-- D-123 (2026-09-25): 30 segundos entre códigos, contados por separado para el
-- registro y la recuperación. Con uno solo, quien acababa de registrarse y pedía
-- recuperar la contraseña no recibía nada, y la recuperación no puede decir por qué
-- (revelaría si el número tiene cuenta). El tope de 5 por hora sigue siendo por
-- número, sumando los dos.
alter table otp_sends add column if not exists motivo text not null default 'registro'
  check (motivo in ('registro', 'recuperacion'));
