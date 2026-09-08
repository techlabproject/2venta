-- Migración 0007 — fotos del artículo
--
-- El video sigue siendo obligatorio y grabado en vivo (D-14): es lo que prueba que
-- el artículo existe. Las fotos son presentación, y por eso sí pueden venir de la
-- galería.
create table if not exists listing_photos (
  id         bigserial primary key,
  listing_id uuid not null references listings(id) on delete cascade,
  path       text not null,
  position   integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists listing_photos_idx on listing_photos (listing_id, position);
