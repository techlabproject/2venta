-- Hasta dónde ha leído cada persona en cada conversación (S-35).
--
-- Va por participante y no por conversación porque comprador y vendedor leen por
-- separado: que uno abra el hilo no puede marcar como leído lo del otro.
--
-- No existir una fila significa «no ha leído nada», que es exactamente el estado
-- correcto para una conversación recién abierta. Por eso no se siembra nada al
-- crear la conversación: la ausencia ya dice la verdad.
create table if not exists conversation_reads (
  conversation_id uuid not null references conversations(id) on delete cascade,
  user_id         text not null references "user"(id) on delete cascade,
  last_read_at    timestamptz not null default now(),
  primary key (conversation_id, user_id)
);
