# 2venta · Vuelta 2

Fecha: 2 de octubre de 2026 · Bogotá  
Probadora: Luna  
Anchos revisados: 390 px (móvil) y 1280 px (escritorio)

## Veredicto

- General: **PASA CON OBSERVACIONES**.
- Fila 54 · Reportes Excel: **PASA CON OBSERVACIONES**. Pantalla y Excel coinciden; la única diferencia visible es la suma por categoría menor que las ventas completadas, explicada por 4 pedidos de prueba sin artículos.
- Liberar el pago y cancelar: **PASA**.
- Reclamo al lado: **PASA**.
- Seguimiento del pedido: **PASA**.
- Comisión en el pedido del vendedor: **PASA**.

No encontré un fallo nuevo alrededor de estos cambios.

## Hallazgos

1. **Observación de datos, no defecto funcional:** en `http://localhost:3100/admin/reportes` con el periodo por defecto, la pantalla muestra `34 de 38` y «Por categoría» suma 11 + 18 + 1 = 30. La lectura de la base confirma 34 pedidos `liberado`, de los cuales exactamente 4 no tienen filas en `order_items`; por eso no pueden aparecer en una categoría. Los 4 pedidos reembolsados tampoco se incluyen en la tabla, como indica la pantalla.
2. Las capturas y los Excel de esta vuelta quedaron en [capturas/](</private/tmp/claude-501/-Users-nicolasr2-Downloads-2venta/d950c930-0883-4b91-a711-8f99b14729c9/scratchpad/luna/v3-vuelta2/capturas>).

## Lo que pasa

### 1. Fila 54 · Excel de Reportes

En `http://localhost:3100/admin/reportes`, a 1280 px, el periodo por defecto quedó en `Desde 2026-09-02` / `Hasta 2026-10-02`. La pantalla mostró `Ventas 34 de 38`, `Volumen $ 8.279.000` y `Comisiones $ 413.950`. El Excel descargado fue `2venta-reporte-2026-09-02-a-2026-10-02.xlsx`; sus hojas fueron `Resumen` y `Por categoría`, con `Ventas completadas = 34`, `Pedidos cerrados (con reembolsos) = 38` y la línea `Del 2 de septiembre de 2026 al 2 de octubre de 2026`. La evidencia está en [reportes-default-1280.png](</private/tmp/claude-501/-Users-nicolasr2-Downloads-2venta/d950c930-0883-4b91-a711-8f99b14729c9/scratchpad/luna/v3-vuelta2/capturas/reportes-default-1280.png>) y [reporte-default.xlsx](</private/tmp/claude-501/-Users-nicolasr2-Downloads-2venta/d950c930-0883-4b91-a711-8f99b14729c9/scratchpad/luna/v3-vuelta2/capturas/reporte-default.xlsx>).

Probé dos periodos adicionales:

- `http://localhost:3100/admin/reportes?desde=2026-01-01&hasta=2026-01-31`, 1280 px: pantalla `0`; Excel `2venta-reporte-2026-01-01-a-2026-01-31.xlsx`, línea `Del 1 de enero de 2026 al 31 de enero de 2026`, y ambos contadores en `0`. [Captura](</private/tmp/claude-501/-Users-nicolasr2-Downloads-2venta/d950c930-0883-4b91-a711-8f99b14729c9/scratchpad/luna/v3-vuelta2/capturas/reportes-enero-1280.png>) · [Excel](</private/tmp/claude-501/-Users-nicolasr2-Downloads-2venta/d950c930-0883-4b91-a711-8f99b14729c9/scratchpad/luna/v3-vuelta2/capturas/reporte-enero.xlsx>).
- `http://localhost:3100/admin/reportes?desde=2026-10-02&hasta=2026-10-02`, 1280 y 390 px: pantalla `22 de 24`; Excel `2venta-reporte-2026-10-02-a-2026-10-02.xlsx`, línea `Del 2 de octubre de 2026 al 2 de octubre de 2026`, `Ventas completadas = 22` y `Pedidos cerrados (con reembolsos) = 24`. Los dos pedidos creados en esta vuelta (`e9cb3ec6-1bb8-4804-883c-8576c307e957` y `1f1932a0-6677-45c7-80be-6ef8399a7ac6`) aparecen en la base como `liberado` el 2 de octubre a las 00:36 de Bogotá, por lo que `Hasta = hoy` sí incluye el día completo. [1280 px](</private/tmp/claude-501/-Users-nicolasr2-Downloads-2venta/d950c930-0883-4b91-a711-8f99b14729c9/scratchpad/luna/v3-vuelta2/capturas/reportes-hoy-1280.png>) · [390 px](</private/tmp/claude-501/-Users-nicolasr2-Downloads-2venta/d950c930-0883-4b91-a711-8f99b14729c9/scratchpad/luna/v3-vuelta2/capturas/reportes-hoy-390.png>) · [Excel](</private/tmp/claude-501/-Users-nicolasr2-Downloads-2venta/d950c930-0883-4b91-a711-8f99b14729c9/scratchpad/luna/v3-vuelta2/capturas/reporte-hoy.xlsx>).

