# Informe de prueba — fila 6: validación de correo

**Veredicto: `NO PASA` — la validación mejora el caso de Catalina, pero todavía deja pasar formatos de correo imposibles, sugiere cambiar un dominio legítimo y muestra un mensaje genérico cuando el servidor recibe un correo inválido.**

## Hallazgos

1. **Severidad media — formatos de correo imposibles pasan y se intenta iniciar sesión.**

   - **Ancho:** 390 px.
   - **URL:** `http://localhost:3100/ingresar`.
   - **Pasos exactos:** abrir la URL; escribir `luna.@gmail.com` en `Correo`; escribir `cualquier` en `Contraseña`; pulsar `Iniciar sesión`.
   - **Esperado:** el campo debe marcarse inválido con un mensaje propio, no debe salir ninguna petición y el foco debe volver a `Correo`. Un punto al final del usuario no forma un correo válido.
   - **Visto:** el campo no tomó `aria-invalid`, no apareció mensaje bajo el campo y sí salió una petición `POST` a `http://localhost:3100/api/auth/sign-in/email` con `{"email":"luna.@gmail.com","password":"cualquier"}`. La pantalla mostró exactamente `Correo o contraseña incorrectos.` en `http://localhost:3100/ingresar`. También pasó la variante `cata@-gmail.com`.
   - **Capturas:** [login-malformado-local-final.png](capturas/login-malformado-local-final.png), [entrada-guion-dominio.png](capturas/entrada-guion-dominio.png).

2. **Severidad baja — aparece una sugerencia incorrecta para un dominio legítimo.**

   - **Ancho:** 390 px.
   - **URL:** `http://localhost:3100/registro`.
   - **Pasos exactos:** abrir la URL; escribir `cata@hotmail.co` en `Correo`.
   - **Esperado:** el correo debe quedar válido y no debe ofrecerse una corrección para `hotmail.co`, que es un dominio legítimo.
   - **Visto:** el campo quedó sin error, pero apareció exactamente `¿Quisiste decir cata@hotmail.com?`. La sugerencia se mostró también antes de salir del campo. En cambio, `gmx.com` y `uniandes.edu.co` no generaron sugerencia.
   - **Captura:** [sugerencia-cata-hotmail-co.png](capturas/sugerencia-cata-hotmail-co.png).

3. **Severidad media — el respaldo del servidor conserva el mensaje genérico.**

   - **Ancho:** 390 px.
   - **URL:** `http://localhost:3100/registro`.
   - **Pasos exactos:** abrir la URL; completar nombre `Luna Prueba`, correo visible `luna.servidor.1790166257691@correo.com`, celular `3004128899`, contraseña `ClaveSegura2026` y aceptar los términos; antes de dejar salir la petición de registro, cambiar en tránsito el correo enviado al servidor por `correo-invalido`; pulsar `Continuar`.
   - **Esperado:** si el servidor recibe un correo inválido, debe aparecer exactamente `¡Uy! Ese correo no parece válido. Revisa que se vea como nombre@gmail.com.` y no debe mostrarse el genérico.
   - **Visto:** el servidor recibió el valor inválido y la pantalla se quedó en `http://localhost:3100/registro` mostrando exactamente `No pudimos crear tu cuenta. Intenta de nuevo.`
   - **Captura:** [registro-fallback-servidor-invalido.png](capturas/registro-fallback-servidor-invalido.png).

4. **Severidad baja — se acepta un correo de 255 caracteres sin advertencia.**

   - **Ancho:** 390 px.
   - **URL:** `http://localhost:3100/registro`.
   - **Pasos exactos:** abrir la URL; pegar `a` repetida 245 veces seguida de `@gmail.com` (255 caracteres en total) en `Correo`; hacer clic en `Nombre` para salir del campo.
   - **Esperado:** un correo de más de 254 caracteres debe identificarse como inválido antes de enviarse.
   - **Visto:** el valor completo de 255 caracteres permaneció en el campo, `aria-invalid` no apareció y `#email-error` quedó vacío. No hubo mensaje.
   - **Captura:** [correo-255-caracteres.png](capturas/correo-255-caracteres.png).

