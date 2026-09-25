# Informe D-123 — Vuelta 2 — 25 de septiembre de 2026

## Veredicto

**PASA** — los tres hallazgos de la vuelta 1 no se reproducen; el límite de 30 segundos funciona en pantalla, en el servidor y por separado para registro y recuperación.

## Hallazgos

Ninguno reproducido en esta vuelta.

## Lo que verifiqué y pasa

- **API con sesión pendiente, 390 px.** `POST /api/auth/update-user` respondió HTTP 403 `PHONE_UNCONFIRMED`. El nombre y celular quedaron intactos.
- **API con cuenta confirmada, 390 px.** Cambiar el celular respondió HTTP 400 `PHONE_READONLY`. Captura: [v2-api-celular-y-sesion-390.png](capturas/v2-api-celular-y-sesion-390.png)
- **Mismo número, 390 px.** Mostró «Es el mismo número: te mandamos otro código.» y «Mandar otro en 30 s». Captura: [v2-mismo-numero-390.png](capturas/v2-mismo-numero-390.png)
- **Aviso anterior, 390 px.** Al fallar un cambio, desapareció el aviso de éxito previo. Captura: [v2-aviso-anterior-borrado-390.png](capturas/v2-aviso-anterior-borrado-390.png)
- **Espera visible, 390 px.** Arrancó con «Mandar otro en 30 s» deshabilitado. Captura: [v2-rate-inicial-390.png](capturas/v2-rate-inicial-390.png)
- **Salto del botón, 390 px.** Adelantando solo el reloj del navegador, el servidor respondió «Espera 29 segundos para pedir otro código.» Captura: [v2-rate-salto-boton-servidor-390.png](capturas/v2-rate-salto-boton-servidor-390.png)
- **Después de esperar 31 segundos reales, 390 px.** Mostró «Te mandamos otro código.» y reinició «Mandar otro en 30 s». Captura: [v2-rate-despues-30-390.png](capturas/v2-rate-despues-30-390.png)
- **Registro con código reciente, 390 px.** El registro sí llegó a `/verificar?rol=comprador`, sin alerta, mostrando «Mandar otro en 28 s». Captura: [v2-registro-con-codigo-reciente-390.png](capturas/v2-registro-con-codigo-reciente-390.png)
- **Motivos separados, 390 px.** Un envío reciente de registro no bloqueó el primer envío de recuperación. El segundo intento inmediato no creó otro envío. Captura: [v2-recuperacion-motivo-separado-390.png](capturas/v2-recuperacion-motivo-separado-390.png)
- **Repaso de acceso, 390 y 1280.** Antes de confirmar, las rutas privadas redirigieron a `/verificar` y la portada mostró «Entrar». Después, abrieron cuenta, guardados, avisos y checkout. Capturas: [v2-repaso-pendiente-390.png](capturas/v2-repaso-pendiente-390.png), [v2-repaso-confirmada-390.png](capturas/v2-repaso-confirmada-390.png), [v2-repaso-pendiente-1280.png](capturas/v2-repaso-pendiente-1280.png), [v2-repaso-confirmada-1280.png](capturas/v2-repaso-confirmada-1280.png)
- **Salir e iniciar sesión, 390 px.** «Salir» llevó a `/` con «Entrar`; iniciar sesión con el registro pendiente llevó a `/verificar`.
- **Reemplazo, 390 px.** El primer contexto terminó en `/ingresar`, el segundo confirmó y `laura@2venta.demo` no se reemplazó. Capturas: [v2-reemplazo-primer-contexto-390.png](capturas/v2-reemplazo-primer-contexto-390.png), [v2-correo-confirmado-no-reemplaza-390.png](capturas/v2-correo-confirmado-no-reemplaza-390.png)
- **Términos, 390 y 1280.** Ocuparon exactamente `390×844` y `1280×800`; la X, Escape y «Aceptar» funcionaron. Capturas: [v2-terminos-390.png](capturas/v2-terminos-390.png), [v2-terminos-1280.png](capturas/v2-terminos-1280.png)

## Observaciones fuera de alcance

- Los términos siguen mostrando «Versión 1 · Borrador en revisión legal» y campos `[POR COMPLETAR]`.
- Un comprador confirmado que entra a `/publicar` llega a `/vender` para verificar identidad.

## NO VERIFICADO

- No esperé 24 horas para comprobar en navegador el borrado automático.
- No completé un pago real ni la entrega.
- No volví a hacer clic en las 14 anclas una por una en esta vuelta; pasaron en la vuelta 1.
- Los SMS no se verificaron en un teléfono real; usé el código local para números inventados.