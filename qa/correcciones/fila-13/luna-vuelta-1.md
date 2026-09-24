# Informe de prueba — fila 13, registro

**Veredicto: PASA CON OBSERVACIONES — la corrección de duplicados y fallas desconocidas funciona; queda una observación de nombre vacío fuera de la fila 13.**

## Hallazgos

1. **Severidad media — Nombre requerido permite crear una cuenta sin nombre.**

   - **Ancho:** 390 px.
   - **Pasos:** abrir `http://localhost:3100/registro`; dejar vacío «Nombre»; llenar correo único, celular `300 900 9100`, fecha `1995-05-20` y contraseña `unaClaveLarga1`; aceptar términos; tocar «Continuar».
   - **Esperado:** un mensaje junto a «Nombre» indicando qué falta y permanecer en `http://localhost:3100/registro`; no crear ni encaminar a confirmar una cuenta incompleta.
   - **Visto:** no apareció alerta ni error de campo; navegó a `http://localhost:3100/verificar?rol=comprador`. Una consulta de solo lectura encontró la cuenta `luna13-nombre-vacio-1790273515710@correo.com` con `name = ""` y `phoneNumberVerified = false`.
   - **Captura:** [C-nombre-vacio.png](capturas/C-nombre-vacio.png).

## Lo que verifiqué y pasa

- **Celular confirmado repetido — 390 px y 1280 px.** Con `300 111 0003` (Laura) y `300 111 0001` (Camila), al tocar «Continuar» permaneció en `http://localhost:3100/registro` y mostró exactamente: «¡Uy! Ese celular ya tiene una cuenta. Inicia sesión o recupera tu contraseña.» Los enlaces exactos fueron `Iniciar sesión → /ingresar` y `Recuperar contraseña → /recuperar`. Las consultas posteriores devolvieron cero filas para los correos nuevos. [390](capturas/A-dup-clean-390.png) · [1280](capturas/A-dup-clean-1280.png).

- **Destino desde «Escribirle al vendedor» — 390 px.** Desde `http://localhost:3100/producto/e2cf169d-1cd8-442d-8a92-eee7055091d4`, el recorrido llevó a `http://localhost:3100/ingresar?motivo=chat&volver=%2Fchat%2Fabrir%2Fe2cf169d-1cd8-442d-8a92-eee7055091d4`, después a registro con el mismo `volver`. Tras el celular repetido, el enlace de alerta fue `/ingresar?volver=%2Fchat%2Fabrir%2Fe2cf169d-1cd8-442d-8a92-eee7055091d4`; al entrar con Laura terminó en `http://localhost:3100/chat/b7bca831-23c5-4f2c-b13c-28225d6935a7`. [resultado final](capturas/A-destino-final-chat.png).

- **Recuperar contraseña:** al tocar el enlace desde el error de celular repetido abrió `http://localhost:3100/recuperar`, con el título «Recuperar tu cuenta». [captura](capturas/A-recuperar-destino.png).

- **Correo repetido — 390 px y 1280 px.** Con `laura@2venta.demo`, en `http://localhost:3100/registro`, mostró exactamente: «Ese correo ya tiene una cuenta. Inicia sesión o usa otro.» y los mismos enlaces `Iniciar sesión → /ingresar` y `Recuperar contraseña → /recuperar`. La consulta de solo lectura encontró una sola fila para `laura@2venta.demo`. [390](capturas/B-email-clean.png) · [1280](capturas/B-email-clean-1280.png).

