# Informe de prueba — fila 8 de Catalina

**Veredicto:** `PASA CON OBSERVACIONES` — la caja única filtra letras y signos, limita a seis dígitos, valida al salir, bloquea envíos incompletos, no se confirma sola, informa los intentos y funciona en recuperación; pero al pegar un SMS cuyo código viene como `482-913`, la caja queda en `248291` porque se cuela el `2` de «2venta». El segundo ciclo de recuperación para restaurar a Laura quedó `NO VERIFICADO` por el límite de cinco envíos por hora.

## Hallazgos

### 1. El pegado de un código con guiones produce un código equivocado

- **Severidad:** media.
- **Ancho:** 390 px y 1280 px.
- **Pasos exactos:** abrir `http://localhost:3100/registro?rol=comprador`; registrar una cuenta nueva con un celular colombiano único; llegar a `http://localhost:3100/verificar?rol=comprador`; pegar exactamente `Tu código de 2venta es 482-913. No lo compartas.` en `Código de seis dígitos`.
- **Esperado:** que quede `482913`, solo dígitos y máximo seis, para poder confirmar el celular con el código recibido.
- **Visto:** quedó `248291` tanto con pegado real del portapapeles como con la entrada equivalente. La URL exacta permaneció `http://localhost:3100/verificar?rol=comprador`.
- **Capturas:** [390 px](capturas/16-pegado-real-guion-390.png) · [1280 px](capturas/03-variantes-1280.png).

## Lo que verificaste y pasa

- En `/verificar`, una sola caja grande con placeholder exacto `000000`; en 390 y 1280 px se ve centrada, legible y sin desbordes.
- Letras, signos y espacios no entran; `123456789012` queda `123456`. Los SMS pegados con un bloque contiguo de seis dígitos al principio, al final o junto a otros números dejan `482913`.
- Con seis dígitos escritos, después de un segundo, la URL sigue siendo `http://localhost:3100/verificar?rol=comprador` y `Confirmar celular` sigue habilitado: no hay confirmación automática.
- Al salir con `1234` se vio exactamente `Te faltan 2 dígitos: el código tiene 6.`. Al pulsar `Confirmar celular`, no navegó, el foco volvió a la caja y cinco intentos incompletos no impidieron que el código real posterior confirmara la cuenta.
- El código equivocado `000000` mostró exactamente `Ese código no es. Te quedan 4 intentos.` en `http://localhost:3100/verificar?rol=comprador`; el código real posterior entró y llevó a `http://localhost:3100/`.
- `No me llegó, mandar otro` mostró exactamente `Te mandamos otro código.`; el código cambió de `490080` a `577219` y el nuevo confirmó la cuenta.
- El aviso del celular se mostró como, por ejemplo, `Lo mandamos al +57 322 068 6916. Vence en cinco minutos.`.
- En el DOM de `/verificar` y `/recuperar`, la caja fue `type="text"`, `inputmode="numeric"`, `autocomplete="one-time-code"`; la etiqueta exacta fue `Código de seis dígitos`.
- El error tuvo `aria-invalid="true"`, `aria-describedby` apuntando a `code-error` y `#code-error` con `aria-live="polite"`. Se observó también en recuperación el texto exacto `Te faltan 2 dígitos: el código tiene 6.`.
- En `/recuperar`, con `3001110003`, se vio `Si ese celular tiene una cuenta, le mandamos un código.`; la misma caja aceptó el código y el primer cambio llevó a `http://localhost:3100/ingresar?recuperada=1`. La contraseña temporal funcionó para iniciar sesión.
- Capturas clave: [error de incompleto](capturas/04-incompleto-error-390.png), [cinco incompletos y código bueno](capturas/05-incompletos-codigo-bueno-390.png), [código equivocado](capturas/06-codigo-equivocado-390.png), [recuperación en 390](capturas/10-recuperar-codigo-390.png), [recuperación en 1280](capturas/14-recuperar-error-1280.png).

## Observaciones fuera de alcance

- El límite observado de cinco envíos de SMS por celular en una hora impidió solicitar un segundo código de recuperación durante esta sesión; no se evaluó como defecto de la fila 8.
- No se evaluaron costo/documentación del SMS ni el selector de país, tal como se indicó.

## NO VERIFICADO

- No pude completar el segundo ciclo de `/recuperar` para cambiar temporalmente la contraseña de Laura y volver a `Demo2venta.2026` usando otro código: después de cinco envíos en una hora, la interfaz siguió mostrando el paso normal pero no generó un código nuevo. La primera recuperación sí se completó y la contraseña temporal funcionó.
- Para no dejar la cuenta compartida alterada, la contraseña de Laura quedó restaurada a `Demo2venta.2026` mediante limpieza técnica local con el mismo hasheo de Better Auth, y se comprobó por interfaz que ese acceso funciona. Esta limpieza no cuenta como evidencia del segundo ciclo de recuperación.
