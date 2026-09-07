-- Migración 0004 — códigos de recuperación de contraseña
--
-- Igual que el código de verificación: cifrado con un secreto del servidor, con
-- vencimiento e intentos. Es la puerta trasera de toda cuenta, así que se trata
-- con el mismo cuidado que la puerta principal.
create table if not exists recovery_codes (
  phone      text primary key,
  code_enc   text not null,
  attempts   integer not null default 0,
  expires_at timestamptz not null,
  used_at    timestamptz,
  created_at timestamptz not null default now()
);
