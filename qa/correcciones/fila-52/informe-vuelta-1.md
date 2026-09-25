# Informe de prueba — corrección 52 (D-128)

**Veredicto: NO PASA — una talla desactivada puede cambiar silenciosamente la talla de una publicación existente al guardarla desde el editor.**

## Hallazgos

### 1. Media — una talla desactivada se reemplaza silenciosamente por `XS` al editar

- **Ancho:** 390 × 844.
- **URL:** `http://localhost:3100/admin/configuracion?listo=1#atributos`; publicación `http://localhost:3100/producto/7856cd61-7ae8-48ec-ba47-f8ff34be3f13`; editor `http://localhost:3100/producto/7856cd61-7ae8-48ec-ba47-f8ff34be3f13/editar`.
- **Pasos exactos:**
  1. Como `admin@2venta.demo`, tocar `Desactivar 37` y ver `Guardado.`.
  2. Como `camila@2venta.demo`, abrir el editor de `Tacones blancos talla 37, usados una vez`.
  3. Ver el campo `Talla`: queda seleccionado `XS` y la opción `37` ya no existe.
  4. Pulsar `Guardar cambios` sin cambiar nada más.
- **Esperado:** la publicación existente conserva `Talla 37`, o el editor avisa que su valor quedó inactivo y exige una decisión explícita.
- **Visto:** antes de guardar, la ficha pública seguía mostrando exactamente `Talla 37`; el editor mostraba `XS` sin aviso. Tras guardar sin tocar la talla, la ficha mostró exactamente `Talla XS` y dejó de mostrar `Talla 37`.
- **Capturas:** [editor con `XS`](capturas/12-editar-existente-talla-off-390.png), [resultado después de guardar](capturas/30-talla-desactivada-guarda-xs-390.png).

### 2. Baja — un nombre enorme se trunca y se guarda sin advertencia

- **Ancho:** 390 × 844.
- **URL:** `http://localhost:3100/admin/configuracion?listo=1#categorias`.
- **Pasos exactos:** en `Nombre (tecnologia)`, pegar 500 `X` y pulsar `Guardar`.
- **Esperado:** un límite visible o un error que indique que el valor excede el máximo.
- **Visto:** la pantalla mostró exactamente `Guardado.`; al recargar, el valor quedó como 40 `X` (`XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`), sin indicar que se recortó.
- **Captura:** [valor enorme truncado](capturas/18-valor-enorme-truncado-390.png).

### 3. Baja — el historial es funcional pero se presenta como JSON técnico

- **Ancho:** 1280 × 800.
- **URL:** `http://localhost:3100/admin/configuracion`, sección `Historial`.
- **Pasos exactos:** realizar cambios de categoría y tallas, bajar a `Historial` y leer la tabla.
- **Esperado:** antes y después entendibles para una persona administradora.
- **Visto:** las columnas sí existen (`Cuándo`, `Quién`, `Qué`, `Antes`, `Después`), pero el contenido aparece como `{"activo":false}` y `{"activo":true}`; `Quién` aparece como `2venta`. Cumple el registro, pero obliga a interpretar JSON y no explica qué significa cada campo.
- **Captura:** [historial a 1280](capturas/26-historial-1280-final.png).

## Lo que verificaste y pasa

- **Acceso privado:** sin sesión, `GET http://localhost:3100/admin/configuracion` devolvió 404. Como Laura, la pantalla mostró exactamente `No pudimos abrir esto`. Reenvié con la sesión de Laura un formulario real tomado del admin; el POST también devolvió HTTP 404 y la categoría quedó sin cambios. Anchos 390. [Anónima](capturas/00-anon-config-390.png), [Laura](capturas/16-laura-config-404.png).

- **Categorías:** al cambiar `Tecnología` a `Tecnología temporal`, la portada mostró `Tecnología temporal` y el enlace siguió siendo exactamente `/?categoria=tecnologia`. Al cambiar el orden a 4 en 1280, los atajos quedaron `Filtros`, `Verificados`, `Ropa`, `Artículos para niños`, `Tecnología`. La pantalla confirmó `Guardado.`. [390 admin](capturas/03-categoria-390-guardado.png), [portada 390](capturas/04-portada-categoria-390.png), [cambio 1280](capturas/24-categoria-1280-guardado.png), [portada 1280](capturas/25-portada-categoria-1280.png).

- **Lugares de encuentro (390 × 844):** agregué `Parque QA 945761` en `La Calera`, tipo `Parque`. En `http://localhost:3100/comprar/808c009c-8560-4d20-a0c3-ea7a19c840ec`, al elegir `Nos vemos en persona` y `La Calera`, apareció el radio `Parque QA 945761`. Tras desactivarlo, dejó de aparecer. [Admin](capturas/05-lugar-390-agregado.png), [compra](capturas/06-lugar-compra-390.png), [desactivado](capturas/07-lugar-390-inactivo.png).