- **Campos vacíos o mal escritos — 390 px, URL `http://localhost:3100/registro`:**
  - correo vacío: «Escribe tu correo.» [captura](capturas/C-correo-vacio.png);
  - correo `cata@mail`: «Le falta el final del dominio: ¿cata@mail.com?» [captura](capturas/C-correo-mal-escrito.png);
  - celular vacío: «Escribe tu celular.» [captura](capturas/C-celular-vacio.png);
  - celular `123`: «¡Uy! Los celulares en Colombia empiezan por 3.» [captura](capturas/C-celular-mal-escrito.png);
  - fecha vacía: «Escribe tu fecha de nacimiento.» [captura](capturas/C-fecha-vacia.png);
  - fecha `2012-01-01`: «Para usar 2venta debes tener 18 años o más.» [captura](capturas/C-menor.png);
  - fecha `2099-01-01`: «Esa fecha no parece real. Revísala.» [captura](capturas/C-fecha-futura.png);
  - contraseña `siete77`, vacía o de ocho espacios: «La contraseña necesita al menos ocho caracteres que no sean espacios.» [corta](capturas/C-clave-corta.png) · [espacios](capturas/C-clave-espacios.png) · [vacía](capturas/C-clave-vacia.png);
  - términos sin aceptar: «Para crear tu cuenta, lee y acepta los términos y la política de datos.» [captura](capturas/C-terminos-sin-aceptar.png).

- **Falla desconocida / respuesta 500 — 390 px.** Intercepté `POST http://localhost:3100/api/auth/sign-up/email` con estado 500 y cuerpo `{ code: "ALGO_RARO", message: "boom" }`. Permaneció en `http://localhost:3100/registro`, conservó nombre, correo, celular, fecha y contraseña, y mostró exactamente: «¡Uy! Algo falló de nuestro lado y no se creó tu cuenta. Intenta de nuevo en un momento. (Código: ALGO_RARO)». La consulta posterior devolvió cero filas para el correo probado. [captura](capturas/C-500-clean.png).

- **Sin conexión — 390 px.** Después de llenar el formulario y aceptar términos, puse el contexto del navegador offline y toqué «Continuar». Permaneció en `http://localhost:3100/registro`, conservó todo lo escrito y mostró exactamente: «No pudimos conectarnos. Revisa tu conexión e intenta otra vez.» [captura](capturas/C-sin-conexion-real.png).

- **Demasiados intentos — 390 px.** En una cuenta nueva, el primer envío y los cuatro reenvíos siguientes mostraron «Te mandamos otro código.»; el sexto código total dejó `http://localhost:3100/verificar?rol=comprador` y mostró exactamente: «Pediste demasiados códigos. Espera una hora y vuelve a intentar.» [captura](capturas/C-demasiados-codigos.png).

- **Carrera de confirmación — 390 px.** Registré dos cuentas nuevas antes de confirmar, ambas con `300 930 8276`. Confirmé la primera y llegó a `http://localhost:3100/`; en la segunda toqué «No me llegó, mandar otro», usé el código nuevo y confirmé. Permaneció en `http://localhost:3100/verificar?rol=comprador` y mostró exactamente: «Ese celular ya está confirmado en otra cuenta. Si es tuya, entra con ella o recupera la contraseña.» La consulta de solo lectura devolvió la primera cuenta con `phoneNumberVerified = true` y la segunda con `false`. [primera confirmada](capturas/D-primera-confirmada.png) · [segunda bloqueada](capturas/D-segunda-bloqueada.png).

- **Ajuste visual — 390 px.** En el error de celular duplicado el bloque midió 350 px, no hubo desbordamiento horizontal (`scrollWidth = 390`, `clientWidth = 390`) y el mensaje más enlaces cupo en la pantalla. El tono resultó cálido y accionable («¡Uy!», iniciar sesión o recuperar contraseña); el 500 y la caída de red también explican qué hacer.

## Observaciones fuera de alcance

- El campo «Nombre» tiene `required` en la interfaz, pero el registro vacío sí avanzó; queda documentado como hallazgo 1 y no corresponde al cambio de fila 13.
- El panel legal mostrado durante la prueba contiene los textos pendientes `[correo — POR COMPLETAR]` y `[fecha de aprobación — POR COMPLETAR]`; pertenece a términos/política, no a fila 13. [panel](capturas/01-terminos-panel.png).

## NO VERIFICADO

- No probé un fallo de red durante el reenvío del código en `/verificar`; la caída de red sí fue probada durante el envío del registro.
- No probé formatos de respuesta 500 sin JSON o sin el campo `code`; sí probé el 500 interceptado con `code = ALGO_RARO`, que es el caso solicitado.
