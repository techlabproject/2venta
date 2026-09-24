# Informe — fila 5, mensajes sin resultados

**Veredicto**: `NO PASA` — el mensaje corregido funciona y tiene buen tono, pero la portada no permite aplicar desde el panel una combinación que da cero resultados y una palabra de 120 caracteres rompe el ancho de la página.

## Hallazgos

### 1. Severidad media — el panel de filtros de la portada bloquea la ruta a cero resultados

- **Ancho**: 390 px y 1280 px.
- **Pasos exactos**: abrir `http://localhost:3100/`; tocar `Filtros`; marcar `Tecnología`; escribir `1` en `Precio máximo`; esperar el recuento.
- **Esperado**: poder aplicar la combinación y ver en la portada el estado vacío con el título exacto `¡Uy! Esta combinación no dio con nada`, más `Ver todo lo publicado`, el aviso y el texto de consuelo.
- **Visto**: la URL permanece exactamente `http://localhost:3100/`. El panel muestra el texto exacto `Ningún resultado` en el botón, pero el botón queda deshabilitado (`disabled=true`), por lo que no se puede aplicar. Detrás siguen visibles `Cerca de ti` y los productos de la portada. En 1280 px se repite el mismo estado.
- **Captura**: [capturas/a-portada-panel-tecnologia-max-390.png](capturas/a-portada-panel-tecnologia-max-390.png) (la comprobación de 1280 está en [capturas/a-panel-portada-tecnologia-max-1280.png](capturas/a-panel-portada-tecnologia-max-1280.png)).

La misma URL aplicada directamente sí muestra el mensaje corregido; el defecto está en el flujo real del panel.

### 2. Severidad media — una palabra de 120 caracteres desborda el layout

- **Ancho**: 390 px; también reproducido en 1280 px.
- **Pasos exactos**: abrir `http://localhost:3100/buscar?q=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`.
- **Esperado**: el título de resultados y la tarjeta vacía deben partir línea o truncarse de forma controlada, sin scroll horizontal.
- **Visto**: el título exacto de la página es `Resultados para “xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx”` y el de la tarjeta es `¡Uy! Por ahora no hay «xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx»`. En 390 px el viewport mide 390 px, pero el documento llega a 1298 px; el título de la tarjeta tiene un `scrollWidth` de 1185 px. El texto queda en una línea que sale de la tarjeta y obliga a desplazamiento horizontal. En 1280 px el documento llega a 1597 px.
- **Captura**: [capturas/e-120-390.png](capturas/e-120-390.png) y [capturas/e-120-1280.png](capturas/e-120-1280.png).

## Lo que verifiqué y pasa

