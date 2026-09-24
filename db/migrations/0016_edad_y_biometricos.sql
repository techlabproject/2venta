-- Corrección 11 (2026-09-24), decisiones de Nicolás sobre los hallazgos de Luna.
-- Fecha de nacimiento: la «medida posible» del art. 52 de la Ley 1480 para no dejar
-- entrar a menores de 18. Se guarda como AAAA-MM-DD; nula en cuentas anteriores.
alter table "user" add column if not exists birth_date text;
-- Autorización explícita y aparte para datos biométricos (selfie de la verificación
-- de identidad), art. 6 de la Ley 1581. Cuándo la dio quien empezó la verificación.
alter table kyc_verifications add column if not exists biometric_consent_at timestamptz;
