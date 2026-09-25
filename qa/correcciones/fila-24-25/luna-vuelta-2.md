# Informe de prueba — segunda vuelta, correcciones 24 y 25

**Veredicto: PASA — el hallazgo anterior de `Supr` quedó corregido en las tres superficies de precio y en el celular del registro; no encontré regresiones reproducibles en los borrados probados.**

## Hallazgos

Ninguno reproducible en esta vuelta.

El hallazgo anterior se volvió a ejecutar con `260|.000` y `Supr` en:

- Editar: `http://localhost:3100/producto/f5059f57-3d67-4eb8-95c6-c61f89f2eb20/editar`
- Publicar: `http://localhost:3100/publicar`
- Oferta: `http://localhost:3100/chat/018d239d-c059-43ba-8da0-f00b028e499a/oferta`

En los tres lugares, a 390 y 1280 px, el valor pasó de `260.000` a `26.000` y el cursor quedó en la posición 4, después de los mismos tres dígitos. [Editar 390](capturas/v2-editar-390-supr-separador.png) · [Editar 1280](capturas/v2-editar-1280-supr-separador.png) · [Publicar 390](capturas/v2-publicar-390-supr-separador.png) · [Publicar 1280](capturas/v2-publicar-1280-supr-separador.png) · [Oferta 390](capturas/v2-oferta-390-supr-separador.png) · [Oferta 1280](capturas/v2-oferta-1280-supr-separador.png)

## Lo que verifiqué y pasa

- En precio, `Retroceso` y `Supr` al principio, al final y en medio conservaron el resultado esperado: al inicio `Retroceso` no cambió `260.000`, `Supr` dejó `60.000`; al final `Retroceso` dejó `26.000`, `Supr` no cambió el valor; en medio `Supr` dejó `26.000`.
- Una selección de varios caracteres que incluía un separador dejó `2.600` tanto con `Retroceso` como con `Supr`, con el cursor después de los mismos dígitos seleccionados. Esto pasó en editar, publicar y oferta, a 390 y 1280 px.
- En `/registro?rol=comprador`, a 390 px, `300| 412 8805` + `Supr` dejó `300 128 805` y el cursor quedó antes del espacio, después de `300`. [captura](capturas/v2-registro-celular-supr-390.png)
- En el celular, `Retroceso` junto al espacio dejó `304 128 805`; al inicio `Retroceso` no cambió el valor y `Supr` dejó `004 128 805`; al final `Retroceso` dejó `300 412 880` y `Supr` no cambió el valor. Una selección de `412` dejó `300 880 5`.
- En el correo de registro, `Supr` al inicio dejó `na@example.com`; `Retroceso` al final dejó `ana@example.co`; `Supr` en medio dejó `ana@xample.com`; seleccionar `example` y borrar con cualquiera de las dos teclas dejó `ana@.com`. [captura](capturas/v2-registro-correo-390.png)
- Llegué a `http://localhost:3100/verificar?rol=comprador` sin confirmar la cuenta. En el campo `Código de seis dígitos`, `Supr` en medio de `482913` dejó `48213`; `Retroceso` en el mismo punto dejó `48913`; al inicio `Retroceso` no cambió el código y `Supr` dejó `82913`; al final `Retroceso` dejó `48291` y `Supr` no cambió el código; una selección de `82` dejó `4913` con ambas teclas. [captura](capturas/v2-verificar-codigo-regresiones-390.png)
- Los campos de precio siguieron mostrando `$` y `COP`, agrupando miles, en publicar, editar y oferta a ambos anchos. El teclado numérico siguió indicado mediante `inputmode="numeric"`.

## Observaciones fuera de alcance

- Esta vuelta se concentró en el borrado y el cursor; no repetí guardados de precio, publicación completa ni aceptación/pago de ofertas.
- Se generaron cuentas temporales de registro y se dejaron sin confirmar, como se pidió.

## NO VERIFICADO

- No pude observar el teclado numérico nativo del sistema: el Chromium remoto no muestra el teclado del celular.
- No verifiqué visualmente la posición física del cursor en el correo: Chromium expone `selectionStart`/`selectionEnd` como `null` para el `input type="email"`; sí verifiqué los valores resultantes de cada borrado.
- No repetí el guardado del precio en la ficha ni el flujo completo de pago en esta segunda vuelta.
