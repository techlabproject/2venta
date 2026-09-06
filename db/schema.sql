-- Esquema de la rebanada S-00. Solo lo mínimo para el esqueleto caminante.
-- Convenciones (ver CLAUDE.md): montos enteros en COP, ids UUID, fechas timestamptz.

create extension if not exists "pgcrypto";

create table if not exists sellers (
  id          uuid primary key default gen_random_uuid(),
  alias       text        not null,
  -- D-04: la zona es pública, la dirección exacta nunca lo es.
  zone        text        not null,
  created_at  timestamptz not null default now()
);

create type listing_condition as enum ('nuevo', 'usado_bueno', 'usado_regular');
create type listing_category  as enum ('tecnologia', 'ropa', 'hogar');

create table if not exists listings (
  id          uuid primary key default gen_random_uuid(),
  seller_id   uuid not null references sellers(id) on delete cascade,
  title       text not null,
  description text not null,
  category    listing_category  not null,
  condition   listing_condition not null,
  -- D-09b y convención de montos: entero en pesos, nunca decimal.
  price_cop   integer not null check (price_cop > 0),
  created_at  timestamptz not null default now()
);

create index if not exists listings_created_at_idx on listings (created_at desc);
