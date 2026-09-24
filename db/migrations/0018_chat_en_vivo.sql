-- Corrección 20 (2026-09-24), decisión de Nicolás: los mensajes llegan en vivo
-- mientras el chat está abierto. Cada mensaje u oferta nueva, o una oferta que
-- cambia de estado, avisa por el canal `chat` con el id de la conversación. Los
-- servidores web escuchan ese canal (`src/lib/tiempo-real.ts`) y le dicen al
-- navegador que vuelva a pedir la conversación: el aviso no lleva el contenido, así
-- que el control de acceso sigue siendo el de siempre, en la pantalla.
--
-- Un disparador y no una llamada en cada acción: cualquier camino que escriba un
-- mensaje (hoy o mañana) avisa sin acordarse de hacerlo.

create or replace function avisar_chat() returns trigger
language plpgsql as $$
begin
  perform pg_notify('chat', new.conversation_id::text);
  return new;
end;
$$;

drop trigger if exists mensajes_avisan on messages;
create trigger mensajes_avisan
  after insert on messages
  for each row execute function avisar_chat();

drop trigger if exists ofertas_avisan on offers;
create trigger ofertas_avisan
  after insert or update of status on offers
  for each row execute function avisar_chat();
