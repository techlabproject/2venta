import { test, expect, type Page } from "@playwright/test";
import { Client } from "pg";
import { config } from "dotenv";
import { decryptCode } from "../src/features/auth/otp";
import { cerrarSesion, aceptarTerminos } from "./helpers";
import { VERSION_TERMINOS } from "../src/features/legal/version";

config({ path: ".env.local" });

// La prueba de punta a punta de la rebanada S-01.
// Ver slices/01-cuenta-telefono-verificado.md

// El código llega por SMS, que en desarrollo no existe. La prueba lo lee de la
// base de datos. Desde S-17 está cifrado (la D-27 quedó cerrada), así que la
// prueba lo descifra con el mismo secreto del servidor.
async function readOtp(phone: string): Promise<string> {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    const { rows } = await client.query<{ code_enc: string }>(
      `select code_enc from phone_codes where phone = $1`,
      [phone]
    );
    if (!rows[0]) throw new Error(`No hay código guardado para ${phone}`);
    return decryptCode(rows[0].code_enc)!;
  } finally {
    await client.end();
  }
}

async function expireOtp(phone: string) {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    await client.query(
      `update phone_codes set expires_at = now() - interval '1 minute'
       where phone = $1`,
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
  await page.getByLabel("Fecha de nacimiento").fill("1995-05-20");
  await aceptarTerminos(page);
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
  await expect(page.getByTestId("usuario")).toContainText("Catalina R.");
});

test("cerrar sesión y volver a entrar con las mismas credenciales", async ({ page }) => {
  const { email, phoneDigits } = uniqueAccount();
  await fillRegistration(page, email, phoneDigits);
  const code = await readOtp(`+57${phoneDigits}`);
  await page.getByLabel("Código de seis dígitos").fill(code);
  await page.getByRole("button", { name: "Confirmar celular" }).click();
  await expect(page.getByTestId("usuario")).toBeVisible();

  await cerrarSesion(page);
  await expect(page.getByRole("link", { name: "Entrar" })).toBeVisible();

  await page.goto("/ingresar");
  await page.getByLabel("Correo").fill(email);
  await page.getByLabel("Contraseña").fill("unaClaveLarga1");
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page.getByTestId("usuario")).toContainText("Catalina R.");
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
  await page.getByLabel("Fecha de nacimiento").fill("1995-05-20");
  await aceptarTerminos(page);
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
      termsVersion: VERSION_TERMINOS,
      birthDate: "1995-05-20",
    },
  });
  expect(res.status()).toBeGreaterThanOrEqual(400);
  expect((await res.json()).code).toMatch(/PASSWORD/);
});

