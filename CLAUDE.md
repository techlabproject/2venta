# 2venta

Marketplace de segunda mano para Colombia. Bogotá, tres categorías, pago protegido.

# Dónde va el proyecto (2026-09-13)

Todos los requisitos funcionales de `SPEC.md` están construidos y probados. El
entorno `dev` corre en AWS —https://d13g2bd9j8wj8k.cloudfront.net— y se despliega
solo al hacer push a `main`; `prod` está definido en Terraform y sin aplicar.
Lo que falta ya casi no es código propio: son proveedores por conectar (SMS, pagos
reales, identidad, transportadora) y sacar la cuenta de AWS del plan gratuito.

Si llegas nuevo a este repositorio, lee en este orden: `NOTES.md` (estado real y
qué quedó a medias), `qa/` (lo último que encontró la verificación independiente)
y `DECISIONS.md` (por qué las cosas son como son). **Este archivo no lleva el
estado; lleva lo que no se puede adivinar leyendo el código.**

# Comandos

- Desarrollo: `npm run dev`
- Base, bucket y cola locales: `docker compose up -d` (Postgres 5433, MinIO 9000, ElasticMQ 9324)
- Worker en desarrollo: `npm run worker` (o `-- --una-vez` para vaciar la cola y salir)
- Pruebas visuales (foto por pantalla, móvil y escritorio): `npm run test:visual`.
  Están fuera de `npm run verify`: dependen de la demo y de las referencias
  `-darwin`, que se generan en este portátil (`-- --update-snapshots`). El runner
  Linux dibuja las fuentes distinto, así que hoy no corren en CI.
- Demostración con fotos y cuentas de prueba (con `npm run dev` corriendo):
  `BETTER_AUTH_URL=http://localhost:3100 npm run demo -- --limpiar-pruebas`.
  Cuentas: `camila@`, `andres@` (vendedores verificados), `laura@` (compradora),
  `admin@2venta.demo`, todas con contraseña `Demo2venta.2026`. En la nube se corre
  como tarea de ECS con la definición `migrar` y el comando `node demo.cjs`.
- Migraciones: `npm run db:migrate`
- Datos de prueba: `npm run db:seed`
- Verificación completa antes de confirmar cambios: `npm run verify`
  (tipos + linter + pruebas unitarias + siembra + pruebas de punta a punta)

- Imagen de producción contra la base local: `docker compose --profile imagen up -d --build app`
  y la suite completa contra ella: `E2E_BASE_URL=http://localhost:3200 npx playwright test`.
  Migraciones dentro de la imagen: `docker compose --profile imagen run --rm app node db/migrate.mts`.

- Nube: `infra/` es Terraform; `dev` se despliega solo al hacer push a `main`
  (GitHub Actions: `verificar` → `desplegar-dev`). A mano: ver `infra/LEEME.md`.
  Perfil de la CLI: `AWS_PROFILE=2venta`.
- Prueba de humo contra la nube (registro → publicar → comprar):
  `NUBE_URL=https://d13g2bd9j8wj8k.cloudfront.net AWS_PROFILE=2venta npx playwright test --config playwright.nube.config.ts`

`verify` vuelve a sembrar la base a propósito. Las pruebas crean artículos y
cuentas que se acumulan, y sin reiniciar, cualquier aserción sobre rangos de precio
o sobre resultados de búsqueda empieza a fallar de forma intermitente.

# Método de trabajo

Este proyecto sigue la skill `product-build-loop`. En corto:

- Una rebanada vertical a la vez, cada una con su especificación en `slices/`.
- Ninguna rebanada se cierra sin correr su prueba de punta a punta y mostrar la salida.
- Toda decisión nueva se anota en `DECISIONS.md`; el estado vive en `NOTES.md`.
- `SPEC.md` manda sobre cualquier suposición. Si algo no está ahí, se pregunta.

# Control de calidad independiente

