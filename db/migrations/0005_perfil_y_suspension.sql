-- Migración 0005 — perfil editable, reportes de usuario y suspensión

alter table "user" add column if not exists bio text;
alter table "user" add column if not exists suspended_at timestamptz;
alter table "user" add column if not exists suspended_reason text;

-- Historial de alias. Un vendedor que acumula malas reseñas no puede limpiar su
-- rastro cambiándose el nombre, que es lo primero que intentaría.
create table if not exists alias_history (
  id         bigserial primary key,
  user_id    text not null references "user"(id) on delete cascade,
  alias      text not null,
  changed_at timestamptz not null default now()
);

create index if not exists alias_history_user_idx on alias_history (user_id, changed_at desc);

-- Reportes contra personas, no contra publicaciones (RF-32).
create table if not exists user_reports (
  id          bigserial primary key,
  reported_id text not null references "user"(id) on delete cascade,
  reporter_id text not null references "user"(id) on delete cascade,
  reason      text not null,
  detail      text,
  resolved_at timestamptz,
  created_at  timestamptz not null default now(),
  unique (reported_id, reporter_id),
  constraint no_se_reporta_a_si_mismo check (reported_id <> reporter_id)
);

create index if not exists user_reports_pending_idx on user_reports (resolved_at, created_at);
