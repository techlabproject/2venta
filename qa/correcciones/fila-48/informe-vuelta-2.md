# Informe de prueba — vuelta 2, corrección 48 y códigos SMS

**Veredicto:** `PASA` — el hallazgo de la vuelta 1 quedó corregido; admin ya no ve avisos guardables ni preguntas, y el servidor también rechaza preguntar sin crear datos. Lo verificado en la vuelta 1 se mantiene.

## Hallazgos

Ninguno.

## Lo que verifiqué y pasa

- **Avisos para admin, 390 px:** en `http://localhost:3100/buscar?q=guante` no existe **“Avísame cuando aparezca algo así”**. En `http://localhost:3100/buscar?q=zzzzzz_luna_v2_noexiste`, con **“0 resultados”** y **“¡Uy! Por ahora no hay «zzzzzz_luna_v2_noexiste»**, tampoco existe ese control. [resultado](capturas/v2-admin-390-buscar.png) · [sin resultados](capturas/v2-admin-390-sin-resultados.png).
- **Avisos para admin, 1280 px:** la misma comprobación dio cero controles tanto con resultados como sin resultados. [resultado](capturas/v2-admin-1280-buscar.png) · [sin resultados](capturas/v2-admin-1280-sin-resultados.png).
- **Preguntas para admin:** en la ficha `http://localhost:3100/producto/0c5efda3-3464-42f9-b5a1-13f1950201c6`, a 390 y 1280 px, el conteo fue cero para el campo `Tu pregunta`, el placeholder **“Pregunta algo del producto”** y el botón **“Preguntar”**. La ficha mantiene el aviso exacto **“Estás en la cuenta del equipo de 2venta: desde aquí no se compra ni se vende. Para eso, usa tu cuenta personal.”** [390 px](capturas/v2-admin-390-ficha.png) · [1280 px](capturas/v2-admin-1280-ficha.png).
- **Acción de preguntar en servidor:** capturé una solicitud real de `askQuestion` enviada por Laura y la reenvié con la sesión de `admin@2venta.demo`. La respuesta cargó la ruta de administración (`/admin`, con **“Moderación”**) y no insertó la pregunta. [ficha admin](capturas/v2-admin-pregunta-bloqueada.png).
- **Laura conserva ambos controles:** a 390 px vio **“Avísame cuando aparezca algo así”**, el campo `Tu pregunta`, el placeholder **“Pregunta algo del producto”** y el botón **“Preguntar”**. [búsqueda Laura](capturas/v2-laura-buscar.png) · [ficha Laura](capturas/v2-laura-ficha.png).
- **Cabecera y barra admin:** siguen correctas a 390 y 1280 px.
- **Rutas admin:** `/vender`, `/publicar`, `/tienda` y `/vender/metricas` siguieron redirigiendo a `http://localhost:3100/admin`.
- **Ficha, carrito y direcciones protegidas:** siguieron sin compra, carrito, chat, favorito ni preguntas; las rutas de comprar y chat devolvieron a la ficha.
- **Acciones adversariales anteriores:** los conteos admin siguieron en `0` para carrito, favoritos, búsquedas, chats, pedidos, vendedores, publicaciones, ofertas y preguntas.
- **Administración:** `/admin`, `/admin/usuarios`, `/admin/reportes`, `/admin/disputas` y `/admin/conversaciones` siguieron cargando.
- **SMS:** en `http://localhost:3100/recuperar` apareció **“Si ese celular tiene una cuenta, le mandamos un código.”** y **“Mandar otro en 30 s”** quedó deshabilitado. [espera SMS](capturas/v2-recuperar-espera.png).

## Observaciones fuera de alcance

- Ninguna nueva.

## NO VERIFICADO

- Fallo real del proveedor SMS para un número al que sí se debe enviar de verdad.
- Ejecución completa de `publishListing` con sesión admin: la pantalla sigue bloqueando el envío con **“Graba el video para continuar”**; el POST manual sin token interno no produjo publicación, pero no contó como ejecución completa.