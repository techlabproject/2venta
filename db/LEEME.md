# Base de datos

## Cómo se cambia el esquema

Los cambios van como **migraciones numeradas** en `db/migrations/`. Nunca se edita
una que ya se aplicó: se escribe una nueva.

```bash
npm run db:migrate     # aplica las pendientes, en orden y una sola vez cada una
```

Cada migración corre dentro de una transacción junto con el registro de que se
aplicó. Si falla a la mitad, no queda ni aplicada ni registrada: sin eso, una que
falle en su última instrucción deja la base en un estado que nadie sabe describir.

Para nombrarlas: `NNNN_descripcion_corta.sql`, con el número siguiente al último.

## En desarrollo

```bash
npm run db:up          # levanta Postgres en el puerto 5433
npx tsx db/seed.ts     # vacía, migra desde cero y siembra datos de prueba
```

`db/seed.ts` **borra todo**. Tiene una guarda que le impide correr contra cualquier
base que no sea local: un descuido con la variable de entorno apuntando a
producción sería irreversible.

`npm run verify` vuelve a sembrar antes de las pruebas, porque estas crean cuentas y
artículos que se acumulan y rompen cualquier aserción sobre rangos.

## El esquema de autenticación

Las tablas de la biblioteca (`user`, `session`, `account`, `verification`,
`rateLimit`) están dentro de `0001_inicial.sql`. Si cambias los campos de usuario en
`src/lib/auth.ts`, hay que generar el diff y meterlo en una migración nueva:

```bash
npx @better-auth/cli generate --config src/lib/auth.ts --output /tmp/diff.sql -y
```

Cuidado con esto: **la herramienta emite solo lo que le falta a la base que
encuentre**. Si la base ya está al día, dice "already up to date"; si le falta una
columna, emite solo ese `alter`. Nunca da el esquema completo salvo contra una base
vacía.
