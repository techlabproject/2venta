# S-36 — El chat parece un chat

## Qué hace

Convierte la pantalla de conversación en algo reconocible como chat, y saca la
oferta de en medio.

## Por qué

Lo pidió Nicolás (2026-09-18) con una captura. Dos problemas distintos en la misma
pantalla:

1. **«Ofertar» pesaba lo mismo que «Enviar».** Debajo del campo de escribir había un
   segundo campo, de precio, siempre visible. La acción de cada día —preguntar— y la
   acción excepcional —negociar— competían por el mismo sitio.
2. **No parecía un chat.** Sin horas, sin separadores de día, sin una zona de
   conversación que se distinga del resto, y con el campo de escribir flotando a
   media pantalla. Todo el mundo sabe cómo se ve un chat; este no se veía así.

## Alcance

1. **Zona de conversación de altura completa.** La cabecera y el artículo arriba, los
   mensajes en el medio con su propio desplazamiento, y el campo de escribir abajo.
2. **La barra inferior desaparece dentro de una conversación.** Es lo que hacen todas
   las apps de chat: dentro del hilo, la navegación estorba y el pulgar quiere el
   campo de escribir. Además libera el fondo de la pantalla, que es donde tiene que
   estar el compositor.
3. **Burbujas con hora**, la mía a la derecha en petróleo, la suya a la izquierda en
   blanco, y la hora dentro de la burbuja.
4. **Separadores de día** («Hoy», «Ayer», «12 de sept»): sin ellos, una conversación
   de varios días es una lista plana y no se sabe qué se dijo cuándo.
5. **La oferta sale del compositor** y pasa a `/chat/[id]/oferta`, un panel propio con
   el precio pedido, el campo, lo que significa y el vencimiento. La entrada desde el
   chat es un enlace discreto, no un campo permanente.
6. **La oferta se ve dentro de la conversación**, en su sitio cronológico, como una
   tarjeta. Hoy vive en un bloque aparte debajo de todo, desconectada de lo que se
   estaba hablando.

## Qué queda explícitamente fuera

- **Tiempo real.** Los mensajes siguen apareciendo al recargar. Es una rebanada propia.
- **Confirmaciones de entrega y de lectura** (los dos vistos de WhatsApp). El dato de
  lectura existe desde la S-35, pero mostrárselo al otro es una decisión de privacidad
  que nadie ha tomado.
- **«Está escribiendo…»**, que necesita tiempo real.
- **Fotos en el chat y reportar la conversación**: van en la S-37, que es lo otro que
  se pidió en el mismo mensaje.

## Prueba de punta a punta

`e2e/chat.spec.ts` (ampliada):

1. Un mensaje propio y uno ajeno caen en lados distintos y cada uno lleva su hora.
2. La conversación no muestra un campo de precio: para ofertar hay que ir al panel.
3. Desde el panel se hace una oferta, y vuelve al chat mostrándola en la conversación.
4. El panel de oferta es de la conversación: quien no es parte no entra.
5. Dentro de una conversación no se dibuja la barra inferior.
