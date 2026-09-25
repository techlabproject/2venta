# Informe independiente de Luna — correcciones 35 a 40

## Veredicto

**PASA CON OBSERVACIONES** — la interfaz de las correcciones 35, 37, 38 y 39, la decisión de IMEI de la 40 y la carga en lote pasan en los escenarios que sí pude ejecutar; queda sin verificar la publicación real porque el navegador conectado no pudo abrir su cámara, y hay una obstrucción visual menor en 390 px.

## Hallazgos

1. **Baja — La tarjeta «Antes de grabar» queda parcialmente tapada por la navegación inferior en 390 px.**

   - Ancho: 390 px.
   - URL: `http://localhost:3100/publicar` y, con el mismo efecto, `http://localhost:3100/publicar/b7d1afed-4e5c-48ef-8c06-44760cdcbacf`.
   - Pasos: iniciar sesión como `camila@2venta.demo`; abrir `/publicar` en 390 × 844 sin desplazarse. Repetido en el borrador empresarial con la cuenta de empresa de prueba y abrir «Grabar video».
   - Esperado: poder leer completa la tarjeta antes de empezar a grabar.
   - Visto: la tarjeta aparece y contiene «Antes de grabar», «Tienes 30 segundos. Lo que más vende:», los cinco puntos y «Se graba aquí mismo, no desde la galería…», pero la barra fija inferior se dibuja encima de la parte baja: tapa parcialmente el quinto punto («Que no salgan caras, documentos ni la dirección de tu casa: el video lo ve todo el mundo.») y la línea final en el primer viewport. Se puede leer al desplazarse.
   - Capturas: [publicar-card-390.png](./capturas/publicar-card-390.png), [borrador-empresa-antes-de-grabar.png](./capturas/borrador-empresa-antes-de-grabar.png).

## Lo que verifiqué y pasa

- **35 — Tarjeta para vendedores:** en 390 y 1280 px aparecen exactamente «Antes de grabar», «Tienes 30 segundos. Lo que más vende:», los consejos de luz, rayones, encendido, caja/accesorios, privacidad y «Se graba aquí mismo, no desde la galería: así quien compra sabe que es de hoy y tuyo.» También aparece en el borrador de empresa. La cámara no llegó a abrirse, por lo que la visibilidad durante una cámara realmente abierta queda en NO VERIFICADO. Capturas: [publicar-card-1280.png](./capturas/publicar-card-1280.png), [borrador-empresa-antes-de-grabar.png](./capturas/borrador-empresa-antes-de-grabar.png).
- **37 — «Artículos para niños»:** se vio en la portada, las tarjetas, `/buscar?categoria=ninos`, el panel lateral de filtros a 390 px, la ficha `/producto/0ff7de23-858c-4a72-a9ae-660156d268c2` y la edición. La dirección conserva `?categoria=ninos`. En el panel estable a 390 px el ancho medido fue 343 px y el texto completo no se corta. El nombre sugerido al guardar una búsqueda fue `noexiste-1790304026368 Artículos para niños`. Capturas: [ninos-filtros-390-estable.png](./capturas/ninos-filtros-390-estable.png), [ninos-ficha-390-final.png](./capturas/ninos-ficha-390-final.png), [ninos-buscar-1280-final.png](./capturas/ninos-buscar-1280-final.png).
- **38 — Campos propios:** en `/publicar`, 390 px, ropa mostró `XS, S, M, L, XL, XXL, Talla única` y números `2` a `46`; artículos para niños mostró `0 a 6 meses`, `6 a 12 meses`, `1 a 2 años`, `3 a 4 años`, `5 a 7 años`, `8 a 11 años`, `12 años o más`. En 1280 px ambos selectores midieron 406 px de ancho sin desbordamiento. En edición, una publicación de ropa pasó de «Talla única» a «Talla XL» y una de niños de «8 a 11 años» a «Para 5 a 7 años» en la ficha. Capturas: [publicar-ropa-campos-390.png](./capturas/publicar-ropa-campos-390.png), [publicar-ninos-campos-390.png](./capturas/publicar-ninos-campos-390.png), [editar-ropa-xl-390-final.png](./capturas/editar-ropa-xl-390-final.png), [editar-ninos-5-a-7-390-final.png](./capturas/editar-ninos-5-a-7-390-final.png).
- **C — Publicaciones antiguas y edición:** en las seis publicaciones activas que mostró `camila@2venta.demo`, las de ropa tenían talla y las de niños tenían edad; no encontré una publicación vieja sin el campo propio. La edición sí mostró y guardó ambos cambios anteriores.
- **39 — Pista del IMEI:** en `/publicar`, tecnología, la pista observada fue «Márcalo en el teclado con *#06# y cópialo tal cual. Son 15 dígitos.» No apareció «Lo pedimos para que nadie venda equipos robados.» ni «equipos robados». Captura: [publicar-tecnologia-imei-390.png](./capturas/publicar-tecnologia-imei-390.png).
- **40 — IMEI según tipo de artículo:** en tecnología aparece «¿Es un celular?», con «Sí» y «No». Sin elección o con «No» no aparece «IMEI del equipo»; con «Sí» aparece. Tampoco se vio «La electrónica la revisa una persona…». Al forzar el envío de un título `iPhone QA manipulado 2` marcado «No» quitando el `disabled` del botón, el servidor respondió exactamente: «Parece un celular: para publicarlo necesitamos el IMEI. Marca «Sí» en «¿Es un celular?» y escríbelo.» En un `Xbox Series S QA sin IMEI` y en `Forro para iPhone QA 2`, ambos marcados «No», el servidor no respondió con un error de IMEI: respondió «Falta el video del artículo.»; es la defensa posterior al filtro de celular y confirma que el accesorio/consola no entran por IMEI. Capturas: [bypass-probe.png](./capturas/bypass-probe.png), [consola-servidor-sin-imei.png](./capturas/consola-servidor-sin-imei.png), [forro-iphone-servidor-probe.png](./capturas/forro-iphone-servidor-probe.png).
- **40 — Carga en lote:** creé una empresa de prueba por la interfaz, confirmé el NIT desde la cuenta admin y abrí `/tienda`. En el CSV, la fila de celular sin IMEI mostró exactamente «Línea 2: Parece un celular: falta el IMEI.»; la fila de consola pasó y mostró «Se creó 1 borrador. Ahora hay que grabarles el video.», con la consola en «borradores sin video». Captura: [tienda-lote-final.png](./capturas/tienda-lote-final.png).

