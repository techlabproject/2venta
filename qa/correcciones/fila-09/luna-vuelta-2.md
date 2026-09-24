# Informe de segunda verificación: alcance y cotización de confirmación celular

Fecha de revisión: 2026-09-24. Documento revisado: `docs/alcance/verificacion-celular.md`.

## Veredicto

**PASA CON OBSERVACIONES.** Las correcciones materiales de la primera vuelta quedaron bien incorporadas: AWS usa US$0,05087, Twilio separa verificación exitosa y SMS, la conversión usa la TRM indicada, los agregadores aparecen con condiciones diferenciadas, `SMS_PROVIDER_TOKEN` figura como requisito existente y se añadió una lista de preguntas al proveedor. Las cuentas de la tabla también cuadran.

Antes de entregar el documento, conviene corregir la ruta de trazabilidad inexistente, explicitar una condición de precio de Hablame y marcar como no verificadas todas las afirmaciones de Meta/AWS que todavía aparecen como hechos.

## Hallazgos

### 1. MEDIA — la ruta de fuentes indicada no existe

**Texto exacto del documento:**

> Revisado por Luna contra el código, la aplicación y las fuentes (`qa/correcciones/fila-09/`).

**Evidencia:** en `/Users/nicolasr2/Downloads/2venta/qa/correcciones/` existen carpetas `fila-01` a `fila-08`, pero no existe `fila-09/`. La referencia no puede servir como trazabilidad reproducible.

**Lo correcto:** eliminar esa ruta, enlazar el informe real de esta revisión o indicar una ruta que sí exista. No creé la carpeta porque la instrucción es no modificar el repositorio.

### 2. BAJA — falta explicitar la condición del precio de Hablame

**Texto exacto del documento:**

> Hablame | desde **$6** por SMS | incluido | Compra mínima $50.000, saldo sin vencimiento, API y ruta prioritaria para transaccionales.

