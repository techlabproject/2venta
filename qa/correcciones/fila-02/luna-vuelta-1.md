# Informe de prueba — fila 2, filtros de portada

**Veredicto:** `PASA CON OBSERVACIONES` — el filtrado normal y el panel cumplen la corrección, con dos problemas menores de robustez/accesibilidad observados.

## Hallazgos

### 1. [baja] Una categoría desconocida se cuenta como filtro activo y muestra un estado incoherente

- **Ancho:** 390 × 844 px.
- **Pasos exactos:** abrir `http://localhost:3100/?categoria=inventada`.
- **Esperado:** que el parámetro basura no active un filtro que no existe, o que el estado activo sea coherente con una etiqueta válida; en ningún caso debería aparentar que hay un filtro visible seleccionado cuando no lo hay.
- **Visto:** URL exacta `http://localhost:3100/?categoria=inventada`. El control de filtros expone el texto accesible exacto `Filtros\n1\nactivos`, pero ninguna de las etiquetas `Verificados`, `Tecnología`, `Ropa` o `Niños` queda marcada. La portada muestra `0 resultados`, `Quitar filtros`, `No encontramos nada con eso.` y `Prueba quitando algún filtro, o mira todo lo publicado.`; no hay tarjetas.
- **También reproducido:** con varios valores distintos, la URL `http://localhost:3100/?categoria=inventada1&categoria=inventada2&categoria=inventada3&categoria=inventada4&categoria=inventada5&categoria=inventada6&categoria=inventada7&categoria=inventada8&categoria=inventada9&categoria=inventada10&categoria=ropa&categoria=ninos&categoria=tecnologia&categoria=inventada11&categoria=inventada12&categoria=inventada13&categoria=inventada14&categoria=inventada15&categoria=inventada16&categoria=inventada17&categoria=inventada18` muestra el texto accesible `Filtros\n10\nactivos`, `0 resultados` y ninguna etiqueta válida marcada.
- **Capturas:** [inventada](capturas/F-inventada-390.png), [veinte valores](capturas/F-twenty-mixed-390.png).

### 2. [baja] El foco de teclado sale del panel al terminar el recorrido

- **Anchos:** 390 × 844 px y 1280 × 800 px.
- **Pasos exactos:** abrir `http://localhost:3100/`, activar `Filtros` y pulsar `Tab` catorce veces, sin cerrar el panel.
- **Esperado:** que el foco permanezca dentro del diálogo modal y vuelva directamente al primer control del panel al terminar el ciclo.
- **Visto:** en ambos anchos, el panel sigue abierto en la URL exacta `http://localhost:3100/`, pero en la pulsación 14 el elemento activo es `BODY`, fuera del diálogo; el texto del elemento activo empieza exactamente por `2ventaBogotáEntrarCompra usado sin miedo a que te tumben`. En la pulsación 15 vuelve a `Cerrar filtros`. Los controles del panel sí se alcanzan entre las pulsaciones 1 y 13.
- **Capturas:** [foco fuera, 390](capturas/C-foco-despues-14-tabs-390.png), [foco fuera, 1280](capturas/C-foco-despues-14-tabs-1280.png).

## Lo que verificaste y pasa

- En 390 × 844 y 1280 × 800, `Verificados`, `Tecnología`, `Ropa` y `Niños` filtran en la portada, marcan `aria-current="true"`, muestran tarjetas de la categoría correcta y se desmarcan al tocarlas otra vez. Resultados observados: Verificados 12, Tecnología 4, Ropa 4 y Niños 4; al quitar vuelven a `/` y a `Cerca de ti`.
- Las combinaciones se suman: Ropa + Niños muestra `8 resultados` y 4 tarjetas `Ropa` más 4 `Niños`; añadir Verificados mantiene esas 8. Quitar Niños del medio deja `4 resultados` de Ropa; tocar en orden inverso también deja `8 resultados`.
- El panel abre desde la primera etiqueta, entra desde la izquierda y deja visibles el formulario y el pie en ambos tamaños. X, tocar fuera y `Escape` lo cierran sin aplicar cambios y devuelven el foco a `Filtros`.
- El conteo en vivo coincidió con la grilla: Tecnología mostró `Ver 4 resultados`; Tecnología con precio máximo `999` mostró `Ningún resultado` y deshabilitó el botón; al quitar el precio volvió a `Ver 4 resultados`. Nuevo + Usaquén mostró `Ver 1 resultado` y aplicó una sola tarjeta: `Atrapasueños para cuarto de bebé`, `Niños · Nuevo`, `Usaquén`.
- Aplicar deja la persona en la portada; reabrir conserva las casillas, el conteo y la marca numérica. Ropa por etiqueta seguida de Niños en el panel terminó en `http://localhost:3100/?categoria=ropa&categoria=ninos`, `8 resultados`, y ambas etiquetas marcadas.
- Volver/avanzar del navegador, `Quitar filtros`, recargar una URL filtrada y abrirla en un contexto nuevo conservaron los resultados y las marcas. La URL compartida `http://localhost:3100/?categoria=ropa&categoria=ninos&verificados=1` mostró `8 resultados` y las tres marcas en un contexto nuevo de 1280 px.
- El panel se ve completo en 390 × 844 y 1280 × 800; el botón inferior queda visible. El estado vacío muestra claramente `0 resultados`, `No encontramos nada con eso.` y `Prueba quitando algún filtro, o mira todo lo publicado.`
- Parámetros de ruptura sin datos válidos no tumbaron la aplicación: `?categoria=`, `?verificados=2`, letras de precio y veinte repeticiones de `categoria=ropa` respondieron. Las veinte repeticiones deduplicaron a Ropa y mostraron `4 resultados`. Las llamadas probadas a `/api/buscar/conteo` devolvieron HTTP 200 y JSON válido, incluido `{"total":0}` para `?categoria=inventada`.
- Sin JavaScript, las etiquetas siguieron filtrando. Desde `http://localhost:3100/?categoria=ninos`, `Filtros` tuvo `href="/buscar?categoria=ninos"` y abrió la búsqueda con el formulario. Desde `/`, el enlace exacto fue `/buscar?` y abrió la ruta `/buscar?` sin caerse.

## Observaciones fuera de alcance

- En URLs de precio, fuera de alcance por corresponder a la fila 4, `http://localhost:3100/?min=-999999` se interpretó como un mínimo positivo y mostró `2 resultados`; `http://localhost:3100/?max=-1` mostró `0 resultados`; `http://localhost:3100/?min=1abc2&max=xyz` mostró `12 resultados` y `Filtros 1 activos`.
- La paginación, el texto/nombre de `Niños` y la búsqueda por texto no se evaluaron como correcciones de esta fila.

## NO VERIFICADO

- No se pudo verificar que `Verificados` excluya vendedores no verificados: las 12 tarjetas visibles, tanto sin filtro como con `?verificados=1`, mostraron el texto `Verificado`; no había una tarjeta no verificada disponible para contrastar.
- No se introdujeron letras directamente en los campos de precio del panel; esa corrección pertenece a la fila 4.
