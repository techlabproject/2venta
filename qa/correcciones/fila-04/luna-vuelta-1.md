# Informe de prueba — fila 4, filtros de precio

**Veredicto: `NO PASA` — dos fallos: un valor extremo aceptado por la caja provoca HTTP 500 en las tres ubicaciones y un decimal escrito en la URL se interpreta como otro precio en vez de ignorarse.**

## Hallazgos

1. **Severidad: alta. Valor de 20 dígitos termina en error 500.**

   **Anchos:** 390 px en portada y `/buscar`; 1280 px en `/buscar`.

   **Pasos exactos:** abrir Filtros; en «Hasta» pegar `12345678901234567890`; la caja queda en `123.456.789.012`; aplicar. En portada y en el panel móvil se ve «Ver resultados»; en escritorio se pulsa «Aplicar».

   **Esperaba:** que el valor se manejara de forma segura —por ejemplo, sin resultados o con una validación—, pero nunca que la página se cayera.

   **Vi:** HTTP `500`. URLs exactas: `http://localhost:3100/?max=123.456.789.012` y `http://localhost:3100/buscar?max=123.456.789.012`. Texto exacto en la pantalla: `This page couldn’t load`, `A server error occurred. Reload to try again.`, `Reload`, `ERROR 1762174974` en portada y `ERROR 1241600306` en `/buscar`.

   **Capturas:** [portada 390, error](capturas/A-portada390-20-digitos-error.png), [buscar 390, error](capturas/A-buscar390-20-digitos-error.png), [buscar 1280, error](capturas/A-buscar1280-20-digitos-error.png), [caja antes de aplicar en buscar 390](capturas/A-buscar390-20-digitos.png).

2. **Severidad: media. Un decimal en la URL no se ignora.**

   **Ancho:** 1280 px.

   **Pasos exactos:** abrir `http://localhost:3100/buscar?max=1.5`.

   **Esperaba:** que un precio con decimales se ignorara; el campo debía quedar vacío y mostrarse el catálogo sin filtro.

   **Vi:** la URL quedó exactamente `http://localhost:3100/buscar?max=1.5`; el campo «Hasta» mostró `15`; la página mostró `0 resultados` y el texto exacto `No encontramos nada con eso.`. Se aplicó como máximo 15 pesos, no se ignoró.

   **Captura:** [URL decimal](capturas/URL-decimal.png).

## Lo que verifiqué y pasa

- En los tres lugares —portada 390, `/buscar` 390 y `/buscar` 1280— las cajas eliminan letras y emojis; `abc` y `💸` quedan vacíos. También observé `1.5` → `15`, `-300` → `300`, `$ 45.000` → `45.000`, `1e6` → `16`. La leyenda exacta es `Precio (pesos colombianos)` y el signo `$` queda fuera de la caja. Las entradas con `$` y puntos sí filtran, por ejemplo `Hasta 45.000` deja la tarjeta de `$ 35.000`.

- El cursor se conserva al editar en medio en los tres anchos: al borrar el `5` de `150.000` queda `10.000` con cursor en la posición 1; al insertar `9` queda `1.590.000` con cursor en la posición 4. [Captura de cursor](capturas/B-portada390-cursor.png).

- Los cuatro rangos se muestran, se marcan y actualizan el conteo en las tres ubicaciones. Resultados observados: `Menos de $50.000` → `$ 35.000`; `$50.000 a $200.000` → `$ 70.000`, `$ 85.000`, `$ 95.000`, `$ 110.000`, `$ 120.000`, `$ 140.000`, `$ 180.000`; `$200.000 a $1.000.000` → `$ 250.000`, `$ 620.000`; `Más de $1.000.000` → `$ 1.650.000`, `$ 2.800.000`. [Rango 50.000–200.000, panel](capturas/C-buscar390-50000-200000-panel.png) y [resultado](capturas/C-buscar390-50000-200000-result.png).