## Lo que verificaste y pasa

- En `/registro`, `cata@mail` se marca al salir tanto a 390 px como a 1280 px con el texto exacto `Le falta el final del dominio: ¿cata@mail.com?`; el borde se vuelve rojo, Continuar no envía y el foco vuelve a `Correo`. Capturas: [cata-mail-movil-salir.png](capturas/cata-mail-movil-salir.png), [cata-mail-movil-continuar.png](capturas/cata-mail-movil-continuar.png), [cata-mail-escritorio-salir.png](capturas/cata-mail-escritorio-salir.png), [cata-mail-escritorio-continuar.png](capturas/cata-mail-escritorio-continuar.png).
- No regaña mientras se escribe; un campo vacío al salir no se marca; Tab y clic con el ratón marcan el error; al corregir a `cata@mail.com` el error desaparece solo. La sugerencia se puede tocar: `cata@gmial.com` pasó a `cata@gmail.com` y mantuvo el foco en el campo. Capturas: [comportamiento-error-tab.png](capturas/comportamiento-error-tab.png), [comportamiento-corregido.png](capturas/comportamiento-corregido.png), [sugerencia-gmial-corregida.png](capturas/sugerencia-gmial-corregida.png).
- Los mensajes vistos para sin `@`, dos `@`, sin usuario, sin dominio, sin punto, puntos dobles, espacios internos y dominio de una letra fueron específicos y en español. Los casos buenos `ana.maria+tienda@empresa.com.co`, `ana@sub.empresa.com.co`, `Laura@Hotmail.es`, `tést@ejemplo.com`, `niño@ejemplo.co` y ` cata@gmail.com ` no fueron rechazados. No hubo desbordamiento horizontal en 390 px (`scrollWidth` 390).
- Las sugerencias `gmial.com`, `hotmal.com`, `gmail.con`, `outlok.es`, `yaho.com` e `iclud.com` se corrigieron a `gmail.com`, `hotmail.com`, `gmail.com`, `outlook.es`, `yahoo.com` e `icloud.com`, respectivamente. En `/ingresar` también apareció `¿Quisiste decir cata@gmail.com?` para `cata@gmial.com`.
- En `/ingresar`, `cata@mail` no generó petición, mostró `Le falta el final del dominio: ¿cata@mail.com?` y devolvió el foco a `Correo`. Un correo bien escrito pero inexistente mostró exactamente `Correo o contraseña incorrectos.`.
- El alta completa con un correo válido funcionó: llegó a `http://localhost:3100/verificar?rol=comprador`, aceptó el código SMS y terminó en `http://localhost:3100/`. Capturas: [registro-valido-antes-enviar.png](capturas/registro-valido-antes-enviar.png), [registro-valido-verificar.png](capturas/registro-valido-verificar.png), [registro-valido-final.png](capturas/registro-valido-final.png).
- Accesibilidad: al marcarse, el campo tuvo `aria-invalid="true"`, `aria-describedby="email-error"`; el mensaje tuvo `id="email-error"` y `aria-live="polite"`. El error ocupó una línea y cabió en 390 px. Captura: [comportamiento-error-raton-aria.png](capturas/comportamiento-error-raton-aria.png).

## Observaciones fuera de alcance

- Celular y código (filas 7 y 8): solo se atravesaron como prerrequisito del alta válida; no se evaluó su validación.
- Términos y condiciones (fila 11): solo se marcó la casilla para completar el alta; no se evaluó su contenido ni comportamiento.
- Otros motivos por los que falla el registro (fila 13): no se evaluaron.

## NO VERIFICADO

- Autocompletado real del navegador: se verificó que el atributo `autocomplete="email"` está presente en `/registro` y `/ingresar`, pero no se pudo verificar el desplegable nativo con datos guardados en los contextos aislados.
