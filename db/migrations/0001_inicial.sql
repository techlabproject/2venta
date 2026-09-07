-- Migración 0001 — esquema inicial
--
-- Reúne lo que hasta ahora vivía en db/auth-schema.sql y db/schema.sql, que se
-- recreaban enteros al sembrar. Eso servía mientras no hubiera un usuario real;
-- a partir de aquí los cambios van como migraciones numeradas y nunca se edita
-- una que ya se aplicó.
--
-- La parte de autenticación la genera la biblioteca; el resto es del dominio.

create table "user" ("id" text not null primary key, "name" text not null, "email" text not null unique, "emailVerified" boolean not null, "image" text, "createdAt" timestamptz default CURRENT_TIMESTAMP not null, "updatedAt" timestamptz default CURRENT_TIMESTAMP not null, "phoneNumber" text, "phoneNumberVerified" boolean, "alias" text, "zone" text, "role" text);

create table "session" ("id" text not null primary key, "expiresAt" timestamptz not null, "token" text not null unique, "createdAt" timestamptz default CURRENT_TIMESTAMP not null, "updatedAt" timestamptz not null, "ipAddress" text, "userAgent" text, "userId" text not null references "user" ("id") on delete cascade);

create table "account" ("id" text not null primary key, "accountId" text not null, "providerId" text not null, "userId" text not null references "user" ("id") on delete cascade, "accessToken" text, "refreshToken" text, "idToken" text, "accessTokenExpiresAt" timestamptz, "refreshTokenExpiresAt" timestamptz, "scope" text, "password" text, "createdAt" timestamptz default CURRENT_TIMESTAMP not null, "updatedAt" timestamptz not null);

create table "verification" ("id" text not null primary key, "identifier" text not null, "value" text not null, "expiresAt" timestamptz not null, "createdAt" timestamptz default CURRENT_TIMESTAMP not null, "updatedAt" timestamptz default CURRENT_TIMESTAMP not null);

create table "rateLimit" ("id" text not null primary key, "key" text not null unique, "count" integer not null, "lastRequest" bigint not null);

create index "session_userId_idx" on "session" ("userId");

create index "account_userId_idx" on "account" ("userId");

create index "verification_identifier_idx" on "verification" ("identifier");
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
  -- Nulos solo mientras la publicación es un borrador de carga en lote.
  video_path  text,
  poster_path text,
  -- D-16 y R-03: la electrónica nace en revisión, porque no hay forma automática
  -- de contrastar el IMEI contra la base de equipos reportados. Ropa y niños salen
  -- directo. Cuando el contraste sea automático, esto cambia en un solo lugar.
  status      text not null default 'activa'
              -- 'borrador' es lo que crea la carga en lote de una tienda (S-13):
              -- tiene todo menos el video, que hay que grabar desde el móvil.
              check (status in ('borrador','activa','en_revision','rechazada','reservada','vendida')),
  -- D-15: solo en electrónica. Se guarda desde ya para poder contrastarlo después
  -- sin volver a molestar al vendedor.
  imei        text,
  review_note text,
  created_at  timestamptz not null default now()
);

create index if not exists listings_created_at_idx on listings (created_at desc);
create index if not exists listings_category_idx   on listings (category);
create index if not exists listings_seller_idx     on listings (seller_id);
create index if not exists listings_status_idx     on listings (status);
-- Un mismo IMEI publicado dos veces es señal de fraude, no de coincidencia.
create unique index if not exists listings_imei_unico on listings (imei)
  where imei is not null and status <> 'rechazada';
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
                    check (status in ('pendiente_pago','pagado','despachado','entregado',
                                      'en_disputa','liberado','cancelado','reembolsado')),

  -- Todo entero en pesos. Se guardan las tres cifras, no solo el total: cuando
  -- alguien cuadre las cuentas del mes tiene que poder ver el desglose exacto
  -- que se aplicó ese día, aunque la tarifa haya cambiado después.
  subtotal_cop      integer not null check (subtotal_cop > 0),
  commission_cop    integer not null check (commission_cop >= 0),
  seller_payout_cop integer not null check (seller_payout_cop >= 0),

  -- El envío se cobra al comprador y no entra en el cálculo de la comisión: 2venta
  -- no gana sobre la plata de la transportadora.
  -- D-19: envío a domicilio o encuentro en persona. En persona no hay envío que
  -- cobrar, y el pago se libera con un código en el momento.
  delivery_method   text not null default 'envio'
                    check (delivery_method in ('envio','presencial')),
  meeting_zone      text,

  shipping_cop      integer not null default 0 check (shipping_cop >= 0),
  carrier           text,
  tracking_number   text,

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

