import { expect, type Browser, type Page } from "@playwright/test";
import { Client } from "pg";
import { config } from "dotenv";

config({ path: ".env.local" });

// Auxiliares compartidos.
//
// La regla que los ordena: cada prueba recorre por interfaz lo que está probando,
// y siembra el resto. Grabar un video y hacer el KYC completo en cada prueba de
// chat o de envío repite lo que S-02 y S-03 ya comprueban, hace las corridas
// lentas, y el síntoma acaba siendo un fallo intermitente distinto cada vez.

export const alertIn = (page: Page) => page.getByRole("main").getByRole("alert");

export function uniqueAccount(prefix: string) {
  const n = Math.floor(Math.random() * 900_000_000) + 100_000_000;
  return {
    phoneDigits: `3${String(n).padStart(9, "0")}`.slice(0, 10),
    email: `${prefix}.${Date.now()}.${n}@correo.com`,
  };
}

export async function withDb<T>(fn: (c: Client) => Promise<T>): Promise<T> {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

/** Crea la cuenta por la interfaz, que es donde hace falta una sesión de verdad. */
export async function signUpVerified(page: Page, prefix: string, name: string) {
  const { email, phoneDigits } = uniqueAccount(prefix);
  await page.goto("/registro?rol=comprador");
  await page.getByLabel("Nombre").fill(name);
  await page.getByLabel("Correo").fill(email);
  await page.getByLabel("Celular").fill(phoneDigits);
  await page.getByLabel("Contraseña").fill("unaClaveLarga1");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page).toHaveURL(/\/verificar/);

  const code = await withDb(async (c) => {
    const { rows } = await c.query<{ value: string }>(
      `select value from verification where identifier = $1 order by "createdAt" desc limit 1`,
      [`+57${phoneDigits}`]
    );
    return rows[0].value.split(":")[0];
  });
  await page.getByLabel("Código de seis dígitos").fill(code);
  await page.getByRole("button", { name: "Confirmar celular" }).click();
  await expect(page.getByTestId("usuario")).toBeVisible();
  return { email };
}

/** Un vendedor verificado con un artículo publicado, listo en un segundo. */
export async function sellerWithListing(
  browser: Browser,
  title: string,
  price: number,
  category = "tecnologia"
) {
  const context = await browser.newContext();
  const page = await context.newPage();
  const { email } = await signUpVerified(page, "vendedor", "Camila Vendedora");

  const listingId = await withDb(async (c) => {
    const { rows: users } = await c.query<{ id: string }>(
      `select id from "user" where email = $1`,
      [email]
    );
    const sellerId = users[0].id;

    await c.query(
      `insert into kyc_verifications (user_id, provider, reference, status)
       values ($1, 'prueba', $2, 'aprobado')
       on conflict (user_id) do update set status = 'aprobado'`,
      [sellerId, `ref-${sellerId}`]
    );

    const { rows } = await c.query<{ id: string }>(
      `insert into listings
         (seller_id, title, description, category, condition, price_cop,
          video_path, poster_path)
       values ($1, $2, 'Descripción de prueba.', $3, 'usado_bueno', $4,
               'seed/demo.webm', 'seed/demo.jpg')
       returning id`,
      [sellerId, title, category, price]
    );
    return rows[0].id;
  });

  return { context, page, listingId };
}

/** Aprueba el KYC de una cuenta ya creada, sin recorrer el flujo del proveedor. */
export async function approveKycFor(email: string): Promise<void> {
  await withDb(async (c) => {
    const { rows } = await c.query<{ id: string }>(
      `select id from "user" where email = $1`,
      [email]
    );
    await c.query(
      `insert into kyc_verifications (user_id, provider, reference, status)
       values ($1, 'prueba', $2, 'aprobado')
       on conflict (user_id) do update set status = 'aprobado'`,
      [rows[0].id, `ref-${rows[0].id}`]
    );
  });
}

/** Convierte una cuenta en administrador. El rol no es escribible desde el cliente. */
export async function makeAdmin(email: string): Promise<void> {
  await withDb((c) => c.query(`update "user" set role = 'admin' where email = $1`, [email]));
}

/** Un IMEI válido y único por corrida, con su dígito verificador. */
export function freshImei(): string {
  const base = String(Date.now()).slice(-9) + String(Math.floor(Math.random() * 90000) + 10000);
  let sum = 0;
  const padded = base.padStart(14, "0").slice(0, 14);
  for (let i = 0; i < 14; i++) {
    let v = Number(padded[13 - i]);
    if (i % 2 === 0) {
      v *= 2;
      if (v > 9) v -= 9;
    }
    sum += v;
  }
  return padded + ((10 - (sum % 10)) % 10);
}
