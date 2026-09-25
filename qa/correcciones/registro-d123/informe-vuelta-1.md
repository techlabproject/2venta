# Informe D-123 — 25 de septiembre de 2026

## Veredicto

**NO PASA** — una sesión pendiente puede modificar el nombre mediante `/api/auth/update-user` antes de confirmar el celular.

## Hallazgos

### 1. Media — modificación de nombre por API sin confirmar celular

- **Ancho:** 390 px.
- **Pasos:** registrar una cuenta, llegar a `http://localhost:3100/verificar?rol=comprador` y hacer `POST http://localhost:3100/api/auth/update-user` con `{"name":"Nombre Intruso Capturado"}`. Consultar después `GET /api/auth/get-session`.
- **Esperado:** rechazar modificaciones privadas hasta confirmar el celular.
- **Visto:** respondió `200` con `{"status":true}`. La sesión mostró `name: "Nombre Intruso Capturado"` y `phoneNumberVerified: false`.
- **Captura:** [E-api-update-user-pendiente-390.png](capturas/E-api-update-user-pendiente-390.png)

### 2. Baja — el mismo número aparece como “número nuevo”

- **Ancho:** 390 px.
- **Pasos:** en `http://localhost:3100/verificar?rol=comprador`, abrir «¿No es tu número? Cámbialo», escribir `3970424286` otra vez y pulsar «Mandar código a este número».
- **Esperado:** indicar que se reenvió el código al mismo número.
- **Visto:** «Listo: te mandamos un código al número nuevo.» La pantalla mostró «Lo mandamos al +57 397 042 4286. Vence en 10 minutos.»
- **Captura:** [B-mismo-numero-390.png](capturas/B-mismo-numero-390.png)

### 3. Baja — queda un aviso de éxito junto al error del tope

- **Ancho:** 390 px.
- **Pasos:** cambiar el celular tres veces y volver a intentar un cuarto cambio.
- **Esperado:** mostrar solo el error del límite.
- **Visto:** junto a «Ya cambiaste el número varias veces. Si sigue sin llegarte el código, vuelve a crear la cuenta.» permaneció «Listo: te mandamos un código al número nuevo.» en `http://localhost:3100/verificar?rol=comprador`.
- **Captura:** [B-tope-tres-cambios-390.png](capturas/B-tope-tres-cambios-390.png)

## Lo que verifiqué y pasa

- Registro en 390 y 1280: queda en `/verificar` con «Tu cuenta queda creada cuando confirmes el código. Si no lo confirmas en 24 horas, el registro se borra.»
- Antes de confirmar, las rutas privadas redirigen a verificar y la portada muestra «Entrar».
- Después de confirmar, abren cuenta, guardados, avisos, checkout y chat.
- «No me llegó, mandar otro» mostró «Te mandamos otro código.»
- Se rechazaron números mal escritos y `3001110001` con mensajes correctos.
- Tres cambios de celular funcionaron; el cuarto mostró el límite.
- Un registro pendiente fue reemplazado desde otro contexto; una cuenta confirmada no se reemplazó.
- «Salir» llevó a `/`; iniciar sesión con una cuenta pendiente volvió a verificar.
- Role/zona fueron rechazados por API con HTTP 400.
- Atrás/adelante y dos pestañas no abrieron contenido privado.
- Los términos ocuparon el viewport en 390 y 1280, el texto quedó centrado, la X y Escape cerraron, los 14 enlaces funcionaron y «Aceptar» marcó la casilla. Capturas: [F-dialog-only-390.png](capturas/F-dialog-only-390.png), [F-dialog-final-390.png](capturas/F-dialog-final-390.png), [F-dialog-final-1280.png](capturas/F-dialog-final-1280.png).

## Observaciones fuera de alcance

- Los términos muestran «Borrador en revisión legal» y campos `[POR COMPLETAR]`.
- `/publicar` lleva a `/vender` para verificar identidad del vendedor.

## NO VERIFICADO

- No esperé 24 horas para verificar el borrado automático.
- No completé un pago real ni la entrega.
- No invoqué Server Actions internas directamente; sí probé las APIs de autenticación.