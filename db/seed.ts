import { config } from "dotenv";
import { readFileSync } from "node:fs";
import { Pool } from "pg";

// Next carga .env.local por su cuenta; dotenv no, hay que decírselo.
config({ path: ".env.local" });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  await pool.query(readFileSync("db/schema.sql", "utf8"));
  await pool.query("truncate listings, sellers restart identity cascade");

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
      ($2, 'Chaqueta de cuero talla M', 'Cuero legítimo, usada dos temporadas. Forro intacto.', 'ropa', 'usado_bueno', 145000),
      ($1, 'Mesa de comedor para cuatro', 'Madera maciza. Una pata con una marca que no se ve puesta la mesa.', 'hogar', 'usado_regular', 320000)`,
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
