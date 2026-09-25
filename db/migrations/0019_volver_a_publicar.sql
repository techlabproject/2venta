-- Corrección 31 (2026-09-24), decisión de Nicolás: lo retirado se puede volver a
-- publicar desde «Tus publicaciones». Para no saltarse nada al volver, se guarda de
-- qué estado venía: una publicación que estaba en revisión cuando se retiró (por
-- ejemplo, al suspender la cuenta) vuelve a revisión, no al catálogo.
alter table listings add column if not exists retirada_desde text;

-- Las ya retiradas no dicen de dónde venían: se tratan como en revisión, que es lo
-- seguro (alguien del equipo las mira antes de que vuelvan a verse).
update listings set retirada_desde = 'en_revision'
 where status = 'retirada' and retirada_desde is null;
