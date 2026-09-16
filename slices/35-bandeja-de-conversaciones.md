# S-35 — La bandeja de conversaciones

## Qué hace

Le da a las conversaciones una pantalla propia en `/chats`, con la forma de bandeja
que tiene cualquier marketplace: quién te escribió, de qué artículo, qué fue lo
último que se dijo, cuándo, y **qué no has leído**.

## Por qué

Lo pidió Nicolás (2026-09-15) comparándolo con Facebook Marketplace, y detrás hay un
desajuste concreto: la barra inferior dice **«Chats»** y lleva a `/actividad`, donde
las conversaciones son la **tercera** sección, debajo de compras y ventas. El
producto promete un chat interno —es lo que sostiene la D-19, que los pagos por
fuera se bloquean— y ese chat no tiene dónde vivir.

Y falta lo que hace útil una bandeja: hoy **no existe ningún registro de leído**.
Sin eso, la lista no puede decir lo único que de verdad le importa a alguien que la
abre, que es qué hay nuevo.

## Alcance

1. **Migración `0012_conversaciones_leidas.sql`**: tabla `conversation_reads`
   (`conversation_id`, `user_id`, `last_read_at`). Por participante, no por
   conversación: comprador y vendedor leen por separado.
2. **`/chats`**: la bandeja. Cada renglón lleva la cara de la contraparte, la
   portada del artículo, el alias, el título, el último mensaje con «Tú:» cuando lo
   escribiste tú, la hora relativa y el punto de no leído.
3. **Marcar leído** al abrir la conversación.
4. **Contador en la barra inferior**, sobre «Chats».
5. **`/actividad` deja de listar conversaciones** y enlaza a `/chats`. Esa pantalla
   es la de pedidos; tener la misma lista en dos sitios es lo que hace que ninguno
   de los dos se sienta el sitio.
6. Estado vacío con `<Vacio>` (D-88).

## Qué queda explícitamente fuera

- **Tiempo real.** Los mensajes nuevos aparecen al recargar, no solos. Websockets
  son una rebanada propia y no es lo que se pidió.
- **Buscar dentro de las conversaciones.** Con 30 conversaciones no hace falta.
- **Archivar o silenciar.** No hay volumen que lo justifique todavía.
- **Marcar como no leído** a mano.
- El contador en la cabecera de escritorio: la barra inferior es de móvil, y en
  escritorio el menú ya nombra las conversaciones.

## Control de acceso

IMPORTANT: zona sensible — son datos personales de dos personas. Toda consulta
filtra por participación en el servidor:

- `listConversations` ya filtra `buyer_id = $1 or seller_id = $1`.
- `markConversationRead` escribe **solo** si quien pide es parte de esa conversación;
  si no, no escribe nada y no dice por qué.
- `countUnreadConversations` cuenta sobre el mismo filtro.
- El punto de no leído no puede revelar la existencia de una conversación ajena:
  todo sale de la misma consulta ya filtrada.

## Prueba de punta a punta

`e2e/chats.spec.ts`:

1. Las dos partes encuentran la conversación en `/chats`, con el último mensaje.
2. Un mensaje de la contraparte marca la conversación como no leída, y abrirla la
   marca leída.
3. Lo que escribes tú **no** te aparece como no leído a ti.
4. Nadie ve en su bandeja la conversación de otras dos personas.
5. La conversación sigue en la bandeja cuando el artículo ya se vendió.
