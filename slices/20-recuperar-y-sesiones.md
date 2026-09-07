# Rebanada S-20 — Recuperar contraseña y ver sesiones

**Zona sensible.** Recuperar contraseña es la puerta trasera de toda cuenta.

## Qué hace

Quien olvidó su contraseña la recupera con un código a su celular. Y desde la
cuenta se ven las sesiones abiertas por dispositivo, con la opción de cerrarlas.

## Por qué

Son el RF-04 y el RF-05, y ninguno se construyó. Hoy quien olvida su contraseña
pierde la cuenta para siempre, sin salida.

## Por qué por celular y no por correo

El requisito original decía "correo o SMS". Se hace por celular por dos razones.

La primera es práctica: no hay proveedor de correo conectado y sí existe ya toda la
maquinaria del código por celular, cifrado y con límite de intentos, de S-17.

La segunda importa más: **el celular está verificado y el correo no.** Mandar la
recuperación a un correo que nadie comprobó convierte ese correo en la llave real de
la cuenta, y cualquiera que se registre con un correo ajeno se queda con la puerta
abierta. Recuperar por el canal verificado es lo coherente con la D-01.

## La decisión sobre qué se le dice a quien pide recuperar

**Siempre lo mismo, exista o no la cuenta.** Si la pantalla dijera "ese celular no
está registrado", cualquiera podría averiguar qué números tienen cuenta en 2venta
probando. El mensaje es el mismo en los dos casos y el código solo se manda si la
cuenta existe.

## Otra decisión: recuperar cierra todas las sesiones

Cambiar la contraseña cierra las demás sesiones abiertas. Si alguien entró a la
cuenta, recuperar la contraseña tiene que echarlo, y no hacerlo dejaría al intruso
dentro mientras el dueño cree que ya lo resolvió.

## Archivos que toca

- `db/migrations/0004_*.sql` — códigos de recuperación
- `src/features/auth/recovery.ts`
- `src/app/(auth)/recuperar/`
- `src/app/cuenta/page.tsx` — sesiones abiertas
- `e2e/recovery.spec.ts`

## Explícitamente fuera

- Recuperar por correo.
- Recuperar sin acceso al celular. Necesita soporte humano y verificación de
  identidad; es un procedimiento, no una pantalla.

## Prueba de punta a punta

1. Se pide recuperación, llega el código, se cambia la contraseña y se entra con
   la nueva.
2. La contraseña vieja deja de servir.
3. Recuperar cierra las sesiones que estaban abiertas.
4. Se ven las sesiones abiertas y se pueden cerrar.

## Casos de fallo con prueba

- Pedir recuperación de un celular sin cuenta responde igual, y no manda nada.
- Un código equivocado, vencido o ya usado se rechaza.
- Se agotan los intentos.
- Una contraseña nueva que no cumple el mínimo se rechaza.

## Depende de

S-19.
