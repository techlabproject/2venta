-- Migración 0006 — carrito
--
-- D-20: un vendedor por pedido. El carrito no lo impone en el esquema porque el
-- vendedor puede cambiar (vaciando y empezando de nuevo); lo impone la aplicación
-- al agregar.
create table if not exists cart_items (
  user_id    text not null references "user"(id) on delete cascade,
  listing_id uuid not null references listings(id) on delete cascade,
  added_at   timestamptz not null default now(),
  primary key (user_id, listing_id)
);

create index if not exists cart_items_user_idx on cart_items (user_id, added_at);
