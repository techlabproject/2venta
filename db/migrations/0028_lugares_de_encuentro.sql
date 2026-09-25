-- D-125 (2026-09-25, corrección 46): «Nos vemos en persona» en un lugar público y
-- concurrido de la zona, elegido de una lista, en vez de «donde acuerden por el chat».
-- Protege a las dos partes y evita que alguien dé su dirección.
--
-- La lista inicial la propuso el equipo técnico con lugares muy conocidos (centros
-- comerciales grandes y bibliotecas públicas). TODOS nacen `confirmado = false`:
-- alguien del equipo tiene que revisarlos antes de producción (panel de la fila 52).
-- Las zonas sin lugares siguen funcionando: se acuerda un lugar público por el chat.
create table if not exists lugares_encuentro (
  id          uuid primary key default gen_random_uuid(),
  zona        text not null,
  nombre      text not null,
  tipo        text not null check (tipo in ('centro_comercial', 'biblioteca', 'parque', 'museo')),
  activo      boolean not null default true,
  confirmado  boolean not null default false,
  creado      timestamptz not null default now(),
  unique (zona, nombre)
);

alter table orders add column if not exists meeting_place_id uuid references lugares_encuentro (id);

insert into lugares_encuentro (zona, nombre, tipo) values
  ('Usaquén', 'Centro Comercial Unicentro', 'centro_comercial'),
  ('Usaquén', 'Centro Comercial Santafé', 'centro_comercial'),
  ('Usaquén', 'Centro Comercial Hacienda Santa Bárbara', 'centro_comercial'),
  ('Chapinero', 'Centro Comercial Andino', 'centro_comercial'),
  ('Chapinero', 'Centro Comercial Avenida Chile', 'centro_comercial'),
  ('Chapinero', 'Parque de la 93', 'parque'),
  ('Santa Fe', 'Museo Nacional de Colombia', 'museo'),
  ('Teusaquillo', 'Centro Comercial Galerías', 'centro_comercial'),
  ('Teusaquillo', 'Centro Comercial Gran Estación', 'centro_comercial'),
  ('Teusaquillo', 'Biblioteca Pública Virgilio Barco', 'biblioteca'),
  ('Suba', 'Centro Comercial Plaza Imperial', 'centro_comercial'),
  ('Suba', 'Centro Comercial Bulevar Niza', 'centro_comercial'),
  ('Suba', 'Biblioteca Pública Julio Mario Santo Domingo', 'biblioteca'),
  ('Engativá', 'Centro Comercial Titán Plaza', 'centro_comercial'),
  ('Engativá', 'Centro Comercial Portal 80', 'centro_comercial'),
  ('Engativá', 'Centro Comercial Diverplaza', 'centro_comercial'),
  ('Fontibón', 'Centro Comercial Hayuelos', 'centro_comercial'),
  ('Fontibón', 'Centro Comercial Salitre Plaza', 'centro_comercial'),
  ('Kennedy', 'Centro Comercial Plaza de las Américas', 'centro_comercial'),
  ('Kennedy', 'Centro Comercial Tintal Plaza', 'centro_comercial'),
  ('Kennedy', 'Biblioteca Pública El Tintal', 'biblioteca'),
  ('Bosa', 'Centro Comercial Metro Recreo', 'centro_comercial'),
  ('Puente Aranda', 'Centro Comercial Plaza Central', 'centro_comercial'),
  ('Antonio Nariño', 'Centro Comercial Centro Mayor', 'centro_comercial'),
  ('Tunjuelito', 'Biblioteca Pública El Tunal', 'biblioteca'),
  ('Tunjuelito', 'Centro Comercial Ciudad Tunal', 'centro_comercial'),
  ('La Candelaria', 'Biblioteca Luis Ángel Arango', 'biblioteca'),
  ('La Candelaria', 'Centro Cultural Gabriel García Márquez', 'museo'),
  ('Soacha', 'Centro Comercial Unisur', 'centro_comercial'),
  ('Soacha', 'Centro Comercial Mercurio', 'centro_comercial'),
  ('Chía', 'Centro Chía', 'centro_comercial'),
  ('Chía', 'Centro Comercial Fontanar', 'centro_comercial')
on conflict (zona, nombre) do nothing;
