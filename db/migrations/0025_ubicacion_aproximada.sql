-- D-122 (2026-09-25, correcciones 43, 44, 45 y 51): ubicación aproximada.
--
-- El vendedor tiene un punto aproximado: el de su zona o el de su celular, llevado a
-- una cuadrícula de 0,01° (~1,1 km). Nunca se guarda el punto exacto: con él,
-- comparando distancias desde varios sitios, se daría con la casa de alguien. Los
-- dos van juntos o ninguno.
alter table "user"
  add column if not exists ubicacion_lat double precision,
  add column if not exists ubicacion_lng double precision;
alter table "user" drop constraint if exists ubicacion_completa;
alter table "user" add constraint ubicacion_completa
  check ((ubicacion_lat is null) = (ubicacion_lng is null));

-- Distancia en km entre dos puntos (semiverseno). La misma fórmula que
-- `distanciaKm` en src/features/ubicacion/zonas.ts. Con un punto nulo, da nulo.
create or replace function distancia_km(
  lat1 double precision, lng1 double precision,
  lat2 double precision, lng2 double precision
) returns double precision
  language sql immutable strict parallel safe
  as $$
    select 2 * 6371 * asin(sqrt(least(1,
      power(sin(radians(lat2 - lat1) / 2), 2)
      + cos(radians(lat1)) * cos(radians(lat2)) * power(sin(radians(lng2 - lng1) / 2), 2)
    )))
  $$;

-- La zona deja de ser texto libre. Lo escrito a mano se lleva a la zona de la lista
-- que corresponda (sin importar tildes, mayúsculas ni espacios) y toma su centro; lo
-- que no se reconoce queda sin zona, y se le pide a la persona al editar su perfil.
-- La lista es la de src/features/ubicacion/zonas.ts en esta fecha.
with zonas(nombre, lat, lng) as (values
    ('Usaquén', 4.711, -74.03),
    ('Chapinero', 4.648, -74.061),
    ('Santa Fe', 4.606, -74.068),
    ('San Cristóbal', 4.566, -74.087),
    ('Usme', 4.52, -74.117),
    ('Tunjuelito', 4.576, -74.134),
    ('Bosa', 4.617, -74.19),
    ('Kennedy', 4.63, -74.155),
    ('Fontibón', 4.678, -74.145),
    ('Engativá', 4.706, -74.111),
    ('Suba', 4.741, -74.084),
    ('Barrios Unidos', 4.668, -74.075),
    ('Teusaquillo', 4.638, -74.087),
    ('Los Mártires', 4.607, -74.09),
    ('Antonio Nariño', 4.589, -74.1),
    ('Puente Aranda', 4.616, -74.115),
    ('La Candelaria', 4.597, -74.072),
    ('Rafael Uribe Uribe', 4.57, -74.115),
    ('Ciudad Bolívar', 4.56, -74.155),
    ('Soacha', 4.579, -74.217),
    ('Chía', 4.863, -74.059),
    ('Cajicá', 4.918, -74.028),
    ('Cota', 4.809, -74.103),
    ('Funza', 4.716, -74.211),
    ('Mosquera', 4.706, -74.23),
    ('Madrid', 4.733, -74.264),
    ('La Calera', 4.721, -73.969)
)
update "user" u
   set zone = z.nombre,
       ubicacion_lat = round(z.lat::numeric, 2)::double precision,
       ubicacion_lng = round(z.lng::numeric, 2)::double precision
  from zonas z
 where lower(sin_tildes(regexp_replace(trim(u.zone), '\s+', ' ', 'g')))
     = lower(sin_tildes(z.nombre));

update "user" set zone = null where zone is not null and ubicacion_lat is null;
