# Informe de verificación: alcance y cotización de confirmación celular

Fecha de revisión: 2026-09-24. Documento revisado: `docs/alcance/verificacion-celular.md`.

## Veredicto

**NO PASA.** El alcance funcional de la app está documentado con bastante fidelidad y responde las correcciones 9 y 50: cambiar la contraseña usa `/recuperar` y depende del mismo envío SMS. Sin embargo, la cotización contiene un precio AWS materialmente incorrecto, la tabla de Twilio mezcla mensajes con verificaciones exitosas y varias afirmaciones de proveedor/WhatsApp no quedaron verificadas en las fuentes indicadas. Para que Catalina pueda decidir el lanzamiento, hay que corregir esas cifras, distinguir los supuestos y agregar tiempos y riesgos de integración.

## Hallazgos

### 1. ALTA — precio AWS para Colombia incorrecto

**Texto exacto del documento:**

> **AWS End User Messaging** | ~$40 COP (US$0,01) + cargo del operador

**Evidencia:** la página oficial de AWS indica que el precio SMS depende del país y del operador, y su CSV oficial publica para Colombia una tarifa base de **US$0,05087 por SMS** (`CO, Colombia, All Networks, All number types, 0.05087`). En la misma página, **US$0,01** corresponde a SMS Protect en modo `Monitor` o `Filter`, no al SMS base. Fuentes: [AWS End User Messaging](https://aws.amazon.com/end-user-messaging/pricing/) y [CSV oficial de precios SMS de AWS](https://d1.awsstatic.com/onedam/marketing-channels/website/aws/en_US/business-applications/approved/documents/End-User-Messaging-SMS-Prices.ebc340b4d416d90832dd59629c4792b0deb6f8bc.csv).

**Lo correcto:** corregir a aproximadamente **US$0,05087 + cargos aplicables del operador**, es decir, unos **$203 COP** usando la tasa redondeada del documento de $4.000 COP/USD, o unos **$166 COP** usando la TRM del día. No debe presentarse como ~$40 COP.

### 2. ALTA — la tabla de Twilio usa la unidad equivocada

**Texto exacto del documento:**

> Supuesto: 1,3 mensajes por usuario nuevo (el registro, algún «no me llegó» y alguna recuperación de contraseña).

> 500 | 650 | $3.900 – $13.000 | ~$286.000

> 1.000 | 1.300 | $7.800 – $26.000 | ~$572.000

**Evidencia:** Twilio Verify publica **US$0,05 por verificación exitosa más la tarifa del canal**; no publica ese cargo como un costo por cada mensaje. Para SMS a Colombia, la página de Twilio publica **US$0,0592 por SMS saliente**, cobrado por segmento. Fuentes: [Twilio Verify](https://www.twilio.com/en-us/verify/pricing) y [Twilio SMS Colombia](https://www.twilio.com/en-us/sms/pricing/co).

**Lo correcto:** el valor de referencia de aproximadamente $440 COP es razonable solo para **una verificación exitosa con un SMS**, usando la tasa redondeada de $4.000: `(0,05 + 0,0592) × 4.000 ≈ $437`. Pero el documento define 1,3 como **mensajes**, no como verificaciones exitosas. Si se supone una verificación exitosa por usuario y 1,3 SMS por usuario, el cálculo con la propia tasa redondeada sería aproximadamente **$253.920** para 500 usuarios y **$507.840** para 1.000, antes de otros cargos. Alternativamente, si se quieren conservar $286.000 y $572.000, hay que decir que se presupuestan 650 y 1.300 verificaciones exitosas, no mensajes.

### 3. MEDIA — la tasa de cambio está presentada como si fuera la de la fecha

**Texto exacto del documento:**

> Tasa usada: 1 US$ ≈ $4.000 COP.

**Evidencia:** la TRM publicada por la [Superintendencia Financiera de Colombia](https://www.superfinanciera.gov.co/CargaDriver/) para el 24 de septiembre de 2026 es **$3.264,39 COP/USD**. $4.000 puede servir como supuesto redondeado y conservador, pero no es la tasa del día que el documento dice haber consultado.

**Lo correcto:** rotular $4.000 como “supuesto redondeado para presupuesto” o recalcular las conversiones con la TRM. Con la TRM del día, por ejemplo, Twilio Verify con un SMS sería aproximadamente **$356,67 COP**, y US$0,05087 de AWS aproximadamente **$166 COP**, antes de cargos adicionales.

### 4. MEDIA — rango local y condiciones de agregadores demasiado generalizados

**Texto exacto del documento:**

> **$6 a $20 COP**, IVA incluido | En pesos; certificados ante la CRC; todos los operadores (Claro, Movistar, Tigo, WOM…); API para mensajes transaccionales con ruta prioritaria; el saldo no vence

**Evidencia:**

- [Hablame](https://www.hablame.co/sms/) publica SMS desde **$6 COP**, IVA incluido, compra mínima de $50.000, saldo sin vencimiento, API, prioridad para mensajes importantes/transaccionales y cobertura de varios operadores. Su lista visible menciona Claro, Movistar, Tigo, Avantel, ETB y operadores virtuales, pero no vi WOM nombrado.
- [Inalambria Express](https://www.inalambria.express/post/cuanto-cuesta-enviar-sms-masivos-en-colombia) publica paquetes de **$19,99 COP por SMS**, IVA incluido, y dice que puede bajar hasta **$6 + IVA** mediante convenios corporativos o altos volúmenes. Por tanto, el extremo de $6 no es IVA incluido en esa condición.
- [Onurix](https://www.onurix.com/) muestra **$5,79 + IVA** por SMS en una sección y, en otra, paquetes desde $42.000 y precios con IVA incluido. También afirma API, saldo sin caducidad y cobertura de todos los operadores. La propia página presenta condiciones de precio inconsistentes.

**Lo correcto:** cotizar por proveedor y con condiciones explícitas: precio de lista, volumen mínimo, IVA, cargos de ruta/entrega, cobertura real incluyendo WOM, API y SLA. El rango $6–$20 puede usarse como estimación preliminar, pero no como tarifa uniforme “IVA incluido” de los tres. No encontré en esas páginas la afirmación “certificados ante la CRC”.

### 5. MEDIA — WhatsApp no quedó verificable con la fuente indicada

**Texto exacto del documento:**

> WhatsApp (API de Meta, plantilla de autenticación) | **~$3 COP** (US$0,0008) | Lo más barato; la gente ya lo usa | Exige que la persona tenga WhatsApp; verificación del negocio ante Meta y plantilla aprobada; no reemplaza al SMS, lo complementa

**Evidencia:** la URL oficial de Meta indicada en el documento devolvió un error interno al abrirla. La página oficial de AWS confirma que autenticación es una categoría de mensaje de WhatsApp y que el cargo de Meta cambia por país y tipo, pero no permite confirmar allí el valor colombiano de US$0,0008 ni las condiciones de aprobación del negocio/plantilla.

**Lo correcto:** conservar esta opción como decisión de segunda etapa, pero marcar precio y requisitos como **NO VERIFICADO** hasta obtener la rate card de Meta y confirmar el onboarding del negocio. Con la tasa redondeada del documento, US$0,0008 sí daría $3,20 COP; eso es solo la conversión, no una verificación de la tarifa.

### 6. BAJA — la integración ya tiene la variable de configuración declarada

**Texto exacto del documento:**

> clave de API como variable de entorno, agregada a `REQUIREMENTS` en `src/lib/config.ts` (si falta, la app no arranca).

**Evidencia:** `src/lib/config.ts:94-97` ya declara `SMS_PROVIDER_TOKEN` como requisito obligatorio en producción, y `src/lib/boot.ts:11-15` termina el proceso si faltan requisitos.

**Lo correcto:** documentar que hay que **configurar** el requisito existente y conectar el token a la implementación del proveedor. No hace falta agregar otra entrada a `REQUIREMENTS`, salvo que el proveedor requiera variables adicionales.

### 7. OBSERVACIÓN — faltan tiempos y riesgos para decidir el lanzamiento

**Texto exacto del documento:**

> Qué hay que hacer para conectarlo

> Contrato y cuenta con el agregador; clave de API como variable de entorno...

> Cambiar solo `sendVerificationCode` en `src/lib/sms.ts`.

**Evidencia:** el documento enumera tareas, pero no da una estimación de integración, aprobación de remitente/plantillas, pruebas de entrega por operador, revisión de límites, plan de reversa ni responsable. Sí identifica correctamente que falta alarma de gasto y que no existe un límite global diario.

**Lo correcto:** agregar para cada proveedor el tiempo de alta y aprobación, esfuerzo de integración/pruebas, dependencia de soporte, SLA de entrega, tratamiento de fallos y reintentos, monitoreo de costo/entrega, límite global antiabuso y criterio para elegir al proveedor. No invento tiempos: no están en las fuentes ni en el código revisado.

## Lo que verifiqué y es correcto

### Código y aplicación

- En `src/app/cuenta/page.tsx:125-131`, el enlace visible **“Cambiar tu contraseña”** apunta a `/recuperar`. Lo confirmé en el navegador con `laura@2venta.demo`: la página `/cuenta` mostró el enlace y el clic abrió `/recuperar`.
- En `src/features/auth/recovery.ts:7-13,37-49`, la recuperación consulta el celular confirmado, genera el código, lo cifra, lo guarda en `recovery_codes` por 10 minutos y llama a `sendVerificationCode`. En el navegador, al solicitar el código a Laura apareció el formulario de código; la base mostró un registro vigente, cifrado y disponible con aproximadamente 509 segundos restantes.
- La recuperación no revela si el celular existe: con un número confirmado y con un número no registrado, la UI mostró exactamente **“Si ese celular tiene una cuenta, le mandamos un código.”**. Esto coincide con `src/features/auth/recovery.ts:18-20,32-56` y `src/features/auth/RecoveryForm.tsx:61-68`.
- Los códigos son de seis dígitos, se cifran con AES-GCM y el registro de confirmación usa 5 minutos: `src/features/auth/otp.ts:18-20,34-38`. La consulta del registro creado para la cuenta nueva mostró código vigente con aproximadamente 276 segundos restantes, consistente con 5 minutos.
- El límite de intentos sí es de 5: `src/features/auth/otp.ts:19` y `src/features/auth/actions.ts:81-97`. Con una cuenta nueva, cinco códigos erróneos mostraron sucesivamente 4, 3, 2 y 1 intentos restantes; el quinto terminó en **“Demasiados intentos. Pide un código nuevo.”**.
- El límite de envíos sí es de 5 por celular en una hora: `src/lib/otp-rate-limit.ts:4,13-26`. Con la misma cuenta nueva —no con Laura— el registro inicial más cuatro reenvíos fueron aceptados; el sexto intento mostró **“Pediste demasiados códigos. Espera una hora y vuelve a intentar.”**. La base confirmó cinco filas de `otp_sends` para ese número dentro de la prueba.
- `src/lib/sms.ts:17-23` es el punto de salida común y en desarrollo escribe el código en el log. En producción lanza **“No hay proveedor de SMS configurado...”**. Los dos tests de `src/lib/sms.test.ts` pasaron: producción rechaza y desarrollo escribe en el registro.
- El flujo de Google sí contempla el celular faltante: `src/features/auth/GoogleButton.tsx:8-10,31-34`, `src/features/auth/PhoneForm.tsx:12-16,61-70` y `src/app/(auth)/verificar/page.tsx:25-35` mandan a pedir y confirmar el número antes de comprar/escribir/publicar. No hice OAuth real porque no era necesario para confirmar el comportamiento que ya está explícito en código.

### Cálculos que sí están bien hechos

- La aritmética local de la tabla es correcta: 650 mensajes × $6–$20 = $3.900–$13.000; 1.300 mensajes × $6–$20 = $7.800–$26.000.
- La compra mínima de Hablame de unos $50.000 y el saldo sin vencimiento están publicados por Hablame. A los consumos locales de la tabla, una recarga de $50.000 cubre varios meses, aunque la duración depende del precio y volumen contratados.
- La referencia unitaria de Twilio de aproximadamente $440 es coherente con **US$0,05 + US$0,0592** usando la tasa redondeada de $4.000. El error está en reutilizarla como multiplicador de todos los mensajes de la tabla.
- La decisión del dueño quedó reflejada: agregador colombiano en el lanzamiento, WhatsApp en segunda etapa con SMS de respaldo, y la tabla cotiza solo el escenario de arranque.

## NO VERIFICADO

- Tarifa oficial de Meta para autenticación de WhatsApp en Colombia de US$0,0008, verificación del negocio y aprobación de plantilla: la URL entregada devolvió error interno.
- “Certificados ante la CRC”, cobertura de WOM para el agregador elegido y cualquier SLA de entrega en segundos.
- Que el plan actual de AWS esté en modo de prueba/gratuito con las restricciones descritas, y que la condición “misma nube y misma factura” sea relevante para esta cuenta.
- Cargo exacto de operador de AWS para el número/ruta que se contrataría.
- Tiempos de alta, aprobación, soporte e integración de cada proveedor; el documento no los informa y las páginas consultadas no permiten estimarlos para 2venta.
- Cotización final: las páginas de Hablame, Inalambria y Onurix advierten que volumen, condiciones comerciales, IVA o ruta pueden cambiar el precio.
- No se ejecutó el último paso de cambio de contraseña: verificar el código y guardar una contraseña habría alterado una credencial y no era necesario para comprobar que el código se solicita y llega al flujo. El código fuente sí confirma que una verificación exitosa cambia la contraseña y cierra las sesiones (`src/features/auth/recovery.ts:106-124`).

## Fuentes consultadas

- [Hablame SMS](https://www.hablame.co/sms/)
- [Inalambria Express: tarifas SMS en Colombia](https://www.inalambria.express/post/cuanto-cuesta-enviar-sms-masivos-en-colombia)
- [Onurix](https://www.onurix.com/)
- [Twilio SMS Colombia](https://www.twilio.com/en-us/sms/pricing/co)
- [Twilio Verify](https://www.twilio.com/en-us/verify/pricing)
- [AWS End User Messaging](https://aws.amazon.com/end-user-messaging/pricing/)
- [WhatsApp Business Platform pricing de Meta](https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing)
- [TRM de la Superintendencia Financiera](https://www.superfinanciera.gov.co/CargaDriver/)
