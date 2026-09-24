# Informe 4 — fila 5, estados en avisos

**Veredicto**: `PASA CON OBSERVACIONES` — los dos hallazgos anteriores están corregidos; el estado aparece en los nombres y el corte largo usa espacio más `…`. Con tres estados el texto es entendible, aunque suena algo mecánico.

## Hallazgos

### 1. Hallazgo anterior cerrado — el estado ya aparece en el nombre

- **Severidad original**: media; **estado actual**: cerrado.
- **Ancho**: 390 px.
- **Pasos exactos y URLs exactas repetidas**:
  1. Abrir `http://localhost:3100/buscar?q=submarino&zona=Chapinero&verificados=1&estado=nuevo` y pulsar `Avísame cuando aparezca`.
  2. Abrir `http://localhost:3100/buscar?categoria=tecnologia&estado=nuevo&max=1` y pulsar `Avísame cuando aparezca`.
  3. Abrir `http://localhost:3100/buscar?q=submarino&categoria=tecnologia&categoria=ropa&categoria=ninos&min=50000&max=999999&zona=Chapinero&verificados=1&estado=usado_bueno` y pulsar `Avísame cuando aparezca`.
- **Esperado**: incluir el estado seleccionado entre paréntesis.
- **Visto**:
  - URL 1: `submarino (nuevo) en Chapinero de vendedores verificados`.
  - URL 2: `Tecnología (nuevo) hasta $1`.
  - URL 3: `submarino Tecnología, Ropa y Niños (usado, buen estado) de $50.000 a $999.999…`.
- **Capturas**: [v4-url1-estado-nuevo-formulario.png](capturas/v4-url1-estado-nuevo-formulario.png), [v4-url2-sin-palabra-estado-formulario.png](capturas/v4-url2-sin-palabra-estado-formulario.png), [v4-url3-todos-filtros-estado-formulario.png](capturas/v4-url3-todos-filtros-estado-formulario.png).

### 2. Hallazgo anterior cerrado — el corte largo termina correctamente

- **Severidad original**: media; **estado actual**: cerrado.
- **Ancho**: 390 px.
- **Pasos exactos**: abrir la URL 3 exacta de arriba y pulsar `Avísame cuando aparezca`.
- **Esperado**: cortar en un espacio y terminar en `…`, sin partir `vendedores` ni dejar una palabra incompleta.
- **Visto**: el nombre termina exactamente en `a $999.999…`. El corte ocurre después de un espacio y no queda `vendedo`.
- **Captura**: [v4-url3-todos-filtros-estado-formulario.png](capturas/v4-url3-todos-filtros-estado-formulario.png).

### 3. Severidad baja — tres estados suenan mecánicos, aunque son comprensibles

- **Ancho**: 390 px.
- **Pasos exactos**:
  1. Abrir `http://localhost:3100/buscar?q=submarino&estado=nuevo&estado=usado_bueno`.
  2. Abrir `http://localhost:3100/buscar?q=submarino&estado=nuevo&estado=usado_bueno&estado=usado_regular`.
  3. En ambos casos, pulsar `Avísame cuando aparezca`.
- **Esperado**: que dos y tres estados se entiendan sin ambigüedad.
- **Visto**:
  - Dos estados: `submarino (nuevo o usado, buen estado)`; se lee natural.
  - Tres estados: `submarino (nuevo o usado, buen estado o usado, estado regular)`; incluye todo y no se corta, pero la repetición de `usado` hace que suene generado mecánicamente.
- **Capturas**: [v4-dos-estados-formulario.png](capturas/v4-dos-estados-formulario.png), [v4-tres-estados-formulario.png](capturas/v4-tres-estados-formulario.png).

## Lo que verifiqué y pasa

- Las tres URLs exactas de la tercera vuelta siguen mostrando el estado vacío y ahora proponen nombres con el estado incluido.
- Con Laura, guardé la búsqueda de la URL 1 sin editar el nombre. La confirmación exacta fue `Guardada. Te avisamos cuando aparezca algo que coincida.`
- En `http://localhost:3100/avisos` apareció exactamente `submarino (nuevo) en Chapinero de vendedores verificados`, con href exacto `/buscar?q=submarino&zona=Chapinero&verificados=1&estado=nuevo`. Capturas: [v4-url1-estado-nuevo-guardado.png](capturas/v4-url1-estado-nuevo-guardado.png), [v4-url1-estado-nuevo-avisos.png](capturas/v4-url1-estado-nuevo-avisos.png).
- No vi nombres vacíos. Los nombres de un estado y de dos estados se leen naturales; tres estados se entiende, aunque con menos fluidez.

## Observaciones fuera de alcance

- **Paginación, fila 33**: no evaluada.
- **«Niños», fila 37**: se usó como categoría de prueba, pero no se evaluó su corrección propia.
- **Textos de otras pantallas, filas 14, 35, 39 y 41**: no evaluados.

## NO VERIFICADO

- Guardar en `/avisos` una búsqueda con dos o tres estados; solo guardé la de un estado.
- Todas las combinaciones posibles de categorías, estados, zonas y precios.
- Aparición posterior de una notificación cuando se publica un artículo coincidente.
- Pruebas del repositorio, no ejecutadas por instrucción.
