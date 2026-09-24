# Informe de prueba — tercera vuelta, fila 11 de Catalina

**Veredicto: `PASA` — los cuatro cambios solicitados funcionan en 390 y 1280 px; la sección 7 coincide con el art. 47 vigente en plazo, procedimiento y excepciones, y la API distingue correctamente fechas inválidas, menores, ausencia de fecha y cambios bloqueados.**

Probé `http://localhost:3100` el 24 de septiembre de 2026, en Chromium real, con contextos nuevos por escenario y anchos de 390 y 1280 px. No reinicié el servidor ni ejecuté pruebas del repositorio. La revisión legal es una observación de QA, no un concepto de abogado.

## Hallazgos

No hay hallazgos en esta vuelta.

## Lo que verificaste y pasa

- **Sección 7 en ambos anchos:** en `http://localhost:3100/registro`, abrí el panel y el índice `7. Reclamos, devoluciones y retracto`. Vi exactamente: `el dinero se te reintegra completo, sin descuentos, en máximo 15 días calendario desde que ejerces el derecho y devuelves el artículo.` También vi: `No aplica a bienes de uso personal, perecederos, hechos a tu medida o que por su naturaleza no se puedan devolver o se deterioren rápido. Las demás excepciones de la ley (servicios ya empezados, precios atados al mercado financiero, apuestas y loterías) no corresponden a lo que se vende en 2venta.` El procedimiento visible conserva los `5 días hábiles`, la solicitud desde `«Tengo un problema con el pedido»`, la devolución en las mismas condiciones y el transporte a cargo del comprador. Capturas: [sección 7 en 390](/private/tmp/claude-501/-Users-nicolasr2-Downloads-2venta/d950c930-0883-4b91-a711-8f99b14729c9/scratchpad/luna/fila-11/capturas/3-panel-390-seccion-7.png) y [sección 7 en 1280](/private/tmp/claude-501/-Users-nicolasr2-Downloads-2venta/d950c930-0883-4b91-a711-8f99b14729c9/scratchpad/luna/fila-11/capturas/3-panel-1280-seccion-7.png).
- **Comparación legal de la sección 7:** el texto cubre las siete excepciones del art. 47: servicios iniciados; precios sujetos a fluctuaciones financieras; bienes personalizados; bienes que no puedan devolverse o se deterioren/caduquen; apuestas y loterías; perecederos; y bienes de uso personal. Las tres primeras categorías que no corresponden al catálogo de 2venta están identificadas como tales. El reintegro de máximo 15 días desde el ejercicio y la devolución del artículo coincide con el texto vigente del [art. 47 de la Ley 1480, modificado por la Ley 2439 de 2024](https://normograma.dian.gov.co/dian/compilacion/docs/ley_1480_2011.htm#articulo_47). No encontré una discrepancia nueva en esta releída.
- **Panel responsive y cierre tocando fuera:** en 390 px el panel quedó entre `left: 40.08` y `right: 390.08`, con ancho `350 px`, dejando una franja real del fondo a la izquierda. En 1280 px quedó entre `left: 608.15` y `right: 1280.15`, con ancho `672 px`. Toqué en `x=10, y=420` en ambos anchos: `dialog.open` pasó de `true` a `false` y la URL permaneció `http://localhost:3100/registro`. Capturas: [franja en 390](/private/tmp/claude-501/-Users-nicolasr2-Downloads-2venta/d950c930-0883-4b91-a711-8f99b14729c9/scratchpad/luna/fila-11/capturas/3-panel-390-franja.png) y [panel en 1280](/private/tmp/claude-501/-Users-nicolasr2-Downloads-2venta/d950c930-0883-4b91-a711-8f99b14729c9/scratchpad/luna/fila-11/capturas/3-panel-1280-franja.png).
- **API de registro, en 390 y 1280 px:** `POST http://localhost:3100/api/auth/sign-up/email` devolvió HTTP `400` con `{"code":"BIRTHDATE_REQUIRED","message":"Escribe tu fecha de nacimiento."}` sin `birthDate`; con `birthDate: "2010-01-01"` devolvió `{"code":"UNDERAGE","message":"Para usar 2venta debes tener 18 años o más."}`; con `birthDate: "2026-09-25"` devolvió `{"code":"INVALID_BIRTHDATE","message":"Esa fecha no parece real. Revísala."}`; y con `birthDate: "2025-02-31"` devolvió la misma respuesta `INVALID_BIRTHDATE`.
- **API de actualización, en 390 y 1280 px:** con sesión real, `POST http://localhost:3100/api/auth/update-user` y `{"birthDate":"2000-01-01"}` devolvió HTTP `400`, `{"code":"BIRTHDATE_READONLY","message":"La fecha de nacimiento no se cambia desde aquí."}`. El mismo endpoint con `{"termsVersion":"2"}` devolvió HTTP `400`, `{"code":"TERMS_READONLY","message":"La aceptación de los términos no se cambia desde aquí."}`. La separación de códigos quedó comprobada.

## Observaciones fuera de alcance

- No revisé nuevamente otras filas ni la dirección física del vendedor de la fila 15.
- No hice una compra, devolución o retracto real; la comprobación legal de esta vuelta fue sobre el texto visible y su correspondencia con el art. 47.

## NO VERIFICADO

- No verifiqué el cumplimiento operativo de un reembolso real en 15 días con un proveedor de pagos.
- No obtuve un concepto o aval de abogado; el texto continúa siendo un borrador en revisión legal.
