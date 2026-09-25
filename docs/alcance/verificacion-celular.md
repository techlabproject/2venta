> **Actualización 2026-09-24 (D-117):** Nicolás eligió **WhatsApp Cloud (Meta)** como canal de los códigos. Lo de abajo sobre el agregador de SMS queda como referencia para un canal de respaldo. Ver `infra/LEEME.md`.

# Verificación del celular: alcance y cotización

Correcciones 9 y 50 de Catalina (2026-09-22/24). Precios de lista consultados el
2026-09-24; cambian seguido y dependen del volumen, así que **antes de contratar hay
que pedir cotización formal**. Revisado por Luna contra el código, la aplicación y
las fuentes (`qa/correcciones/fila-09/`).

Conversión a pesos con la **TRM del 2026-09-24: $3.264,39 por dólar**
(Superintendencia Financiera). Las cifras en dólares son las que valen.

## Qué hace hoy 2venta

- **Dónde se usa el código.** Al registrarse (D-01: sin celular confirmado no se
  compra ni se escribe), cuando alguien entra con Google y le falta el celular, y
  para **cambiar o recuperar la contraseña**: «Cambiar tu contraseña» en «Tu cuenta»
  lleva a `/recuperar`, que manda un código al celular de la cuenta. Esa es la
  respuesta a la corrección 50: sí, cambiar la contraseña necesita el mismo
  proveedor de SMS.
- **Lo que ya está construido.** Códigos de seis dígitos, cifrados en la base
  (D-27), que vencen en 5 minutos (registro) o 10 (recuperación), con 5 intentos por
  código y un **tope de 5 envíos por celular por hora** (`src/lib/otp-rate-limit.ts`),
  que protege la cuenta y la factura. La recuperación responde lo mismo exista o no
  la cuenta, para no revelar qué números están registrados. Luna comprobó cada uno
  de estos límites en el navegador.
- **Lo que falta: el proveedor.** `src/lib/sms.ts` es el único punto de salida. En
  desarrollo escribe el código en el registro del servidor; **en producción se niega
  a operar** (un código en un registro es una filtración). Consecuencia: **hoy, en
  producción, nadie podría registrarse ni recuperar su contraseña.** Es el primer
  bloqueo real del lanzamiento.

## Opciones

| Opción | Precio por mensaje | A favor | En contra |
|---|---|---|---|
| **Agregador colombiano** (ver detalle abajo) | **$6 a $20 COP**, según proveedor y volumen | Precios en pesos; API para mensajes transaccionales; saldo que no vence | Condiciones distintas en cada uno; cobertura, SLA y certificación a confirmar en una prueba |
| **WhatsApp** (API de Meta, plantilla de autenticación) | ~US$0,0008 ≈ **$2,6 COP** — *no verificado* | Lo más barato; la gente ya lo usa | Exige que la persona tenga WhatsApp; complementa al SMS, no lo reemplaza. *No verificado:* el trámite con Meta (verificación del negocio, plantilla aprobada) |
| **AWS End User Messaging** | **US$0,05087** ≈ **$166 COP** + cargos del operador | Misma nube que 2venta | Más caro que un agregador local. *Por confirmar:* si la cuenta necesita pedir salir del modo de prueba de SMS |
| **Twilio Verify** | **US$0,05 por verificación exitosa + US$0,0592 por SMS** ≈ **$356 COP** por verificación con un SMS | Muy usado y con mucha documentación (apreciación, no medido) | El más caro |

### Los agregadores, uno por uno

| Proveedor | Precio de lista | IVA | Condiciones |
|---|---|---|---|
| Hablame | desde **$6** por SMS, *sujeto a un volumen mínimo mensual* | incluido | Compra mínima $50.000 (otra condición), saldo sin vencimiento, API y ruta prioritaria para transaccionales. Lista Claro, Movistar, Tigo, Avantel, ETB y virtuales: **WOM no aparece, confirmarlo** |
| Inalambria Express | **$19,99** por SMS en paquetes (500 a 5.000) | incluido | Baja hasta **$6 + IVA** por convenio o alto volumen |
| Onurix | **$5,79 + IVA** en una sección de su página; paquetes desde $42.000 en otra | varía | Su propia página muestra condiciones distintas: pedir cotización |

