# Informe de prueba — tanda D-130

Fecha: 2 de octubre de 2026 · app: `http://localhost:3100` · probadora: Luna

Anchos usados: móvil `390 × 844` y escritorio `1280 × 800`. Las rutas autenticadas se probaron con contextos nuevos. No se ejecutaron pruebas del repositorio ni se modificó el código de la aplicación.

## Veredicto

| Punto | Veredicto | Evidencia principal |
|---|---|---|
| 1. Barra inferior y salidas | **PASA CON OBSERVACIONES** | La barra aparece donde corresponde y se oculta en las rutas de tarea; `/dev/pago/[id]` queda sin salida dentro de la app. `/publicar/[id]` no se pudo verificar porque no había borradores. |
| 2. Filtros móviles y etiquetas | **PASA** | Etiquetas, X individual, «Quitar todo», panel de 390 px, ayuda de zona, escritorio y enlaces sin JavaScript. |
| 3. Medios que no cargan | **PASA CON OBSERVACIONES** | Se verificaron ambos respaldos provocando un 404 del recurso en el navegador; no quedó una publicación persistida con `seed/*` rota para probar de forma natural. |
| 4. Términos al registrarse | **PASA** | Probado a 390 y 1280 px, con teclado, cierre sin aceptar y aceptación visible. |
| 5. Configuración del equipo | **PASA** | Cinco pestañas por `?seccion=…`, búsqueda por nombre y zona, «Por confirmar» primero y guardados que regresan a su pestaña. Todo lo creado para la prueba fue borrado. |
| 6. Sesiones | **PASA** | «Este dispositivo», cinco recientes, «Ver las otras 2», cierre individual y cierre masivo verificados en contextos separados. |

**Veredicto general: PASA CON OBSERVACIONES.** El único fallo encontrado es la falta de una salida visible en la pantalla de pago de desarrollo.

## Hallazgos

### 1. Severidad: Media — `/dev/pago/[id]` queda en un callejón sin salida móvil

- **Pasos:** con Laura, 390 × 844, abrir un artículo, entrar a «Comprar con pago protegido», elegir «Nos vemos en persona», elegir `Chapinero` y pulsar «Ir a pagar».
- **URL exacta observada:** `http://localhost:3100/dev/pago/33cce261-1faa-4b99-9452-8b4872909fae`.
- **Esperado:** como la barra inferior está correctamente oculta en una tarea de pago, debe existir «Volver» o un menú superior para salir.
- **Visto:** aparece «Proveedor de pagos de prueba…», «Confirmar pago», el total y «Simular pago aprobado» / «Simular pago rechazado», pero no aparece «Volver», el encabezado ni la navegación principal. La barra inferior tampoco está. La única salida es el botón Atrás del navegador.
- **Captura:** [pago sin salida, 390 px](capturas/barra-pago-390.png).

La naturaleza simulada del proveedor no es el hallazgo; el problema es la falta de una salida de navegación.

## Lo que pasa

### 1. Barra inferior

En `390 × 844`, la barra con `Inicio · Buscar · Chats · Perfil` se mantuvo visible en `/`, `/buscar`, `/chats`, `/cuenta`, `/favoritos` y `/producto/9c19eedf-dd1d-4d37-82ca-6b908b896844`. Capturas: [inicio](capturas/barra-inicio-390.png), [buscar](capturas/barra-buscar-390.png), [chats](capturas/barra-chats-390.png), [perfil](capturas/barra-perfil-390.png), [guardados](capturas/barra-guardados-390.png), [ficha](capturas/barra-ficha-390.png).

Se ocultó en `/comprar/9c19eedf-dd1d-4d37-82ca-6b908b896844`, `/pedido/33cce261-1faa-4b99-9452-8b4872909fae`, `/publicar`, `/producto/b752ebad-e132-4c1d-822d-8326d3343af9/editar` y `/chat/105b6318-078c-4e85-b2ef-a5d5bb76e659`. Todas esas pantallas tenían salida visible: «Volver al artículo», «Volver», «Cancelar», «Volver al artículo» y «Volver», respectivamente. Capturas: [comprar](capturas/barra-comprar-390.png), [pedido](capturas/barra-pedido-390.png), [publicar](capturas/barra-publicar-390.png), [editar](capturas/barra-editar-390.png), [chat](capturas/barra-chat-390.png).

En `1280 × 800` no se mostró la barra móvil; la portada mantuvo el menú de escritorio y la ruta de compra no mostró navegación inferior. Capturas: [inicio escritorio](capturas/barra-inicio-1280.png), [comprar escritorio](capturas/barra-comprar-1280.png).

`/publicar/[id]` quedó **NO VERIFICADO**: Camila y Andrés no tenían borradores de tienda, y no se creó uno solo para forzar esa pantalla.

### 2. Filtros

En `/buscar?q=chaqueta&categoria=ropa&max=200000&estado=usado_bueno&radio=5&zona=Chapinero&verificados=1`, a 390 px, se vieron exactamente las etiquetas:

`Ropa`, `Hasta $ 200.000`, `Usado, buen estado`, `A menos de 5 km`, `Vende en Chapinero`, `Solo verificados`.

Cada X quitó solo su filtro y actualizó la URL. «Quitar todo» produjo `/buscar?q=chaqueta` y conservó `Resultados para “chaqueta”`. Capturas: [etiquetas antes](capturas/filtros-q-antes-quitar-todo-390.png), [después de quitar todo](capturas/filtros-q-despues-quitar-todo-390.png).

