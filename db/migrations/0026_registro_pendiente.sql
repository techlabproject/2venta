-- D-123 (2026-09-25, pedido de Nicolás): la cuenta existe de verdad solo cuando se
-- confirma el celular. Mientras tanto queda pendiente: sin sesión útil, y si en 24
-- horas nadie la confirma, se borra (y el correo queda libre). Un registro nuevo con
-- el mismo correo reemplaza al pendiente.
--
-- Solo las cuentas creadas desde ahora nacen pendientes; las anteriores quedan
-- como estaban.
alter table "user" add column if not exists registro_pendiente_desde timestamptz;
-- «¿No es tu número?»: cuántas veces lo cambió antes de confirmar. Tope contra usar
-- el cambio para mandar códigos a números ajenos.
alter table "user" add column if not exists cambios_de_celular integer not null default 0;

create index if not exists user_registro_pendiente
  on "user" (registro_pendiente_desde) where registro_pendiente_desde is not null;

-- Confirmar el celular termina el registro, venga de donde venga (la app, la demo o
-- una prueba que lo marca directo). Sin esto, una cuenta confirmada por otro camino
-- se borraría a las 24 horas.
create or replace function terminar_registro() returns trigger
  language plpgsql as $$
begin
  if new."phoneNumberVerified" then
    new.registro_pendiente_desde := null;
  end if;
  return new;
end $$;

drop trigger if exists terminar_registro on "user";
create trigger terminar_registro before insert or update on "user"
  for each row execute function terminar_registro();
