# S-33 — El seguimiento dice dónde va el pedido y qué falta

## Por qué

Del repaso de los mockups (pantalla 1j) quedó pendiente lo más visible: el mockup
dibuja una línea de tiempo con cuatro pasos y puntos que muestran dónde va el pedido
y qué viene después. La aplicación tenía la misma información repartida en dos
sitios —un rótulo de estado arriba y una lista de «Movimientos» al final— y **ninguno
de los dos decía nunca qué falta**.

Importa aquí más que en otra pantalla: es donde está el dinero de alguien retenido.
Quien acaba de pagarle a un desconocido abre esto para saber si su plata está bien y
cuánto falta, y le respondíamos con dos palabras.

## Alcance

- `OrderTimeline`: los pasos, cuáles se cumplieron, con qué hora, y cuál va ahora.
- Los pasos cumplidos salen de `order_events`, no del estado actual: un pedido puede
  saltarse pasos (en persona va de `pagado` a `liberado`) y así cada paso muestra su
  hora de verdad.
- Dos caminos, porque son dos productos distintos: con envío (cuatro pasos) y en
  persona (dos; no hay transportadora que despache ni que reporte entrega).
- Los desvíos no se dibujan como el camino feliz: cancelado y reembolsado tienen su
  propio bloque, y un reclamo abierto dice que nada avanza mientras se decide.
- Se quita la lista de «Movimientos»: decía lo mismo, peor y más abajo.

## Qué queda fuera

- **El paso «En reparto en Bogotá» del mockup.** Necesita que la transportadora lo
  reporte, y la nuestra es de prueba con dos únicos estados. Va con R-04; inventarlo
  sería decirle al comprador que su paquete se está moviendo sin saberlo.
- El número de pedido corto del mockup («#A-4821»). Los identificadores públicos son
  UUID a propósito (un id secuencial deja contar cuántos pedidos existen), y un
  segundo identificador legible es una decisión aparte.

## Prueba de punta a punta

`e2e/seguimiento.spec.ts`:

1. Un pedido con envío muestra los cuatro pasos; el cumplido con su hora y el que
   falta con la explicación de qué pasará.
2. Al despachar, el segundo paso queda cumplido y aparece su hora.
3. Un pedido en persona muestra dos pasos y no menciona transportadora.
4. Un pedido cancelado no se dibuja como si siguiera en camino.
5. Con un reclamo abierto, el seguimiento dice que el dinero no se mueve.
