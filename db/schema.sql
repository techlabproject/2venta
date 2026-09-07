-- Esquema de 2venta. Pre-lanzamiento: se recrea entero al sembrar.
-- Antes del primer usuario real hay que pasar a migraciones numeradas.
-- Convenciones (ver CLAUDE.md): montos enteros en COP, ids UUID, fechas timestamptz.

create extension if not exists "pgcrypto";

-- Las categorías viven en una tabla y no en un tipo fijo, porque cuáles son las
-- tres de la versión 1 sigue en discusión (ver D-05b). Con una tabla, cambiar de
-- opinión es editar una fila; con un tipo fijo sería migrar datos.
create table if not exists categories (
  slug       text primary key,
  label      text    not null,
  position   integer not null,
  active     boolean not null default true
);

create type listing_condition as enum ('nuevo', 'usado_bueno', 'usado_regular');

-- Verificación de identidad del vendedor (D-02, RF-06 a RF-11).
-- 2venta NUNCA guarda la cédula ni la selfie: eso vive en el proveedor externo.
-- Aquí solo el estado que reporta y su identificador de referencia.
create table if not exists kyc_verifications (
  user_id    text primary key references "user"(id) on delete cascade,
  provider   text not null,
  reference  text not null,
  status     text not null check (status in ('pendiente','aprobado','rechazado')),
  reason     text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists kyc_reference_idx on kyc_verifications (reference);

create table if not exists listings (
  id          uuid primary key default gen_random_uuid(),
  -- D-03: una sola cuenta con dos modos. El vendedor es un usuario, no una
  -- entidad aparte.
  seller_id   text not null references "user"(id) on delete cascade,
  title       text not null,
  description text not null,
  category    text not null references categories(slug),
  condition   listing_condition not null,
  -- D-09b y convención de montos: entero en pesos, nunca decimal.
  price_cop   integer not null check (price_cop > 0),
  -- D-14: el video es obligatorio en toda categoría, así que la columna no admite
  -- nulos. Una publicación sin video no puede existir ni por error de programación.
  video_path  text not null,
  poster_path text not null,
  status      text not null default 'activa'
              check (status in ('activa','reservada','vendida')),
  created_at  timestamptz not null default now()
);

create index if not exists listings_created_at_idx on listings (created_at desc);
create index if not exists listings_category_idx   on listings (category);
create index if not exists listings_seller_idx     on listings (seller_id);
create index if not exists listings_price_idx      on listings (price_cop);

-- Búsqueda de texto completo en español: reconoce plurales y conjugaciones, y
-- 'unaccent' hace que "bicicleta" encuentre "bicicléta" y viceversa. Con una sola
-- ciudad y tres categorías esto sobra; un motor dedicado sería complicar por gusto.
create extension if not exists "unaccent";

-- unaccent() no está marcada como inmutable, y Postgres no acepta funciones no
-- inmutables dentro de un índice. Este envoltorio es el patrón estándar: fija el
-- diccionario, con lo cual el resultado sí es estable.
create or replace function sin_tildes(text) returns text
  language sql immutable strict parallel safe
  as $$ select public.unaccent('public.unaccent', $1) $$;

create index if not exists listings_search_idx on listings
  using gin (to_tsvector('spanish', sin_tildes(title || ' ' || description)));

-- Registro de envíos de código, para limitar por número de celular.
-- El límite por dirección IP no sirve solo: en una red compartida (una
-- universidad, una oficina, el NAT de un operador móvil) bloquearía a todos los
-- usuarios legítimos que estén detrás de la misma salida.
create table if not exists otp_sends (
  id      bigserial primary key,
  phone   text        not null,
  sent_at timestamptz not null default now()
);

create index if not exists otp_sends_phone_idx on otp_sends (phone, sent_at desc);

-- ---------------------------------------------------------------------------
-- Pedidos y pago retenido (S-05)
-- ---------------------------------------------------------------------------

-- D-20: un vendedor por pedido. Está en el modelo, no solo en la pantalla.
create table if not exists orders (
  id                uuid primary key default gen_random_uuid(),
  buyer_id          text not null references "user"(id),
  seller_id         text not null references "user"(id),

  status            text not null default 'pendiente_pago'
                    check (status in ('pendiente_pago','pagado','entregado',
                                      'liberado','cancelado','reembolsado')),

  -- Todo entero en pesos. Se guardan las tres cifras, no solo el total: cuando
  -- alguien cuadre las cuentas del mes tiene que poder ver el desglose exacto
  -- que se aplicó ese día, aunque la tarifa haya cambiado después.
  subtotal_cop      integer not null check (subtotal_cop > 0),
  commission_cop    integer not null check (commission_cop >= 0),
  seller_payout_cop integer not null check (seller_payout_cop >= 0),

  provider          text not null,
  provider_ref      text unique,
  -- Generada por el cliente antes de llamar al proveedor. Es lo que impide que un
  -- reintento por timeout cobre dos veces.
  idempotency_key   text not null unique,

  delivered_at      timestamptz,
  released_at       timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  constraint cuentas_cuadran
    check (seller_payout_cop + commission_cop = subtotal_cop),
  constraint el_comprador_no_es_el_vendedor
    check (buyer_id <> seller_id)
);

create index if not exists orders_buyer_idx  on orders (buyer_id, created_at desc);
create index if not exists orders_seller_idx on orders (seller_id, created_at desc);
-- Para el trabajo de liberación automática (D-11b).
create index if not exists orders_release_idx on orders (status, delivered_at);

create table if not exists order_items (
  id         bigserial primary key,
  order_id   uuid not null references orders(id) on delete cascade,
  listing_id uuid not null references listings(id),
  -- Copia del título y del precio al momento de comprar. Si el vendedor los
  -- cambia después, el pedido tiene que seguir diciendo qué se compró y por
  -- cuánto: es la evidencia si hay reclamo.
  title_cop  text    not null,
  price_cop  integer not null check (price_cop > 0)
);

create index if not exists order_items_order_idx on order_items (order_id);

-- Registro de auditoría. Cuando haya una disputa, esto es la única evidencia que
-- existe de qué pasó y cuándo.
create table if not exists order_events (
  id                bigserial primary key,
  order_id          uuid not null references orders(id) on delete cascade,
  from_status       text,
  to_status         text not null,
  source            text not null check (source in ('comprador','vendedor','proveedor','sistema')),
  -- Identificador del aviso del proveedor. Único, y es lo que hace que un webhook
  -- repetido no se procese dos veces.
  provider_event_id text unique,
  detail            text,
  created_at        timestamptz not null default now()
);

create index if not exists order_events_order_idx on order_events (order_id, created_at);