`qa/` tiene los informes de Luna, la verificadora que corre aparte (su prompt está
en `AGENTE-QA.md`). Al empezar una sesión, mirar si hay un informe nuevo: cerrar sus
hallazgos va antes que construir nada más.

Cuando un hallazgo suyo sea real, escribir primero la prueba que lo reproduce y
después el arreglo. Si no se puede reproducir, decirlo así en vez de darlo por
cerrado.

Hay una segunda Luna, que **usa la aplicación en vez de leer el código**: su prompt
está en `qa/PROMPT-LUNA-USUARIO.md` y corre en ChatGPT contra el entorno `dev` de la
nube. Sus informes llegan a `qa/ronda-usuario/informe-AAAA-MM-DD.md`.

# Convenciones

- Los montos de dinero son enteros en pesos colombianos. Nunca decimales, nunca
  punto flotante. La columna se llama siempre `*_cop`.
- Las fechas se guardan en UTC (`timestamptz`) y se formatean en zona
  `America/Bogota` solo al mostrarlas.
- Los identificadores públicos son UUID, no enteros secuenciales. Un id secuencial
  en una URL deja contar cuántos productos existen.
- Todo texto visible va en español de Colombia.
- El trabajo en segundo plano (liberación automática, avisos) va por la cola
  (`src/lib/queue.ts`) y lo ejecuta `src/worker/`, que solo llama funciones de
  `src/features/*`. Todo trabajo que entre a la cola tiene que tolerar repetirse.
  En las pruebas, después de publicar hay que `await runWorkerOnce()` para que
  aparezcan los avisos.
- Los archivos (video, fotos) van directo del navegador al bucket con URL prefirmada
  (D-50). La acción de servidor recibe claves y las comprueba con `claim()` contra
  S3; nunca confía en el tipo o tamaño que declara el cliente. Las pantallas arman
  la dirección con `mediaUrl()` (servidor), nunca con `NEXT_PUBLIC_*`.

# Diseño

Los colores y las dos tipografías viven en `@theme` dentro de `src/app/globals.css`;
las primitivas con la marca ya aplicada, en `src/components/ui.tsx`. Un color suelto
en una pantalla es un error de revisión, no una opción.

- El mostaza (`accent`) es para el dinero y para la acción principal de la pantalla.
  Si aparece en un tercer sitio, deja de significar algo.
- El precio se pinta con `<Price>`, nunca con `formatCop` a mano.
- El escritorio no es el móvil estirado (D-70): catálogo, gestión y paneles usan
  `max-w-6xl` y varias columnas. Solo lo que se lee y los formularios siguen
  angostos, porque una línea de texto de 1152 px no se lee.
- La navegación está en `AppHeader`: en móvil es un menú, en escritorio una barra.
  Ninguna pantalla escribe su propia cabecera.

# Zonas donde hay que bajar la velocidad

Antes de tocar dinero, identidad, datos personales o permisos, lee
`~/.claude/skills/product-build-loop/references/zonas-sensibles.md`.

IMPORTANT: ninguna consulta a base de datos que devuelva datos de una persona sale
sin comprobar en el servidor que quien pregunta tiene derecho a verlos. La interfaz
que oculta el botón no cuenta como control de acceso.

# Entrar con Google

Está implementado y se activa solo si existen `GOOGLE_CLIENT_ID` y
`GOOGLE_CLIENT_SECRET`. Sin ellas el proveedor no se registra y el botón no
aparece. Instrucciones para obtenerlas en `GOOGLE.md`.

Quien entra con Google llega sin celular, y la D-01 no admite excepción: se le pide
el número y se le manda el código antes de dejarlo comprar o escribir.

# Gotchas

- El servidor de desarrollo y las pruebas no pueden correr a la vez: Next se niega
  a levantar un segundo servidor sobre el mismo directorio. Hay que parar el
  preview antes de `npm run verify`.
- Las pruebas precompilan las rutas antes de empezar (`e2e/global-setup.ts`). Sin
  eso, la primera prueba que toca una ruta nueva paga la compilación dentro de su
  presupuesto de tiempo, y el resultado son fallos intermitentes distintos en cada
  corrida. Cuando agregues una ruta, agrégala a esa lista.
