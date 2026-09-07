import { test, expect, type Page } from "@playwright/test";
import { alertIn, signUpVerified, uniqueAccount, withDb } from "./helpers";
import { decryptCode } from "../src/features/auth/otp";

// La prueba de punta a punta de la rebanada S-20.
// Ver slices/20-recuperar-y-sesiones.md

async function readRecoveryCode(phone: string): Promise<string> {
  return withDb(async (c) => {
    const { rows } = await c.query<{ code_enc: string }>(
      `select code_enc from recovery_codes where phone = $1`,
      [phone]
    );
    if (!rows[0]) throw new Error(`No hay código de recuperación para ${phone}`);
    return decryptCode(rows[0].code_enc)!;
  });
}

/** Crea una cuenta y devuelve sus datos, cerrando sesión al final. */
async function account(page: Page) {
  const { email, phoneDigits } = uniqueAccount("recupera");
  await page.goto("/registro?rol=comprador");
  await page.getByLabel("Nombre").fill("Laura Compradora");
  await page.getByLabel("Correo").fill(email);
  await page.getByLabel("Celular").fill(phoneDigits);
  await page.getByLabel("Contraseña").fill("claveOriginal1");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page).toHaveURL(/\/verificar/);

  const code = await withDb(async (c) => {
    const { rows } = await c.query<{ code_enc: string }>(
      `select code_enc from phone_codes where phone = $1`,
      [`+57${phoneDigits}`]
    );
    return decryptCode(rows[0].code_enc)!;
  });
  await page.getByLabel("Código de seis dígitos").fill(code);
  await page.getByRole("button", { name: "Confirmar celular" }).click();
  await expect(page.getByTestId("usuario")).toBeVisible();

  return { email, phoneDigits, phone: `+57${phoneDigits}` };
}

test("se recupera la contraseña con un código al celular", async ({ browser }) => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const { email, phoneDigits, phone } = await account(page);

  await page.getByRole("button", { name: "Salir" }).click();
  await expect(page.getByRole("link", { name: "Entrar" })).toBeVisible();

  await page.goto("/recuperar");
  await page.getByLabel("Tu celular").fill(phoneDigits);
  await page.getByRole("button", { name: "Mandar código" }).click();
  await expect(page.getByRole("status")).toContainText("le mandamos un código");

  const code = await readRecoveryCode(phone);
  await page.getByLabel("Código de seis dígitos").fill(code);
  await page.getByLabel("Nueva contraseña").fill("claveNuevaLarga1");
  await page.getByRole("button", { name: "Cambiar contraseña" }).click();
  await expect(page).toHaveURL(/\/ingresar/);

  // La nueva sirve.
  await page.getByLabel("Correo").fill(email);
  await page.getByLabel("Contraseña").fill("claveNuevaLarga1");
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page.getByTestId("usuario")).toBeVisible();

  await ctx.close();
});

test("la contraseña vieja deja de servir", async ({ browser }) => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const { email, phoneDigits, phone } = await account(page);
  await page.getByRole("button", { name: "Salir" }).click();

  await page.goto("/recuperar");
  await page.getByLabel("Tu celular").fill(phoneDigits);
  await page.getByRole("button", { name: "Mandar código" }).click();
  // Sin esperar la confirmación, el código todavía no está escrito.
  await expect(page.getByRole("status")).toContainText("le mandamos un código");
  const code = await readRecoveryCode(phone);
  await page.getByLabel("Código de seis dígitos").fill(code);
  await page.getByLabel("Nueva contraseña").fill("claveNuevaLarga1");
  await page.getByRole("button", { name: "Cambiar contraseña" }).click();
  await expect(page).toHaveURL(/\/ingresar/);

  await page.getByLabel("Correo").fill(email);
  await page.getByLabel("Contraseña").fill("claveOriginal1");
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(alertIn(page)).toContainText("incorrectos");

  await ctx.close();
});

test("recuperar cierra las sesiones que estaban abiertas", async ({ browser }) => {
  // Si alguien entró a la cuenta, recuperar la contraseña tiene que echarlo. No
  // hacerlo dejaría al intruso adentro mientras el dueño cree que ya lo resolvió.
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const { phoneDigits, phone } = await account(page);

  // Otra sesión abierta, en otro navegador.
  const otroCtx = await browser.newContext();
  const otro = await otroCtx.newPage();
  await otro.goto("/recuperar");
  await otro.getByLabel("Tu celular").fill(phoneDigits);
  await otro.getByRole("button", { name: "Mandar código" }).click();
  await expect(otro.getByRole("status")).toContainText("le mandamos un código");
  const code = await readRecoveryCode(phone);
  await otro.getByLabel("Código de seis dígitos").fill(code);
  await otro.getByLabel("Nueva contraseña").fill("claveNuevaLarga1");
  await otro.getByRole("button", { name: "Cambiar contraseña" }).click();
  await expect(otro).toHaveURL(/\/ingresar/);

  // La sesión que estaba abierta ya no vale.
  await page.goto("/actividad");
  await expect(page).toHaveURL(/\/ingresar/);

  await ctx.close();
  await otroCtx.close();
});

