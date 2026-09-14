-- Migración 0011 — foto de perfil

-- Guarda la clave del objeto en el bucket, no una dirección: la dirección la arma
-- mediaUrl() en tiempo de ejecución y cambia entre entornos (D-50). La columna
-- "image" de Better Auth se queda para lo que ese proveedor guarde por su cuenta
-- (una URL de Google, por ejemplo); son dos cosas distintas y mezclarlas haría que
-- entrar con Google borre la foto que la persona subió.
alter table "user" add column if not exists avatar_path text;
