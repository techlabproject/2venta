# Informe de prueba — correcciones 24 y 25

**Veredicto: PASA CON OBSERVACIONES — las correcciones funcionan en publicar, editar y ofertar, incluida una oferta mínima aceptada que llega al checkout; queda una falla menor de edición con `Supr` sobre el punto de miles.**

## Hallazgos

1. **Severidad: media — `Supr` no atraviesa el separador automático de miles.**

   **Ancho:** 390 × 844.

   **URL:** `http://localhost:3100/producto/f5059f57-3d67-4eb8-95c6-c61f89f2eb20/editar`

   **Pasos exactos:** iniciar sesión como `camila@2venta.demo`; abrir la URL; escribir `260000` en `Precio` y comprobar que se ve `260.000`; pulsar `End`; pulsar `ArrowLeft` cuatro veces para dejar el cursor justo antes del punto de `260.000`; pulsar `Supr` una vez.

   **Esperaba:** que `Supr` ignorara el separador automático y borrara el dígito siguiente, o que el cursor avanzara de forma coherente. El gesto no debería parecer muerto.

   **Vi:** antes y después el campo siguió mostrando exactamente `260.000` y el cursor permaneció en la misma posición; no apareció ningún texto de error. Al mover el cursor un lugar a la derecha y pulsar `Supr`, sí quedó `26.000`. `Retroceso` en el separador sí produjo `26.000`, por lo que el comportamiento no es simétrico.

   **Capturas:** [antes y después de `Supr`](capturas/23-supr-antes-punto-390.png), [después de mover el cursor y repetir](capturas/24-supr-despues-punto-390.png).

## Lo que verifiqué y pasa

- En `http://localhost:3100/publicar`, `http://localhost:3100/producto/f5059f57-3d67-4eb8-95c6-c61f89f2eb20/editar` y el panel de oferta `http://localhost:3100/chat/0e02da14-6648-4d2e-adfd-9b4294beb944/oferta`, el campo es de texto con `inputmode="numeric"`, muestra `$` delante y `COP` detrás, y agrupa miles mientras se escribe. Lo comprobé en 390 y 1280 px.
- Al escribir letras, signos, espacios y centavos se conserva solo el monto entero; pegar `$ 1.250.000,00` deja `1.250.000`. Los valores enormes se limitan visualmente a `999.999.999`.
- Cero deja el campo vacío y `required` detiene el envío. Al salir o enviar `9.999`, el texto exacto observado fue `El mínimo es $10.000.`. `10.000` se acepta.
- En publicar, a 390 px, el texto exacto observado fue `Te llegan $ 7.500 después de la comisión de 2venta ($ 2.500). El comprador paga $ 10.000 más el envío.`; a 1280 px, con `200.000`, fue `Te llegan $ 190.000 después de la comisión de 2venta ($ 10.000). El comprador paga $ 200.000 más el envío.` [captura móvil](capturas/03b-publicar-minimo-te-llegan-390.png) · [captura escritorio](capturas/27-publicar-te-llegan-1280.png).
- Editar guardó exactamente lo mostrado: en `http://localhost:3100/producto/416cd4b2-9f02-414d-8012-766ecb5fb3ba/editar`, `1.250.000` llevó a la ficha `http://localhost:3100/producto/416cd4b2-9f02-414d-8012-766ecb5fb3ba`, donde se vio `$ 1.250.000`. [captura](capturas/07-editar-ropa-guardado-390.png)
- En oferta, a 390 px, `9.999` mostró `El mínimo es $10.000.` y no salió del panel `http://localhost:3100/chat/1b6761dd-236f-4690-b74f-bad89fdb21dd/oferta`. `10.000` se envió y apareció como `OFRECISTE $ 10.000`.
- La oferta de `$ 10.000` fue aceptada por la vendedora y mostró `Pagar $ 10.000`; la compradora llegó a `http://localhost:3100/comprar/5a718513-c2cd-4d7f-88c3-1292590ca21a?oferta=ea49922c-0b95-46e3-b26d-6475b2df5ed0`, con `Producto $ 10.000`, `Envío $ 12.000` y `Total $ 22.000`. [captura](capturas/20-oferta-aceptada-checkout-390.png)
- En el panel de oferta a 1280 px, `50.000` se mostró como `50.000` y volvió al chat como `OFRECISTE $ 50.000`. [captura](capturas/22-oferta-1280-enviada.png)
- Fila 25, ropa: en `http://localhost:3100/producto/f5059f57-3d67-4eb8-95c6-c61f89f2eb20/editar` se vio exactamente `La categoría (Ropa) no se cambia: eso alteraría la revisión que esta publicación ya pasó. Para eso hay que publicar de nuevo.`; no se vio `IMEI`, ni campo de categoría ni campo de IMEI. [captura](capturas/09-ropa-real-390.png)
- Fila 25, tecnología con IMEI: en `http://localhost:3100/producto/6ab8a9bb-e1e9-4edf-9c08-e45a21f8d52d/editar` se vio exactamente `La categoría (Tecnología) y el IMEI no se cambian: eso alteraría la revisión que esta publicación ya pasó. Para eso hay que publicar de nuevo.`; no hubo campo de categoría ni de IMEI. [captura](capturas/10-editar-iphone-imei-1280.png)
- Intenté añadir `imei=490154203237518` y `category=ropa` al formulario de edición desde el navegador. Después de guardar, la ficha siguió mostrando `Tecnología` e `IMEI validado`. [antes](capturas/25-iphone-editar-antes-tamper-1280.png) · [después](capturas/26-iphone-editar-despues-tamper-1280.png)
- Los textos `$`, `COP`, `Mínimo $10.000.`, `Te llegan…`, `El mínimo es $10.000.` y `Qué pasa si la acepta` fueron legibles y suficientemente cálidos en las pantallas observadas.

## Observaciones fuera de alcance

- El checkout mostró el flujo normal de envío, dirección y pago protegido; no evalué esas reglas de compra fuera de la comprobación de la oferta aceptada.
- La pantalla de publicar mostró que exige video y ofrece `Abrir cámara`; no evalué la grabación ni la subida del video.

## NO VERIFICADO

- No pude observar la apertura del teclado numérico del sistema: el Chromium remoto no muestra un teclado de celular; solo verifiqué `inputmode="numeric"` y que el campo queda visible al tocarlo a 390 px.
- No publiqué una ficha nueva para revisar su precio guardado, porque publicar exige grabar/subir un video. Sí verifiqué el guardado en editar y el precio acordado en oferta/checkout.
- No completé el pago después de `Ir a pagar`; verifiqué que una oferta mínima aceptada genera el enlace de pago y llega al checkout con el total correcto.
- No guardé el valor máximo `999.999.999` en una ficha; solo verifiqué que se muestra como tope en publicar, editar y oferta.
- El caso de `Supr` se ejecutó directamente en editar a 390 px; no lo repetí como acción de borrar en publicar y oferta.
