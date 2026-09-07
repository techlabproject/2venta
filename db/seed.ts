import { config } from "dotenv";
import { readdirSync, readFileSync } from "node:fs";
import { Pool } from "pg";

// Next carga .env.local por su cuenta; dotenv no, hay que decírselo.
config({ path: ".env.local" });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  // El seed recrea el esquema entero (pre-lanzamiento, ver db/schema.sql). Eso
  // borra todo, así que se niega a correr contra cualquier base que no sea la
  // local: un descuido con la variable de entorno apuntando a producción sería
  // irreversible.
  const url = process.env.DATABASE_URL ?? "";
  if (!/@(localhost|127\.0\.0\.1|db):/.test(url)) {
    throw new Error(`Este script borra todo y solo corre contra una base local. Recibió: ${url}`);
  }

  // Se vacía y se vuelve a migrar desde cero. En desarrollo eso es lo que uno
  // quiere; en producción nunca se llama esto, sino `npm run db:migrate`.
  await pool.query("drop schema public cascade; create schema public;");

  const dir = "db/migrations";
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) {
    await pool.query(readFileSync(`${dir}/${file}`, "utf8"));
  }
  await pool.query(`
    create table if not exists migrations (
      name text primary key, applied_at timestamptz not null default now())
  `);
  await pool.query(
    `insert into migrations (name) select unnest($1::text[]) on conflict do nothing`,
    [readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()]
  );
  await pool.query('truncate listings, categories, kyc_verifications, "user" restart identity cascade');

  // D-05b: las tres categorías de la versión 1 salen de los mockups. Cambiar el
  // conjunto es editar estas filas, no migrar el esquema.
  await pool.query(
    `insert into categories (slug, label, position) values
       ('tecnologia', 'Tecnología', 1),
       ('ropa',       'Ropa',       2),
       ('ninos',      'Niños',      3)`
  );

  // Vendedores de prueba. Son usuarios reales de la tabla de cuentas (D-03), sin
  // contraseña: existen solo para que el catálogo tenga algo que mostrar.
  const camila = "seed-camila";
  const taller = "seed-taller";
  await pool.query(
    `insert into "user" (id, name, email, "emailVerified", "updatedAt", "phoneNumber", "phoneNumberVerified", alias, zone) values
       ($1, 'Camila Rodríguez', 'camila@ejemplo.co', true, now(), '+573001000001', true, 'Camila R.', 'Chapinero'),
       ($2, 'Taller Usaquén',   'taller@ejemplo.co', true, now(), '+573001000002', true, 'Taller Usaquén', 'Usaquén')`,
    [camila, taller]
  );

  // Un administrador para poder abrir la cola de moderación en desarrollo. No
  // tiene contraseña: se le pone rol a una cuenta creada por la interfaz.
  await pool.query(
    `insert into "user" (id, name, email, "emailVerified", "updatedAt", alias, role)
     values ('seed-admin', 'Equipo 2venta', 'admin@ejemplo.co', true, now(), 'Moderación', 'admin')`
  );

  // Camila está verificada; el taller no. Así el catálogo muestra los dos casos y
  // se ve que el distintivo solo aparece cuando hay dato real detrás.
  await pool.query(
    `insert into kyc_verifications (user_id, provider, reference, status) values
       ($1, 'prueba', 'ref-seed-camila', 'aprobado')`,
    [camila]
  );

  await pool.query(
    `insert into listings (seller_id, title, description, category, condition, price_cop, video_path, poster_path, imei) values
      ($1, 'iPhone 13 128 GB', 'Batería al 89%. Sin golpes, con caja y cargador original.', 'tecnologia', 'usado_bueno', 1850000, 'seed/demo.webm', 'seed/demo.jpg', '490154203237518'),
      ($2, 'Chaqueta de jean talla M', 'Poco uso, sin manchas ni descosidos. Talla M real.', 'ropa', 'usado_bueno', 95000, 'seed/demo.webm', 'seed/demo.jpg', null),
      ($1, 'Coche Chicco reclinable', 'Lo usó mi hija hasta los dos años. Ruedas y cinturones perfectos.', 'ninos', 'usado_regular', 260000, 'seed/demo.webm', 'seed/demo.jpg', null)`,
    [camila, taller]
  );

  const { rows: count } = await pool.query<{ n: string }>("select count(*)::text as n from listings");
  console.log(`Sembrados ${count[0].n} productos.`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
