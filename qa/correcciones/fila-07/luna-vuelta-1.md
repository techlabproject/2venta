# Informe de prueba — fila 7, celular colombiano

**Veredicto: `PASA CON OBSERVACIONES` — la validación, normalización, registro, recuperación, envío y servidor pasan; queda una fricción menor al borrar un separador automático.**

## Hallazgos

1. **Severidad: baja — Backspace sobre un separador no cambia el valor visible.**

   **Ancho:** 390 px y 1280 px.

   **URL:** `http://localhost:3100/registro`

   **Pasos exactos:** enfocar `Celular`, escribir `3004128805` para obtener `300 412 8805`, colocar el cursor inmediatamente después de `300 ` y pulsar `Backspace` una vez.

   **Esperado:** que el separador se pueda borrar de forma predecible, o que el dígito vecino se borre con una respuesta visible; el usuario no debería sentir que la tecla no hizo nada.

   **Visto:** el texto queda exactamente `300 412 8805`; el cursor pasa de la posición 4 a la 3, antes del separador. El campo sigue enfocado y no pierde dígitos, pero la primera pulsación parece no hacer nada.

   **Captura:** [cursor-borrar-separador-390.png](</private/tmp/claude-501/-Users-nicolasr2-Downloads-2venta/d950c930-0883-4b91-a711-8f99b14729c9/scratchpad/luna/fila-07/capturas/cursor-borrar-separador-390.png>)

## Lo que verificaste y pasa

- En `http://localhost:3100/registro`, a 390 y 1280 px, el prefijo visible es `+57`, sin bandera ni selector; el campo es `type="tel"` con `inputmode="numeric"`.
- Al escribir `3a🙂00- 4📦12.8805` queda `300 412 8805`. Al pegar `+57 300 412 8805`, `57 300 412 8805`, `(300) 412-8805`, `300.412.8805`, espacios no separables/finos o más de 10 dígitos, queda `300 412 8805`. Las capturas de formato están en [pegado-plus57-390.png](</private/tmp/claude-501/-Users-nicolasr2-Downloads-2venta/d950c930-0883-4b91-a711-8f99b14729c9/scratchpad/luna/fila-07/capturas/pegado-plus57-390.png>) y [mas-de-diez-1280.png](</private/tmp/claude-501/-Users-nicolasr2-Downloads-2venta/d950c930-0883-4b91-a711-8f99b14729c9/scratchpad/luna/fila-07/capturas/mas-de-diez-1280.png>).
- El cursor conserva la edición en medio: insertar un `9` da `300 412 9880`; borrar un dígito da `300 418 805`; seleccionar todo y reemplazar da `310 123 4567`, en ambos anchos.
- En `/registro`, al salir de `300 412 88` se ve exactamente `Te faltan 2 dígitos: son 10 en total.`; al salir de `200 412 8805` se ve `¡Uy! Los celulares en Colombia empiezan por 3.`. Al corregir a `300 412 8805`, el error desaparece solo. [error-incompleto-390.png](</private/tmp/claude-501/-Users-nicolasr2-Downloads-2venta/d950c930-0883-4b91-a711-8f99b14729c9/scratchpad/luna/fila-07/capturas/error-incompleto-390.png>)
- Un celular vacío no alerta al salir, coherente con el patrón del correo; al enviar con los demás campos completos aparece `Escribe tu celular.`, `aria-invalid="true"`, la URL sigue en `http://localhost:3100/registro` y el foco vuelve a `phone`. [error-submit-phone-390.png](</private/tmp/claude-501/-Users-nicolasr2-Downloads-2venta/d950c930-0883-4b91-a711-8f99b14729c9/scratchpad/luna/fila-07/capturas/error-submit-phone-390.png>)
- Registro real con celular válido: `321 958 6883` llevó a `http://localhost:3100/verificar?rol=comprador`; el código obtenido con `codigo-sms.sh` fue aceptado y la sesión terminó en `http://localhost:3100/`, mostrando el usuario `LC`. [registro-verificacion-390.png](</private/tmp/claude-501/-Users-nicolasr2-Downloads-2venta/d950c930-0883-4b91-a711-8f99b14729c9/scratchpad/luna/fila-07/capturas/registro-verificacion-390.png>) y [registro-entra-390.png](</private/tmp/claude-501/-Users-nicolasr2-Downloads-2venta/d950c930-0883-4b91-a711-8f99b14729c9/scratchpad/luna/fila-07/capturas/registro-entra-390.png>).
- Recuperación en `http://localhost:3100/recuperar`: Laura escribió `+57 300 111 0003`, que quedó como `300 111 0003`; al enviar apareció exactamente `Si ese celular tiene una cuenta, le mandamos un código.`. [recuperar-laura-enviado-390.png](</private/tmp/claude-501/-Users-nicolasr2-Downloads-2venta/d950c930-0883-4b91-a711-8f99b14729c9/scratchpad/luna/fila-07/capturas/recuperar-laura-enviado-390.png>)
- En `http://localhost:3100/comprar/64bf5eb1-8a0e-4323-a5e5-4e688be2e5e2`, `Celular de quien recibe` mostró el mismo prefijo, formato y `inputmode="numeric"`. Al salir de `300 41` apareció `Te faltan 5 dígitos: son 10 en total.`; al corregirlo a `+57 300 412 8805` se pudo continuar al pago. [envio-error-celular-390.png](</private/tmp/claude-501/-Users-nicolasr2-Downloads-2venta/d950c930-0883-4b91-a711-8f99b14729c9/scratchpad/luna/fila-07/capturas/envio-error-celular-390.png>)
- La compra completa llegó a `http://localhost:3100/dev/pago/2d17adfe-ff4d-43e3-8526-bf8aa19ccd42`; se aprobó el pago y el pedido quedó en `http://localhost:3100/pedido/2d17adfe-ff4d-43e3-8526-bf8aa19ccd42`. En la base de datos de solo lectura, la dirección quedó guardada como `+573004128805`. [pago-dev-390.png](</private/tmp/claude-501/-Users-nicolasr2-Downloads-2venta/d950c930-0883-4b91-a711-8f99b14729c9/scratchpad/luna/fila-07/capturas/pago-dev-390.png>)
- API `http://localhost:3100/api/auth/sign-up/email` con `Origin: http://localhost:3100`: `+15551234567`, `hola`, `+57200123456` y `57 300 412 8805` respondieron `400` con `code: INVALID_PHONE` y el mensaje exacto `Ese celular no es válido: son 10 dígitos que empiezan por 3.`. No apareció ningún usuario para esos correos.
- API autenticada `http://localhost:3100/api/auth/update-user` con `+15551234567`: respondió `400`/`INVALID_PHONE`; antes y después, `http://localhost:3100/cuenta` mostró el celular de Laura como `+573001110003`. [servidor-update-invalido-no-cambia-390.png](</private/tmp/claude-501/-Users-nicolasr2-Downloads-2venta/d950c930-0883-4b91-a711-8f99b14729c9/scratchpad/luna/fila-07/capturas/servidor-update-invalido-no-cambia-390.png>)
- En los estados inválidos observados, el campo se puso rojo y expuso `aria-invalid="true"`; `aria-describedby` incluyó `phone-error phone-hint`, y el texto de error tenía `aria-live="polite"`. No hubo montaje del `+57` sobre el texto en 390 ni en 1280 px.

