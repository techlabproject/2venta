import { test, expect, type Page } from "@playwright/test";
import { uniqueAccount, withDb, aceptarTerminos } from "./helpers";
import { decryptCode } from "../src/features/auth/otp";

// Corrección 8 (Catalina, 2026-09-22): el código de confirmación admitía letras.
// Ahora una caja grande que solo deja entrar seis dígitos, revisada al salir, y
// que no se confirma sola (cada intento fallido cuenta).

async function hastaVerificar(page: Page) {
  const { email, phoneDigits } = uniqueAccount("codigo");
  await page.goto("/registro");
  await page.getByLabel("Nombre").fill("Coda Código");
  await page.getByLabel("Correo").fill(email);
  await page.getByLabel("Celular").fill(phoneDigits);
  await page.getByLabel("Contraseña").fill("unaClaveLarga1");
  await page.getByLabel("Fecha de nacimiento").fill("1995-05-20");
  await aceptarTerminos(page);
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page).toHaveURL(/\/verificar/);
  return phoneDigits;
}

const intentos = (phoneDigits: string) =>
  withDb(async (c) => {
    const { rows } = await c.query<{ attempts: number }>(
      `select attempts from phone_codes where phone = $1`,
      [`+57${phoneDigits}`],
    );
    return rows[0].attempts;
  });

test("solo entran seis dígitos, también al pegar el SMS entero", async ({ page }) => {
  const phoneDigits = await hastaVerificar(page);
  const codigo = page.getByLabel("Código de seis dígitos");
  await codigo.pressSequentially("12ab3-4");
  await expect(codigo).toHaveValue("1234");
  for (const sms of [
    "Tu código de 2venta es 482913. No lo compartas.",
    "Tu código de 2venta es 482-913. No lo compartas.",
    "Tu código de 2venta es 482 913.",
    "Tu código de 2venta es 482.913. No lo compartas.",
    "Fecha 2026-09-23, hora 14:30. Tu código de 2venta es 482-913. No lo compartas.",
  ]) {
    await codigo.fill(sms);
    await expect(codigo, sms).toHaveValue("482913");
  }
  // El número se muestra como se dice, no como se guarda.
  const d = phoneDigits;
  await expect(page.getByText(`+57 ${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`)).toBeVisible();
});

test("incompleto: lo dice al salir y no gasta un intento al tocar Confirmar", async ({ page }) => {
  const phoneDigits = await hastaVerificar(page);
  const codigo = page.getByLabel("Código de seis dígitos");
  await codigo.fill("1234");
  await page.getByRole("button", { name: "Confirmar celular" }).focus();
  await expect(page.getByText("Te faltan 2 dígitos: el código tiene 6.")).toBeVisible();

  await page.getByRole("button", { name: "Confirmar celular" }).click();
  await expect(page).toHaveURL(/\/verificar/);
  await expect(codigo).toBeFocused();
  expect(await intentos(phoneDigits)).toBe(0);
});

test("con seis dígitos no se confirma solo: lo decide el botón", async ({ page }) => {
  const phoneDigits = await hastaVerificar(page);
  const bueno = await withDb(async (c) => {
    const { rows } = await c.query<{ code_enc: string }>(
      `select code_enc from phone_codes where phone = $1`,
      [`+57${phoneDigits}`],
    );
    return decryptCode(rows[0].code_enc)!;
  });
  await page.getByLabel("Código de seis dígitos").fill(bueno);
  await page.waitForTimeout(1_000);
  await expect(page).toHaveURL(/\/verificar/);

  await page.getByRole("button", { name: "Confirmar celular" }).click();
  await expect(page.getByTestId("usuario")).toBeVisible();
});

test("el código de recuperar contraseña usa la misma caja", async ({ page }) => {
  await page.goto("/recuperar");
  await page.getByLabel("Tu celular").fill("3001110003");
  await page.getByRole("button", { name: "Mandar código" }).click();
  const codigo = page.getByLabel("Código de seis dígitos");
  await codigo.pressSequentially("9x8y7");
  await expect(codigo).toHaveValue("987");
});
