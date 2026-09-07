-- Migración 0002 — índice para la cola de disputas
--
-- La consulta de reclamos abiertos recorre `claims` filtrando por `resolved_at is
-- null`, y el panel de arbitraje se abre cada vez que llega uno. Con volumen, ese
-- recorrido completo se nota.
create index if not exists claims_pendientes_idx
  on claims (created_at)
  where resolved_at is null;