- Tocar de nuevo un rango lo desmarca y vacía ambos campos en portada 390, `/buscar` 390 y `/buscar` 1280. Cambiar manualmente un campo desmarca el rango; escribir exactamente `50.000` y `200.000` vuelve a marcar `$50.000 a $200.000`. [Prueba manual](capturas/D-buscar390-manual.png) y [toggle](capturas/C-buscar390-toggle.png).

- Con mínimo `300000` y máximo `100000` aparece el aviso exacto `El mínimo quedó mayor que el máximo: los vamos a usar al revés.`. Al aplicar, la URL conserva el orden escrito —por ejemplo `http://localhost:3100/buscar?min=300.000&max=100.000`— y los resultados corresponden al intervalo invertido de 100.000 a 300.000: `$ 110.000`, `$ 120.000`, `$ 140.000`, `$ 180.000` y `$ 250.000`. [Formulario](capturas/E-buscar390-invertido-formulario.png) y [resultados](capturas/E-buscar390-invertido-resultados.png).

- Recargar con `min=50.000&max=200.000` o con `min=50000&max=200000` rehidrata los campos como `50.000` y `200.000`, marca el rango correcto en los tres lugares y conserva el filtro. `Limpiar` elimina los parámetros y devuelve el catálogo completo. [URL cargada](capturas/F-buscar390-puntos-cargado.png) y [limpia](capturas/F-buscar390-puntos-limpio.png).

- En teclado, los rangos son botones nativos con `aria-pressed="false"`/`"true"`; al activar uno se observa `aria-pressed="true"`. Los campos tienen nombre accesible exacto `Precio mínimo` y `Precio máximo`. [Captura de teclado y accesibilidad](capturas/G-accesibilidad-teclado.png).

- Diseño: a 390 px los cuatro atajos caben en dos filas dentro del panel; a 1280 px caben en cuatro filas dentro de la columna de 272 px, sin solaparse. [Portada 390](capturas/H-portada390-layout-final.png) y [columna 1280](capturas/H-buscar1280-layout-final.png).

- Sin JavaScript no aparecen botones de rango. El enlace de filtros de la portada lleva a `/buscar`; en `/buscar` a 390 y 1280 el formulario normal acepta `100000` sin formatearlo y filtra a `$ 35.000`, `$ 70.000`, `$ 85.000` y `$ 95.000`. [Fallback de portada](capturas/I-sin-javascript-portada-fallback.png), [390](capturas/I-sin-javascript-390.png) y [1280](capturas/I-sin-javascript-1280.png).

- La URL con letras (`?max=abc`) y la negativa (`?max=-300`) sí se ignoran: el campo queda vacío y se conservan 12 resultados. La URL con puntos (`?max=45.000`) y con `$ ` (`?max=%24%2045.000`) sí se aceptan y dejan la tarjeta de `$ 35.000`. [Puntos](capturas/URL-puntos.png) y [signo `$`](capturas/URL-dolar.png).

## Observaciones fuera de alcance

- Fila 5: al provocar cero resultados vi el texto exacto `No encontramos nada con eso.`; no evalué esa corrección.
- Fila 33: no apareció paginación en los conjuntos observados; no la evalué.
- Fila 37: vi el nombre exacto `Niños` en filtros y tarjetas; no evalué su cambio.
- Fila 24: no abrí publicar ni editar una publicación; no evalué el campo de precio de ese flujo.

## NO VERIFICADO

- Límites exactos: no hay artículos sembrados a exactamente `$ 50.000`, `$ 200.000` o `$ 1.000.000`; no publiqué uno porque publicar/editar precio está fuera de alcance. Por tanto, no pude confirmar inclusión/exclusión en esos bordes.
- No probé la vocalización con un lector de pantalla real; verifiqué el nombre accesible y `aria-pressed` mediante el árbol/DOM del navegador.
- Las variantes de URL inválida/aceptada se comprobaron directamente en `/buscar` a 1280 px; las entradas equivalentes en las tres superficies sí se probaron mediante las cajas visibles.
