# Rebanada S-08 — Chat, ofertas y preguntas públicas

## Qué hace

Los tres canales de la D-21. Chat privado por artículo entre comprador y vendedor.
Oferta formal con precio y vencimiento, que al aceptarse lleva directo al pago por
ese precio. Y preguntas públicas en la ficha, que ve cualquiera.

Todo pasa por el filtro anti-desvío de la D-22.

## Por qué va primero en la Fase 2

Porque la entrega presencial con código (S-09) se coordina dentro del chat: sin
conversación no hay dónde ponerse de acuerdo en el punto y la hora.

## La decisión sobre el filtro: ocultar y explicar, no bloquear

El mensaje se envía siempre; lo que se oculta es el dato. Un mensaje bloqueado sin
explicación se lee como una falla de la app. Uno con el dato tachado y una línea
que dice por qué, educa. Es lo que muestra el mockup.

**El filtro no pretende ser infalible y no puede serlo.** Quien de verdad quiera
salirse va a poder, deletreando el número en tres mensajes. Lo que sí logra es que
salirse deje de ser lo cómodo, y eso mueve el comportamiento de la mayoría.

El costo del filtro es tachar de más. Por eso tiene tantas pruebas de mensajes
normales como de mensajes con datos de contacto: si tacha "¿me la dejas en
1.700.000?", rompe justo la conversación para la que existe.

## Archivos que toca

- `src/features/chat/redact.ts` — el filtro, con pruebas unitarias propias
- `src/features/chat/` — conversación, ofertas, preguntas
- `src/app/chat/[id]/page.tsx`
- `src/app/producto/[id]/page.tsx` — las preguntas públicas
- `db/schema.sql` — `conversations`, `messages`, `offers`, `questions`
- `e2e/chat.spec.ts`

## Explícitamente fuera

- Imágenes en el chat. La D-22 pide que el filtro cubra también las capturas de
  pantalla con el número visible, y eso necesita leer texto dentro de una imagen.
  Como todavía no se pueden mandar imágenes, no hay hueco abierto; cuando se
  agreguen, el filtro tiene que crecer con ellas.
- Contraoferta como acción propia. Hoy se rechaza y se ofrece otro precio, que
  produce el mismo resultado con un paso más.
- Avisos por notificación de un mensaje nuevo. Es S-15.
- Reportar una conversación o un usuario. Es RF-32, va con moderación.
- Bandeja con todas las conversaciones.

## Prueba de punta a punta

1. Comprador y vendedor conversan en el mismo hilo.
2. Volver a escribir al mismo artículo retoma el hilo, no abre otro.
3. El filtro oculta el número y explica por qué, y el original no queda en la base.
4. Negociar precios no se ve afectado por el filtro.
5. Una oferta aceptada lleva a pagar el precio acordado, no el publicado.
6. Las preguntas y respuestas las ve cualquiera, sin cuenta.

## Casos de fallo con prueba

- Quien ofrece no puede aceptar su propia oferta.
- Una oferta rechazada no sirve para pagar el precio ofrecido, ni con el
  identificador en la mano.
- Una oferta vencida no se puede aceptar.
- Una conversación ajena no se puede leer.
- No se puede abrir chat con uno mismo.
- Solo el vendedor del artículo responde sus preguntas.
- Sin sesión no se puede escribir ni preguntar.

## Depende de

S-06.