test("un celular que no es colombiano se rechaza antes de crear nada", async ({ page }) => {
  await page.goto("/registro?rol=comprador");
  await page.getByLabel("Nombre").fill("Numero Malo");
  await page.getByLabel("Correo").fill(uniqueAccount().email);
  await page.getByLabel("Celular").fill("123");
  await page.getByLabel("Contraseña").fill("unaClaveLarga1");
  await page.getByLabel("Fecha de nacimiento").fill("1995-05-20");
  await aceptarTerminos(page);
  await page.getByRole("button", { name: "Continuar" }).click();
  // Desde la corrección 7 el aviso va debajo del campo y dice qué está mal.
  await expect(page.getByLabel("Celular")).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByText("Los celulares en Colombia empiezan por 3")).toBeVisible();
  await expect(page).toHaveURL(/\/registro/);
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

test("una contraseña corta dice en pantalla cuántos caracteres faltan", async ({
  page,
}) => {
  // Hallazgo de Luna, la verificadora independiente: el servidor rechazaba bien
  // pero la pantalla decía "No pudimos crear tu cuenta", que no le dice al usuario
  // qué arreglar. La prueba que ya existía solo miraba el código de estado, no el
  // mensaje, y por eso no lo vio.
  const { email, phoneDigits } = uniqueAccount();
  await page.goto("/registro?rol=comprador");
  await page.getByLabel("Nombre").fill("Clave Corta");
  await page.getByLabel("Correo").fill(email);
  await page.getByLabel("Celular").fill(phoneDigits);
  await page.getByLabel("Contraseña").fill("siete77");
  await page.getByLabel("Fecha de nacimiento").fill("1995-05-20");
  await aceptarTerminos(page);
  await page.getByRole("button", { name: "Continuar" }).click();

  await expect(alertIn(page)).toContainText("ocho caracteres");
});

test("una contraseña de puros espacios se rechaza en el servidor", async ({ request }) => {
  // La biblioteca solo mide el largo, así que ocho espacios le parecían válidos.
  // Salió sondeando el hallazgo de Luna sobre los mensajes de contraseña.
  const { email, phoneDigits } = uniqueAccount();
  const res = await request.post("/api/auth/sign-up/email", {
    headers: { origin: "http://localhost:3100" },
    data: {
      email,
      password: "        ",
      name: "Espacios",
      phoneNumber: `+57${phoneDigits}`,
      termsVersion: VERSION_TERMINOS,
      birthDate: "1995-05-20",
    },
  });
  expect(res.status()).toBeGreaterThanOrEqual(400);
  expect((await res.json()).code).toBe("PASSWORD_TOO_WEAK");
});

test("sin celular confirmado no se entra al circuito de vendedor", async ({ page }) => {
  // Hallazgo de Luna. Sin esto, alguien podía saltarse el código por SMS y aun así
  // verificar identidad y publicar, que es justo lo que la D-01 existe para impedir.
  const { email, phoneDigits } = uniqueAccount();
  await page.goto("/registro?rol=vendedor");
  await page.getByLabel("Nombre").fill("Sin Confirmar");
  await page.getByLabel("Correo").fill(email);
  await page.getByLabel("Celular").fill(phoneDigits);
  await page.getByLabel("Contraseña").fill("unaClaveLarga1");
  await page.getByLabel("Fecha de nacimiento").fill("1995-05-20");
  await aceptarTerminos(page);
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page).toHaveURL(/\/verificar/);

  // La cuenta existe y la sesión está abierta, pero el celular no está confirmado.
  await page.goto("/vender");
  await expect(page).toHaveURL(/\/verificar/);

  await page.goto("/publicar");
  await expect(page).toHaveURL(/\/verificar/);
});

test("entrar con Google no aparece si no hay credenciales configuradas", async ({
  page,
}) => {
  // El proveedor se registra solo cuando existen las dos variables de entorno. Sin
  // ellas la app no se rompe: simplemente no ofrece el botón.
  await page.goto("/ingresar");
  const hayCredenciales = Boolean(process.env.GOOGLE_CLIENT_ID);
  await expect(page.getByRole("button", { name: /Continuar con Google/ })).toHaveCount(
    hayCredenciales ? 1 : 0
  );
});

test("quien no tiene celular llega a la pantalla que se lo pide", async ({ page }) => {
  // Es el caso de quien entra con Google: trae correo, no número. La D-01 no admite
  // excepción, así que hay que pedírselo antes de dejarlo comprar o escribir.
  const { email, phoneDigits } = uniqueAccount();
  await page.goto("/registro?rol=comprador");
  await page.getByLabel("Nombre").fill("Sin Celular");
  await page.getByLabel("Correo").fill(email);
  await page.getByLabel("Celular").fill(phoneDigits);
  await page.getByLabel("Contraseña").fill("unaClaveLarga1");
  await page.getByLabel("Fecha de nacimiento").fill("1995-05-20");
  await aceptarTerminos(page);
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page).toHaveURL(/\/verificar/);

  // Se le quita el número, como si hubiera entrado con Google.
  const { Client } = await import("pg");
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  await client.query(`update "user" set "phoneNumber" = null where email = $1`, [email]);
  await client.end();

  await page.goto("/verificar");
  await expect(page.getByRole("heading", { name: "Falta tu celular" })).toBeVisible();
  await expect(page.getByLabel("Tu celular")).toBeVisible();
});

