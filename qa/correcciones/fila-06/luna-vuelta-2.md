# Informe de prueba — segunda vuelta, fila 6: validación de correo

**Veredicto: `PASA` — los cuatro hallazgos anteriores están corregidos y la batería ampliada de correos válidos no produjo falsos positivos.**

## Hallazgos

1. **Severidad media — RESUELTO: formatos de correo imposibles ya no pasan.**

   - **Ancho:** 390 px.
   - **URL:** `http://localhost:3100/registro` y `http://localhost:3100/ingresar`.
   - **Pasos exactos:** en `/registro`, escribir y sacar el foco de `cata.@gmail.com`, `.cata@gmail.com`, `cata@-gmail.com`, `cata@gmail-.com`, `cata@gma!l.com` y `cata@mi_empresa.com.co`; en `/ingresar`, escribir `luna.@gmail.com`, una contraseña y pulsar `Iniciar sesión`.
   - **Esperado:** marcar los valores inválidos, explicar el problema y no intentar autenticarse.
   - **Visto:** los puntos al inicio o final del usuario mostraron exactamente `Revisa los puntos del correo: hay uno de más o fuera de lugar.`. Los guiones en las puntas y los caracteres raros del dominio mostraron exactamente `Revisa lo que va después de la @: tiene un carácter que no va ahí.`. En `/ingresar`, `luna.@gmail.com` tomó `aria-invalid="true"`, el foco volvió a `email` y no salió ninguna petición `POST` de autenticación.
   - **Capturas:** [malformado-usuario-punto-final.png](capturas/r2/malformado-usuario-punto-final.png), [malformado-usuario-punto-inicial.png](capturas/r2/malformado-usuario-punto-inicial.png), [malformado-dominio-guion-inicial.png](capturas/r2/malformado-dominio-guion-inicial.png), [malformado-dominio-guion-final.png](capturas/r2/malformado-dominio-guion-final.png), [malformado-dominio-caracter-raro.png](capturas/r2/malformado-dominio-caracter-raro.png), [malformado-dominio-guion-raro.png](capturas/r2/malformado-dominio-guion-raro.png), [login-malformado-bloqueado.png](capturas/r2/login-malformado-bloqueado.png).

2. **Severidad baja — RESUELTO: ya no se sugiere cambiar dominios `.co` legítimos.**

   - **Ancho:** 390 px.
   - **URL:** `http://localhost:3100/registro`.
   - **Pasos exactos:** escribir `cata@hotmail.co`, `cata@outlook.co`, `cata@empresa.co` y `cata@uniandes.edu.co`; después escribir `cata@gmail.co` y tocar la sugerencia.
   - **Esperado:** los dominios `.co` legítimos no deben sugerir una conversión a `.com`; `gmail.co` sí debe sugerir `gmail.com`.
   - **Visto:** los cuatro dominios legítimos quedaron sin error y sin sugerencia. `cata@gmail.co` mostró exactamente `¿Quisiste decir cata@gmail.com?`; al tocarla, el valor pasó a `cata@gmail.com` y el foco quedó en `email`. `cata@gmial.com` siguió sugiriendo correctamente `cata@gmail.com`.
   - **Capturas:** [sugerencia-hotmail-co.png](capturas/r2/sugerencia-hotmail-co.png), [sugerencia-outlook-co.png](capturas/r2/sugerencia-outlook-co.png), [sugerencia-empresa-co.png](capturas/r2/sugerencia-empresa-co.png), [sugerencia-gmail-co.png](capturas/r2/sugerencia-gmail-co.png), [sugerencia-gmail-co-corregida.png](capturas/r2/sugerencia-gmail-co-corregida.png), [sugerencia-gmial-com.png](capturas/r2/sugerencia-gmial-com.png).

3. **Severidad media — RESUELTO: el error de validación del servidor ya tiene mensaje específico.**

   - **Ancho:** 390 px.
   - **URL:** `http://localhost:3100/registro`.
   - **Pasos exactos:** completar nombre, correo visible válido, celular, contraseña y términos; modificar en tránsito el correo enviado al servidor a `correo-invalido`; pulsar `Continuar`.
   - **Esperado:** para la respuesta `400` `{"message":"[body.email] Invalid email address","code":"VALIDATION_ERROR"}`, mostrar `¡Uy! Ese correo no parece válido. Revisa que se vea como nombre@gmail.com.`.
   - **Visto:** la respuesta real fue exactamente `{"message":"[body.email] Invalid email address","code":"VALIDATION_ERROR"}` y la pantalla quedó en `http://localhost:3100/registro` con exactamente `¡Uy! Ese correo no parece válido. Revisa que se vea como nombre@gmail.com.`.
   - **Captura:** [servidor-validation-error-traducido.png](capturas/r2/servidor-validation-error-traducido.png).