En 390 px el reporte no tuvo overflow horizontal (`scrollWidth = 390`).

### 2. Liberar el pago y cancelarlo

En `http://localhost:3100/pedido/e9cb3ec6-1bb8-4804-883c-8576c307e957`, como Laura a 390 px, «Ya lo recibí, liberar pago» abrió el diálogo con el título exacto `¿Liberar el pago?`, el texto que advierte `Después la plata es de quien vendió y ya no puedes abrir un reclamo.`, y los botones `Cancelar` y `Sí, liberar el pago`. [Diálogo](</private/tmp/claude-501/-Users-nicolasr2-Downloads-2venta/d950c930-0883-4b91-a711-8f99b14729c9/scratchpad/luna/v3-vuelta2/capturas/liberar-dialogo-390.png>).

Probé las tres salidas: `Cancelar`, Escape y tocar fuera del diálogo. En los tres casos el estado siguió siendo exactamente `Pago recibido y guardado` y el dinero no se liberó. La pantalla previa conserva el recuadro de dinero guardado y ambos botones: [estado sin liberar](</private/tmp/claude-501/-Users-nicolasr2-Downloads-2venta/d950c930-0883-4b91-a711-8f99b14729c9/scratchpad/luna/v3-vuelta2/capturas/envio-pagado-seguimiento-390.png>). Después confirmé con `Sí, liberar el pago` y el estado pasó a `Pago liberado al vendedor`: [resultado](</private/tmp/claude-501/-Users-nicolasr2-Downloads-2venta/d950c930-0883-4b91-a711-8f99b14729c9/scratchpad/luna/v3-vuelta2/capturas/envio-completado-390.png>).

### 3. Reclamo al lado

En el mismo pedido y ancho, dentro de `data-testid="dinero-guardado"`, apareció `Tengo un problema con el pedido` como botón debajo de la acción de liberar, visible en la misma tarjeta. [Captura](</private/tmp/claude-501/-Users-nicolasr2-Downloads-2venta/d950c930-0883-4b91-a711-8f99b14729c9/scratchpad/luna/v3-vuelta2/capturas/envio-pagado-seguimiento-390.png>).

### 4. Seguimiento y compras completas

#### Compra con envío

Pedido `http://localhost:3100/pedido/e9cb3ec6-1bb8-4804-883c-8576c307e957`, Laura compra a Camila.

