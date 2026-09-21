-- Fotos como prueba en un reclamo (S-39).
--
-- Tabla y no columnas, al revés que en el chat (D-92). Allí la decisión fue columna
-- porque un mensaje tiene como mucho una foto. Un reclamo no es un mensaje: es un
-- expediente al que aportan las dos partes, y el número es variable. Seis columnas
-- `foto_1..3` por lado para representar dos listas sería modelar al revés.
create table if not exists claim_photos (
  id          bigserial primary key,
  claim_id    uuid not null references claims(id) on delete cascade,
  -- Quién la aportó. No se deduce del pedido: hace falta para el tope por persona y
  -- para rotular la prueba en pantalla como de quien compra o de quien vende.
  uploaded_by text not null references "user"(id),
  -- La CLAVE del bucket, nunca una dirección. Las direcciones se arman en el
  -- servidor con mediaUrl(), que lee una variable que no existe en el navegador.
  path        text not null,
  created_at  timestamptz not null default now()
);

create index if not exists claim_photos_claim_idx
  on claim_photos (claim_id, created_at);
