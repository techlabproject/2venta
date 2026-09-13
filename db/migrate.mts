import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { Pool } from "pg";

// En el portátil la conexión sale de .env.local. Dentro del contenedor no existe ese
// archivo ni la biblioteca que lo lee: la variable llega del entorno de la tarea.
if (existsSync(".env.local")) {
  const { config } = await import("dotenv");
  config({ path: ".env.local" });
}

const DIR = path.resolve("db/migrations");

/**
 * Aplica las migraciones pendientes, en orden y una sola vez cada una.
 *
 * Cada migración corre dentro de una transacción junto con el registro de que se
 * aplicó: si falla a la mitad, no queda ni aplicada ni registrada. Sin eso, una
 * migración que falla en su última instrucción deja la base en un estado que nadie
 * sabe describir.
 */
async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  await pool.query(`
    create table if not exists migrations (
      name       text primary key,
      applied_at timestamptz not null default now()
    )
  `);

  const applied = new Set(
    (await pool.query<{ name: string }>(`select name from migrations`)).rows.map((r) => r.name)
  );

  const files = readdirSync(DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  let count = 0;
  for (const file of files) {
    if (applied.has(file)) continue;

    const client = await pool.connect();
    try {
      await client.query("begin");
      await client.query(readFileSync(path.join(DIR, file), "utf8"));
      await client.query(`insert into migrations (name) values ($1)`, [file]);
      await client.query("commit");
      console.log(`Aplicada ${file}`);
      count++;
    } catch (err) {
      await client.query("rollback");
      console.error(`Falló ${file}. No se aplicó nada de esa migración.`);
      throw err;
    } finally {
      client.release();
    }
  }

  console.log(count === 0 ? "Sin migraciones pendientes." : `${count} aplicadas.`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
