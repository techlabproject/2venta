# Informe de verificación — Corrección 12

Fecha: 2026-09-24  
Documento: `docs/alcance/identidad-y-llaves.md`  
Alcance: documento contra migraciones, código, base real de solo lectura y aplicación local.

## Veredicto

**PASA CON OBSERVACIONES.**

La decisión del dueño queda correctamente reflejada: no se pide un nombre de usuario. Las dos tablas describen el modelo implementado y la base real coincide con ellas en tipos de PK e índices únicos. No encontré una dirección pública o compartible que exponga un `bigserial` ni un id consecutivo. Las observaciones son de precisión documental, no bloquean la decisión.

## Hallazgos

### 1. Baja — La frase “texto aleatorio” no cubre los fixtures locales

El documento afirma literalmente: **“Texto aleatorio (lo genera la biblioteca de autenticación) | `user`, `session`, `account`, `verification`, `rateLimit`”**.

La afirmación es correcta para las cuentas creadas por Better Auth: la biblioteca genera ids de 32 caracteres y los ids de las cuentas demo creadas por `db/demo.mts` tienen ese formato. Pero el seed local inserta usuarios con ids literales `seed-camila`, `seed-taller` y `seed-admin` ([db/seed.ts:49](</Users/nicolasr2/Downloads/2venta/db/seed.ts:49>), [db/seed.ts:62](</Users/nicolasr2/Downloads/2venta/db/seed.ts:62>)). En la base consultada existen esos ids.

No es un hallazgo de enumeración: no son números consecutivos y no permiten contar filas. Sí conviene añadir “salvo usuarios fixture de desarrollo” o dejar claro que la regla de ids aleatorios aplica a cuentas reales.

### 2. Baja — Falta un glosario mínimo para una persona no técnica

El documento se entiende en su decisión y en sus ejemplos, pero usa sin definición términos como **“PK”**, **“índice único”**, **“UUID”**, **“`bigserial`”**, **“`gen_random_uuid()`”** y **“Better Auth”** ([identidad-y-llaves.md:33](</Users/nicolasr2/Downloads/2venta/docs/alcance/identidad-y-llaves.md:33>), [identidad-y-llaves.md:34](</Users/nicolasr2/Downloads/2venta/docs/alcance/identidad-y-llaves.md:34>)). Para cerrar la corrección con una persona no técnica, bastan dos frases: PK = identificador principal que no se repite; índice único = regla de la base que impide duplicados; UUID/texto aleatorio = identificador de sistema, no un username visible.

### 3. Baja — Conviene explicitar que la unicidad del alias elegido es una regla de aplicación

La tabla dice: **“el que se elige a mano no puede ser el de otra persona”**. El código lo valida al cambiar el perfil, comparando `lower(alias)` ([src/features/profile/actions.ts:26](</Users/nicolasr2/Downloads/2venta/src/features/profile/actions.ts:26>), [src/features/profile/actions.ts:34](</Users/nicolasr2/Downloads/2venta/src/features/profile/actions.ts:34>)), pero no existe un índice único sobre `user.alias`; esto es intencional en D-67 para permitir alias derivados repetidos. El documento debería decir expresamente “se comprueba al cambiarlo en la aplicación; no es una restricción única de la base”. La garantía frente a dos cambios simultáneos queda NO VERIFICADA (ver abajo).

## Lo que verifiqué y es correcto

### Decisión de no pedir username

- En el registro de la aplicación solo aparecen los campos `name`, `email`, `phone`, `birthDate`, `password` y aceptación de términos; no hay campo `username` ni `userName`.
- [RegisterForm.tsx:63](</Users/nicolasr2/Downloads/2venta/src/features/auth/RegisterForm.tsx:63>) envía nombre, correo, celular y un alias derivado; [auth.ts:70](</Users/nicolasr2/Downloads/2venta/src/lib/auth.ts:70>) configura `alias`, no un username.

### A. Las dos tablas frente a migraciones y base real

La base tenía aplicadas las migraciones `0001_inicial.sql` a `0016_edad_y_biometricos.sql`. Las consultas directas a la base fueron solo de lectura: consulté `information_schema.columns`, restricciones PK y `pg_indexes`.

