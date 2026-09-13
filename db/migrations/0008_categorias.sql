-- D-05b: las tres categorías de la versión 1. Son dato de referencia del
-- producto, no de prueba: hasta S-29 solo las creaba db/seed.ts y en la nube la
-- tabla quedaba vacía. `on conflict` porque el seed también las inserta.
insert into categories (slug, label, position) values
  ('tecnologia', 'Tecnología', 1),
  ('ropa',       'Ropa',       2),
  ('ninos',      'Niños',      3)
on conflict (slug) do nothing;
