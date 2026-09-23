# Informe de prueba — fila 3 de Catalina

**Veredicto: NO PASA — la columna de filtros de escritorio no permanece visible al desplazarse; el resto de la corrección observada funciona en los anchos y escenarios probados.**

## Hallazgos

1. **Severidad media — la columna de filtros no es realmente fija/sticky y sus acciones quedan fuera de la primera pantalla.**

   - **Ancho:** 1280x800; el mismo corte inicial se observó en 1024x800.
   - **URL:** `http://localhost:3100/buscar`
   - **Pasos exactos:**

     1. Abrir la URL con una ventana de 1280x800.
     2. Ver la columna izquierda con el texto exacto «Filtros».
     3. Desplazarse hacia abajo por la grilla varias filas, hasta aproximadamente `scrollY=600` o más.

   - **Esperado:** la columna izquierda debe quedarse visible al bajar por muchos resultados, incluyendo «Aplicar» y «Limpiar».
   - **Visto:** al inicio la tarjeta de filtros ocupa `y=256..920`; «Aplicar» aparece en `y=864` y «Limpiar» en `y=872`, por debajo del viewport de 800 px. Tras desplazarse, la tarjeta completa desaparece y solo quedan productos. El texto de la pantalla sigue siendo, entre otros, «12 resultados», pero ya no se ven «Filtros», «Aplicar» ni «Limpiar».
   - **Capturas:** [vista inicial](<./capturas/desktop-inicial-viewport-1280.png>), [vista desplazada sin filtros](<./capturas/desktop-sticky-form-scroll-1280.png>).

## Lo que verifiqué y pasa

- **Anchos y prioridad de contenido:** en 390x844, 768x1024 y 1023x800 se ve el botón «Filtros», no se ve la columna, y el primer producto aparece sin bajar (`y=306`). En 1024x800 y 1280x800 se ve la columna, no el botón, y el primer producto aparece en `y=300`. No observé botón y columna visibles simultáneamente ni ambos ocultos. Capturas: [390](<./capturas/base-390x844.png>), [768](<./capturas/base-768x1024.png>), [1023](<./capturas/base-1023x800.png>), [1024](<./capturas/base-1024x800.png>), [1280](<./capturas/base-1280x800.png>).
- **Panel móvil sin palabra:** en `http://localhost:3100/buscar`, al marcar «Tecnología» y «Ropa», el pie mostró «Ver 8 resultados» en vivo; aplicar llevó a `http://localhost:3100/buscar?categoria=tecnologia&categoria=ropa`, mostró «8 resultados» y el botón quedó como «Filtros 2 activos».
- **Panel móvil con palabra:** con `http://localhost:3100/buscar?q=iPhone`, el panel conservó el valor oculto exacto `iPhone`; al marcar «Tecnología» mostró «Ver 1 resultado»; aplicar llevó a `http://localhost:3100/buscar?q=iPhone&categoria=tecnologia&categoria=ropa`, conservó el texto visible `iPhone`, mostró «1 resultado» y «Filtros 2 activos». Capturas: [panel](<./capturas/mobile-panel-con-q-390.png>), [aplicado](<./capturas/mobile-aplicado-con-q-390.png>).
- **Cerrar sin aplicar:** después de cambiar filtros y pulsar «Cerrar filtros», la URL quedó sin cambios en `http://localhost:3100/buscar?q=iPhone` y el botón exterior siguió diciendo «Filtros». Captura: [cierre](<./capturas/mobile-cierre-sin-aplicar-390.png>).
- **Limpiar:** en móvil, «Limpiar» llevó de `http://localhost:3100/buscar?q=iPhone&categoria=tecnologia` a `http://localhost:3100/buscar?q=iPhone`; en escritorio también conservó la palabra `iPhone` y dejó la URL exacta `http://localhost:3100/buscar?q=iPhone`. Capturas: [móvil limpiado](<./capturas/mobile-limpiado-con-q-390.png>), [escritorio limpiado](<./capturas/desktop-limpiado-1280.png>).
- **Buscar otra palabra con filtros:** desde `http://localhost:3100/buscar?q=iPhone&categoria=tecnologia&categoria=ropa`, buscar `MacBook` llevó a `http://localhost:3100/buscar?q=MacBook&categoria=tecnologia&categoria=ropa`; la pantalla mostró «1 resultado» y el botón «Filtros 2 activos». Captura: [búsqueda conservando filtros](<./capturas/buscar-otra-palabra-con-filtro-390.png>).
- **Buscar desde portada:** buscar `MacBook` desde la barra de la portada llevó a `http://localhost:3100/buscar?q=MacBook`, sin filtros heredados; mostró «1 resultado» y el botón «Filtros». Captura: [búsqueda desde portada](<./capturas/buscar-desde-portada-390.png>).
- **Cambio de ancho con el panel abierto:** al pasar de 390 a 1280 px desapareció el panel y quedó la columna de escritorio sin superposición; al volver a 390 px reapareció el panel lateral. Capturas: [390→1280](<./capturas/resize-panel-390-a-1280.png>), [1280→390](<./capturas/resize-panel-1280-a-390.png>).
- **Guardar búsqueda con Laura:** con `laura@2venta.demo`, la pantalla mostró el formulario «Avísame cuando aparezca algo así». Para `iPhone` con categorías «Tecnología» y «Ropa», el campo oculto `params` fue exactamente `q=iPhone&categoria=tecnologia&categoria=ropa`; al guardar apareció «Guardada. Te avisamos cuando aparezca algo que coincida.» En `/avisos` quedó la búsqueda «Prueba fila 3 2026-09-22» con enlace exacto `/buscar?q=iPhone&categoria=tecnologia&categoria=ropa`. Capturas: [guardado](<./capturas/guardar-busqueda-exito-1280.png>), [avisos](<./capturas/avisos-busqueda-guardada-390.png>).
- **Sin JavaScript:** en 390 px el enlace «Filtros» tuvo `href="#filtros"`; tras pulsarlo la columna apareció arriba de los resultados. Marcar «Tecnología» y pulsar «Aplicar» funcionó como formulario normal, llevó a `http://localhost:3100/buscar?categoria=tecnologia&min=&max=&zona=&orden=recientes` y mostró «4 resultados». Capturas: [columna sin JS](<./capturas/sin-js-filtros-arriba-390.png>), [aplicado sin JS](<./capturas/sin-js-filtros-aplicado-390.png>).
- **Diseño y comprensión móvil:** el conteo «12 resultados» y el botón «Filtros» quedaron alineados en la misma franja; el panel muestra el título «Filtros», el conteo vivo en el pie y la grilla queda visible al cerrarlo. Capturas: [base móvil](<./capturas/base-390x844.png>), [panel con selección](<./capturas/mobile-panel-seleccion-390.png>).

## Observaciones fuera de alcance

- Se vio la etiqueta exacta «Niños» en el filtro de categoría y en las tarjetas; no se evaluó el cambio de nombre de la fila 37.
- No se evaluó la validación de precios de la fila 4.
- No se evaluó el texto de resultados vacíos de la fila 5.
- No se evaluó la paginación de la fila 33.
- El panel de filtros de la portada, correspondiente a la fila 2, no se volvió a probar; solo se usó su barra de búsqueda sin filtros para este escenario.

## NO VERIFICADO

- No se probaron entradas de precio con letras o valores negativos, por estar explícitamente fuera de esta fila.
- No se ejecutó una prueba específica de paginación ni del texto de resultados vacíos, por estar explícitamente fuera de esta fila.
- No se creó una cuenta nueva ni se usó el flujo SMS; se utilizó la cuenta existente de Laura para guardar la búsqueda.