Ninguna de las tres páginas permitió confirmar una «certificación ante la CRC»:
es una de las preguntas para el proveedor.

## Recomendación (decisión de Nicolás, 2026-09-24)

1. **Lanzamiento: SMS por un agregador colombiano.** Es barato, se paga en pesos y
   no depende de que la persona tenga WhatsApp. Elegir uno después de una prueba de
   entrega real con los operadores grandes (incluido WOM): que el código llegue en
   segundos importa más que dos pesos de diferencia.
2. **Segunda etapa: WhatsApp primero, SMS de respaldo.** Cuando el volumen lo
   justifique, y después de confirmar la tarifa de Meta y el trámite del negocio.

## Cuánto cuesta el arranque

Supuestos: **una verificación exitosa por usuario nuevo y 1,3 mensajes por usuario**
(el registro, algún «no me llegó» y alguna recuperación de contraseña).

| Usuarios nuevos al mes | Mensajes | Agregador local ($6–$20 por mensaje) | Twilio Verify (referencia) |
|---|---|---|---|
| 500 | 650 | $3.900 – $13.000 | ~$207.000 |
| 1.000 | 1.300 | $7.800 – $26.000 | ~$414.000 |

Twilio = usuarios × US$0,05 + mensajes × US$0,0592, a la TRM del día. Con un
agregador, la compra mínima de unos $50.000 con saldo que no vence **cubre varios
meses** a este volumen: entre 4 y 13 meses con 500 usuarios, y entre 2 y 6 con 1.000, según se contrate a $20 o a $6.

## Qué hay que preguntarle al proveedor antes de contratar

No se inventan tiempos ni garantías: esto es lo que falta saber, y decide la
elección entre agregadores.

- Tiempo de alta de la cuenta y de aprobación del remitente o de la plantilla.
- Tiempo de entrega típico y garantizado (SLA) para mensajes transaccionales, por
  operador, incluido WOM y los operadores virtuales.
- Reglas de la CRC que aplican a un código de verificación (horarios, remitente,
  registro de la marca) y si el proveedor está certificado.
- Qué pasa con un mensaje que no se entrega: ¿se cobra?, ¿hay reporte de entrega?
- Precio real por volumen, con IVA y sin cargos escondidos por ruta.

## Qué hay que hacer para conectarlo

- **Configurar** la variable `SMS_PROVIDER_TOKEN`, que ya está declarada como
  obligatoria en producción en `src/lib/config.ts` (sin ella la app no arranca).
  Solo se agregan otras si el proveedor pide más datos que una clave.
- Cambiar solo `sendVerificationCode` en `src/lib/sms.ts`. **El código va al final
  del mensaje** («Tu código de 2venta es 482913»): la caja del código toma el último
  bloque de seis dígitos de lo que se pega (D-106).
- Reintento con otro proveedor o mensaje de «no nos llegó, intenta en un rato» si el
  proveedor falla.
- Alarma de gasto y de entregas fallidas. El tope por celular ya existe; **falta uno
  global por día** contra el abuso distribuido (muchos números distintos).

## Fuentes

- Hablame: https://www.hablame.co/sms/
- Inalambria Express: https://www.inalambria.express/post/cuanto-cuesta-enviar-sms-masivos-en-colombia
- Onurix: https://www.onurix.com/
- Twilio SMS Colombia: https://www.twilio.com/en-us/sms/pricing/co
- Twilio Verify: https://www.twilio.com/en-us/verify/pricing
- AWS End User Messaging: https://aws.amazon.com/end-user-messaging/pricing/ (tabla
  por país en su CSV oficial de precios SMS)
- WhatsApp, precio de autenticación (la página de Meta dio error al revisarla; cifra
  tomada de resúmenes de terceros, por confirmar): https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing
- TRM: Superintendencia Financiera de Colombia
