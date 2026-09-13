-- Hallazgo de QA (2026-09-13, agente técnico, CRÍTICO): el mismo celular podía
-- quedar verificado en dos cuentas. La D-01 dice que el número verificado es lo
-- que impide las cuentas desechables; sin unicidad no lo impedía.
--
-- Parcial a propósito: mientras no está verificado, dos registros a medias con
-- el mismo número no chocan (solo uno va a poder confirmarlo).
create unique index if not exists user_celular_verificado_unico
  on "user" ("phoneNumber")
  where "phoneNumberVerified";
