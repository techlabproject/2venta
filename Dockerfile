# Imagen de la aplicación. Tres etapas: dependencias, compilación y ejecución.
# La última lleva solo lo que `output: "standalone"` decide que hace falta.
#
# La misma imagen sirve para el servidor web, para aplicar migraciones
# (`node db/migrate.mts`) y, desde S-28, para el worker. Qué proveedores son reales
# lo decide APP_ENV en tiempo de ejecución, no la imagen.

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

USER app
EXPOSE 3000
CMD ["node", "server.js"]