- **Tallas y edades (390 × 844):** agregué `QA17328` y `EdadQA17328`; la primera apareció en el editor de ropa y la segunda en `http://localhost:3100/publicar` al escoger `Artículos para niños`. Al tocar cada opción para desactivarla, desapareció de las opciones. [Panel](capturas/08-atributos-390-agregados.png), [editor ropa](capturas/09-talla-nueva-en-editar-390.png), [publicar niños](capturas/10-edad-nueva-en-publicar-390.png).

- **Palabras prohibidas (390 × 844):** agregué `CAFE QA84434`; el panel la mostró normalizada como `cafe qa84434`. Al editar como Camila con `CAFE QA84434` o `Café QA84434`, el rechazo fue exactamente `No se permiten pruebas de cafe QA.`. Una aparición embebida en `cafeteria qa84434` no fue rechazada. [Palabra](capturas/13-palabra-390-agregada.png), [edición bloqueada](capturas/14-palabra-edit-bloquea-390.png), [acentos y mayúsculas](capturas/31-palabra-sin-tildes-390.png).

- **Republicar (390 × 844):** una publicación retirada cuyo título contenía `repuqa72013` mostró en `http://localhost:3100/vender/metricas` el rechazo exacto `No se permiten republicaciones de prueba.`. Al desactivar la regla, se pudo republicar y se restauró el título original. [Captura](capturas/27-republicar-palabra-bloquea-390.png).

- **Validaciones y ataques de formulario (390 × 844):** los valores vacíos (quitando `required`) devolvieron `http://localhost:3100/admin/configuracion?error=nombre#categorias` con `El nombre es muy corto o trae un teléfono o un enlace.` y `http://localhost:3100/admin/configuracion?error=frase#palabras` con `La frase necesita al menos 3 letras.`. Un teléfono en una categoría devolvió el primer texto; un enlace en un lugar, `http://localhost:3100/admin/configuracion?error=nombre#lugares`, devolvió `El nombre es muy corto o trae un teléfono o un enlace.`; un teléfono en una talla, `http://localhost:3100/admin/configuracion?error=valor#atributos`, devolvió `Escribe el valor, sin teléfonos ni enlaces.`. IDs inventados en categoría y lugar devolvieron `http://localhost:3100/admin/configuracion?error=no-existe#categorias` y `...#lugares`, con `Eso ya no existe. Recarga la página.`; un lugar repetido devolvió `http://localhost:3100/admin/configuracion?error=repetido#lugares` con `Ya existe uno igual.`. [teléfono](capturas/17-validacion-telefono-390.png), [enlace](capturas/19-validacion-enlace-390.png).

- **No dejar listas vacías (390 × 844):** al intentar desactivar la última categoría en `http://localhost:3100/admin/configuracion?error=ultima#categorias` y la última talla en `http://localhost:3100/admin/configuracion?error=ultima#atributos`, el panel mostró exactamente `Tiene que quedar al menos una activa.` y no aplicó el cambio. [Última categoría](capturas/20-ultima-categoria-390.png), [última talla](capturas/21-ultima-talla-390.png).

- **Categoría desactivada (390 × 844):** al desactivar `Tecnología`, una publicación existente (`MacBook Air 13" 2020, 8 GB, 256 GB`) siguió visible en `http://localhost:3100/producto/4cc19ab8-51be-43d1-a090-c937d352e3f7` y su editor siguió disponible en `http://localhost:3100/producto/4cc19ab8-51be-43d1-a090-c937d352e3f7/editar`; al publicar en `http://localhost:3100/publicar`, `Tecnología` dejó de estar entre las opciones. Esto coincide con que la categoría inactiva no recibe publicaciones nuevas ni aparece en la portada. [Ficha existente](capturas/28-categoria-off-publicacion-existente-390.png), [editor existente](capturas/29-categoria-off-editar-existente-390.png).

- **Estado final de la demo:** restauré `Tecnología`, `Ropa` y `Artículos para niños` a sus nombres, posiciones y estado originales; restauré la talla `37`; la publicación de Camila quedó activa con `Talla 37`; los lugares y valores QA agregados quedaron inactivos.

## Observaciones fuera de alcance

- No evalué pagos, envíos, chats ni las demás pantallas de administración.
- No modifiqué el código de la aplicación ni reinicié el servidor.

## NO VERIFICADO

- **Publicación nueva bloqueada por una palabra:** la pantalla `http://localhost:3100/publicar` quedó en `Graba el video para continuar`; no había un video de prueba disponible para completar el flujo real de cámara.
- **Carga en lote:** con `camila@2venta.demo` y `andres@2venta.demo`, `http://localhost:3100/tienda` redirigió a `http://localhost:3100/vender` y no mostró `Cargar varios artículos de una vez`; no pude ejecutar una carga CSV.
- **Pedido existente que conserva un lugar inactivo:** no había un pedido de prueba apropiado para verificar esa retención sin afectar la demo.