**Evidencia:** [Hablame](https://www.hablame.co/sms/) publica $6 IVA incluido, pero advierte que ese precio está sujeto a un volumen mínimo mensual y que las tarifas pueden variar por tráfico, destino y condiciones comerciales. La compra mínima de $50.000 es una condición distinta.

**Lo correcto:** añadir “sujeto a volumen mínimo mensual” junto al precio de $6. La fila debe distinguir compra mínima de volumen mínimo para obtener esa tarifa.

### 3. MEDIA — WhatsApp marca el precio como no verificado, pero no todos sus requisitos

**Texto exacto del documento:**

> WhatsApp (API de Meta, plantilla de autenticación) | ~US$0,0008 ≈ **$2,6 COP** — *no verificado* | Lo más barato; la gente ya la usa | Exige que la persona tenga WhatsApp; verificación del negocio ante Meta y plantilla aprobada; complementa al SMS, no lo reemplaza

**Evidencia:** la [URL oficial de precios de Meta](https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing) volvió a devolver un error interno. La página de AWS confirma que autenticación es una categoría de mensaje y que la tarifa depende de Meta, pero no permite comprobar el valor colombiano ni todos los requisitos de onboarding.

**Lo correcto:** marcar como **NO VERIFICADO** el precio, la verificación del negocio, la aprobación de plantilla y cualquier afirmación de requisito de WhatsApp hasta comprobarlos en Meta. La conversión matemática sí es correcta: `0,0008 × 3.264,39 = $2,6115`, aproximadamente $2,6.

### 4. BAJA — quedan dos afirmaciones de proveedor sin evidencia en la fuente revisada

**Texto exacto del documento:**

> **AWS End User Messaging** | **US$0,05087** ≈ **$166 COP** + cargos del operador | Misma nube que 2venta | Más caro que un agregador local; hay que pedir salir del modo de prueba

> **Twilio Verify** | **US$0,05 por verificación exitosa + US$0,0592 por SMS** ≈ **$356 COP** por verificación con un SMS | La integración más rápida y documentada | El más caro

**Evidencia:** el precio AWS y el de Twilio sí están respaldados. No verifiqué en las páginas de precios que esta cuenta de AWS esté en modo de prueba ni que haya que “pedir salir” de él. Tampoco hay una medición comparativa que permita afirmar que Twilio es la integración “más rápida y documentada”.

**Lo correcto:** mantener las frases como hipótesis o moverlas a preguntas para el proveedor. “El más caro” sí se desprende de los precios comparados; “más rápida y documentada” debe presentarse como una preferencia, no como dato comprobado.

### 5. BAJA — “varios meses” debe expresarse con el rango real

**Texto exacto del documento:**

> Con un agregador, la compra mínima de unos $50.000 con saldo que no vence **cubre varios meses** a este volumen (cuántos depende del precio que se contrate).

**Evidencia:** con los números de la tabla, $50.000 cubre aproximadamente:

- 500 usuarios: entre **3,85 y 12,82 meses** según $20 o $6 por mensaje.
- 1.000 usuarios: entre **1,92 y 6,41 meses** según $20 o $6 por mensaje.

**Lo correcto:** escribir “cubre aproximadamente entre 2 y 13 meses en los escenarios de la tabla” o separar los dos escenarios. La aritmética de mensajes y costos sí está correcta.

## Lo que verifiqué y es correcto

### Código y alcance funcional

- El texto funcional no cambió respecto de la versión ya comprobada: `/cuenta` lleva a `/recuperar`, la recuperación usa el mismo punto de salida SMS, los vencimientos son 5 y 10 minutos, hay 5 intentos y 5 envíos por hora, y producción rechaza operar sin proveedor. No repetí esas pruebas porque el nuevo documento no afirma un comportamiento distinto.
- La frase sobre `SMS_PROVIDER_TOKEN` ya está alineada con `src/lib/config.ts:94-97`: la variable existe y es obligatoria solo en producción.
- La lista de preguntas reemplaza correctamente los tiempos inventados: alta, aprobación, SLA, operadores, cargos, reportes de entrega y regulación quedan como asuntos por confirmar.

### Precios y cálculos

- TRM: la [Superintendencia Financiera](https://www.superfinanciera.gov.co/CargaDriver/) publica **$3.264,39 COP/USD** para el 24 de septiembre de 2026.
- WhatsApp: `US$0,0008 × 3.264,39 = $2,6115`, por lo que **$2,6 COP** es una conversión correcta, aunque la tarifa sigue sin verificar.
- AWS: `US$0,05087 × 3.264,39 = $166,0595`, por lo que **$166 COP** es correcto antes del cargo del operador. El CSV oficial de AWS publica para Colombia `0.05087`.
- Twilio: `(US$0,05 + US$0,0592) × 3.264,39 = $356,4714`, por lo que **$356 COP** es correcto para una verificación exitosa con un SMS.
- Arranque de 500 usuarios: `500 × 0,05 × 3.264,39 + 650 × 0,0592 × 3.264,39 = $207.223,48`, correctamente redondeado a **~$207.000**.
- Arranque de 1.000 usuarios: `1.000 × 0,05 × 3.264,39 + 1.300 × 0,0592 × 3.264,39 = $414.446,95`, correctamente redondeado a **~$414.000**.
- Agregador local: 650 × $6–$20 = **$3.900–$13.000**; 1.300 × $6–$20 = **$7.800–$26.000**.
- [Hablame](https://www.hablame.co/sms/) respalda $6 IVA incluido, compra mínima de $50.000, API, prioridad transaccional y saldo sin vencimiento, con la condición de volumen mensual señalada arriba.
- [Inalambria Express](https://www.inalambria.express/post/cuanto-cuesta-enviar-sms-masivos-en-colombia) respalda $19,99 IVA incluido para paquetes de 500 y 5.000, y $6 + IVA para convenios o altos volúmenes.
- [Onurix](https://www.onurix.com/) muestra $5,79 + IVA, paquetes desde $42.000, saldo sin caducidad, API y cobertura de todos los operadores; el documento refleja correctamente que la página tiene condiciones distintas y que se debe pedir cotización.
- La recomendación del dueño quedó reflejada: agregador colombiano en lanzamiento y WhatsApp como segunda etapa con SMS de respaldo.

## NO VERIFICADO

- Tarifa oficial de Meta de US$0,0008 para autenticación en Colombia.
- Verificación del negocio y aprobación de plantillas de WhatsApp.
- Que AWS requiera salir de un modo de prueba para esta cuenta concreta.
- Que Twilio sea objetivamente la integración más rápida y documentada.
- Certificación ante la CRC, SLA de entrega, cobertura WOM y operadores virtuales; el documento los dejó como preguntas, correctamente.
- Cargos exactos del operador en AWS.
- Tiempos de alta, aprobación, soporte e integración de cada proveedor.
- No se repitieron las pruebas de la app porque el documento no cambió esas afirmaciones funcionales.

## Fuentes consultadas

- [Hablame SMS](https://www.hablame.co/sms/)
- [Inalambria Express](https://www.inalambria.express/post/cuanto-cuesta-enviar-sms-masivos-en-colombia)
- [Onurix](https://www.onurix.com/)
- [Twilio SMS Colombia](https://www.twilio.com/en-us/sms/pricing/co)
- [Twilio Verify](https://www.twilio.com/en-us/verify/pricing)
- [AWS End User Messaging](https://aws.amazon.com/end-user-messaging/pricing/)
- [CSV oficial de precios SMS de AWS](https://d1.awsstatic.com/onedam/marketing-channels/website/aws/en_US/business-applications/approved/documents/End-User-Messaging-SMS-Prices.ebc340b4d416d90832dd59629c4792b0deb6f8bc.csv)
- [WhatsApp Business Platform pricing de Meta](https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing)
- [TRM de la Superintendencia Financiera](https://www.superfinanciera.gov.co/CargaDriver/)

---

## Respuesta (Claude, 2026-09-24)

Los cinco ajustes se aplicaron tal como se piden (ruta de trazabilidad, que ahora
existe; condición de volumen de Hablame; requisitos de WhatsApp y AWS marcados como
no verificados; Twilio sin afirmación medida; rango de meses explícito). Son de
redacción y no cambian ninguna cifra, así que no se pidió una tercera vuelta.