- `/buscar` sin palabra y con filtros, en `http://localhost:3100/buscar?categoria=tecnologia&max=1`, muestra exactamente `¡Uy! Esta combinación no dio con nada`. Funcionó en 390 y 1280 px. El mismo título aparece en la portada filtrada `http://localhost:3100/?categoria=tecnologia&max=1` en ambos anchos. Capturas: [a-solo-filtros-buscar-390.png](capturas/a-solo-filtros-buscar-390.png), [a-solo-filtros-buscar-1280.png](capturas/a-solo-filtros-buscar-1280.png), [a-portada-etiqueta-390.png](capturas/a-portada-etiqueta-390.png), [a-portada-etiqueta-1280.png](capturas/a-portada-etiqueta-1280.png).
- `q=submarino` sin filtros muestra exactamente `¡Uy! Por ahora no hay «submarino»` en 390 y 1280 px; con `categoria=tecnologia&max=1` añade exactamente `con esos filtros` en 1280 px. En 390 px se comprobó la misma variante con `q=submarino-inexistente-9f2`. Capturas: [a-submarino-390.png](capturas/a-submarino-390.png), [a-submarino-1280.png](capturas/a-submarino-1280.png), [a-palabra-filtros-390.png](capturas/a-palabra-filtros-390.png), [a-palabra-filtros-1280.png](capturas/a-palabra-filtros-1280.png).
- El consuelo visto fue exactamente `En segunda mano todo se mueve rápido: lo que hoy no está puede aparecer mañana. Prueba con otra palabra, o date una vuelta por todo lo publicado.` sin filtros, y `En segunda mano todo se mueve rápido: lo que hoy no está puede aparecer mañana. Prueba quitando algún filtro, o date una vuelta por todo lo publicado.` con filtros. El tono se siente cálido y claro: `¡Uy!` suaviza la ausencia, la explicación normaliza que el inventario cambia y `Ver todo lo publicado` queda visualmente como acción principal; el aviso queda como salida secundaria.
- En `http://localhost:3100/buscar?q=submarino-inexistente-9f2&categoria=tecnologia&max=1`, los destinos observados fueron `/buscar` para `Ver todo lo publicado`, `/buscar?q=submarino-inexistente-9f2` para `Quitar filtros` y `/ingresar?motivo=avisos&volver=%2Fbuscar%3Fq%3Dsubmarino-inexistente-9f2%26categoria%3Dtecnologia%26max%3D1` para `Entra y te avisamos cuando aparezca`. `Quitar filtros` conserva la palabra. Dentro de la tarjeta no apareció con solo palabra ni con solo filtros. En la portada, el control general externo `Quitar filtros` también se ve cuando hay filtros activos y apunta a `/`; `Ver todo lo publicado` apunta a `/` y al pulsarlo llevó a la portada sin filtros.
- Sin sesión, el login mostró exactamente `Entra y te avisamos apenas aparezca lo que buscas: en segunda mano, lo de mañana no es lo de hoy.` en `http://localhost:3100/ingresar?motivo=avisos&volver=%2Fbuscar%3Fq%3Dsubmarino-inexistente-9f2%26categoria%3Dtecnologia%26max%3D1`. Entrar con `laura@2venta.demo` volvió a `http://localhost:3100/buscar?q=submarino-inexistente-9f2&categoria=tecnologia&max=1`. Captura: [c-entrar-motivo-390.png](capturas/c-entrar-motivo-390.png).
- Desde `Crear una`, una cuenta demo nueva completó registro, SMS local y confirmación de celular; volvió a `http://localhost:3100/buscar?q=submarino-inexistente-9f2&categoria=tecnologia&max=1` y conservó el mensaje vacío. Captura: [c-cuenta-nueva-vuelve-390.png](capturas/c-cuenta-nueva-vuelve-390.png).
- Con Laura, en `/buscar` el aviso aparece dentro de la tarjeta y no arriba como acción separada. Al abrirlo, el campo `Nombre de la búsqueda` llegó sugerido como `submarino-inexistente-9f2`; el formulario completo cabe en 390 px. Guardar mostró exactamente `Guardada. Te avisamos cuando aparezca algo que coincida.`
- En `/avisos`, la búsqueda guardada apareció como enlace `submarino-inexistente-9f2` con href exacto `/buscar?q=submarino-inexistente-9f2&categoria=tecnologia&max=1`. Guardarla otra vez con otra etiqueta dejó una sola fila, `segunda etiqueta misma búsqueda`, con el mismo href: no duplicó la búsqueda.
- Comillas, HTML, emojis y espacios no provocaron inyección. Por ejemplo, en `http://localhost:3100/buscar?q=%3Cb%3Ehola%3C%2Fb%3E` se vio literalmente `¡Uy! Por ahora no hay «<b>hola</b>»`, no se interpretó como HTML. En `http://localhost:3100/buscar?q=%22submarino%22` se vio `¡Uy! Por ahora no hay «"submarino"»`; en `http://localhost:3100/buscar?q=%F0%9F%9B%B6%F0%9F%9A%80%E2%9C%A8` se vieron los emojis. Solo espacios se normalizó a búsqueda vacía y mostró los 12 resultados publicados, sin título extraño.
- La tarjeta vacía se vio legible en 390 px y en 1280 px; el formulario abierto del aviso se vio contenido en 390 px. Capturas: [d-formulario-aviso-390.png](capturas/d-formulario-aviso-390.png), [a-solo-filtros-buscar-1280.png](capturas/a-solo-filtros-buscar-1280.png).

## Observaciones fuera de alcance

- **Paginación, fila 33**: no apareció en los estados de cero resultados; no evalué su comportamiento.
- **«Niños», fila 37**: la etiqueta y productos de esa categoría se vieron en la portada, pero no probé esa corrección.
- **Textos de otras pantallas, filas 14, 35, 39 y 41**: no los evalué.

## NO VERIFICADO

- Guardar un aviso desde la portada filtrada con sesión; el guardado se ejecutó desde `/buscar`.
- Aviso real posterior a la aparición de un producto; solo verifiqué el guardado, la confirmación y el enlace en `/avisos`.
- Todas las combinaciones de filtros distintos de Tecnología + precio máximo, por ejemplo zona, estado, vendedor verificado y orden.
- Pruebas del repositorio (`npm run verify`, `npm run dev` y suites), no ejecutadas por instrucción.