## Observaciones fuera de alcance

- En el pedido de prueba, la línea de tiempo llegó a mostrar `Pago recibido y guardado`, `El vendedor despachó` y `Entregado`; esa transición de estados queda fuera de la fila 7. [pedido-compradora-390.png](</private/tmp/claude-501/-Users-nicolasr2-Downloads-2venta/d950c930-0883-4b91-a711-8f99b14729c9/scratchpad/luna/fila-07/capturas/pedido-compradora-390.png>)

## NO VERIFICADO

- `Falta tu celular` después de entrar con Google: `/ingresar` no mostró el botón `Continuar con Google` (`count = 0`), por lo que no fue posible alcanzar ese flujo en este entorno.
- Cómo se muestra visualmente el celular al vendedor: en `http://localhost:3100/pedido/2d17adfe-ff4d-43e3-8526-bf8aa19ccd42`, con Andrés M. autenticado a 1280 px, la sección `Entrega` mostró `Laura Torres`, `Calle 72 #10-34` y `Chapinero · Bogotá`, pero no mostró `Celular` ni `+573004128805`. Sí se verificó su persistencia normalizada en servidor, pero no una representación visual para el vendedor. [pedido-vendedor-guia-1280.png](</private/tmp/claude-501/-Users-nicolasr2-Downloads-2venta/d950c930-0883-4b91-a711-8f99b14729c9/scratchpad/luna/fila-07/capturas/pedido-vendedor-guia-1280.png>)
- No se ejecutó un lector de pantalla real; la accesibilidad reportada se comprobó mediante los atributos DOM observados en el navegador.
