-- Fotos en el chat y reportes de conversación (S-37).

-- Una foto por mensaje. Va como columna y no como tabla aparte porque un mensaje
-- tiene como mucho una, y una tabla de una fila por mensaje solo añadiría un join.
--
-- Es la CLAVE del bucket, nunca una dirección: las direcciones se arman en el
-- servidor con mediaUrl(), que lee una variable que no existe en el navegador.
alter table messages add column if not exists image_path text;

-- El cuerpo deja de ser obligatorio cuando hay foto: «te mando una foto» sin texto
-- es un mensaje legítimo. Lo que no puede existir es un mensaje vacío del todo.
alter table messages alter column body drop not null;

alter table messages drop constraint if exists messages_con_algo_dentro;
alter table messages add constraint messages_con_algo_dentro
  check (coalesce(nullif(btrim(body), ''), image_path) is not null);

-- Reportar una conversación (S-37).
--
-- Tabla propia y no la de `reports`, que va contra una publicación: «este artículo
-- es falso» y «esta persona me está acosando» son dos cosas distintas, van a manos
-- distintas, y la restricción única de `reports` impediría reportar las dos.
create table if not exists chat_reports (
  id              bigserial primary key,
  conversation_id uuid not null references conversations(id) on delete cascade,
  reporter_id     text not null references "user"(id) on delete cascade,
  reason          text not null,
  detail          text,
  resolved_at     timestamptz,
  created_at      timestamptz not null default now(),
  -- Una persona reporta una conversación una vez. Sin esto, cualquiera podría
  -- inflar la cola de moderación reportando el mismo hilo cien veces.
  unique (conversation_id, reporter_id)
);

create index if not exists chat_reports_pending_idx
  on chat_reports (resolved_at, created_at);
