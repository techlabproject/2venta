# Rebanada S-01 — Cuenta con teléfono verificado

**Zona sensible.** Toca identidad, credenciales y datos personales. Antes de
implementar se leyó `references/zonas-sensibles.md` de la skill `product-build-loop`.

## Qué hace

Una persona crea su cuenta con nombre, correo y contraseña, verifica su celular con
un código de seis dígitos, y queda con sesión iniciada. Puede cerrar sesión y volver
a entrar. Sin celular verificado no va a poder comprar ni escribir, aunque esas dos
cosas todavía no existan.

## Por qué va en este momento

Es la D-01: el número verificado es lo que impide crear cuentas desechables para
estafar y volver a entrar. Todo lo que viene después (publicar, comprar, escribir,
calificar) cuelga de saber quién es quién, así que va antes que cualquiera de ellas.

## Archivos que toca

- `src/lib/auth.ts` — configuración del servidor de autenticación
- `src/lib/auth-client.ts` — cliente para las pantallas
- `src/lib/rate-limit.ts` — límite de intentos, respaldado en Postgres
- `src/features/auth/` — pantallas de bienvenida, registro, verificación e ingreso
- `src/app/(auth)/` — rutas de esas pantallas
- `src/app/api/auth/[...all]/route.ts` — manejador de la biblioteca
- `db/schema.sql` — tablas de la biblioteca más `otp_attempts`
- `e2e/auth.spec.ts` — la prueba de punta a punta

## Explícitamente fuera

- Ingreso con Google y Apple. La D-01 los contempla, pero necesitan credenciales de
  cada proveedor que todavía no existen. La biblioteca elegida los soporta y se
  activan con configuración, sin reescribir nada.
- Envío real de SMS. En desarrollo el código se escribe en el registro del servidor.
  El punto de envío está aislado en una función para que conectar el proveedor sea
  cambiar esa función y nada más.
- Verificación de identidad del vendedor con documento. Es S-02.
- Recuperación de contraseña. Va después, no bloquea nada de la Fase 1.
- Pantalla de sesiones activas por dispositivo.

## Prueba de punta a punta

`npm run verify`. La prueba de navegador comprueba:

1. Registro completo: alguien crea su cuenta, recibe el código, lo escribe y queda
   con sesión iniciada mostrando su nombre.
2. Cerrar sesión y volver a entrar con las mismas credenciales.
3. La cuenta sin verificar no puede pasar de la pantalla de verificación.

## Casos de fallo con prueba

- Código equivocado: lo rechaza y deja reintentar.
- Código vencido: lo rechaza.
- Código de otro usuario: no sirve.
- Sexto envío de código al mismo número dentro de una hora: bloqueado.
- Correo ya registrado: mensaje claro, sin revelar si la cuenta existe por otra vía.
- Contraseña de menos de ocho caracteres: rechazada en servidor, no solo en pantalla.
- Celular que no es colombiano: rechazado antes de crear nada.

## Decisiones de la lista de zonas sensibles

- La biblioteca de autenticación es establecida. No se implementa a mano el manejo
  de contraseñas, tokens ni sesiones.
- Las contraseñas se guardan con la función de derivación de la biblioteca, nunca
  cifrado reversible ni hash rápido.
- BRECHA CONOCIDA: el código de verificación se guarda en texto plano. Se creyó
  que la biblioteca lo hasheaba y no es así; su complemento de celular no ofrece
  esa opción, aunque otros complementos suyos sí. Queda registrado en la D-27 con
  su mitigación (vence en cinco minutos, cinco intentos, cinco envíos por hora) y
  hay que resolverlo antes del lanzamiento.
- Hay límite de envío de código por número de celular, no por dirección IP. El
  límite por IP se descartó como protección principal porque detrás de una misma
  salida puede haber un edificio entero de usuarios legítimos: el sexto registro
  del día bloquearía a todos. El techo por IP se conserva solo contra inundación,
  y solo en producción.
- Los registros del servidor no imprimen el código en producción, solo en desarrollo.
- El secreto de sesión sale de variable de entorno y no está en el repositorio.

## Depende de

S-00.