4. **Severidad baja — RESUELTO: se aplican los límites de longitud.**

   - **Ancho:** 390 px.
   - **URL:** `http://localhost:3100/registro`.
   - **Pasos exactos:** probar un correo de 255 caracteres (`a` repetida 245 veces seguida de `@gmail.com`), otro con 65 caracteres antes de la `@`, y el límite válido con 64 caracteres antes de la `@`; sacar el foco del campo.
   - **Esperado:** los dos primeros deben marcarse como demasiado largos; el límite de 64 caracteres antes de la `@` debe pasar.
   - **Visto:** los dos primeros mostraron exactamente `Ese correo es demasiado largo. Revisa que esté bien copiado.` con `aria-invalid="true"`. El caso de 64 caracteres quedó sin error.
   - **Capturas:** [longitud-total-255.png](capturas/r2/longitud-total-255.png), [longitud-usuario-65.png](capturas/r2/longitud-usuario-65.png), [longitud-usuario-64.png](capturas/r2/longitud-usuario-64.png).

## Lo que verificaste y pasa

- `cata@mail` volvió a marcarse al salir en `/registro`, tanto a 390 como a 1280 px, con `Le falta el final del dominio: ¿cata@mail.com?`; mientras se escribe no regaña. Capturas: [cata-mail-movil.png](capturas/r2/cata-mail-movil.png), [cata-mail-escritorio.png](capturas/r2/cata-mail-escritorio.png).
- Tras marcar un correo inválido, corregirlo limpia automáticamente `aria-invalid`, `aria-describedby` y el texto; un campo vacío al salir sigue sin marcarse. Capturas: [comportamiento-error-corregido-marcado.png](capturas/r2/comportamiento-error-corregido-marcado.png), [comportamiento-error-corregido-limpio.png](capturas/r2/comportamiento-error-corregido-limpio.png).
- La batería de buenos pasó sin falsos positivos: `tést@ejemplo.com`, `niño@ejemplo.com`, `persona@señal.co`, `ana.maria+tienda@empresa.com.co`, `estudiante@uniandes.edu.co`, `correo@mi-empresa.com.co`, `usuario123@dominio123.com`, `Laura@Hotmail.es`, ` cata@gmail.com `, `cata@gmx.com`, `cata@hotmail.co`, `cata@outlook.co`, `cata@empresa.co`, `ana@sub.empresa.com.co`, `ana@sub.uniandes.edu.co`, `nombre+tag@outlook.com`, `ventas2026@mi-empresa2.com.co` y un usuario de 64 caracteres. Todos quedaron sin `aria-invalid` ni mensaje después de salir.
- Las tildes y la ñ en usuario y dominio pasaron; el navegador mostró visualmente `persona@señal.co` sin error. Los guiones internos del dominio, números, `+`, subdominios, `.com.co` y `.edu.co` también pasaron.
- La alta completa con el correo válido `luna+segunda.1790218908356@mi-empresa.com.co` funcionó: llegó a `http://localhost:3100/verificar?rol=comprador`, aceptó el código SMS y terminó en `http://localhost:3100/`. Capturas: [alta-bueno-complejo-antes.png](capturas/r2/alta-bueno-complejo-antes.png), [alta-bueno-complejo-verificar.png](capturas/r2/alta-bueno-complejo-verificar.png), [alta-bueno-complejo-final.png](capturas/r2/alta-bueno-complejo-final.png).
- Accesibilidad conservada: el campo marcado tuvo `aria-invalid="true"`, `aria-describedby="email-error"`; el mensaje tuvo `id="email-error"` y `aria-live="polite"`.

## Observaciones fuera de alcance

- Celular y código (filas 7 y 8): solo se atravesaron como prerrequisito de las altas válidas; no se evaluó su validación.
- Términos y condiciones (fila 11): solo se marcó la casilla para completar el alta; no se evaluó su contenido.
- Otros motivos por los que falla el registro (fila 13): no se evaluaron.

## NO VERIFICADO

- Autocompletado real del navegador: se verificó que `autocomplete="email"` está presente en `/registro` y `/ingresar`, pero no se verificó el desplegable nativo con datos guardados en los contextos aislados.