- Recién pagado, 390 px: `Pago recibido y guardado` con hora `2 de oct, 12:36 a. m.`; `Esperando el despacho — El vendedor lo lleva a la transportadora.`; `Entrega — La transportadora avisa cuando lo entregue.`; `Pago al vendedor — Cuando confirmes que lo recibiste, o a los siete días de la entrega.` [Captura](</private/tmp/claude-501/-Users-nicolasr2-Downloads-2venta/d950c930-0883-4b91-a711-8f99b14729c9/scratchpad/luna/v3-vuelta2/capturas/envio-pagado-seguimiento-390.png>).
- Despachado, vendedor en 1280 px: `El vendedor despachó`, con guía `GUIA-E9CB3EC6`; la comisión y el pedido siguen visibles. [Captura vendedor](</private/tmp/claude-501/-Users-nicolasr2-Downloads-2venta/d950c930-0883-4b91-a711-8f99b14729c9/scratchpad/luna/v3-vuelta2/capturas/envio-despachado-vendedor-1280.png>).
- Compradora tras despacho, 390 px: `El vendedor despachó` con hora y el paso siguiente `En camino — La transportadora avisa cuando lo entregue.` [Captura](</private/tmp/claude-501/-Users-nicolasr2-Downloads-2venta/d950c930-0883-4b91-a711-8f99b14729c9/scratchpad/luna/v3-vuelta2/capturas/envio-despachado-compradora-390.png>).
- Tras la entrega simulada: `Entregado` con hora y `Revisa y confirma`; luego de confirmar, `Le pagamos al vendedor`. [Entregado](</private/tmp/claude-501/-Users-nicolasr2-Downloads-2venta/d950c930-0883-4b91-a711-8f99b14729c9/scratchpad/luna/v3-vuelta2/capturas/envio-entregado-390.png>) · [Completado](</private/tmp/claude-501/-Users-nicolasr2-Downloads-2venta/d950c930-0883-4b91-a711-8f99b14729c9/scratchpad/luna/v3-vuelta2/capturas/envio-completado-390.png>).

#### Compra en persona

Pedido `http://localhost:3100/pedido/1f1932a0-6677-45c7-80be-6ef8399a7ac6`, Laura compra a Camila.

- Recién pagado, 390 px: el seguimiento tuvo solo dos pasos, `Pago recibido y guardado` y `Encuentro y código`; no mostró transportadora. También mostró `Se ven en Centro Comercial Andino (Chapinero)` y el código de seis dígitos. [Captura](</private/tmp/claude-501/-Users-nicolasr2-Downloads-2venta/d950c930-0883-4b91-a711-8f99b14729c9/scratchpad/luna/v3-vuelta2/capturas/persona-pagada-compradora-390.png>).
- El vendedor introdujo el código y cobró la venta en 1280 px; el paso pasó a `Le dictaste el código y le pagamos al vendedor`. [Captura vendedor](</private/tmp/claude-501/-Users-nicolasr2-Downloads-2venta/d950c930-0883-4b91-a711-8f99b14729c9/scratchpad/luna/v3-vuelta2/capturas/persona-completada-vendedor-1280.png>) · [compradora](</private/tmp/claude-501/-Users-nicolasr2-Downloads-2venta/d950c930-0883-4b91-a711-8f99b14729c9/scratchpad/luna/v3-vuelta2/capturas/persona-completada-compradora-390.png>).

### 5. Comisión del vendedor

En el pedido con producto de `$ 154.000`, vendedor a 1280 px, bajo `Comisión 2venta` apareció exactamente `5 % del precio, mínimo $ 2.500`; comisión `$ 7.700` y `Recibes $ 146.300`. [Captura](</private/tmp/claude-501/-Users-nicolasr2-Downloads-2venta/d950c930-0883-4b91-a711-8f99b14729c9/scratchpad/luna/v3-vuelta2/capturas/pedido-vendedor-comision-1280.png>).

También verifiqué el tope con un checkout pendiente del MacBook de Camila de `$ 2.800.000`: el pedido del vendedor mostró exactamente `5 % del precio, máximo $ 120.000`, comisión `$ 120.000` y `Recibes $ 2.680.000`, en 1280 px. Lo cancelé inmediatamente después de tomar la evidencia, sin completar una tercera compra. [Captura](</private/tmp/claude-501/-Users-nicolasr2-Downloads-2venta/d950c930-0883-4b91-a711-8f99b14729c9/scratchpad/luna/v3-vuelta2/capturas/pedido-vendedor-tope-1280.png>) · [cancelación](</private/tmp/claude-501/-Users-nicolasr2-Downloads-2venta/d950c930-0883-4b91-a711-8f99b14729c9/scratchpad/luna/v3-vuelta2/capturas/pedido-tope-cancelado-390.png>).

## NO VERIFICADO

- No ejecuté la liberación automática siete días después de la entrega; el pedido con envío se completó mediante entrega simulada y confirmación manual.
- El caso del tope de `$ 120.000` se verificó en un pedido pendiente del vendedor, que se canceló después; las dos compras solicitadas sí quedaron completas: una con envío y otra en persona.