-- Dirección de entrega (S-06). Dato personal.
--
-- Vive en su propia tabla y no en `orders` para que ninguna consulta de pedidos la
-- traiga por descuido: hay que pedirla a propósito. La ven quien compra, la
-- transportadora, y quien vende solo dentro de la guía.
create table if not exists shipping_addresses (
  order_id       uuid primary key references orders(id) on delete cascade,
  recipient      text not null,
  phone          text not null,
  line1          text not null,
  details        text,
  city           text not null default 'Bogotá',
  zone           text not null,
  notes          text,
  created_at     timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Conversación y ofertas (S-08). D-21 y D-22.
-- ---------------------------------------------------------------------------

create table if not exists conversations (
  id         uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings(id) on delete cascade,
  buyer_id   text not null references "user"(id) on delete cascade,
  seller_id  text not null references "user"(id) on delete cascade,
  created_at timestamptz not null default now(),
  -- Una sola conversación por artículo y comprador: si no, cada visita abriría un
  -- hilo nuevo y el vendedor no sabría con quién está hablando.
  unique (listing_id, buyer_id),
  constraint no_se_escribe_a_si_mismo check (buyer_id <> seller_id)
);

create index if not exists conversations_buyer_idx  on conversations (buyer_id, created_at desc);
create index if not exists conversations_seller_idx on conversations (seller_id, created_at desc);

create table if not exists messages (
  id              bigserial primary key,
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_id       text not null references "user"(id) on delete cascade,
  -- Se guarda el texto ya filtrado, nunca el original. Guardar el número tachado
  -- en la base sería dejarlo disponible para quien tenga acceso a ella, que es
  -- justo lo que el filtro pretende evitar.
  body            text not null,
  redactions      text[] not null default '{}',
  created_at      timestamptz not null default now()
);

create index if not exists messages_conversation_idx on messages (conversation_id, created_at);

-- Oferta formal (D-21). Lleva precio y vencimiento, y aceptarla lleva al pago.
create table if not exists offers (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  listing_id      uuid not null references listings(id) on delete cascade,
  offered_by      text not null references "user"(id) on delete cascade,
  price_cop       integer not null check (price_cop > 0),
  status          text not null default 'pendiente'
                  check (status in ('pendiente','aceptada','rechazada','vencida')),
  expires_at      timestamptz not null,
  created_at      timestamptz not null default now()
);

create index if not exists offers_conversation_idx on offers (conversation_id, created_at desc);

-- Preguntas públicas en la ficha (D-21). A diferencia del chat, las ve cualquiera:
-- una pregunta respondida le ahorra la misma duda al siguiente comprador.
create table if not exists questions (
  id          bigserial primary key,
  listing_id  uuid not null references listings(id) on delete cascade,
  asker_id    text not null references "user"(id) on delete cascade,
  body        text not null,
  answer      text,
  answered_at timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists questions_listing_idx on questions (listing_id, created_at desc);

-- Código de entrega presencial (S-09). Libera dinero, así que es una credencial.
--
-- Se guarda cifrado con un secreto del servidor, nunca en claro. Cifrado y no
-- hasheado a propósito: el comprador necesita volver a ver su código al llegar al
-- encuentro, y de un hash no se recupera nada. Quien tenga la base sin el secreto
-- sigue sin poder leerlo, que es la propiedad que importa.
create table if not exists pickup_codes (
  order_id   uuid primary key references orders(id) on delete cascade,
  code_enc   text not null,
  attempts   integer not null default 0,
  expires_at timestamptz not null,
  used_at    timestamptz,
  created_at timestamptz not null default now()
);

-- Reportes de la comunidad (D-16, RF-39). La moderación automática filtra lo
-- evidente; esto es lo que trae a revisión lo que se le escapó.
create table if not exists reports (
  id          bigserial primary key,
  listing_id  uuid not null references listings(id) on delete cascade,
  reporter_id text not null references "user"(id) on delete cascade,
  reason      text not null,
  detail      text,
  resolved_at timestamptz,
  created_at  timestamptz not null default now(),
  -- Una persona reporta una publicación una vez. Sin esto, un competidor podría
  -- inflar la cola reportando lo mismo cien veces.
  unique (listing_id, reporter_id)
);

create index if not exists reports_pending_idx on reports (resolved_at, created_at);

-- Reclamos y disputas (S-11, D-12 y D-13).
--
-- Mientras un reclamo está abierto el dinero no se mueve, ni al vendedor ni de
-- vuelta al comprador. Eso es lo que lo hace creíble para ambos lados.
create table if not exists claims (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references orders(id) on delete cascade,
  opened_by     text not null references "user"(id),
  kind          text not null check (kind in ('no_coincide','no_llego')),
  detail        text not null,
  seller_reply  text,
  replied_at    timestamptz,
  -- 'comprador' o 'vendedor': a favor de quién se resolvió.
  resolution    text check (resolution in ('comprador','vendedor')),
  resolution_note text,
  resolved_at   timestamptz,
  resolved_by   text references "user"(id),
  created_at    timestamptz not null default now(),
  -- Un reclamo por pedido. Dos reclamos abiertos sobre el mismo dinero no tienen
  -- forma de resolverse coherentemente.
  unique (order_id)
);

create index if not exists claims_open_idx on claims (resolved_at, created_at);

-- Calificaciones mutuas (S-12, D-17).
create table if not exists ratings (
  id         bigserial primary key,
  order_id   uuid not null references orders(id) on delete cascade,
  rater_id   text not null references "user"(id) on delete cascade,
  ratee_id   text not null references "user"(id) on delete cascade,
  stars      integer not null check (stars between 1 and 5),
  review     text,
  created_at timestamptz not null default now(),
  -- Una calificación por persona y por pedido. Sin esto, alguien podría hundir a
  -- otro calificándolo diez veces por la misma venta.
  unique (order_id, rater_id),
  constraint no_se_califica_a_si_mismo check (rater_id <> ratee_id)
);

create index if not exists ratings_ratee_idx on ratings (ratee_id, created_at desc);

-- Datos de tienda (S-13, D-07). Viven aparte de la cuenta porque la mayoría de los
-- vendedores nunca van a tener ninguno.
create table if not exists stores (
  user_id     text primary key references "user"(id) on delete cascade,
  legal_name  text not null,
  nit         text not null unique,
  created_at  timestamptz not null default now()
);

-- Publicaciones destacadas (S-14, D-10). Segunda fuente de ingreso.
--
-- Es pago del vendedor por su propio artículo: no se vende espacio a terceros.
create table if not exists promotions (
  id              uuid primary key default gen_random_uuid(),
  listing_id      uuid not null references listings(id) on delete cascade,
  seller_id       text not null references "user"(id) on delete cascade,
  price_cop       integer not null check (price_cop > 0),
  status          text not null default 'pendiente_pago'
                  check (status in ('pendiente_pago','activa','cancelada')),
  provider        text not null,
  provider_ref    text unique,
  idempotency_key text not null unique,
  starts_at       timestamptz,
  ends_at         timestamptz,
  created_at      timestamptz not null default now()
);

create index if not exists promotions_listing_idx on promotions (listing_id);
-- Para ordenar el catálogo: solo importan las vigentes.
create index if not exists promotions_active_idx on promotions (status, ends_at);

-- Alertas y métricas (S-15, D-24).

create table if not exists saved_searches (
  id         uuid primary key default gen_random_uuid(),
  user_id    text not null references "user"(id) on delete cascade,
  label      text not null,
  -- La búsqueda se guarda tal cual venía en la dirección: los filtros ya viven
  -- ahí (S-04), así que no hay que inventar otra representación.
  params     text not null,
  created_at timestamptz not null default now(),
  unique (user_id, params)
);

create table if not exists notifications (
  id         bigserial primary key,
  user_id    text not null references "user"(id) on delete cascade,
  kind       text not null,
  title      text not null,
  href       text not null,
  -- Sirve para no avisar dos veces de lo mismo.
  subject_id text,
  read_at    timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, kind, subject_id)
);

create index if not exists notifications_user_idx on notifications (user_id, created_at desc);

-- Una fila por vista, no un contador: permite no contar las del propio vendedor y
-- deduplicar por persona sin rehacer nada.
create table if not exists listing_views (
  id         bigserial primary key,
  listing_id uuid not null references listings(id) on delete cascade,
  viewer_id  text references "user"(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists listing_views_idx on listing_views (listing_id);

create table if not exists favorites (
  user_id    text not null references "user"(id) on delete cascade,
  listing_id uuid not null references listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);

create index if not exists favorites_listing_idx on favorites (listing_id);

-- Código de verificación por celular (S-17, cierra la D-27).
--
-- Cifrado con un secreto del servidor, no en texto plano. La biblioteca de
-- autenticación lo guardaba en claro y no ofrecía alternativa; aquí el código es
-- nuestro, así que se hace bien. Quien tenga la base sin el secreto no puede tomar
-- el control de ninguna cuenta.
create table if not exists phone_codes (
  phone      text primary key,
  code_enc   text not null,
  attempts   integer not null default 0,
  expires_at timestamptz not null,
  used_at    timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists phone_codes_expiry_idx on phone_codes (expires_at);
