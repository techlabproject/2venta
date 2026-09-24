# Identidad de las personas y llaves de la base

Corrección 12 de Catalina (2026-09-24): «¿Se debería pedir un username único? Se debe
documentar cuál será el PK de la db». Decisión de Nicolás: **no se pide nombre de
usuario**; se documenta el modelo que ya existe.

## Palabras que se usan aquí

- **Llave primaria (PK):** el identificador principal de cada fila de una tabla; no
  se repite nunca.
- **Índice único:** una regla de la base que impide guardar dos filas con el mismo
  valor (por ejemplo, dos cuentas con el mismo correo).
- **UUID / texto aleatorio:** un identificador largo generado por el sistema, que no
  sigue un orden. No es un nombre de usuario ni lo elige nadie.
- **Consecutivo (`bigserial`):** 1, 2, 3… en orden de creación.

## Cómo se identifica a una persona

| Qué | Para qué sirve | ¿Único? | ¿Público? |
|---|---|---|---|
| **Id de la cuenta** (`user.id`) | La llave de todo: pedidos, publicaciones, conversaciones apuntan a él. También es la dirección del perfil (`/vendedor/<id>`) | Sí (llave primaria) | Sí, en la dirección del perfil |
| **Correo** | Entrar y recibir avisos | Sí (índice único) | No |
| **Celular confirmado** | Confirmar que la persona existe y frenar cuentas desechables (D-01) | Sí, entre los confirmados (índice `user_celular_verificado_unico`) | No |
| **Alias** | El nombre que ven los demás (D-04) | No siempre: el que se arma solo («Catalina R.») puede repetirse; el que se elige a mano no puede ser el de otra persona (D-67). Lo comprueba la aplicación al cambiarlo; **no es una regla de la base** (no hay índice único, a propósito) | Sí |
| **Identidad verificada** (vendedores) | Saber quién vende de verdad (D-02) | Una por cuenta | Solo el distintivo «Verificado» |

**Por qué no hay nombre de usuario (@usuario).** No agregaría seguridad: la identidad
real ya la dan el celular confirmado y la verificación del vendedor, y suplantar a
alguien con el alias ya está cerrado (D-67; además, el alias anterior queda
registrado, D-43). Pedirlo sumaría un campo al registro y la tarea de moderar nombres
ofensivos y reclamos por nombres. Si más adelante se quiere una dirección bonita para
las tiendas (`2venta.co/@tienda`), se puede agregar como opcional sin cambiar ninguna
llave.

## Llaves primarias de la base

Regla del proyecto (`CLAUDE.md`): **lo que aparece en una dirección pública lleva un
identificador aleatorio**, nunca un número consecutivo, porque un consecutivo deja
contar cuántos productos o pedidos existen.

| Tipo de llave | Tablas | Por qué |
|---|---|---|
| **Texto aleatorio** (lo genera la biblioteca de autenticación) | `user`, `session`, `account`, `verification`, `rateLimit` | Así los crea Better Auth (D-27). Excepción: los usuarios de prueba que siembra `db/seed.ts` en desarrollo usan ids legibles (`seed-camila`); no existen en la nube |
| **UUID** (`gen_random_uuid()`) | `listings`, `orders`, `conversations`, `offers`, `claims`, `promotions`, `saved_searches` | Salen en direcciones públicas o compartibles (`/producto/…`, `/pedido/…`, `/chat/…`) |
| **Número consecutivo** (`bigserial`) | `messages`, `order_items`, `order_events`, `questions`, `reports`, `ratings`, `notifications`, `listing_views`, `otp_sends`, `alias_history`, `user_reports`, `listing_photos`, `chat_reports`, `claim_photos` | Filas internas que nunca van solas en una dirección pública; el orden sirve para listarlas |
| **La llave de otra tabla** (una fila por dueño) | `kyc_verifications` y `stores` (por `user_id`), `shipping_addresses` y `pickup_codes` (por `order_id`), `phone_codes` y `recovery_codes` (por celular) | Hay una sola por persona, pedido o celular |
| **Compuesta** | `favorites` y `cart_items` (`user_id` + `listing_id`), `conversation_reads` (`conversation_id` + `user_id`) | La pareja es lo que no se puede repetir |
| **Texto legible** | `categories` (`slug`: `tecnologia`, `ropa`, `ninos`) | Va en los filtros de la dirección (`?categoria=ropa`) |

## Qué queda por decidir

- Si las tiendas deben tener una dirección propia y legible (sería el @usuario
  opcional); hoy no hace falta.
- Las cuentas que entren con Google se identifican igual, por su id; el correo
  lo trae Google y el celular se pide aparte (D-01).