| Fila del documento | Migraciones | Esquema real | Resultado |
|---|---|---|---|
| Id de cuenta | `user.id` es `text primary key` ([0001:10](</Users/nicolasr2/Downloads/2venta/db/migrations/0001_inicial.sql:10>)) | PK `user_pkey`, tipo `text` | Coincide |
| Correo | `email text not null unique` ([0001:10](</Users/nicolasr2/Downloads/2venta/db/migrations/0001_inicial.sql:10>)) | `user_email_key`, `UNIQUE (email)` | Coincide |
| Celular confirmado | Índice parcial `user_celular_verificado_unico` ([0010:7](</Users/nicolasr2/Downloads/2venta/db/migrations/0010_celular_unico.sql:7>)) | Índice `UNIQUE ("phoneNumber") WHERE "phoneNumberVerified"` | Coincide |
| Alias | `alias` es texto sin índice único; la comprobación está en la acción de perfil | `pg_indexes` no muestra índice único sobre `user.alias` | Coincide con D-67 |
| Identidad verificada | `kyc_verifications.user_id` es PK ([0001:47](</Users/nicolasr2/Downloads/2venta/db/migrations/0001_inicial.sql:47>)) | `kyc_verifications_pkey (user_id)` | Coincide |
| Texto aleatorio de autenticación | PK `text` en `user`, `session`, `account`, `verification`, `rateLimit` ([0001:10](</Users/nicolasr2/Downloads/2venta/db/migrations/0001_inicial.sql:10>), [0001:18](</Users/nicolasr2/Downloads/2venta/db/migrations/0001_inicial.sql:18>)) | Los cinco PK son `text`; Better Auth usa el generador aleatorio por defecto | Coincide para cuentas reales |
| UUID | `id uuid primary key default gen_random_uuid()` en `listings`, `orders`, `conversations`, `offers`, `claims`, `promotions`, `saved_searches` ([0001:59](</Users/nicolasr2/Downloads/2venta/db/migrations/0001_inicial.sql:59>), [0001:130](</Users/nicolasr2/Downloads/2venta/db/migrations/0001_inicial.sql:130>), [0001:231](</Users/nicolasr2/Downloads/2venta/db/migrations/0001_inicial.sql:231>), [0001:396](</Users/nicolasr2/Downloads/2venta/db/migrations/0001_inicial.sql:396>)) | Los siete PK son `uuid` con default `gen_random_uuid()` | Coincide |
| `bigserial` interno | `bigserial primary key` en las 14 tablas enumeradas ([0001:117](</Users/nicolasr2/Downloads/2venta/db/migrations/0001_inicial.sql:117>), [0005:10](</Users/nicolasr2/Downloads/2venta/db/migrations/0005_perfil_y_suspension.sql:10>), [0007:7](</Users/nicolasr2/Downloads/2venta/db/migrations/0007_fotos.sql:7>), [0013:24](</Users/nicolasr2/Downloads/2venta/db/migrations/0013_fotos_y_reportes_de_chat.sql:24>), [0014:8](</Users/nicolasr2/Downloads/2venta/db/migrations/0014_fotos_en_los_reclamos.sql:8>)) | Los 14 ids son `int8` con `nextval(..._id_seq)` | Coincide |
| PK de otra tabla | `user_id`, `order_id` o `phone` según la tabla ([0001:215](</Users/nicolasr2/Downloads/2venta/db/migrations/0001_inicial.sql:215>), [0001:295](</Users/nicolasr2/Downloads/2venta/db/migrations/0001_inicial.sql:295>), [0004:7](</Users/nicolasr2/Downloads/2venta/db/migrations/0004_recuperacion.sql:7>)) | PKs reales: `kyc_verifications(user_id)`, `stores(user_id)`, `shipping_addresses(order_id)`, `pickup_codes(order_id)`, `phone_codes(phone)`, `recovery_codes(phone)` | Coincide |
| PK compuesta | `favorites`, `cart_items` y `conversation_reads` ([0006:10](</Users/nicolasr2/Downloads/2venta/db/migrations/0006_carrito.sql:10>), [0012:13](</Users/nicolasr2/Downloads/2venta/db/migrations/0012_conversaciones_leidas.sql:13>)) | `favorites(user_id, listing_id)`, `cart_items(user_id, listing_id)`, `conversation_reads(conversation_id, user_id)` | Coincide |
| Texto legible | `categories.slug text primary key` ([0001:35](</Users/nicolasr2/Downloads/2venta/db/migrations/0001_inicial.sql:35>)) | `categories_pkey (slug)` | Coincide |

