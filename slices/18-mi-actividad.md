# Rebanada S-18 — Mis compras, mis ventas, mis chats

## Qué hace

Tres listas que faltaban: los pedidos que hice, las ventas que tengo, y las
conversaciones abiertas.

## Por qué

No es una función nueva, es un defecto. Hoy la única manera de volver a un pedido es
tener su dirección web guardada: se paga, se cierra la pestaña y no se encuentra
nunca más. Lo mismo con el chat, al que solo se llega desde el artículo, y que
desaparece si el artículo se vende.

Se descubrió revisando qué faltaba, no probando: ninguna prueba lo cubría porque
todas navegan con la dirección en la mano.

Es la clase de hueco que no aparece en una lista de requisitos porque nadie escribe
"y que se pueda volver". Está implícito en cada uno de los otros.

## Archivos que toca

- `src/app/actividad/page.tsx`
- `src/features/orders/queries.ts` — mis compras y mis ventas
- `src/features/chat/queries.ts` — mis conversaciones
- `src/components/AppHeader.tsx` — el enlace
- `e2e/actividad.spec.ts`

## Explícitamente fuera

- Filtrar o buscar dentro de las listas.
- Paginación. Con el volumen de una ciudad, treinta por lista alcanza.
- Contador de mensajes sin leer en el chat.

## Prueba de punta a punta

1. Un comprador ve su compra en la lista y llega al pedido desde ahí.
2. Un vendedor ve su venta.
3. Los dos ven la conversación y llegan a ella.
4. La conversación sigue estando cuando el artículo se vende.

## Casos de fallo con prueba

- No aparecen pedidos ni conversaciones de otras personas.
- Sin sesión, la pantalla manda a ingresar.

## Depende de

S-17.
