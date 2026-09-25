-- D-128 (2026-09-25, corrección 52): el equipo gestiona sin desarrollador las
-- categorías, los lugares de encuentro, las tallas y edades y las palabras
-- prohibidas, desde /admin/configuracion. Cada cambio queda en el historial.

-- Tallas y edades (corrección 38) dejan de ser constantes del código. Los valores son
-- el texto que guarda cada publicación: no se renombran (una publicación vieja se
-- quedaría con un valor que ya no existe); se desactivan y se agregan otros.
create table if not exists atributos (
  tipo    text    not null check (tipo in ('talla', 'edad')),
  valor   text    not null,
  -- Solo tallas: «letra» (XS, M…) o «numero» (2 a 46), para agruparlas en la lista.
  grupo   text    check (grupo in ('letra', 'numero')),
  orden   integer not null,
  activo  boolean not null default true,
  primary key (tipo, valor)
);

insert into atributos (tipo, valor, grupo, orden) values
  ('talla', 'XS', 'letra', 1), ('talla', 'S', 'letra', 2), ('talla', 'M', 'letra', 3),
  ('talla', 'L', 'letra', 4), ('talla', 'XL', 'letra', 5), ('talla', 'XXL', 'letra', 6),
  ('talla', 'Talla única', 'letra', 7)
on conflict do nothing;
insert into atributos (tipo, valor, grupo, orden)
  select 'talla', n::text, 'numero', 100 + n from generate_series(2, 46) n
on conflict do nothing;
insert into atributos (tipo, valor, orden) values
  ('edad', '0 a 6 meses', 1), ('edad', '6 a 12 meses', 2), ('edad', '1 a 2 años', 3),
  ('edad', '3 a 4 años', 4), ('edad', '5 a 7 años', 5), ('edad', '8 a 11 años', 6),
  ('edad', '12 años o más', 7)
on conflict do nothing;

-- Palabras prohibidas que agrega el equipo, con el motivo que ve quien publica. Las
-- reglas fijas del código (armas, drogas, imitaciones…) siguen: están escritas con
-- cuidado para no rechazar «armario» por «arma».
create table if not exists palabras_prohibidas (
  id      uuid primary key default gen_random_uuid(),
  frase   text not null unique,
  motivo  text not null,
  activo  boolean not null default true,
  creado  timestamptz not null default now()
);

-- Historial: quién cambió qué, cuándo, y qué había antes.
create table if not exists cambios_config (
  id        uuid primary key default gen_random_uuid(),
  admin_id  text not null references "user" (id),
  entidad   text not null,
  clave     text not null,
  antes     jsonb,
  despues   jsonb,
  creado    timestamptz not null default now()
);
create index if not exists cambios_config_creado on cambios_config (creado desc);
