# Informe de segunda vuelta — fila 2, filtros de portada

**Veredicto:** `PASA CON OBSERVACIONES` — se corrigió el filtro falso de categorías inventadas y el panel no deja interactuar con el fondo; queda un borde en URLs con demasiadas categorías basura antes de las válidas.

## Hallazgos

### 1. [baja] Al sanear categorías, diez valores basura pueden hacer que se pierdan categorías válidas posteriores

- **Ancho:** 390 × 844 px.
- **Pasos exactos:** abrir esta URL en la portada:
  `http://localhost:3100/?categoria=inventada1&categoria=inventada2&categoria=inventada3&categoria=inventada4&categoria=inventada5&categoria=inventada6&categoria=inventada7&categoria=inventada8&categoria=inventada9&categoria=inventada10&categoria=ropa&categoria=ninos&categoria=tecnologia&categoria=inventada11&categoria=inventada12&categoria=inventada13&categoria=inventada14&categoria=inventada15&categoria=inventada16&categoria=inventada17&categoria=inventada18`.
- **Esperado:** descartar las categorías inexistentes y conservar las válidas `ropa`, `ninos` y `tecnologia`, dejando las tres etiquetas marcadas. En `/buscar` y en el conteo debería conservarse el mismo conjunto válido.
- **Visto:** en la portada la URL queda exactamente igual, el control muestra solo `Filtros` —sin número—, ninguna etiqueta queda marcada y se muestra `Cerca de ti` y `Lo que se está vendiendo ahora mismo en Bogotá.` con las 12 tarjetas del catálogo completo. En `/buscar` con la misma URL se vio `12 resultados` y las casillas `Ropa`, `Niños` y `Tecnología` quedaron sin marcar. El endpoint con la misma URL devolvió HTTP 200 y `{"total":12}`.
- **Control positivo:** `http://localhost:3100/?categoria=ropa&categoria=inventada1&categoria=inventada2` sí conservó Ropa: mostró `4 resultados` y Ropa quedó marcada. También `http://localhost:3100/api/buscar/conteo?categoria=inventada&categoria=ropa` devolvió HTTP 200 y `{"total":4}`.
- **Capturas:** [portada con URL mezclada](capturas/segunda-A-home-mixed.png), [búsqueda con URL mezclada](capturas/segunda-A-search-mixed.png).

## Lo que verificaste y pasa

- `http://localhost:3100/?categoria=inventada` ya no cuenta un filtro falso: la portada muestra `Cerca de ti`, 12 tarjetas y el control exacto `Filtros`, sin número ni etiqueta activa.
- `http://localhost:3100/buscar?categoria=inventada` muestra `Buscar`, `12 resultados`, 12 tarjetas y las casillas de categorías sin marcar.
- `/api/buscar/conteo?categoria=inventada` respondió HTTP 200 con `{"total":12}`; `/api/buscar/conteo?categoria=inventada&categoria=ropa` respondió HTTP 200 con `{"total":4}`. Las categorías válidas funcionan cuando están dentro del límite de parámetros saneados.
- Con el panel abierto no recibió foco ningún control de la página de atrás. En 390 × 844 y 1280 × 800, Tab recorrió los controles del diálogo; después del último control el elemento activo fue `BODY`, y el siguiente Tab volvió a `Cerrar filtros`. No apareció ningún enlace, botón o campo del fondo en la secuencia.
- Con el panel abierto, hacer clic sobre el botón de búsqueda de atrás en 1280 px dejó la URL en `/`, no abrió `Buscar` y cerró solo el panel por el clic en el fondo. En 390 px, hacer clic sobre la zona de `Entrar` tampoco abrió login: la URL quedó `/`, no apareció ningún encabezado de entrada y el foco volvió a `Filtros`.
- En 390 px, `Verificados`, `Tecnología`, `Ropa` y `Niños` filtraron en la portada y se desmarcaron al tocarse otra vez. Resultados observados: Verificados 12, Tecnología 4, Ropa 4 y Niños 4; cada grilla mostró únicamente la categoría correspondiente.
- Las combinaciones se sumaron: Ropa + Niños mostró `8 resultados`; añadir Verificados mantuvo 8; quitar Niños dejó Ropa con `4 resultados`; el orden inverso también produjo 8.
- El panel abrió como lateral, mostró `Ver 12 resultados`, actualizó Tecnología a `Ver 4 resultados`, mostró `Ningún resultado` y deshabilitó el botón con precio máximo `999`, y aplicó Tecnología en la portada. Reabrir conservó Tecnología marcada. Añadir Ropa mostró `Ver 8 resultados` y aplicó ambas categorías; el badge mostró `Filtros\n3\nactivos` al conservar además Verificados.
- Limpiar devolvió a `/`, mostró las 12 tarjetas y `Cerca de ti`. Las capturas del panel y los estados están en [panel abierto](capturas/segunda-C-panel-open-390.png), [cero resultados](capturas/segunda-C-panel-zero-390.png), [Tecnología aplicada](capturas/segunda-C-panel-tech-390.png) y [Tecnología + Ropa](capturas/segunda-D-panel-tech-ropa-390.png).

## Observaciones fuera de alcance

- No se repitieron pruebas del campo de precio con letras, paginación, nombre de `Niños` ni rediseño de la búsqueda por texto, porque corresponden a otras filas.

## NO VERIFICADO

- No se pudo verificar el comportamiento de `Verificados` frente a un vendedor no verificado: en el catálogo visible había 12 tarjetas y las 12 mostraban exactamente `Verificado`; no apareció ninguna tarjeta sin ese texto para contrastar. Captura del inventario observado: [inventario](capturas/segunda-D-inventory-390.png).