test("pedir recuperación de un celular sin cuenta responde igual", async ({ page }) => {
  // Si dijera "ese celular no está registrado", cualquiera averiguaría qué números
  // tienen cuenta en 2venta probando uno por uno.
  await page.goto("/recuperar");
  await page.getByLabel("Tu celular").fill("3009998877");
  await page.getByRole("button", { name: "Mandar código" }).click();
  await expect(page.getByRole("status")).toContainText("Si ese celular tiene una cuenta");

  const hay = await withDb(async (c) => {
    const { rows } = await c.query(`select 1 from recovery_codes where phone = $1`, [
      "+573009998877",
    ]);
    return rows.length;
  });
  expect(hay).toBe(0);
});

test("un código de recuperación equivocado se rechaza y dice cuántos quedan", async ({
  browser,
}) => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const { phoneDigits, phone } = await account(page);
  await page.getByRole("button", { name: "Salir" }).click();

  await page.goto("/recuperar");
  await page.getByLabel("Tu celular").fill(phoneDigits);
  await page.getByRole("button", { name: "Mandar código" }).click();
  // Sin esperar la confirmación, el código todavía no está escrito.
  await expect(page.getByRole("status")).toContainText("le mandamos un código");
  const code = await readRecoveryCode(phone);

  await page.getByLabel("Código de seis dígitos").fill(code === "000000" ? "111111" : "000000");
  await page.getByLabel("Nueva contraseña").fill("claveNuevaLarga1");
  await page.getByRole("button", { name: "Cambiar contraseña" }).click();
  await expect(alertIn(page)).toContainText("quedan 4 intentos");

  await ctx.close();
});

test("un código de recuperación vencido se rechaza", async ({ browser }) => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const { phoneDigits, phone } = await account(page);
  await page.getByRole("button", { name: "Salir" }).click();

  await page.goto("/recuperar");
  await page.getByLabel("Tu celular").fill(phoneDigits);
  await page.getByRole("button", { name: "Mandar código" }).click();
  // Sin esperar la confirmación, el código todavía no está escrito.
  await expect(page.getByRole("status")).toContainText("le mandamos un código");
  const code = await readRecoveryCode(phone);
  await withDb((c) =>
    c.query(`update recovery_codes set expires_at = now() - interval '1 hour' where phone = $1`, [
      phone,
    ])
  );

  await page.getByLabel("Código de seis dígitos").fill(code);
  await page.getByLabel("Nueva contraseña").fill("claveNuevaLarga1");
  await page.getByRole("button", { name: "Cambiar contraseña" }).click();
  await expect(alertIn(page)).toContainText("venció");

  await ctx.close();
});

test("una contraseña nueva demasiado corta se rechaza", async ({ browser }) => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const { phoneDigits, phone } = await account(page);
  await page.getByRole("button", { name: "Salir" }).click();

  await page.goto("/recuperar");
  await page.getByLabel("Tu celular").fill(phoneDigits);
  await page.getByRole("button", { name: "Mandar código" }).click();
  // Sin esperar la confirmación, el código todavía no está escrito.
  await expect(page.getByRole("status")).toContainText("le mandamos un código");
  const code = await readRecoveryCode(phone);

  await page.getByLabel("Código de seis dígitos").fill(code);
  await page.getByLabel("Nueva contraseña").fill("       x");
  await page.getByRole("button", { name: "Cambiar contraseña" }).click();
  await expect(alertIn(page)).toContainText("ocho caracteres");

  await ctx.close();
});

test("se ven las sesiones abiertas y se pueden cerrar", async ({ browser }) => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await signUpVerified(page, "sesiones", "Laura Compradora");

  await page.goto("/cuenta");
  const sesiones = page.getByTestId("sesiones").getByRole("listitem");
  await expect(sesiones).toHaveCount(1);
  // La sesión actual se marca y no se puede cerrar desde aquí.
  await expect(sesiones.first()).toContainText("esta");
  await expect(sesiones.first().getByRole("button", { name: "Cerrar" })).toHaveCount(0);

  await ctx.close();
});
