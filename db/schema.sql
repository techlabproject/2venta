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
  created_at  timestamptz not null default now()
);

create index if not exists listings_created_at_idx on listings (created_at desc);
create index if not exists listings_category_idx   on listings (category);
create index if not exists listings_seller_idx     on listings (seller_id);

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
