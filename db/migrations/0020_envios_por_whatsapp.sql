-- D-117 (2026-09-24): los códigos de verificación salen por WhatsApp Cloud (Meta).
-- Cada envío se anota con el id que devuelve Meta (`wamid`) para que el aviso de
-- entrega (webhook) diga si el código llegó, se leyó o falló. Sin el código: solo
-- a qué celular y en qué quedó.
create table if not exists envios_codigo (
  wamid       text primary key,
  telefono    text not null,
  motivo      text not null check (motivo in ('registro', 'recuperacion', 'otro')),
  estado      text not null default 'aceptado'
              check (estado in ('aceptado', 'sent', 'delivered', 'read', 'failed')),
  error       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists envios_codigo_telefono on envios_codigo (telefono, created_at desc);
