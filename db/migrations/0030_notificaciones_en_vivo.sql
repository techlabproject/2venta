-- Fila 73 de la revisión 4 de Catalina (D-131): «no se actualiza justo con el
-- mensaje nuevo, hay que recargar». El chat abierto ya se ponía al día (0018); el
-- resto de la app —encabezado, lista de conversaciones, notificaciones— no. Cada
-- notificación nueva avisa por el canal `aviso` con el id de su destinatario, y los
-- servidores web se lo pasan a los navegadores de esa persona
-- (`src/lib/tiempo-real.ts`). Como en 0018, el aviso no lleva contenido.

create or replace function avisar_notificacion() returns trigger
language plpgsql as $$
begin
  perform pg_notify('aviso', new.user_id::text);
  return new;
end;
$$;

drop trigger if exists notificaciones_avisan on notifications;
create trigger notificaciones_avisan
  after insert on notifications
  for each row execute function avisar_notificacion();