test("el código de verificación no queda en claro en la base", async ({ page }) => {
  // Cierra la D-27, que arrastraba desde S-01: la biblioteca lo guardaba en texto
  // plano y quien tuviera lectura de la base podía tomar el control de cualquier
  // cuenta durante los minutos que el código vive.
  const { email, phoneDigits } = uniqueAccount();
  await page.goto("/registro?rol=comprador");
  await page.getByLabel("Nombre").fill("Cifrado Uno");
  await page.getByLabel("Correo").fill(email);
  await page.getByLabel("Celular").fill(phoneDigits);
  await page.getByLabel("Contraseña").fill("unaClaveLarga1");
  await page.getByLabel("Fecha de nacimiento").fill("1995-05-20");
  await aceptarTerminos(page);
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page).toHaveURL(/\/verificar/);

  const code = await readOtp(`+57${phoneDigits}`);
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const { rows } = await client.query<{ code_enc: string }>(
    `select code_enc from phone_codes where phone = $1`,
    [`+57${phoneDigits}`]
  );
  await client.end();

  expect(rows[0].code_enc).not.toContain(code);
  expect(rows[0].code_enc).toMatch(/^[0-9a-f]+:[0-9a-f]+:[0-9a-f]+$/);
});

test("un código ya usado no sirve otra vez", async ({ page }) => {
  const { email, phoneDigits } = uniqueAccount();
  await page.goto("/registro?rol=comprador");
  await page.getByLabel("Nombre").fill("Cifrado Dos");
  await page.getByLabel("Correo").fill(email);
  await page.getByLabel("Celular").fill(phoneDigits);
  await page.getByLabel("Contraseña").fill("unaClaveLarga1");
  await page.getByLabel("Fecha de nacimiento").fill("1995-05-20");
  await aceptarTerminos(page);
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page).toHaveURL(/\/verificar/);

  const code = await readOtp(`+57${phoneDigits}`);
  await page.getByLabel("Código de seis dígitos").fill(code);
  await page.getByRole("button", { name: "Confirmar celular" }).click();
  await expect(page.getByTestId("usuario")).toBeVisible();

  // El código se consumió: la pantalla ya ni siquiera existe para esta cuenta.
  await page.goto("/verificar");
  await expect(page).toHaveURL(/^[^?]*\/$|\/$/);
});

// Hallazgo de la ronda de QA del 2026-09-13 (agente técnico, CRÍTICO): el mismo
// celular quedaba verificado en dos cuentas. La D-01 dice que el número
// verificado es lo que impide las cuentas desechables; con dos cuentas por
// número, no lo impedía.
test("un celular ya confirmado en otra cuenta no confirma una segunda", async ({
  browser,
}) => {
  const { phoneDigits } = uniqueAccount();
  const phone = `+57${phoneDigits}`;

  // Desde la corrección 13 un celular ya confirmado se rechaza al registrarse. Lo
  // que esta prueba cuida es la carrera: las dos cuentas se registran con el mismo
  // número antes de que alguna lo confirme, y la segunda confirmación no debe pasar.
  const a = await browser.newContext();
  const pageA = await a.newPage();
  await fillRegistration(pageA, uniqueAccount().email, phoneDigits);

  const b = await browser.newContext();
  const pageB = await b.newPage();
  const emailB = uniqueAccount().email;
  await fillRegistration(pageB, emailB, phoneDigits);

  await pageA.getByLabel("Código de seis dígitos").fill(await readOtp(phone));
  await pageA.getByRole("button", { name: "Confirmar celular" }).click();
  await expect(pageA.getByTestId("usuario")).toBeVisible();

  // Hay un código por celular y A ya lo usó: B pide uno nuevo, como haría cualquiera.
  await pageB.getByRole("button", { name: "No me llegó, mandar otro" }).click();
  await expect(pageB.getByRole("status")).toContainText("Te mandamos otro código");
  await pageB.getByLabel("Código de seis dígitos").fill(await readOtp(phone));
  await pageB.getByRole("button", { name: "Confirmar celular" }).click();
  await expect(alertIn(pageB)).toContainText("ya está confirmado en otra cuenta");

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    const { rows } = await client.query<{ n: string }>(
      `select count(*)::text as n from "user"
        where "phoneNumber" = $1 and "phoneNumberVerified"`,
      [phone]
    );
    expect(Number(rows[0].n)).toBe(1);
  } finally {
    await client.end();
  }
  await a.close();
  await b.close();
});
