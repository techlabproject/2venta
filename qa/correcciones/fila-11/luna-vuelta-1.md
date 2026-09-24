# Informe de prueba — fila 11 de Catalina

**Veredicto: `NO PASA` — el flujo de aceptación, persistencia y consulta funciona, pero el borrador todavía tiene vacíos legales materiales y una autorización sensible prometida que no aparece en el flujo real de verificación.**

Probé en `http://localhost:3100`, sin reiniciar el servidor ni ejecutar pruebas del repositorio. La revisión legal es una observación de QA, no un concepto de abogado. Contrasté con [art. 13 del Decreto 1377 de 2013](https://www.cancilleria.gov.co/sites/default/files/Normograma/docs/decreto_1377_2013.htm), [arts. 6, 8, 12, 14 y 15 de la Ley 1581 de 2012](https://www.cancilleria.gov.co/sites/default/files/Normograma/docs/pdf/ley_1581_2012.pdf) y [arts. 47, 48 y 50–53 de la Ley 1480 de 2011](https://normograma.dian.gov.co/dian/compilacion/docs/ley_1480_2011.htm).

## Hallazgos

### 1. Alta — La política todavía no tiene la identidad ni los datos de contacto del responsable

- **Ancho:** 390 y 1280 px.
- **URL:** `http://localhost:3100/registro` y `http://localhost:3100/legal`.
- **Pasos:** abrir `http://localhost:3100/registro`; pulsar `Términos y la Política de datos`; leer `1. Quiénes somos`. Confirmé lo mismo en `http://localhost:3100/legal` sin JavaScript.
- **Esperado:** nombre/razón social, NIT, domicilio, dirección de notificaciones, correo y teléfono reales, y un responsable identificable para la política.
- **Visto, texto exacto:** `2venta es operada por [razón social — POR COMPLETAR], NIT [POR COMPLETAR], con domicilio en Bogotá, dirección de notificaciones [POR COMPLETAR], teléfono [POR COMPLETAR] y correo [POR COMPLETAR].` También: `Vigencia. Versión 1. Entra en vigencia el [fecha de aprobación — POR COMPLETAR].`
- **Defecto:** el aviso de borrador es claro, pero el documento no está listo para producir efectos como política publicada: faltan todos los datos que el art. 13 exige y la fecha de vigencia. Es coherente que estén marcados `POR COMPLETAR`, pero por eso la corrección no puede darse por cerrada.
- **Capturas:** [03-registro-390-panel-abierto.png](/private/tmp/claude-501/-Users-nicolasr2-Downloads-2venta/d950c930-0883-4b91-a711-8f99b14729c9/scratchpad/luna/fila-11/capturas/03-registro-390-panel-abierto.png), [18-legal-sin-javascript-1280.png](/private/tmp/claude-501/-Users-nicolasr2-Downloads-2venta/d950c930-0883-4b91-a711-8f99b14729c9/scratchpad/luna/fila-11/capturas/18-legal-sin-javascript-1280.png).

### 2. Alta — Retracto y reversión del pago no están descritos; solo quedaron como pendientes

- **Ancho:** 390 px en el panel y 1280 px en `/legal`.
- **URL:** `http://localhost:3100/registro` y `http://localhost:3100/legal`.
- **Pasos:** abrir el panel y saltar a `7. Reclamos, devoluciones y retracto`; leer la nota de revisión y la sección `5. Comprar y pago protegido`.
- **Esperado:** explicar cuándo procede el retracto, excepciones, cómo se ejerce, devolución y costos; además, explicar la reversión del pago, sus eventos y el trámite dentro del plazo legal.
- **Visto, texto exacto:** `El arrepentimiento, por sí solo, no da derecho a devolución en una venta entre particulares.`; `Para revisión legal: Derecho de retracto (art. 47 de la Ley 1480): en ventas a distancia es de 5 días hábiles cuando quien vende es un proveedor profesional. Definir si aplica a las tiendas con NIT y cómo se ofrece. Entre particulares, el Estatuto del Consumidor en principio no aplica. Verificar también los cambios de la Ley 2439 de 2024.`; y `Revisar también la reversión del pago del artículo 51.`
- **Defecto:** la nota reconoce la duda, pero el borrador no informa el procedimiento al consumidor. La Ley 1480 contempla la reversión para fraude, operación no solicitada, no recepción, producto distinto o defectuoso y exige actuación del consumidor dentro de cinco días hábiles; nada de eso aparece en el texto. Tampoco aparece el plazo de devolución actualizado ni el canal para ejercer el retracto. Observación de interpretación legal, no concepto jurídico.
- **Capturas:** [10-registro-390-final-panel-aceptar.png](/private/tmp/claude-501/-Users-nicolasr2-Downloads-2venta/d950c930-0883-4b91-a711-8f99b14729c9/scratchpad/luna/fila-11/capturas/10-registro-390-final-panel-aceptar.png), [18-legal-sin-javascript-1280.png](/private/tmp/claude-501/-Users-nicolasr2-Downloads-2venta/d950c930-0883-4b91-a711-8f99b14729c9/scratchpad/luna/fila-11/capturas/18-legal-sin-javascript-1280.png).

### 3. Alta — La regla para menores no implementa la verificación de edad ni la autorización parental

- **Ancho:** 390 px.
- **URL:** `http://localhost:3100/registro`.
- **Pasos:** abrir `http://localhost:3100/registro` y el panel; revisar `3. Tu cuenta` y `14. Tu autorización`. Observar también todos los campos del registro.
- **Esperado:** además de declarar la edad, el flujo debería contemplar medidas posibles para verificar la edad y, si un menor compra, dejar constancia de la autorización expresa de sus padres.
- **Visto, texto exacto:** `Para usar 2venta debes ser mayor de 18 años.` y `Al tocar «Aceptar» declaras que tienes 18 años o más, que leíste estos Términos y Condiciones y la Política de tratamiento de datos personales (versión 1), y autorizas de forma previa, expresa e informada a 2venta a tratar tus datos personales para las finalidades descritas aquí.` En la pantalla de registro solo vi `Nombre`, `Correo`, `Celular`, `Contraseña`, la casilla y `Continuar`; no vi edad, fecha de nacimiento ni flujo para autorización parental.
- **Defecto:** una declaración en términos no equivale por sí sola a la medida de verificación de edad ni cubre la autorización parental exigida por el art. 52 para una compra de un menor. La frase `No tratamos datos de menores de edad.` en la política tampoco resuelve la compra hecha por un menor.
- **Capturas:** [03-registro-390-panel-abierto.png](/private/tmp/claude-501/-Users-nicolasr2-Downloads-2venta/d950c930-0883-4b91-a711-8f99b14729c9/scratchpad/luna/fila-11/capturas/03-registro-390-panel-abierto.png), [11-registro-390-casilla-aceptada.png](/private/tmp/claude-501/-Users-nicolasr2-Downloads-2venta/d950c930-0883-4b91-a711-8f99b14729c9/scratchpad/luna/fila-11/capturas/11-registro-390-casilla-aceptada.png).

### 4. Alta — El texto promete autorización separada para biométricos, pero la pantalla real de KYC no la muestra

- **Ancho:** 390 px.
- **URL:** `http://localhost:3100/vender` y `http://localhost:3100/dev/kyc/ref_72782ce1-7b81-4196-bc55-9459271b05c3?u=8bdUWYHQIAuQwLDohqCZ4f5GqHIEJpLU`.
- **Pasos:** iniciar sesión con una cuenta verificada; ir a `http://localhost:3100/vender`; pulsar `Empezar verificación`.
- **Esperado:** antes de procesar cédula/selfie, una autorización explícita para datos sensibles, con carácter facultativo informado.
- **Visto, URL exacta:** `http://localhost:3100/dev/kyc/ref_72782ce1-7b81-4196-bc55-9459271b05c3?u=8bdUWYHQIAuQwLDohqCZ4f5GqHIEJpLU`.
- **Visto, texto exacto en el panel:** `La verificación de identidad de quien vende puede incluir una foto de tu rostro, que es un dato biométrico y por eso sensible. No es obligatorio entregarlo: solo se pide si quieres vender, y se te pedirá una autorización aparte en ese momento.` La nota siguiente dice: `agregar la autorización explícita de datos sensibles en la pantalla de verificación (art. 6 de la Ley 1581). Hoy esa pantalla no la tiene.`
- **Visto, texto exacto en KYC:** `1. Foto de tu cédula por ambos lados, sin reflejos. 2. Una selfie para confirmar que eres tú. 3. Listo. Nosotros no guardamos ni la cédula ni la selfie.` Solo aparecieron `Simular aprobación` y `Simular rechazo`; no apareció autorización, casilla ni texto de carácter facultativo.
- **Defecto:** el documento identifica correctamente que el rostro es biométrico, pero el flujo que efectivamente solicita cédula y selfie confirma que la autorización explícita todavía falta.
- **Captura:** [19-kyc-prueba-sin-autorizacion-sensible-390.png](/private/tmp/claude-501/-Users-nicolasr2-Downloads-2venta/d950c930-0883-4b91-a711-8f99b14729c9/scratchpad/luna/fila-11/capturas/19-kyc-prueba-sin-autorizacion-sensible-390.png).

### 5. Alta — El registro de vendedores no cumple todavía lo que el propio borrador identifica para un portal de contacto

- **Ancho:** 390 px.
- **URL:** `http://localhost:3100/registro`.
- **Pasos:** abrir el panel y saltar a `4. Vender`.
- **Esperado:** registro consultable por quien compró, con nombre/razón social, documento de identificación, dirección física de notificaciones y teléfono.
- **Visto, texto exacto:** `Artículo 53 de la Ley 1480: 2venta debe llevar un registro de cada vendedor con nombre o razón social, documento, dirección de notificaciones y teléfono, que el comprador puede consultar para presentar una queja. Hoy la aplicación no le pide dirección física al vendedor.`
- **Defecto:** el texto transparenta la carencia, pero sigue describiendo una condición que el producto aún no satisface. En la revisión del código, el registro de tienda guarda razón social y NIT; no encontré un campo de dirección física del vendedor en ese flujo.
- **Captura:** [20-legal-vender-390.png](/private/tmp/claude-501/-Users-nicolasr2-Downloads-2venta/d950c930-0883-4b91-a711-8f99b14729c9/scratchpad/luna/fila-11/capturas/20-legal-vender-390.png).

### 6. Media — PQR y política de datos tienen canales y período de conservación incompletos

- **Ancho:** 390 px.
- **URL:** `http://localhost:3100/registro` y `http://localhost:3100/legal`.
- **Pasos:** abrir el panel; leer `11. Peticiones, quejas y reclamos` y `13. Política de tratamiento de datos personales`.
- **Esperado:** canal real, responsable/área identificada, procedimiento completo de consulta/reclamo, período de vigencia de la base de datos y plazo de conservación.
- **Visto, texto exacto:** `Puedes presentar peticiones, quejas y reclamos desde tu pedido («Tengo un problema con el pedido») o al correo [POR COMPLETAR]. Cada radicación queda con fecha y hora y puedes seguirla.`; `El área que atiende las consultas y reclamos sobre datos personales se contacta en [correo — POR COMPLETAR].`; `Cómo ejercerlos. Escribe a [correo — POR COMPLETAR] diciendo quién eres y qué pides.`; y `Para revisión legal: Definir el plazo de conservación (art. 50 lit. e de la Ley 1480: «por el mismo tiempo que se deben guardar los documentos de comercio») y la fecha de entrada en vigencia de esta política.`
- **Defecto:** sí están los plazos de consultas y reclamos (`10 días hábiles + 5` y `15 días hábiles + 8`), pero faltan datos de contacto reales, el área identificada, el período de vigencia de la base y un procedimiento suficientemente concreto. El art. 13 del Decreto 1377 exige esos elementos.
- **Observación adicional:** `www.sic.gov.co` sí aparece como enlace en la sección 11, pero en `/legal` no está visible en la navegación ni en la parte superior; la propia nota reconoce: `falta ubicarlo en la navegación.`
- **Capturas:** [21-legal-pqr-390.png](/private/tmp/claude-501/-Users-nicolasr2-Downloads-2venta/d950c930-0883-4b91-a711-8f99b14729c9/scratchpad/luna/fila-11/capturas/21-legal-pqr-390.png), [22-legal-datos-390.png](/private/tmp/claude-501/-Users-nicolasr2-Downloads-2venta/d950c930-0883-4b91-a711-8f99b14729c9/scratchpad/luna/fila-11/capturas/22-legal-datos-390.png).

### 7. Media — “Cifrada” no describe con precisión cómo se guarda la contraseña

- **Ancho:** 390 px.
- **URL:** `http://localhost:3100/registro`.
- **Pasos:** abrir el panel y saltar a `13. Política de tratamiento de datos personales`.
- **Esperado:** que la afirmación de seguridad coincida con la implementación.
- **Visto, texto exacto:** `Registro: nombre, correo, celular, alias y contraseña (guardada cifrada, nunca en texto).` y `Las contraseñas y los códigos de verificación se guardan cifrados`.
- **Defecto:** en el código de autenticación, la contraseña se procesa mediante hash scrypt de Better Auth; los códigos OTP sí se cifran. “Cifrada” mezcla dos propiedades distintas en un texto legal/explicativo. Es una observación técnica de exactitud, no una afirmación de que la contraseña quede expuesta.
- **Captura:** [22-legal-datos-390.png](/private/tmp/claude-501/-Users-nicolasr2-Downloads-2venta/d950c930-0883-4b91-a711-8f99b14729c9/scratchpad/luna/fila-11/capturas/22-legal-datos-390.png).

### 8. Baja — Las notas para el abogado interrumpen la lectura del consentimiento en móvil

- **Ancho:** 390 px.
- **URL:** `http://localhost:3100/registro`.
- **Pasos:** abrir el panel desde `/registro` y desplazarse por las secciones.
- **Esperado:** aviso de versión y revisión legal visible, con lectura clara para una persona que se está registrando.
- **Visto, texto exacto:** se repite `Para revisión legal:` en cajas amarillas dentro del texto, junto con referencias como `Artículo 50, literal a...`, `art. 6 de la Ley 1581` y `art. 26 de la Ley 1581`.
- **Juicio:** el aviso superior `Versión 1 · Borrador en revisión legal. Este texto todavía no lo ha aprobado un abogado.` es visible y comprensible. El panel sí se lee, pero las notas ocupan una fracción importante de la pantalla y mezclan instrucciones internas con las reglas que la persona debe aceptar; distraen especialmente en 390 px. Lo dejo como observación de comprensión, no como fallo funcional.
- **Capturas:** [03-registro-390-panel-abierto.png](/private/tmp/claude-501/-Users-nicolasr2-Downloads-2venta/d950c930-0883-4b91-a711-8f99b14729c9/scratchpad/luna/fila-11/capturas/03-registro-390-panel-abierto.png), [10-registro-390-final-panel-aceptar.png](/private/tmp/claude-501/-Users-nicolasr2-Downloads-2venta/d950c930-0883-4b91-a711-8f99b14729c9/scratchpad/luna/fila-11/capturas/10-registro-390-final-panel-aceptar.png).

## Lo que verifiqué y pasa

- En 390 px, la casilla y el enlace muestran `Leí y acepto los Términos y la Política de datos (versión 1).`; ambos abren `http://localhost:3100/registro` en un panel con el encabezado exacto `Términos y política de datos`.
- El panel contiene las 14 secciones, el aviso exacto `Versión 1 · Borrador en revisión legal. Este texto todavía no lo ha aprobado un abogado.` y `Aceptar` solo al final. El índice lleva a cada sección dentro del panel: la URL permaneció en `/registro` y el `scrollTop` observado cambió en el contenedor interno del panel (6116 px al llegar a `14. Tu autorización`).
- X, Escape y tocar fuera en 1280 px cierran. Después de cerrar sin aceptar, la casilla permaneció desmarcada. Capturas: [05-registro-390-cierre-x.png](/private/tmp/claude-501/-Users-nicolasr2-Downloads-2venta/d950c930-0883-4b91-a711-8f99b14729c9/scratchpad/luna/fila-11/capturas/05-registro-390-cierre-x.png), [06-registro-390-cierre-escape.png](/private/tmp/claude-501/-Users-nicolasr2-Downloads-2venta/d950c930-0883-4b91-a711-8f99b14729c9/scratchpad/luna/fila-11/capturas/06-registro-390-cierre-escape.png), [09-registro-1280-toque-fuera.png](/private/tmp/claude-501/-Users-nicolasr2-Downloads-2venta/d950c930-0883-4b91-a711-8f99b14729c9/scratchpad/luna/fila-11/capturas/09-registro-1280-toque-fuera.png).
- Con datos válidos y sin aceptar, `Continuar` dejó el texto exacto `Para crear tu cuenta, lee y acepta los términos y la política de datos.`, volvió a abrir el panel y dejó la casilla desmarcada. URL: `http://localhost:3100/registro`. Captura: [07-registro-390-continuar-sin-aceptar.png](/private/tmp/claude-501/-Users-nicolasr2-Downloads-2venta/d950c930-0883-4b91-a711-8f99b14729c9/scratchpad/luna/fila-11/capturas/07-registro-390-continuar-sin-aceptar.png).
- Aceptar desde `14. Tu autorización` marcó la casilla y permitió el registro. La cuenta de prueba terminó en `http://localhost:3100/` tras confirmar el código SMS. Capturas: [10-registro-390-final-panel-aceptar.png](/private/tmp/claude-501/-Users-nicolasr2-Downloads-2venta/d950c930-0883-4b91-a711-8f99b14729c9/scratchpad/luna/fila-11/capturas/10-registro-390-final-panel-aceptar.png), [14-registro-completo-1280.png](/private/tmp/claude-501/-Users-nicolasr2-Downloads-2venta/d950c930-0883-4b91-a711-8f99b14729c9/scratchpad/luna/fila-11/capturas/14-registro-completo-1280.png).
- En base de datos, consulta de solo lectura con `node + pg` y `DATABASE_URL` de `.env.local`: la cuenta `luna11-ok-1790267741599@2venta.demo` quedó con `terms_version = "1"`, `terms_accepted_at = 2026-09-24T16:35:44.597Z` y `createdAt = 2026-09-24T16:35:44.597Z`.
- API, con URL `http://localhost:3100/api/auth/sign-up/email`: sin `termsVersion` y con `termsVersion: "99"` devolvió `400` y `{"code":"TERMS_REQUIRED","message":"Lee y acepta los términos y la política de datos para crear tu cuenta."}`. En `http://localhost:3100/api/auth/update-user` con `termsVersion: "99"` devolvió `400` y `{"code":"TERMS_READONLY","message":"La aceptación de los términos no se cambia desde aquí."}`.
- En `http://localhost:3100/cuenta` con Laura vi `Términos y datos personales` y el texto exacto `Tu cuenta es de antes de que existieran estos términos.`. El enlace abrió el panel sin botón `Aceptar`; solo mostró la constancia de lectura. Capturas: [15-cuenta-laura-390.png](/private/tmp/claude-501/-Users-nicolasr2-Downloads-2venta/d950c930-0883-4b91-a711-8f99b14729c9/scratchpad/luna/fila-11/capturas/15-cuenta-laura-390.png), [16-cuenta-laura-390-panel-solo-lectura.png](/private/tmp/claude-501/-Users-nicolasr2-Downloads-2venta/d950c930-0883-4b91-a711-8f99b14729c9/scratchpad/luna/fila-11/capturas/16-cuenta-laura-390-panel-solo-lectura.png).
- Las cuatro cuentas demo consultadas en la base (`camila`, `andres`, `laura`, `admin`) tienen `terms_version = NULL` y `terms_accepted_at = NULL`; la pantalla de Laura lo explica como cuenta anterior.
- Con JavaScript desactivado, `http://localhost:3100/legal` cargó la página completa, con título `Términos y política de datos · 2venta`, las 14 secciones y cero `<dialog>`. Captura: [18-legal-sin-javascript-1280.png](/private/tmp/claude-501/-Users-nicolasr2-Downloads-2venta/d950c930-0883-4b91-a711-8f99b14729c9/scratchpad/luna/fila-11/capturas/18-legal-sin-javascript-1280.png).
- En revisión de código, las promesas operativas del texto coinciden con las constantes/acciones: reclamo por no coincidencia `48 horas`, reclamo por no llegada `7 días`, liberación automática `7 días`, comisión `5%` con mínimo `$2.500` y máximo `$120.000`, destacado `$8.000` por `7 días`, precio mínimo `$10.000`, caducidad del pedido `30 minutos`, oferta `24 horas`, filtro de contactos del chat, video obligatorio y pedido de un vendedor. Esto fue contraste de código, no una compra real.

## Observaciones fuera de alcance

- No reporto otras filas; el flujo `/vender`/KYC se revisó únicamente porque la autorización de datos sensibles forma parte de esta corrección.

## NO VERIFICADO

- No ejecuté una compra real con un proveedor de pagos, entrega, retracto, reversión ni reembolso; por eso no afirmo que esos comportamientos funcionen, aunque sí contrasté las reglas visibles con el código.
- No abrí `Tu cuenta` en la interfaz para Camila, Andrés y admin; para esas tres cuentas solo hice la consulta de base de datos. Laura sí fue probada en navegador.
- No hubo revisión ni aval de abogado. El propio texto se presenta como `Borrador en revisión legal`.
- No probé impresión/descarga ni comparación carácter por carácter entre el contenido del panel y `/legal`; sí confirmé visualmente `/legal` sin JavaScript y las mismas 14 secciones.
