import { test, expect, type Page } from "@playwright/test";
import { Client } from "pg";
import { config } from "dotenv";

config({ path: ".env.local" });

// La prueba de punta a punta de la rebanada S-01.
// Ver slices/01-cuenta-telefono-verificado.md

// El código llega por SMS, que en desarrollo no existe. La prueba lo lee de la
// base de datos, que es donde la biblioteca lo guarda. Esto también documenta la
// brecha conocida de la D-27: ahí está en texto plano.
async function readOtp(phone: string): Promise<string> {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    const { rows } = await client.query<{ value: string }>(
      `select value from verification
       where identifier = $1 order by "createdAt" desc limit 1`,
      [phone]
    );
    if (!rows[0]) throw new Error(`No hay código guardado para ${phone}`);
    return rows[0].value.split(":")[0];
  } finally {
    await client.end();
  }
}

async function expireOtp(phone: string) {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    await client.query(
      `update verification set "expiresAt" = now() - interval '1 minute'
       where identifier = $1`,
      [phone]
    );
  } finally {
    await client.end();
  }
}

// Cada corrida usa un número y un correo distintos para no chocar con la anterior.
function uniqueAccount() {
  const n = Math.floor(Math.random() * 900_000_000) + 100_000_000;
  return {
    phoneDigits: `3${String(n).padStart(9, "0")}`.slice(0, 10),
    email: `prueba.${Date.now()}.${n}@correo.com`,
  };
}

// Next añade su propio elemento con role="alert" para anunciar cambios de ruta,
// así que los errores del formulario se buscan dentro de la pantalla.
const alertIn = (page: Page) => page.getByRole("main").getByRole("alert");

async function fillRegistration(page: Page, email: string, phoneDigits: string) {
  await page.goto("/registro?rol=comprador");
  await page.getByLabel("Nombre").fill("Catalina Ríos");
  await page.getByLabel("Correo").fill(email);
  await page.getByLabel("Celular").fill(phoneDigits);
  await page.getByLabel("Contraseña").fill("unaClaveLarga1");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page).toHaveURL(/\/verificar/);
}

test("registro completo: crea la cuenta, confirma el celular y queda con sesión", async ({
  page,
}) => {
  const { email, phoneDigits } = uniqueAccount();
  await fillRegistration(page, email, phoneDigits);

  const code = await readOtp(`+57${phoneDigits}`);
  await page.getByLabel("Código de seis dígitos").fill(code);
  await page.getByRole("button", { name: "Confirmar celular" }).click();

  // D-04: la cabecera muestra el alias público, no el nombre completo.
  await expect(page.getByTestId("usuario")).toHaveText("Catalina R.");
});

test("cerrar sesión y volver a entrar con las mismas credenciales", async ({ page }) => {
  const { email, phoneDigits } = uniqueAccount();
  await fillRegistration(page, email, phoneDigits);
  const code = await readOtp(`+57${phoneDigits}`);
  await page.getByLabel("Código de seis dígitos").fill(code);
  await page.getByRole("button", { name: "Confirmar celular" }).click();
  await expect(page.getByTestId("usuario")).toBeVisible();

  await page.getByRole("button", { name: "Salir" }).click();
  await expect(page.getByRole("link", { name: "Entrar" })).toBeVisible();

  await page.goto("/ingresar");
  await page.getByLabel("Correo").fill(email);
  await page.getByLabel("Contraseña").fill("unaClaveLarga1");
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page.getByTestId("usuario")).toHaveText("Catalina R.");
});

test("un código equivocado se rechaza y deja reintentar", async ({ page }) => {
  const { email, phoneDigits } = uniqueAccount();
  await fillRegistration(page, email, phoneDigits);

  await page.getByLabel("Código de seis dígitos").fill("000000");
  await page.getByRole("button", { name: "Confirmar celular" }).click();
  await expect(alertIn(page)).toContainText("Ese código no es");

  const code = await readOtp(`+57${phoneDigits}`);
  await page.getByLabel("Código de seis dígitos").fill(code);
  await page.getByRole("button", { name: "Confirmar celular" }).click();
  await expect(page.getByTestId("usuario")).toBeVisible();
});

test("un código vencido se rechaza", async ({ page }) => {
  const { email, phoneDigits } = uniqueAccount();
  await fillRegistration(page, email, phoneDigits);

  const code = await readOtp(`+57${phoneDigits}`);
  await expireOtp(`+57${phoneDigits}`);

  await page.getByLabel("Código de seis dígitos").fill(code);
  await page.getByRole("button", { name: "Confirmar celular" }).click();
  await expect(alertIn(page)).toBeVisible();
  await expect(page.getByTestId("usuario")).toBeHidden();
});

test("el código de otro usuario no sirve", async ({ page }) => {
  const a = uniqueAccount();
  await fillRegistration(page, a.email, a.phoneDigits);
  const codeA = await readOtp(`+57${a.phoneDigits}`);

  const b = uniqueAccount();
  await fillRegistration(page, b.email, b.phoneDigits);

  await page.getByLabel("Código de seis dígitos").fill(codeA);
  await page.getByRole("button", { name: "Confirmar celular" }).click();
  await expect(alertIn(page)).toBeVisible();
  await expect(page.getByTestId("usuario")).toBeHidden();
});

test("un correo ya registrado no crea una segunda cuenta", async ({ page }) => {
  const { email, phoneDigits } = uniqueAccount();
  await fillRegistration(page, email, phoneDigits);

  const otro = uniqueAccount();
  await page.goto("/registro?rol=comprador");
  await page.getByLabel("Nombre").fill("Otra Persona");
  await page.getByLabel("Correo").fill(email);
  await page.getByLabel("Celular").fill(otro.phoneDigits);
  await page.getByLabel("Contraseña").fill("otraClaveLarga1");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Continuar" }).click();

  await expect(alertIn(page)).toContainText("ya tiene una cuenta");
});

test("una contraseña corta se rechaza en el servidor, no solo en la pantalla", async ({
  request,
}) => {
  // Salta la pantalla a propósito: el control tiene que estar en el servidor.
  const { email, phoneDigits } = uniqueAccount();
  const res = await request.post("/api/auth/sign-up/email", {
    headers: { origin: "http://localhost:3100" },
    data: {
      email,
      password: "corta",
      name: "Clave Corta",
      phoneNumber: `+57${phoneDigits}`,
    },
  });
  expect(res.status()).toBeGreaterThanOrEqual(400);
});

test("un celular que no es colombiano se rechaza antes de crear nada", async ({ page }) => {
  await page.goto("/registro?rol=comprador");
  await page.getByLabel("Nombre").fill("Numero Malo");
  await page.getByLabel("Correo").fill(uniqueAccount().email);
  await page.getByLabel("Celular").fill("123");
  await page.getByLabel("Contraseña").fill("unaClaveLarga1");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(alertIn(page)).toContainText("celular colombiano");
});

test("el sexto código pedido para el mismo celular se bloquea", async ({ page }) => {
  // Sin este límite, el endpoint que manda SMS es una factura abierta. Se cuenta
  // por número y no por dirección IP a propósito: detrás de una misma IP puede
  // haber un edificio entero de usuarios legítimos.
  const { email, phoneDigits } = uniqueAccount();
  await fillRegistration(page, email, phoneDigits); // envío 1

  for (let i = 0; i < 4; i++) {
    await page.getByRole("button", { name: "No me llegó, mandar otro" }).click();
    await expect(page.getByRole("status")).toBeVisible();
  }

  await page.getByRole("button", { name: "No me llegó, mandar otro" }).click();
  await expect(alertIn(page)).toContainText("demasiados códigos");
});
