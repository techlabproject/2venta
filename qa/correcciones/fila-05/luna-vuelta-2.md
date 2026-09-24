# Informe 2 — fila 5, segunda vuelta

**Veredicto**: `PASA CON OBSERVACIONES` — los dos hallazgos anteriores están corregidos y el panel de `/buscar` también permite aplicar cero resultados; el guardado desde la portada funciona, pero allí el nombre del aviso no llega sugerido.

## Hallazgos

### 1. Hallazgo anterior cerrado — panel de la portada con cero resultados

- **Severidad original**: media; **estado actual**: cerrado.
- **Ancho**: 390 px y 1280 px.
- **Pasos exactos**: abrir `http://localhost:3100/`; tocar `Filtros`; marcar `Tecnología`; escribir `1` en `Precio máximo`; esperar el recuento; pulsar el botón.
- **Esperado**: poder aplicar la combinación aunque dé cero resultados y ver `¡Uy! Esta combinación no dio con nada`.
- **Visto**: el botón muestra exactamente `Aplicar igual (0 resultados)` y está habilitado (`disabled=false`). Después de pulsarlo, la URL es exactamente `http://localhost:3100/?categoria=tecnologia&max=1` y se ve:

  `¡Uy! Esta combinación no dio con nada`

  `En segunda mano todo se mueve rápido: lo que hoy no está puede aparecer mañana. Prueba quitando algún filtro, o date una vuelta por todo lo publicado.`

  También aparecen `Ver todo lo publicado` y `Entra y te avisamos cuando aparezca`.
- **Capturas**: [v2-portada-panel-antes-390.png](capturas/v2-portada-panel-antes-390.png), [v2-portada-panel-despues-390.png](capturas/v2-portada-panel-despues-390.png), [v2-portada-panel-antes-1280.png](capturas/v2-portada-panel-antes-1280.png), [v2-portada-panel-despues-1280.png](capturas/v2-portada-panel-despues-1280.png).

### 2. Hallazgo anterior cerrado — palabra de 120 caracteres

- **Severidad original**: media; **estado actual**: cerrado.
- **Ancho**: 390 px y 1280 px.
- **Pasos exactos**: abrir `http://localhost:3100/buscar?q=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`.
- **Esperado**: que los títulos partan las palabras largas sin desbordar la página.
- **Visto**: el título de la página conserva exactamente `Resultados para “xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx”` y la tarjeta conserva `¡Uy! Por ahora no hay «xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx»`, pero ahora ambos parten línea. En 390 px el `scrollWidth` del documento es 390 px y en 1280 px es 1280 px; no hay scroll horizontal. El `scrollWidth` del título de la tarjeta es 302 px en 390 y 760 px en 1280.
- **Capturas**: [v2-palabra-larga-390.png](capturas/v2-palabra-larga-390.png), [v2-palabra-larga-1280.png](capturas/v2-palabra-larga-1280.png).

### 3. Severidad baja — en la portada vacía el nombre del aviso no llega sugerido

- **Ancho**: 390 px.
- **Pasos exactos**: entrar con `laura@2venta.demo`; abrir `http://localhost:3100/?categoria=tecnologia&max=1`; pulsar `Avísame cuando aparezca`.
- **Esperado**: que el campo `Nombre de la búsqueda` llegue con un nombre sugerido, como ocurre con una palabra buscada.
- **Visto**: el campo llega vacío (`value=""`) y muestra solo el placeholder exacto `iPhone hasta 2 millones`. Al escribir `Tecnología hasta 1 peso` y pulsar `Guardar`, confirma exactamente `Guardada. Te avisamos cuando aparezca algo que coincida.`
- **Capturas**: [v2-portada-aviso-form-390.png](capturas/v2-portada-aviso-form-390.png), [v2-portada-aviso-guardado-390.png](capturas/v2-portada-aviso-guardado-390.png).

No bloquea el guardado, pero como usuaria me deja una tarea de naming justo después de pedir el aviso. En una portada filtrada sin palabra, la sugerencia podría construirse a partir de los filtros.

## Lo que verifiqué y pasa

- El panel de la portada funciona en 390 y 1280 px: `Aplicar igual (0 resultados)` es accionable y lleva a la URL filtrada vacía.
- El panel de `/buscar` en 390 px también muestra exactamente `Aplicar igual (0 resultados)`, está habilitado y lleva de `http://localhost:3100/buscar` a `http://localhost:3100/buscar?categoria=tecnologia&max=1`. La tarjeta muestra `¡Uy! Esta combinación no dio con nada`. Capturas: [v2-buscar-panel-antes-390.png](capturas/v2-buscar-panel-antes-390.png), [v2-buscar-panel-despues-390.png](capturas/v2-buscar-panel-despues-390.png).
- Como usuaria, `Aplicar igual (0 resultados)` se entiende: `Aplicar` indica la acción, `igual` comunica que se puede continuar aunque el resultado sea cero y el paréntesis elimina la ambigüedad. Además, cabe en una línea a 390 px y queda como botón principal.
- El aviso guardado desde la portada apareció en `http://localhost:3100/avisos` como `Tecnología hasta 1 peso`, con enlace exacto `/buscar?categoria=tecnologia&max=1`; conserva los filtros. Captura: [v2-portada-avisos-390.png](capturas/v2-portada-avisos-390.png).
- La portada vacía con Laura mostró exactamente `¡Uy! Esta combinación no dio con nada`, el consuelo, `Ver todo lo publicado` y `Avísame cuando aparezca`. Captura: [v2-portada-vacia-laura-390.png](capturas/v2-portada-vacia-laura-390.png).

## Observaciones fuera de alcance

- **Paginación, fila 33**: no evaluada.
- **«Niños», fila 37**: no evaluada.
- **Textos de otras pantallas, filas 14, 35, 39 y 41**: no evaluados.

## NO VERIFICADO

- Aviso real posterior a la aparición de un producto; solo verifiqué guardado, confirmación y enlace.
- Combinaciones de filtros distintas de Tecnología + precio máximo 1.
- Repetición de los casos adversariales de comillas, HTML, emojis y espacios en esta segunda vuelta.
- Pruebas del repositorio, no ejecutadas por instrucción.