## NO VERIFICADO

- **Video real y audio:** en 390 px, `/publicar`, el permiso del navegador figuró como `granted` y había un `videoinput`, pero `getUserMedia({ video: true, audio: false })` devolvió `NotSupportedError: Not supported`. La pantalla mostró exactamente «No pudimos abrir la cámara. Revisa el permiso en tu navegador e intenta otra vez.»; no apareció «Grabar». Captura: [diagnostico-camara.png](./capturas/diagnostico-camara.png). No hubo Blob grabado para inspeccionar `audioTracks`, `mozHasAudio` o `webkitAudioDecodedByteCount`.
- **Publicación real con video:** no pude publicar ropa, artículos para niños, celular con IMEI, consola sin IMEI, iPhone marcado «No» ni forro para iPhone; el botón quedó en «Graba el video para continuar» o la prueba tuvo que forzarlo para probar el servidor. Por la misma razón no verifiqué que una publicación nueva salga inmediatamente al catálogo, a `/buscar` o al catálogo de electrónica.
- **Aviso de búsqueda guardada tras una publicación nueva:** sí guardé búsquedas y comprobé que aparecen en `/avisos`; sin una publicación nueva generada con video no pude atribuir un aviso nuevo a esta corrida. La pantalla observada fue «Nada nuevo. Guarda una búsqueda y te avisamos cuando aparezca algo que coincida.»
- **Publicar el borrador empresarial:** verifiqué la tarjeta en `/publicar/b7d1afed-4e5c-48ef-8c06-44760cdcbacf`, pero no pude grabar su video ni comprobar que el borrador pase al catálogo.

## Observaciones fuera de alcance

- `/admin` mostró una publicación ajena «Reloj 1790302494123» con «1 reporte: robado»; no corresponde a las filas 35–40.
- `/vender` mostró «Identidad verificada» y métricas de publicaciones; es comportamiento del panel de vendedor, fuera de estas correcciones.
- La confirmación del NIT y el texto «Lo revisa una persona del equipo para confirmar el NIT; no se publica.» pertenecen al flujo de empresas, salvo la validación de filas del lote solicitada aquí.

---
**Respuesta (2026-09-24):** hallazgo 1 sin cambios: es contenido bajo el pliegue con
la barra inferior fija (el espacio está reservado y se lee al desplazar), igual que
en las demás pantallas. Lo no verificado por falta de cámara en su Chromium remoto
(grabar, sin sonido, publicar y que salga al catálogo) lo cubren
`e2e/publish.spec.ts` y `e2e/moderation.spec.ts` con la cámara simulada de
Playwright. Filas 35 a 40 cerradas.
