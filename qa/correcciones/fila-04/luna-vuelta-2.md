# Informe de prueba — segunda vuelta, fila 4

**Veredicto: `NO PASA` — los dos fallos visibles originales están corregidos, pero `/api/buscar/conteo` y una URL con un mínimo de 20 dígitos ignoran ese mínimo y devuelven 12 resultados en vez de 0.**

## Hallazgos

1. **Severidad: media. `/api/buscar/conteo` ignora un mínimo numérico de 20 dígitos.**

   **Ancho:** endpoint abierto desde un contexto de navegador de 390 px; el resultado no depende del ancho.

   **Pasos exactos:** abrir `http://localhost:3100/api/buscar/conteo?min=12345678901234567890`.

   **Esperaba:** que el mínimo enorme se recortara al máximo de la base y produjera 0 resultados, igual que el valor normalizado por la caja (`1.234.567.890`).

   **Vi:** HTTP `200` y cuerpo exacto `{"total":12}`. La URL de catálogo `http://localhost:3100/buscar?min=12345678901234567890` también responde `200`, deja el campo vacío y muestra 12 tarjetas: el mínimo se ignoró. Como control, `http://localhost:3100/api/buscar/conteo?min=1.234.567.890` responde `{"total":0}` y `http://localhost:3100/api/buscar/conteo?max=12345678901234567890` responde `{"total":12}`.

   **Capturas:** [API con mínimo crudo](capturas-2/api-min-raw.png), [API con mínimo normalizado](capturas-2/api-min-formateado.png), [catálogo con mínimo crudo](capturas-2/extremo-buscar1280-min-directo.png).

## Lo que verifiqué y pasa

- **Regresión del valor de 20 dígitos, tres ubicaciones:** en portada 390, `/buscar` 390 y `/buscar` 1280, pegar `12345678901234567890` deja la caja en `1.234.567.890` y no produce error. En `Desde`, la interfaz muestra `Ningún resultado` en móvil y 0 resultados al aplicar en escritorio. En `Hasta`, muestra 12 resultados y al aplicar conserva los 12 artículos. Todas las rutas responden HTTP `200`; ya no aparece `This page couldn’t load`. [Portada](capturas-2/extremo-portada390-min-formulario.png), [buscar 390](capturas-2/extremo-buscar390-min-formulario.png) y [buscar 1280](capturas-2/extremo-buscar1280-min-formulario.png).

- **Endpoint para máximo enorme:** `/api/buscar/conteo?max=12345678901234567890` responde HTTP `200` con `{"total":12}`. [Captura](capturas-2/api-max-raw.png).

- **URL con agrupación inválida:** probé como `max` `1.5`, `1.50.000`, `45.00`, `45.0000`, `.500`, `500.`, `1..000` y `12.345.67`. En los ocho casos el campo queda vacío, la página responde HTTP `200` y conserva las 12 tarjetas. [Ejemplos: `1.5`](capturas-2/url-malformada-1.5.png), [`1.50.000`](capturas-2/url-malformada-1.50.000.png), [`45.00`](capturas-2/url-malformada-45.00.png), [`45.0000`](capturas-2/url-malformada-45.0000.png), [`.500`](capturas-2/url-malformada-.500.png), [`500.`](capturas-2/url-malformada-500..png), [`1..000`](capturas-2/url-malformada-1..000.png), [`12.345.67`](capturas-2/url-malformada-12.345.67.png).

- **URL válida:** `max=45000`, `max=45.000` y `max=$ 45.000` muestran `45.000` en la caja y dejan la tarjeta de `$ 35.000`. `max=1.000.000` muestra `1.000.000` y deja 10 tarjetas. [Sin puntos](capturas-2/url-aceptada-sin-puntos.png), [con puntos](capturas-2/url-aceptada-puntos.png), [con `$ `](capturas-2/url-aceptada-dolar.png).

- **Repaso rápido a 390 px:** en portada y `/buscar`, escribir `150000` deja `150.000` y muestra `Ver 5 resultados`. Los cuatro rangos llenan correctamente los campos, se marcan y filtran: 1, 7, 2 y 2 resultados respectivamente. Tocar `$50.000 a $200.000` otra vez vacía ambos campos y lo desmarca. [Campo](capturas-2/movil-portada390-campo-150000.png), [rango](capturas-2/movil-portada390-50000-200000-panel.png), [resultado](capturas-2/movil-portada390-50000-200000-resultado.png) y [toggle](capturas-2/movil-portada390-toggle.png).

## Observaciones fuera de alcance

- Fila 5: al mínimo enorme vi el texto exacto `No encontramos nada con eso.`; no evalué esa corrección.
- Fila 33: no apareció paginación; no la evalué.
- Fila 37: vi `Niños` en filtros y tarjetas; no evalué su cambio.
- Fila 24: no abrí publicar ni editar; no evalué el precio de ese flujo.

## NO VERIFICADO

- No había artículos exactamente en `$50.000`, `$200.000` o `$1.000.000`; no confirmé la inclusión de los límites.
- No probé vocalización con un lector de pantalla real; solo verifiqué la semántica accesible en el navegador.
- Las agrupaciones URL se comprobaron directamente en `/buscar` a 1280 px; el repaso visible de campos y rangos se hizo a 390 px.
- No probé por separado los valores exactos `2.147.483.647` y `2.147.483.648` en la caja. En la prueba de 20 dígitos observé `1.234.567.890`, que cumple el límite de 10 dígitos pero no alcanza visualmente el valor máximo de la base.
