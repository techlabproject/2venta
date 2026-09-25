-- D-120 (2026-09-25): con Twilio Verify el código lo genera y lo comprueba Twilio,
-- no 2venta. Cada código pedido anota quién lo tiene: null es el propio (cifrado en
-- `code_enc`, como siempre); 'twilio_verify' se comprueba contra Twilio. El límite
-- de intentos y el vencimiento siguen siendo de 2venta en los dos casos.
alter table phone_codes add column if not exists verificado_por text
  check (verificado_por in ('twilio_verify'));
alter table recovery_codes add column if not exists verificado_por text
  check (verificado_por in ('twilio_verify'));