- IMPORTANT: un componente de cliente no puede importar, ni indirectamente, nada
  que llegue a `src/lib/db.ts`. Arrastra el cliente de Postgres al navegador y
  rompe toda la aplicación, con un error que solo aparece en el registro del
  servidor. Las constantes que comparten cliente y servidor van en un archivo que
  no importa nada del servidor.
- Regenerar el esquema de autenticación (`@better-auth/cli generate`) emite solo el
  diff contra la base que encuentre. Para obtener el esquema completo hay que vaciar
  el esquema público primero. Ver `db/LEEME.md`.
- El esquema se cambia con migraciones numeradas en `db/migrations/`. Nunca se edita
  una ya aplicada.
- El contenedor de Postgres corre con configuración regional en inglés. Cualquier
  fecha con nombre de mes se formatea en la aplicación con `Intl`, nunca con
  `to_char` en SQL.
- `dotenv` no lee `.env.local`, eso solo lo hace Next. Los scripts fuera de Next
  tienen que pasarle la ruta explícita. Las unitarias lo cargan con
  `node --env-file`, porque `claim.test.ts` habla con MinIO.
- El worker de `docker compose` corre una **imagen construida, no el código fuente**, y
  compite por los mensajes con el `runWorkerOnce()` de las pruebas. Al agregar un tipo
  de trabajo nuevo hay que `docker compose up -d --build worker`: si no, el contenedor
  se come el mensaje y lo descarta con «mensaje sin forma conocida», la prueba falla
  sin decir por qué, y el error no aparece en la salida de Playwright sino en
  `docker compose logs worker`.
- `npm run test:visual -- --update-snapshots` **puede dejar una referencia vieja sin
  reescribir**: solo escribe cuando la comparación falla, y si el servidor de
  desarrollo todavía servía la versión anterior de la pantalla, la comparación pasa y
  la foto desactualizada se queda. Síntoma: la suite visual en verde mientras la
  captura muestra un diseño que ya no existe. Cuando cambies una pantalla, **borra su
  `.png` antes de regenerar**; `rm e2e/visual/pantallas.spec.ts-snapshots/*.png` y
  volver a generar es lo único que garantiza que las 50 referencias son de verdad.
- Las imágenes de MinIO viven en `quay.io/minio/*`; las de Docker Hub ya no existen.
- En S3 de verdad, `HeadObject` sobre una clave inexistente devuelve **403, no 404**,
  si el rol no tiene `s3:ListBucket` sobre el bucket. MinIO no lo hace. Los roles
  de web y worker lo tienen por eso; no quitarlo.
- Al firmar con `getSignedUrl`, las cabeceras que deban quedar dentro de la firma
  van en `signableHeaders` **y** `unhoistableHeaders`; si no, el SDK las mueve a la
  URL y S3 rechaza el PUT por "cabeceras sin firmar".

# Configuración

`APP_ENV` (`desarrollo` | `produccion`) dice qué proveedores son reales y qué
puentes `/api/dev/*` existen; `NODE_ENV` solo dice cómo se compiló. Para preguntar
"¿estoy en producción?" se usa `isProduction()` de `src/lib/env.ts`, nunca
`NODE_ENV`. Si `APP_ENV` falta dentro de una imagen compilada se asume producción.

La aplicación comprueba sus variables de entorno al arrancar (`src/instrumentation.ts`
→ `src/lib/config.ts`) y **sale del proceso** si falta algo.
Si falta alguna, se detiene diciendo cuáles y para qué sirve cada una. Al agregar
una variable nueva, agrégala también a `REQUIREMENTS`: si no, su ausencia se va a
descubrir en producción y de la peor forma.

# Entorno

- Docker Desktop debe estar corriendo antes de `docker compose up`.
- No hay Xcode completo instalado, solo Command Line Tools. Compilar para iOS lo
  va a requerir; hasta la rebanada S-13 no hace falta.
