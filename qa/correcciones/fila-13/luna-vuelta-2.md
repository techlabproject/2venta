# Informe de prueba — segunda vuelta, fila 13

**Veredicto: PASA — el hallazgo del nombre vacío quedó corregido en la interfaz y en el servidor; celular repetido y respuesta 500 siguen explicándose correctamente.**

## Hallazgos

1. **Severidad media — RETESTEADO Y CERRADO: nombre vacío o de solo espacios.**

   - **Anchos:** 390 px y 1280 px.
   - **Pasos exactos:** abrir `http://localhost:3100/registro`; probar por separado Nombre vacío (`""`) y Nombre con espacios (`"   "` en 390, `"        "` en 1280); llenar un correo y celular únicos, fecha `1995-05-20` y contraseña `unaClaveLarga1`; aceptar términos; tocar «Continuar».
   - **Esperado:** marcar el campo, mostrar «Escribe tu nombre.», permanecer en `http://localhost:3100/registro` y no crear la cuenta.
   - **Visto en los cuatro casos:** URL exacta `http://localhost:3100/registro`; no apareció alerta general; el campo Nombre quedó con `aria-invalid="true"` y mostró exactamente «Escribe tu nombre.». El valor de solo espacios permaneció escrito en el campo.
   - **Capturas:** [vacío 390](capturas/V2-nombre-vacio-390.png) · [solo espacios 390](capturas/V2-nombre-espacios-390.png) · [vacío 1280](capturas/V2-nombre-vacio-1280.png) · [solo espacios 1280](capturas/V2-nombre-espacios-1280.png).

   - **API con nombre vacío:** `POST http://localhost:3100/api/auth/sign-up/email`, correo `luna13-v2-api-vacio-1790274399668@correo.com`, nombre `""`: HTTP **400**, cuerpo exacto `{"code":"NAME_REQUIRED","message":"Escribe tu nombre."}`.
   - **API con nombre de espacios:** misma URL, correo `luna13-v2-api-espacios-1790274399788@correo.com`, nombre `"        "`: HTTP **400**, cuerpo exacto `{"code":"NAME_REQUIRED","message":"Escribe tu nombre."}`.
   - **Base de datos:** consulta de solo lectura sobre los cuatro correos de UI (`luna13-v2-390-vacio-1790274329103@correo.com`, `luna13-v2-390-espacios-1790274331762@correo.com`, `luna13-v2-1280-vacio-1790274334248@correo.com` y `luna13-v2-1280-espacios-1790274336690@correo.com`) y los dos de API devolvió `rowCount = 0`; no se creó ninguna cuenta.

## Lo que verifiqué y pasa

- **Celular repetido — 390 px.** Con el celular demo de Laura, `300 111 0003`, en `http://localhost:3100/registro` mostró exactamente: «¡Uy! Ese celular ya tiene una cuenta. Inicia sesión o recupera tu contraseña.» Enlaces: `Iniciar sesión → /ingresar` y `Recuperar contraseña → /recuperar`. El correo de prueba `luna13-v2-phone-1790274433024@correo.com` tuvo cero filas en la consulta posterior. [captura](capturas/V2-celular-repetido-390.png).

- **Respuesta 500 — 390 px.** Intercepté `POST http://localhost:3100/api/auth/sign-up/email` con HTTP 500 y `{ code: "ALGO_RARO", message: "boom" }`. Permaneció en `http://localhost:3100/registro`, conservó lo escrito y mostró exactamente: «¡Uy! Algo falló de nuestro lado y no se creó tu cuenta. Intenta de nuevo en un momento. (Código: ALGO_RARO)». El correo `luna13-v2-500-1790274435321@correo.com` tuvo cero filas en la consulta posterior. [captura](capturas/V2-500-390.png).

- **Lectura visual:** el mensaje «Escribe tu nombre.» cabe en 390 px y 1280 px, el borde rojo identifica el campo correcto y el botón no envía el formulario.

## Observaciones fuera de alcance

- No aparecieron observaciones nuevas fuera de la corrección retesteada.

## NO VERIFICADO

- No repetí en esta segunda vuelta todos los demás errores de campos, límite de códigos, caída de red ni la carrera de confirmación; esta vuelta cubrió nombre, API, celular repetido y 500.
- No probé respuestas 500 sin JSON o sin el campo `code`.
