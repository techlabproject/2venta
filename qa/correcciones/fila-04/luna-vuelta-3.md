# Informe de prueba — tercera vuelta, fila 4

**Veredicto: `NO PASA` — los mínimos y máximos de 20 dígitos ya funcionan sin 500, los límites y ceros iniciales pasan, pero un número bien formado de 41 dígitos se ignora en vez de tratarse como el máximo de la base.**

## Hallazgos

1. **Severidad: media. Un número de 41 dígitos bien formado se ignora en la URL.**

   **Ancho:** 1280 px en `/buscar`.

   **Pasos exactos:** abrir `http://localhost:3100/buscar?min=99999999999999999999999999999999999999999` y después `http://localhost:3100/buscar?max=99999999999999999999999999999999999999999`.

   **Esperaba:** como son números sin puntos y tienen más de 15 dígitos, que ambos se trataran como `2.147.483.647`: mínimo con 0 resultados y máximo con 12 resultados.

   **Vi:** HTTP `200` en ambos casos, pero el campo queda vacío y se muestran las 12 tarjetas tanto para `min` como para `max`; el valor se ignoró. Como contraste, el número de 40 dígitos `9999999999999999999999999999999999999999` sí se normaliza a `2.147.483.647`: mínimo 0 resultados y máximo 12.

   **Capturas:** [41 dígitos en mínimo](capturas-3/url-41-digitos-min.png), [41 dígitos en máximo](capturas-3/url-41-digitos-max.png), [40 dígitos en mínimo](capturas-3/url-40-digitos-min.png) y [40 dígitos en máximo](capturas-3/url-40-digitos-max.png).

## Lo que verifiqué y pasa

- **Regresión del hallazgo de 20 dígitos, tres ubicaciones:** en portada 390, `/buscar` 390 y `/buscar` 1280, `12345678901234567890` se muestra en la caja como `1.234.567.890`, sin error. En `Desde` deja 0 resultados; en `Hasta` conserva los 12 artículos. Todas las rutas responden HTTP `200` y no aparece `This page couldn’t load`. [Portada](capturas-3/huge20-portada390-min-form.png), [buscar 390](capturas-3/huge20-buscar390-min-form.png) y [buscar 1280](capturas-3/huge20-buscar1280-min-form.png).

- **API con 20 dígitos:** `http://localhost:3100/api/buscar/conteo?min=12345678901234567890` responde HTTP `200` con `{"total":0}`; `http://localhost:3100/api/buscar/conteo?max=12345678901234567890` responde HTTP `200` con `{"total":12}`. [Mínimo](capturas-3/api-huge20-min.png) y [máximo](capturas-3/api-huge20-max.png).

- **Límites exactos:** en la caja, `2147483647` aparece como `2.147.483.647`; `2147483648` aparece como `2.147.483.648`. En ambos casos no hay 500: como mínimo dan 0 resultados y como máximo dan 12. En la URL, las formas sin puntos y con puntos de `2.147.483.647` y `2.147.483.648` responden HTTP `200`; el valor superior se rehidrata como `2.147.483.647` y conserva la misma semántica. [Caja con límite](capturas-3/limite-2147483647-min-caja.png) y [caja sobre el límite](capturas-3/limite-2147483648-min-caja.png).

- **Números de 40 caracteres:** tanto `min` como `max` se tratan como `2.147.483.647`, sin 500: mínimo 0 resultados y máximo 12.

- **Ceros a la izquierda:** `min=000150000` se muestra como `150.000` y devuelve 5 artículos (`$250.000`, `$180.000`, `$620.000`, `$1.650.000`, `$2.800.000`); `max=000150000` devuelve 7 artículos hasta `$150.000`. [Mínimo](capturas-3/url-ceros-min.png) y [máximo](capturas-3/url-ceros-max.png).

- **Agrupaciones inválidas:** `1.5`, `1.50.000`, `45.00`, `45.0000`, `.500`, `500.`, `1..000` y `12.345.67` siguen ignorándose: HTTP `200`, campo vacío y 12 tarjetas en cada caso. [Ejemplo `1.5`](capturas-3/malformada-1.5.png) y [ejemplo `12.345.67`](capturas-3/malformada-12.345.67.png).

- En todos los escenarios de esta vuelta no observé HTTP `500` ni la pantalla `This page couldn’t load`.

## Observaciones fuera de alcance

- Fila 5: al mínimo enorme vi `No encontramos nada con eso.`; no evalué esa corrección.
- Fila 33: no apareció paginación; no la evalué.
- Fila 37: vi `Niños` en filtros y tarjetas; no evalué su cambio.
- Fila 24: no abrí publicar ni editar; no evalué el precio de ese flujo.

## NO VERIFICADO

- No había artículos exactamente en `$50.000`, `$200.000` o `$1.000.000`; no confirmé la inclusión de esos límites.
- No probé vocalización con un lector de pantalla real; solo verifiqué la interfaz desde el navegador.
- Los límites exactos en la caja se probaron en `/buscar` a 390 px; sus variantes URL se probaron en `/buscar` a 1280 px.
- No probé números de 40 o 41 dígitos directamente en `/api/buscar/conteo`; el API sí se probó con los 20 dígitos solicitados.
