# Informe de prueba — segunda vuelta, correcciones 26 a 32

Fecha: 24 de septiembre de 2026. Navegador Chromium conectado al servidor existente. Anchos usados: 390 × 844 y 1280 × 800.

## Veredicto

**PASA CON OBSERVACIONES** — el cierre por fondo oscuro y el flujo retirar/republicar pasan; los rangos de visitas se muestran correctamente en tarjetas y en `/vender`, pero `Más de 500` se parte en dos líneas en el resumen de `Tus publicaciones` a 390 px.

## Hallazgos

### 1. «Más de 500» se parte en el resumen de Tus publicaciones a 390 px

- **Severidad:** baja.
- **Ancho:** 390 px.
- **Pasos exactos:** iniciar sesión como `camila@2venta.demo`; abrir `http://localhost:3100/vender/metricas` con un total preparado de más de 500 visitas; mirar el resumen superior con `Visitas`.
- **Esperaba:** que el rango se leyera completo en una sola línea, sin partirse ni desbordarse.
- **Vi:** el texto exacto `Más de 500` aparece en dos líneas: `Más de` / `500`. El `dd` del resumen mide 84 px de ancho y 48 px de alto. La URL es `http://localhost:3100/vender/metricas`. En las tarjetas, los cinco rangos sí caben en una línea; en `/vender`, `Visitas en total · Más de 500` también cabe en una línea.
- **Captura:** [v2-rangos-metricas-390.png](./capturas/v2-rangos-metricas-390.png). Comparación con `/vender`: [v2-rangos-vender-390.png](./capturas/v2-rangos-vender-390.png).

## Lo que verificaste y pasa

- El diálogo de `Retirar` se cerró al tocar el fondo oscuro a 390 px con toque real. La URL permaneció `http://localhost:3100/producto/4d92b622-7c66-4db3-93f4-c4e8d4d72d84`, el botón `Retirar la publicación` siguió visible y la publicación permaneció `Activa`. Capturas: [v2-dialogo-abierto-touch-390.png](./capturas/v2-dialogo-abierto-touch-390.png) y [v2-dialogo-cerrado-touch-390.png](./capturas/v2-dialogo-cerrado-touch-390.png).
- El mismo diálogo se cerró al hacer clic en el fondo a 1280 px. La URL permaneció `http://localhost:3100/producto/4d92b622-7c66-4db3-93f4-c4e8d4d72d84` y no se retiró la publicación. Capturas: [v2-dialogo-abierto-click-1280.png](./capturas/v2-dialogo-abierto-click-1280.png) y [v2-dialogo-cerrado-click-1280.png](./capturas/v2-dialogo-cerrado-click-1280.png).
- Regresión rápida retirar/republicar en 390 px: desde `http://localhost:3100/vender/metricas`, confirmar `Retirar` llevó a `http://localhost:3100/vender/metricas?retirada=4d92b622-7c66-4db3-93f4-c4e8d4d72d84` y mostró exactamente `Retiraste «MacBook Air 13" 2020, 8 GB, 256 GB». Ya no se ve en el catálogo; la tienes abajo, en Retiradas, por si la quieres volver a publicar.` `Republicar` devolvió la tarjeta a `Activa` y la quitó de `Retiradas`. Capturas: [v2-retirada-390.png](./capturas/v2-retirada-390.png) y [v2-republicada-390.png](./capturas/v2-republicada-390.png).
- Con la demo reiniciada, las seis tarjetas de `http://localhost:3100/vender/metricas` mostraron inicialmente `Menos de 10`; el resumen mostró `Visitas · Menos de 10`. En `/vender`, el resumen mostró `Visitas en total · Menos de 10`. Capturas: [v2-metricas-inicial-390.png](./capturas/v2-metricas-inicial-390.png), [v2-vender-inicial-390.png](./capturas/v2-vender-inicial-390.png), [v2-metricas-inicial-1280.png](./capturas/v2-metricas-inicial-1280.png) y [v2-vender-inicial-1280.png](./capturas/v2-vender-inicial-1280.png).
- Se verificaron los cinco rangos en las tarjetas, a 390 y 1280 px: `Menos de 10`, `10 a 50`, `50 a 100`, `100 a 500` y `Más de 500`. No se mostró ningún valor exacto como `60`, `120` o `600`. En las tarjetas, todos los rangos quedaron en una sola línea, sin desbordamiento.
- En el resumen superior de `Tus publicaciones`, el total preparado fue `Más de 500` a 390 y 1280 px. A 1280 px quedó en una sola línea. En `/vender`, `Visitas en total · Más de 500` quedó en una sola línea a ambos anchos. Capturas: [v2-rangos-metricas-1280.png](./capturas/v2-rangos-metricas-1280.png) y [v2-rangos-vender-1280.png](./capturas/v2-rangos-vender-1280.png).
- Las visitas sí cambian con visitantes externos: después de tres aperturas de Camila en su propia ficha, el conteo exacto era `0`; una apertura de Laura lo llevó a `1`; nueve aperturas sin sesión lo llevaron a `10`. En la tarjeta de MacBook el rango cambió a `10 a 50` y el resumen también a `10 a 50`. Captura: [v2-visitas-live-390.png](./capturas/v2-visitas-live-390.png).
- Las tres aperturas posteriores de Camila en su propia ficha no aumentaron el conteo: siguió en `10` y la tarjeta siguió mostrando `10 a 50`. Captura: [v2-visitas-propio-no-cuenta-390.png](./capturas/v2-visitas-propio-no-cuenta-390.png).
- Los textos se entienden como rangos: `Menos de 10`, `10 a 50`, `50 a 100`, `100 a 500` y `Más de 500`; no aparecen cifras exactas en la interfaz.

## Observaciones fuera de alcance

- La visita propia del vendedor se comprobó mediante la ficha y las métricas; no se evaluó ningún panel futuro de pago ni detalle histórico de visitas.
- No se evaluaron favoritos, chats ni estados de publicación, salvo lo necesario para comprobar que las tarjetas de `Tus publicaciones` conservaran su estructura.

## NO VERIFICADO

- Los rangos superiores (`50 a 100`, `100 a 500` y `Más de 500`) se probaron visualmente con conteos exactos preparados en los datos de prueba; no generé las 60, 120 y 600 visitas completas navegando una por una desde el navegador.
- No se verificó el comportamiento con más de 500 visitas generadas exclusivamente por visitantes anónimos reales; sí se verificó que el rango mostrado fuera `Más de 500` y que las visitas anónimas aumentaran el conteo.
