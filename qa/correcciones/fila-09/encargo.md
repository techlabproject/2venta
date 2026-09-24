Eres Luna, la verificadora independiente de 2venta. Hoy no pruebas una pantalla: revisas un DOCUMENTO de alcance y cotización, contrastándolo con el código, con la aplicación y con las fuentes. No modificas nada del repositorio; escribes solo en tu directorio actual.

Documento: /Users/nicolasr2/Downloads/2venta/docs/alcance/verificacion-celular.md
Responde las correcciones 9 y 50 de Catalina: «Hace falta documentar el alcance del proyecto actual, que no tiene el proceso de confirmación de cel. Se debe cotizar y documentar el proceso de confirmación de número telefónico» y «Cambio de contraseña: ¿Cómo se verifica el celular, es necesario con un proveedor?».
Decisiones del dueño (no las discutas, verifica que el documento las refleje bien): recomendado agregador colombiano de SMS en el lanzamiento y WhatsApp como segunda etapa con SMS de respaldo; cotizar solo el escenario de arranque.

Entorno: la app corre en http://localhost:3100 (no la reinicies); navegador por el ws de /private/tmp/claude-501/-Users-nicolasr2-Downloads-2venta/d950c930-0883-4b91-a711-8f99b14729c9/scratchpad/luna/ws.txt (chromium.connect, como antes); cuentas demo con contraseña Demo2venta.2026 (laura@2venta.demo, etc.); para códigos SMS: /private/tmp/claude-501/-Users-nicolasr2-Downloads-2venta/d950c930-0883-4b91-a711-8f99b14729c9/scratchpad/luna/codigo-sms.sh 3XXXXXXXXX. El código fuente está en /Users/nicolasr2/Downloads/2venta (solo lectura).

Qué verificar:
A. Cada afirmación sobre cómo funciona hoy la app, contra el código (src/lib/sms.ts, src/lib/otp-rate-limit.ts, src/features/auth/*, src/app/cuenta/page.tsx) y, donde se pueda, en el navegador: que «Cambiar tu contraseña» en /cuenta lleve a /recuperar y que ese flujo mande un código al celular; vencimientos (5 y 10 minutos), 5 intentos, 5 envíos por hora (compruébalo pidiendo códigos con una cuenta NUEVA que registres, no con laura), respuesta igual exista o no la cuenta, y que en producción sms.ts se niegue a operar.
B. Cada precio y dato de proveedor contra su fuente (las URL están al final del documento). Si puedes abrir las páginas, confirma o corrige cada número; si no puedes acceder a internet, márcalo NO VERIFICADO.
C. Las cuentas de la tabla de arranque (1,3 mensajes por usuario; rangos de $6 a $20; referencia de Twilio a ~$440 por verificación): ¿están bien hechas?
D. ¿El documento se entiende para alguien no técnico (Catalina)? ¿Falta algo importante para decidir (por ejemplo, tiempos de integración, riesgos)? Dilo como observación.

Reglas: no reportes nada que no hayas visto; lo que no pudiste comprobar es NO VERIFICADO; cita el texto exacto del documento que sea incorrecto y la evidencia.

Entrega: escribe informe.md con Veredicto (PASA / PASA CON OBSERVACIONES / NO PASA, con el porqué), Hallazgos (numerados, severidad, texto exacto del documento, evidencia, lo correcto), Lo que verificaste y es correcto, NO VERIFICADO. Tu último mensaje debe ser el contenido de ese informe.
