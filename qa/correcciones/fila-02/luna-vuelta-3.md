# Informe de tercera vuelta — fila 2, filtros de portada

**Veredicto:** `PASA` — la URL mezclada conserva las categorías válidas en portada, búsqueda y API; una URL absurda con 60 inventadas no se cae; etiquetas y panel siguen funcionando en 390 px.

## Hallazgos

Ninguno observado en esta vuelta.

## Lo que verificaste y pasa

- **URL mezclada exacta:**
  `http://localhost:3100/?categoria=inventada1&categoria=inventada2&categoria=inventada3&categoria=inventada4&categoria=inventada5&categoria=inventada6&categoria=inventada7&categoria=inventada8&categoria=inventada9&categoria=inventada10&categoria=ropa&categoria=ninos&categoria=tecnologia&categoria=inventada11&categoria=inventada12&categoria=inventada13&categoria=inventada14&categoria=inventada15&categoria=inventada16&categoria=inventada17&categoria=inventada18`
  - En la portada, 390 × 844 px: `12 resultados`, 12 tarjetas, `Filtros\n3\nactivos` y las etiquetas `Tecnología`, `Ropa` y `Niños` marcadas.
  - En `/buscar` con la misma consulta: la página abrió, mostró `12 resultados`, 12 tarjetas y las tres casillas válidas marcadas.
  - En `/api/buscar/conteo` con la misma consulta: HTTP 200 y `{"total":12}`.
  - Capturas: [portada](capturas/tercera-home-mixed.png), [búsqueda](capturas/tercera-search-mixed.png).

- **URL absurda exacta, 60 inventadas seguidas de Ropa:**
  `http://localhost:3100/?categoria=inventada01&categoria=inventada02&categoria=inventada03&categoria=inventada04&categoria=inventada05&categoria=inventada06&categoria=inventada07&categoria=inventada08&categoria=inventada09&categoria=inventada10&categoria=inventada11&categoria=inventada12&categoria=inventada13&categoria=inventada14&categoria=inventada15&categoria=inventada16&categoria=inventada17&categoria=inventada18&categoria=inventada19&categoria=inventada20&categoria=inventada21&categoria=inventada22&categoria=inventada23&categoria=inventada24&categoria=inventada25&categoria=inventada26&categoria=inventada27&categoria=inventada28&categoria=inventada29&categoria=inventada30&categoria=inventada31&categoria=inventada32&categoria=inventada33&categoria=inventada34&categoria=inventada35&categoria=inventada36&categoria=inventada37&categoria=inventada38&categoria=inventada39&categoria=inventada40&categoria=inventada41&categoria=inventada42&categoria=inventada43&categoria=inventada44&categoria=inventada45&categoria=inventada46&categoria=inventada47&categoria=inventada48&categoria=inventada49&categoria=inventada50&categoria=inventada51&categoria=inventada52&categoria=inventada53&categoria=inventada54&categoria=inventada55&categoria=inventada56&categoria=inventada57&categoria=inventada58&categoria=inventada59&categoria=inventada60&categoria=ropa`
  - En la portada: no se cayó, mostró `Cerca de ti`, 12 tarjetas y `Filtros`, sin número ni etiqueta activa. Que Ropa se pierda aquí es aceptable por superar el tope.
  - En `/buscar` con la misma consulta: la página abrió, mostró `12 resultados`, 12 tarjetas y ninguna categoría marcada.
  - En `/api/buscar/conteo` con la misma consulta: HTTP 200 y `{"total":12}`.
  - Capturas: [portada](capturas/tercera-home-60-invalid-ropa.png), [búsqueda](capturas/tercera-search-60-invalid-ropa.png).

- En 390 × 844 px, cada etiqueta siguió funcionando y se desmarcó al tocarla otra vez: Verificados `12 resultados`, Tecnología `4 resultados`, Ropa `4 resultados` y Niños `4 resultados`. Capturas: [Ropa](capturas/tercera-tag-Ropa.png), [Tecnología](capturas/tercera-tag-Tecnología.png).
- Ropa + Niños mostró `8 resultados`, ambas etiquetas quedaron marcadas y quitar Niños dejó Ropa con `4 resultados`. Captura: [combinación](capturas/tercera-combo-ropa-ninos.png).
- El panel abrió en 390 px con `Ver 12 resultados` y foco inicial en `Cerrar filtros`; marcar Tecnología mostró `Ver 4 resultados`, aplicar dejó `/?categoria=tecnologia` con `4 resultados`, y reabrir conservó Tecnología marcada. X cerró el panel y devolvió el foco a `Filtros 1 activos`. Capturas: [panel](capturas/tercera-panel-open.png), [Tecnología aplicada](capturas/tercera-panel-tech.png).

## Observaciones fuera de alcance

- No se repitieron precio, paginación, nombre de `Niños`, búsqueda por texto ni exclusión de vendedores no verificados.

## NO VERIFICADO

- No se buscó nuevamente una tarjeta de vendedor no verificado en esta vuelta; permanece el `NO VERIFICADO` de la vuelta anterior porque las tarjetas visibles mostraban `Verificado`.
