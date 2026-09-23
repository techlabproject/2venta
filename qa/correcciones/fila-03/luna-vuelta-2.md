# Informe de segunda vuelta — fila 3 de Catalina

**Veredicto: NO PASA — la columna ahora permanece sticky y sus acciones están arriba, pero en 1280x600 la cabecera fija tapa el inicio de los filtros al desplazar la columna hasta el final.**

## Hallazgos

1. **Severidad media — la cabecera fija tapa el campo «Categoría» al desplazar la columna.**

   - **Ancho:** 1280x600.
   - **URL:** `http://localhost:3100/buscar`
   - **Pasos exactos:**

     1. Abrir la URL con una ventana de 1280x600.
     2. Bajar por la página hasta que la columna de filtros quede pegada arriba.
     3. Poner el cursor sobre la columna y usar la rueda hasta llevarla al final.

   - **Esperado:** la cabecera con «Filtros», «Limpiar» y «Aplicar» debe quedarse fija sin cubrir ningún campo; «Categoría» y «Tecnología» deben seguir legibles.
   - **Visto:** con la página en `scrollY=800` y la columna en `scrollTop=57`, la cabecera ocupa `y=16..77`, mientras la leyenda «Categoría» queda en `y=40..60`, debajo de la cabecera. En la captura, «Categoría» queda tapada y «Tecnología» aparece recortada justo bajo el borde de la cabecera; siguen visibles «Filtros», «Limpiar», «Aplicar», «Ropa» y «Niños».
   - **Capturas:** [columna al inicio](<./capturas/v2-desktop-1280x600-inicial.png>), [columna al final](<./capturas/v2-desktop-1280x600-columna-max.png>).

2. **Severidad baja — a 800 px de alto, la rueda sobre la columna desplaza la página en vez de desplazar la columna.**

   - **Anchos:** 1280x800 y 1024x800.
   - **URL:** `http://localhost:3100/buscar`
   - **Pasos exactos:**

     1. Abrir la URL con una ventana de 1280x800 o 1024x800.
     2. Poner el cursor dentro de la columna visible y usar la rueda.

   - **Esperado:** poder llegar a «Ordenar por» usando el desplazamiento propio de la columna, sin mover la grilla.
   - **Visto:** al cargar, «Aplicar» sí está visible (`y=268..304`), pero «Ordenar por» queda en `y=825..861`. La columna tiene `scrollTop=0` y `scrollHeight=625`, igual a su alto visible; la rueda hace que la página pase de `scrollY=0` a `scrollY=600`, mientras la grilla se mueve. Después de ese desplazamiento, la columna queda sticky y «Ordenar por» sí aparece. En 1280x600, donde la columna sí tiene overflow propio (`scrollHeight=625`, `clientHeight=568`), la rueda deja la página en el mismo `scrollY=800`, lleva la columna a `scrollTop=57` y muestra «Ordenar por».
   - **Capturas:** [1280x800 inicial](<./capturas/v2-desktop-1280x800-inicial.png>), [1280x800 tras bajar](<./capturas/v2-desktop-1280x800-page-scroll.png>), [rueda inicial 1280](<./capturas/v2-desktop-1280x800-wheel-inicial.png>), [rueda inicial 1024](<./capturas/v2-desktop-1024x800-wheel-inicial.png>).

## Lo que verifiqué y pasa

- **1280x800 y 1024x800 al cargar:** la columna aparece a la izquierda, el encabezado muestra «Filtros», «Limpiar» y «Aplicar», y «Aplicar» está visible desde el inicio. URLs exactas: `http://localhost:3100/buscar`.
- **Sticky de la columna:** al bajar por la grilla, en ambos anchos la columna se mantiene visible arriba; a 1280x800 queda en `y=16`, y «Aplicar» queda visible en `y=28..64`. Capturas: [1280](<./capturas/v2-desktop-1280x800-page-scroll.png>), [1024](<./capturas/v2-desktop-1024x800-page-scroll.png>).
- **Scroll propio cuando hace falta:** en 1280x600 la rueda dentro de la columna no cambia el `scrollY` de la página y permite llegar a «Ordenar por». La cabecera continúa visible arriba. Captura: [scroll de columna](<./capturas/v2-desktop-1280x600-columna-scroll.png>).
- **Teléfono 390:** la pantalla mostró «12 resultados», el botón «Filtros» y ningún aside visible; el primer producto apareció en `y=306`. Al abrir el panel, el pie mostró «Ver 12 resultados»; al marcar «Tecnología» mostró «Ver 4 resultados»; aplicar llevó a `http://localhost:3100/buscar?categoria=tecnologia`, mostró «4 resultados» y el botón exterior quedó como «Filtros 1 activos». Capturas: [base](<./capturas/v2-mobile-390-base.png>), [panel](<./capturas/v2-mobile-390-panel-seleccion.png>), [aplicado](<./capturas/v2-mobile-390-aplicado.png>).
- **Sin JavaScript en 390:** «Filtros» tuvo `href="#filtros"`; la columna apareció arriba de los resultados. «Aplicar» funcionó como formulario normal y llevó a `http://localhost:3100/buscar?categoria=tecnologia&min=&max=&zona=&orden=recientes`, mostrando «4 resultados». Capturas: [columna](<./capturas/v2-nojs-390-columna.png>), [aplicado](<./capturas/v2-nojs-390-aplicado.png>).
- **Diseño y comprensión:** sí se entiende tener «Aplicar» arriba: queda junto a «Filtros» y «Limpiar», visible desde la carga, y permite actuar sin buscarlo al final de la columna. En 1280x800 y 1024x800 la cabecera se ve compacta pero legible; la confusión aparece únicamente al desplazar el panel corto, porque el título «Categoría» queda oculto bajo la cabecera fija.

## Observaciones fuera de alcance

- Se vio la etiqueta exacta «Niños» en los filtros y en tarjetas; no se evaluó el cambio de nombre de la fila 37.
- No se revisaron precio, resultados vacíos, paginación ni guardado de búsquedas, porque no forman parte del repaso solicitado en esta segunda vuelta.

## NO VERIFICADO

- No se repitieron los anchos 768x1024 y 1023x800 en esta vuelta; se probaron los dos anchos de escritorio solicitados y 390 px.
- No se volvió a probar la conservación de filtros al buscar otra palabra ni el flujo de «Guardar esta búsqueda».

---

## Respuesta (Claude, 2026-09-22) — no se corrigen, con Nicolás informado

1. **Cabecera que «tapa» Categoría.** Es el desplazamiento propio de la columna: lo que
   se sube pasa por debajo de la cabecera fija, como en cualquier lista con encabezado
   fijo, y vuelve a verse al subir la columna. No se pierde ni se bloquea ningún campo.
2. **La rueda mueve la página a 800 px de alto.** Ahí la columna cabe entera y no
   tiene desplazamiento propio; al mover la página queda fija y «Ordenar por» aparece.
   Es el comportamiento esperado de una columna fija.
