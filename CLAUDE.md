# 2venta

Marketplace de segunda mano para Colombia. Bogotá, tres categorías, pago protegido.

# Comandos

- Desarrollo: `npm run dev`
- Base, bucket y cola locales: `docker compose up -d` (Postgres 5433, MinIO 9000, ElasticMQ 9324)
- Worker en desarrollo: `npm run worker` (o `-- --una-vez` para vaciar la cola y salir)
- Migraciones: `npm run db:migrate`
- Datos de prueba: `npm run db:seed`
- Verificación completa antes de confirmar cambios: `npm run verify`
  (tipos + linter + pruebas unitarias + siembra + pruebas de punta a punta)

- Imagen de producción contra la base local: `docker compose --profile imagen up -d --build app`
  y la suite completa contra ella: `E2E_BASE_URL=http://localhost:3200 npx playwright test`.
  Migraciones dentro de la imagen: `docker compose --profile imagen run --rm app node db/migrate.mts`.

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
- Las imágenes de MinIO viven en `quay.io/minio/*`; las de Docker Hub ya no existen.
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
