# Rebanada S-26 — Empaquetado

La aplicación corre como contenedor, igual en el portátil que en AWS. Es el punto 5,
6 y 7 de la sección 9 de `ARQUITECTURA.md`, más una decisión que apareció al
intentarlo.

## Qué hace

- Una imagen de Docker multietapa construye la aplicación y deja solo lo necesario
  para correrla (`output: "standalone"`). Corre como usuario sin privilegios.
- Las migraciones se aplican con un comando aparte dentro de la misma imagen
  (`node db/migrate.mts`), nunca al arrancar el servidor: con dos tareas levantando
  a la vez, las dos intentarían migrar a la vez.
- `GET /api/salud` responde 200 cuando el proceso está vivo y pasó la comprobación
  de configuración. Es lo que el balanceador o App Runner consultan para saber si
  la tarea recibe tráfico.
- El entorno se declara con `APP_ENV`, no se deduce de `NODE_ENV`.

## Por qué `APP_ENV`

`NODE_ENV` lo fija la compilación: toda imagen construida con `next build` corre en
`production`, aunque se despliegue en el entorno de desarrollo de la nube. Con eso,
en `dev` no existirían los proveedores de prueba ni los puentes `/api/dev/*`, y no
se podría probar una compra completa sin Mercado Pago real.

`APP_ENV` dice qué proveedores son reales y qué puentes existen. `NODE_ENV` sigue
diciendo cómo se compiló. Son preguntas distintas.

Si `APP_ENV` falta dentro de una imagen compilada, se asume `produccion`. El error
seguro es el que apaga los puentes de prueba, no el que los deja abiertos. Bajo
`next dev` se asume `desarrollo`, para no obligar a tocar `.env.local`.

## Archivos que toca

- `src/lib/env.ts` — nuevo; `isProduction()` a partir de `APP_ENV`. No importa nada
  del servidor: lo pueden leer cliente y servidor.
- Los doce sitios que hoy preguntan `NODE_ENV === "production"` por motivo de
  producto: `sms.ts`, `config.ts`, `auth.ts`, las cuatro rutas `api/dev/*` y las
  tres pantallas `dev/*`. `db.ts` se queda con `NODE_ENV`: lo suyo es la recarga en
  caliente, no el producto.
- `next.config.ts` — `output: "standalone"`.
- `Dockerfile`, `.dockerignore` — nuevos.
- `db/migrate.mts` — deja de exigir `dotenv`; dentro del contenedor no hay
  `.env.local`.
- `src/app/api/salud/route.ts` — nuevo.
- `docker-compose.yml` — servicio `app` bajo el perfil `imagen`, para correr la
  imagen contra la base local.
- `playwright.config.ts`, `e2e/global-setup.ts` — con `E2E_BASE_URL` las pruebas
  apuntan a un servidor ya levantado en vez de arrancar `next dev`.
- `src/lib/config.ts` — `APP_ENV` en los requisitos, con sus valores permitidos.
- `CLAUDE.md` — cómo correr la suite contra la imagen.

## Explícitamente fuera

- S3, SQS, el worker: S-27 y S-28. Los archivos siguen yendo a disco dentro del
  contenedor, que es efímero. Es aceptable solo hasta S-27.
- Terraform y GitHub Actions: S-29.
- Quitar la ruta `/api/media`: va con S-27, cuando exista quien la reemplace.

## Prueba de punta a punta

1. `docker compose --profile imagen up --build` construye la imagen y levanta la
   aplicación en el puerto 3200 contra la base local.
2. `node db/migrate.mts` dentro del contenedor aplica las migraciones pendientes.
3. `GET /api/salud` responde 200.
4. La suite completa de navegador pasa contra el contenedor con
   `E2E_BASE_URL=http://localhost:3200`, incluidas las que usan los puentes de
   prueba, porque la imagen corre con `APP_ENV=desarrollo`.

## Casos de fallo con prueba

- Con `APP_ENV=produccion`, `/api/dev/pago-callback` responde 404 y
  `sendVerificationCode` se niega a operar (unitaria).
- Con `APP_ENV` en un valor desconocido, la aplicación no arranca y lo dice.
- Sin `APP_ENV` bajo `next build`, se comporta como producción (unitaria).

## Depende de

S-25 (la validación de configuración es lo que hace confiable el chequeo de salud).
