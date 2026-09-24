-- Corrección 11 (2026-09-24): qué versión de los Términos y la Política de datos
-- aceptó cada persona, y cuándo. Es la prueba de consentimiento (Ley 1581; art. 48
-- y 50 de la Ley 1480) y lo que permite pedir que se acepte de nuevo si cambian.
-- Nulo en las cuentas creadas antes: aceptaron una casilla sin texto detrás.
alter table "user" add column if not exists terms_version text;
alter table "user" add column if not exists terms_accepted_at timestamptz;
