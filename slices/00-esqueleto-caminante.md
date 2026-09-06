# Rebanada S-00 — Esqueleto caminante

## Qué hace

Un producto sembrado en base de datos aparece en una lista pública y se puede abrir
su ficha. Nadie puede publicar, nadie puede comprar. No entrega valor a ningún
usuario: existe para demostrar que el andamiaje completo funciona de punta a punta.

## Por qué va en este momento

Es la primera rebanada por definición. Cuando corra, se congela como implementación
de referencia y las quince siguientes copian su forma, no su código. Concretamente
fija: cómo se accede a la base de datos, cómo se organiza una funcionalidad en
carpetas, cómo se escribe una prueba de punta a punta y qué significa `npm run verify`.

## Archivos que toca

- `docker-compose.yml` — Postgres local en el puerto 5433
- `package.json`, `tsconfig.json`, `next.config.ts`
- `db/schema.sql` — tablas `sellers` y `listings`
- `db/seed.ts` — tres productos de prueba, uno por categoría
- `src/lib/db.ts` — acceso a base de datos
- `src/features/catalog/` — la funcionalidad completa: consultas, lista y ficha
- `src/app/page.tsx`, `src/app/producto/[id]/page.tsx`
- `e2e/catalog.spec.ts` — la prueba de punta a punta

## Explícitamente fuera

- Autenticación, cuentas y sesiones (van en S-01)
- Publicar, editar o borrar productos (S-03)
- Búsqueda y filtros (S-04)
- Pagos de cualquier tipo (S-05)
- Diseño visual definitivo. Esta rebanada se ve fea a propósito: la marca de la
  D-23 entra cuando haya pantallas que valga la pena vestir.
- Despliegue a producción. Requiere cuentas del usuario que todavía no existen.

## Prueba de punta a punta

`npm run verify` corre tipos, linter y la prueba de navegador, y debe terminar en
verde. La prueba de navegador comprueba tres cosas:

1. La página de inicio lista los tres productos sembrados con su precio formateado
   en pesos colombianos.
2. Al abrir una ficha se ve el título, el precio, la categoría, el estado del
   artículo y el alias del vendedor.
3. La ficha carga sin sesión iniciada y sin JavaScript del cliente, porque de eso
   depende que Google la indexe (D-25).

## Casos de fallo con prueba

- Un identificador que no existe devuelve 404, no una pantalla en blanco ni un error
  de servidor.
- Un identificador con formato inválido devuelve 404, no una excepción.
- Con la base de datos caída, la página muestra un error legible y el proceso no se
  cae.

## Depende de

Nada. Es la primera.

## Decisiones que ejecuta

- D-25 renderizado en servidor, para que la ficha exista como página real
- Convención de montos: enteros en pesos, columna `price_cop`
- Convención de identificadores: UUID públicos, no enteros secuenciales
