import { config } from "dotenv";
import { readFileSync } from "node:fs";
import { Pool } from "pg";

// Next carga .env.local por su cuenta; dotenv no, hay que decírselo.
config({ path: ".env.local" });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  // El esquema de autenticación lo genera la biblioteca; el de dominio es nuestro.
  await pool.query(readFileSync("db/auth-schema.sql", "utf8"));
  await pool.query(readFileSync("db/schema.sql", "utf8"));
  await pool.query("truncate listings, sellers, categories restart identity cascade");

  // D-05b: las tres categorías de la versión 1 salen de los mockups. Cambiar el
  // conjunto es editar estas filas, no migrar el esquema.
  await pool.query(
    `insert into categories (slug, label, position) values
       ('tecnologia', 'Tecnología', 1),
       ('ropa',       'Ropa',       2),
       ('ninos',      'Niños',      3)`
  );

  const { rows } = await pool.query<{ id: string }>(
    `insert into sellers (alias, zone) values
       ('Camila R.', 'Chapinero'),
       ('Taller Usaquén', 'Usaquén')
     returning id`
  );
  const [camila, taller] = rows.map((r) => r.id);

  await pool.query(
    `insert into listings (seller_id, title, description, category, condition, price_cop) values
      ($1, 'iPhone 13 128 GB', 'Batería al 89%. Sin golpes, con caja y cargador original.', 'tecnologia', 'usado_bueno', 1850000),
      ($2, 'Chaqueta de jean talla M', 'Poco uso, sin manchas ni descosidos. Talla M real.', 'ropa', 'usado_bueno', 95000),
      ($1, 'Coche Chicco reclinable', 'Lo usó mi hija hasta los dos años. Ruedas y cinturones perfectos.', 'ninos', 'usado_regular', 260000)`,
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
