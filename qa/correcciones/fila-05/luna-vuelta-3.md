# Informe 3 — fila 5, sugerencias de avisos

**Veredicto**: `NO PASA` — las categorías, precios, zona y verificados se convierten en nombres legibles y el guardado funciona, pero el estado del artículo se pierde y una combinación larga termina cortada a mitad de palabra.

## Hallazgos

### 1. Severidad media — el estado del artículo no aparece en el nombre sugerido

- **Ancho**: 390 px.
- **Pasos exactos**: entrar con `laura@2venta.demo`; abrir `http://localhost:3100/buscar?q=submarino&zona=Chapinero&verificados=1&estado=nuevo`; pulsar `Avísame cuando aparezca`.
- **Esperado**: el nombre sugerido debe mencionar también el estado seleccionado, por ejemplo `submarino en Chapinero, nuevo, de vendedores verificados`.
- **Visto**: el campo `Nombre de la búsqueda` propone exactamente `submarino en Chapinero de vendedores verificados`; no aparece `Nuevo`. En la variante sin palabra `http://localhost:3100/buscar?categoria=tecnologia&estado=nuevo&max=1`, propone exactamente `Tecnología hasta $1`, también sin mencionar `Nuevo`. En la combinación larga se aplicó `estado=usado_bueno` y tampoco aparece `Usado, buen estado`.
- **Capturas**: [v3-buscar-zona-verificados-estado-formulario.png](capturas/v3-buscar-zona-verificados-estado-formulario.png), [v3-buscar-sin-palabra-estado-formulario.png](capturas/v3-buscar-sin-palabra-estado-formulario.png).

El filtro sí se aplicó a la búsqueda vacía; lo que falta es reflejarlo en el nombre que luego identifica el aviso.

### 2. Severidad media — una combinación larga corta el nombre a mitad de palabra

- **Ancho**: 390 px.
- **Pasos exactos**: abrir `http://localhost:3100/buscar?q=submarino&categoria=tecnologia&categoria=ropa&categoria=ninos&min=50000&max=999999&zona=Chapinero&verificados=1&estado=usado_bueno`; pulsar `Avísame cuando aparezca`.
- **Esperado**: mostrar el nombre completo o recortarlo con una señal clara, sin terminar una palabra a medias.
- **Visto**: el campo propone exactamente `submarino Tecnología, Ropa y Niños de $50.000 a $999.999 en Chapinero de vendedo`. Termina en `vendedo`, sin elipsis ni indicación de que fue recortado.
- **Captura**: [v3-buscar-todos-filtros-formulario.png](capturas/v3-buscar-todos-filtros-formulario.png).

## Lo que verifiqué y pasa

- En la portada vacía sin palabra, con varias categorías, máximo, zona y verificados, la URL `http://localhost:3100/?categoria=tecnologia&categoria=ninos&max=999&zona=Chapinero&verificados=1` propone exactamente `Tecnología y Niños hasta $999 en Chapinero de vendedores verificados`. Se lee natural y completo. Captura: [v3-portada-multi-filtros-formulario.png](capturas/v3-portada-multi-filtros-formulario.png).
- En `/buscar` con palabra, las variantes de precio se leen bien: `submarino desde $2.147.483.647`, `submarino hasta $999` y `submarino de $500 a $999`. Capturas: [v3-buscar-palabra-desde-formulario.png](capturas/v3-buscar-palabra-desde-formulario.png), [v3-buscar-palabra-hasta-formulario.png](capturas/v3-buscar-palabra-hasta-formulario.png), [v3-buscar-palabra-rango-formulario.png](capturas/v3-buscar-palabra-rango-formulario.png).
- La combinación `submarino en Chapinero de vendedores verificados` se lee natural en sí misma; el problema es que omite el estado que también estaba aplicado.
- En la portada, guardar el aviso funcionó. Se confirmó con `Guardada. Te avisamos cuando aparezca algo que coincida.` y en `http://localhost:3100/avisos` apareció como `Tecnología y Niños hasta $999 en Chapinero de vendedores verificados`.
- El enlace guardado conservó los filtros: `/buscar?categoria=tecnologia&categoria=ninos&max=999&zona=Chapinero&verificados=1`. En `/avisos` el nombre se partió en dos líneas, pero quedó completo y legible. Captura: [v3-portada-multi-filtros-avisos.png](capturas/v3-portada-multi-filtros-avisos.png).
- Probé nombres con y sin palabra, varias categorías, desde, hasta, rango, zona, verificados y estado. No vi ningún nombre vacío; los casos problemáticos fueron la omisión del estado y el corte de la combinación larga.

## Observaciones fuera de alcance

- **Paginación, fila 33**: no evaluada.
- **«Niños», fila 37**: se usó como categoría de prueba, pero no se evaluó su corrección propia.
- **Textos de otras pantallas, filas 14, 35, 39 y 41**: no evaluados.

## NO VERIFICADO

- Guardado desde `/buscar` de una búsqueda cuyo nombre incluya estado; solo comprobé la sugerencia y guardé la variante de portada.
- Todas las zonas y combinaciones posibles de categorías, estados y precios.
- Aparición posterior de una notificación cuando se publica un artículo coincidente.
- Pruebas del repositorio, no ejecutadas por instrucción.
