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

create table if not exists sellers (
  id          uuid primary key default gen_random_uuid(),
  alias       text        not null,
  -- D-04: la zona es pública, la dirección exacta nunca lo es.
  zone        text        not null,
  created_at  timestamptz not null default now()
);

create table if not exists listings (
  id          uuid primary key default gen_random_uuid(),
  seller_id   uuid not null references sellers(id) on delete cascade,
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
