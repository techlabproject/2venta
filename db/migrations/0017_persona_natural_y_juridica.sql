-- Corrección 15 (2026-09-24), decisiones de Nicolás: al empezar a vender se elige
-- persona natural o jurídica; desaparece «Registra tu tienda» como paso aparte.

-- Quién vende y cómo notificarlo. El art. 53 de la Ley 1480 obliga a los portales
-- de contacto a registrar nombre o razón social, documento, dirección física de
-- notificaciones y teléfono de cada oferente (pendiente desde la corrección 11).
create table if not exists vendedores (
  user_id                  text primary key references "user"(id) on delete cascade,
  tipo                     text not null check (tipo in ('natural', 'juridica')),
  direccion_notificaciones text not null,
  telefono                 text not null,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

-- La persona jurídica reutiliza `stores` (razón social y NIT) y agrega a quien la
-- representa, el RUT (privado: va en la base, no en el almacenamiento público) y la
-- confirmación manual del NIT mientras no haya proveedor que lo valide.
alter table stores add column if not exists representante_nombre text;
alter table stores add column if not exists representante_cedula text;
alter table stores add column if not exists rut_pdf bytea;
alter table stores add column if not exists nit_confirmado_at timestamptz;
alter table stores add column if not exists archivada_at timestamptz;

-- Las tiendas que ya existían pasan a ser personas naturales: se archivan, no se
-- borran (D-42). Quien quiera vender como empresa se registra de nuevo.
update stores set archivada_at = now() where archivada_at is null;

-- El NIT sigue siendo único, pero solo entre las no archivadas: si no, una tienda
-- archivada impediría registrar esa empresa como persona jurídica.
alter table stores drop constraint if exists stores_nit_key;
create unique index if not exists stores_nit_vigente on stores (nit) where archivada_at is null;
