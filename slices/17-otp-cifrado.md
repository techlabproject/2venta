# Rebanada S-17 — Cerrar la brecha del código por SMS

**Zona sensible.** Es la brecha de seguridad más seria que arrastra el proyecto.

## Qué hace

Reemplaza el almacenamiento del código de verificación por celular. Deja de vivir
en texto plano en la tabla de la biblioteca de autenticación y pasa a guardarse
cifrado con un secreto del servidor, igual que el código de entrega presencial.

## Por qué

Es la D-27, anotada desde S-01 y sin resolver desde entonces. Quien tenga lectura de
la base de datos puede tomar el control de cualquier cuenta durante los cinco
minutos que el código vive: lo lee y lo usa.

En S-09 demostré que el problema se resuelve cuando el código es nuestro. Aquí el
código también puede serlo: lo que faltaba era dejar de delegar esa parte.

## Qué cambia y qué no

**Cambia:** la generación, el almacenamiento y la comprobación del código.
**No cambia:** la biblioteca de autenticación sigue manejando contraseñas, sesiones
y tokens, que es lo que no se implementa a mano. Lo que se deja de delegar es un
código de seis dígitos con vencimiento, que es lógica de aplicación, no criptografía.

La distinción importa: no es "ahora lo hago yo", es "esta parte concreta nunca
debió delegarse a algo que la guarda en claro".

## Cómo

- El código se genera con aleatoriedad criptográfica y se cifra con AES-256-GCM.
- Vive en su propia tabla, con vencimiento e intentos.
- La comprobación es de tiempo constante.
- Al acertar, se marca el celular como verificado y se consume el código.
- El límite de envíos por número que ya existía se conserva.

## Archivos que toca

- `db/schema.sql` — tabla `phone_codes`
- `src/features/auth/otp.ts` — generar, cifrar, comprobar
- `src/features/auth/actions.ts` — mandar y verificar
- `src/features/auth/VerifyForm.tsx` y `PhoneForm.tsx`
- `e2e/auth.spec.ts`

## Explícitamente fuera

- El envío real de SMS, que sigue siendo la función de `src/lib/sms.ts`.
- Cambiar cómo se manejan contraseñas o sesiones.

## Prueba de punta a punta

Las mismas que ya existían para S-01, que deben seguir pasando sin cambios de
comportamiento visible, más:

1. El código no aparece en claro en ninguna tabla.
2. El código se consume al usarse.

## Casos de fallo con prueba

- Código equivocado, vencido, de otro usuario, y agotamiento de intentos.
- Un código ya usado no sirve otra vez.

## Depende de

S-16.