El panel móvil terminó en `x=0`, `width=390`, `height=844`; mostró la ayuda exacta `Dónde está quien vende. Tu ubicación se elige arriba de los resultados.` y dejó el botón inferior visible. Captura: [panel móvil](capturas/filtros-panel-390-final.png). En la portada se repitieron las seis etiquetas y «Quitar todo». Captura: [portada](capturas/filtros-portada-390.png).

En 1280 px la columna quedó a la izquierda de la grilla; «Aplicar» estuvo visible al inicio y después de desplazar, y Tecnología se aplicó en `/buscar?categoria=tecnologia`. Capturas: [columna](capturas/filtros-buscar-1280.png), [columna al bajar](capturas/filtros-buscar-1280-scroll.png).

Sin JavaScript, X y «Quitar todo» siguieron funcionando: `/buscar?q=chaqueta&categoria=ropa&max=200000` quitó Ropa sin perder `q`; en portada `/?categoria=ninos&min=50000` quitó el precio y conservó `categoria=ninos`. Capturas: [búsqueda sin JS](capturas/filtros-sin-js-390.png), [portada sin JS](capturas/filtros-portada-sin-js-390.png).

### 3. Medios rotos

Con una respuesta 404 inducida solo para el JPG de una tarjeta, la tarjeta mostró `Sin foto` y quedó sin `<img>` roto. Captura: [foto sin foto](capturas/media-foto-sin-foto-390.png).

Con una respuesta 404 inducida solo para el MP4 de la ficha, apareció exactamente `El video no cargó. Intenta de nuevo más tarde.`; desaparecieron el reproductor y `Grabado por el vendedor`. Captura: [video sin carga](capturas/media-video-no-cargo-390-final.png).

### 4. Términos

En `390 × 844` y `1280 × 800`, abrir la casilla con la barra espaciadora abrió el panel a pantalla completa. Se vio arriba `Lee los términos y toca «Aceptar» para seguir con tu registro.` y el botón «Aceptar» estuvo dentro del viewport sin desplazarse. Cerrar con Enter dejó la casilla desmarcada y sin `Aceptaste los términos.`; volver a abrir y aceptar con teclado marcó la casilla y mostró `Aceptaste los términos.`. Capturas: [panel 390](capturas/terminos-panel-390.png), [aceptado 390](capturas/terminos-aceptados-390.png), [panel 1280](capturas/terminos-panel-1280.png), [aceptado 1280](capturas/terminos-aceptados-1280.png).

### 5. Configuración del equipo

En 390 px la navegación mostró `Categorías`, `Lugares de encuentro`, `Tallas y edades`, `Palabras prohibidas` e `Historial`. Cada clic llevó a su URL `?seccion=…` y dejó visible solo la sección elegida. Capturas: [categorías](capturas/admin-config-categorias-390.png), [lugares](capturas/admin-config-lugares-390.png), [atributos](capturas/admin-config-atributos-390.png), [palabras](capturas/admin-config-palabras-390.png), [historial](capturas/admin-config-historial-390.png).

En Lugares, la primera fila quedó marcada `Por confirmar`. Buscar `andino` devolvió un lugar; buscar `Chapinero` devolvió tres y puso primero uno `Por confirmar`. URLs observadas: `/admin/configuracion?seccion=lugares&buscar=andino` y `/admin/configuracion?seccion=lugares&buscar=Chapinero`. Capturas: [búsqueda por nombre](capturas/admin-lugares-busqueda-andino-390.png), [búsqueda por zona](capturas/admin-lugares-busqueda-zona-chapinero-390.png), [escritorio](capturas/admin-config-busqueda-1280.png).

Se añadieron y luego se borraron valores temporales. Los guardados regresaron a `?seccion=categorias&listo=1`, `?seccion=lugares&listo=1`, `?seccion=atributos&listo=1` y `?seccion=palabras&listo=1`, con `Guardado.`. Capturas representativas: [lugar guardado](capturas/admin-lugar-guardado-390.png), [categoría](capturas/admin-categoria-guardada-390.png), [atributo](capturas/admin-atributo-guardado-390.png), [palabra](capturas/admin-palabra-guardada-390.png). Al terminar, ninguno de esos valores temporales siguió visible.

### 6. Sesiones

Con Laura se dejaron siete sesiones adicionales abiertas desde contextos separados. En `390 × 844`, la sesión actual apareció aparte como `Este dispositivo`; se mostraron cinco sesiones y `Ver las otras 2`. Al expandir aparecieron las dos restantes. Capturas: [cinco recientes](capturas/sesiones-390-inicial-full.png), [otras dos](capturas/sesiones-390-otras-full.png).

«Cerrar» eliminó una sesión individual. «Cerrar todas las demás» dejó solo `Este dispositivo`, ocultó los contenedores de sesiones y quitó el botón; al navegar desde los otros siete contextos, todos terminaron en `/ingresar`. Capturas: [cierre individual](capturas/sesiones-390-cerrar-full.png), [cierre masivo](capturas/sesiones-390-final-full.png).

## NO VERIFICADO

- `/publicar/[id]`: no había borradores de tienda en las cuentas vendedoras demo y no se creó uno para esta prueba.
- Medios rotos con una publicación persistida apuntando de forma natural a un archivo inexistente: se verificó el mismo evento de error con 404 interceptado en el navegador, sin modificar datos de la aplicación.