El índice de celular no tiene duplicados entre las filas confirmadas en la base consultada.

### B. Direcciones públicas y compartibles

El rastreo de rutas dinámicas de `src/app` encontró:

- `/producto/[id]`, `/publicar/[id]` y `/producto/[id]/editar`: ids de `listings`, validados como UUID en [catalog/queries.ts:132](</Users/nicolasr2/Downloads/2venta/src/features/catalog/queries.ts:132>) y creados por `gen_random_uuid()`.
- `/pedido/[id]`, `/chat/[id]`, `/chat/[id]/oferta`, `/chat/abrir/[listingId]`, `/comprar/[id]` y las rutas `dev` equivalentes: usan pedidos, conversaciones, publicaciones u ofertas UUID; `/comprar/carrito` es una palabra fija, no un id.
- `/vendedor/[id]`: usa `user.id`, que para cuentas reales es texto aleatorio. La ficha enlaza al id, no al alias ([producto/[id]/page.tsx:176](</Users/nicolasr2/Downloads/2venta/src/app/producto/[id]/page.tsx:176>)).
- Los `bigserial` de mensajes, preguntas, fotos, avisos, reportes y eventos no se usan solos en una URL; se pasan como claves internas o datos de formularios.

En el navegador observé enlaces `/producto/<UUID>` y `/vendedor/<texto alfanumérico>`. `/producto/1` y `/vendedor/1` devolvieron 404. No encontré una URL pública con un consecutivo.

### C. Alias y celular

- `toAlias()` es determinista: toma el primer nombre y la inicial del último término ([RegisterForm.tsx:191](</Users/nicolasr2/Downloads/2venta/src/features/auth/RegisterForm.tsx:191>)); por eso los derivados pueden repetirse.
- En la interfaz, una cuenta Camila intentó guardar `aNdRéS m.`, alias existente de otra cuenta. La aplicación mostró exactamente: **“Ese alias ya lo usa otra persona. Elige otro.”** La consulta posterior dejó `Camila V.` y cero filas nuevas en `alias_history`.
- El alias anterior se inserta antes del `UPDATE` cuando sí hay cambio ([profile/actions.ts:46](</Users/nicolasr2/Downloads/2venta/src/features/profile/actions.ts:46>)); la tabla tiene PK `bigserial` ([0005:9](</Users/nicolasr2/Downloads/2venta/db/migrations/0005_perfil_y_suspension.sql:9>)).
- La unicidad del celular confirmado está protegida dos veces: consulta preventiva y captura de la violación del índice en [auth/actions.ts:100](</Users/nicolasr2/Downloads/2venta/src/features/auth/actions.ts:100>), más el índice parcial real descrito arriba.

## NO VERIFICADO

- No pude abrir en navegador un pedido, chat, oferta o reclamo real: la base consultada tiene cero filas en `orders`, `conversations`, `offers` y `claims`. La revisión de sus rutas, PKs y construcción de enlaces sí se hizo en código y migraciones.
- No hice un cambio exitoso de alias solo para producir una fila de `alias_history`, porque habría sido una escritura persistente; la lógica quedó comprobada por código y la migración.
- No probé dos cambios simultáneos del mismo alias. Como no hay índice único de alias, la unicidad bajo carrera no está verificada como garantía de base de datos.
- No verifiqué el despliegue de producción ni el flujo Google; el documento sí deja ambos como comportamiento/decisión aparte.

No se ejecutaron `db:seed`, `db:migrate` ni `verify`, porque escriben o recrean datos. El repositorio no fue modificado.

---

Respuesta (Claude, 2026-09-24): las tres observaciones de redacción se aplicaron tal
cual (excepción de los usuarios sembrados, glosario, unicidad del alias como regla de
la app). La carrera entre dos cambios de alias quedó en `pendientes.md`.
