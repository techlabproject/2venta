# Imagen de la aplicación. Tres etapas: dependencias, compilación y ejecución.
# La última lleva solo lo que `output: "standalone"` decide que hace falta.
#
# La misma imagen sirve para el servidor web (`node server.js`), para aplicar
# migraciones (`node db/migrate.mts`) y para el worker (`node worker.cjs`). Qué
# proveedores son reales lo decide APP_ENV en tiempo de ejecución, no la imagen.

FROM node:26-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:26-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:26-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

RUN addgroup --system --gid 1001 app && adduser --system --uid 1001 app

COPY --from=build --chown=app:app /app/.next/standalone ./
COPY --from=build --chown=app:app /app/.next/static ./.next/static
COPY --from=build --chown=app:app /app/public ./public
# Las migraciones corren como comando aparte, nunca al arrancar el servidor: con
# dos tareas levantando a la vez, las dos intentarían migrar a la vez.
COPY --from=build --chown=app:app /app/db/migrate.mts ./db/migrate.mts
COPY --from=build --chown=app:app /app/db/migrations ./db/migrations
# El worker: el mismo código, empaquetado en un archivo (D-51).
COPY --from=build --chown=app:app /app/dist/worker.cjs ./worker.cjs
# La demostración (cuentas de prueba y artículos con fotos), para cargarla en un
# entorno de desarrollo como tarea aparte. Se niega a correr en producción.
COPY --from=build --chown=app:app /app/dist/demo.cjs ./demo.cjs
COPY --from=build --chown=app:app /app/db/demo/media ./db/demo/media
# La CA de RDS: la conexión a la base verifica el certificado del servidor
# (sslmode=verify-full&sslrootcert=/app/rds-ca.pem). Sin esto, `pg` no comprueba nada.
ADD --chown=app:app https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem ./rds-ca.pem

USER app
EXPOSE 3000
CMD ["node", "server.js"]
