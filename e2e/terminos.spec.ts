import { test, expect } from "@playwright/test";
import { aceptarTerminos, signUpVerified, uniqueAccount, withDb } from "./helpers";
import { VERSION_TERMINOS } from "../src/features/legal/version";

// Corrección 11 (Catalina, 2026-09-24): la casilla de términos no llevaba a ningún
// texto. Ahora abre un panel con los Términos y la Política de datos (versión 1,
// borrador en revisión legal), se acepta desde su final, y se guarda qué versión
// aceptó cada persona y cuándo.

const panel = (page: import("@playwright/test").Page) =>
  page.getByRole("dialog", { name: "Términos y política de datos" });

test("la casilla abre el panel con lo que exige la ley, y se acepta al final", async ({ page }) => {
  await page.goto("/registro");
  const casilla = page.getByRole("checkbox", { name: /Leí y acepto/ });
  await casilla.click();
  await expect(panel(page)).toBeVisible();
  await expect(casilla).not.toBeChecked();

  for (const titulo of [
    "1. Quiénes somos",
    "7. Reclamos, devoluciones y retracto",
    "11. Peticiones, quejas y reclamos",
    "13. Política de tratamiento de datos personales",
    "14. Tu autorización",
  ]) {
    await expect(panel(page).getByRole("heading", { name: titulo })).toBeVisible();
  }
  await expect(panel(page).getByText(`Versión ${VERSION_TERMINOS} · Borrador en revisión legal`)).toBeVisible();
  await expect(panel(page).getByRole("link", { name: "www.sic.gov.co" })).toBeVisible();

  await panel(page).getByRole("button", { name: "Aceptar", exact: true }).click();
  await expect(panel(page)).toBeHidden();
  await expect(casilla).toBeChecked();
});

test("cerrar el panel sin aceptar no marca nada, y sin aceptar no hay cuenta", async ({ page }) => {
  const { email, phoneDigits } = uniqueAccount("sinterminos");
  await page.goto("/registro");
  await page.getByLabel("Nombre").fill("Sin Términos");
  await page.getByLabel("Correo").fill(email);
  await page.getByLabel("Celular").fill(phoneDigits);
  await page.getByLabel("Contraseña").fill("unaClaveLarga1");
  await page.getByLabel("Fecha de nacimiento").fill("1995-05-20");

  await page.getByRole("button", { name: "Términos y la Política de datos" }).click();
  await panel(page).getByRole("button", { name: "Cerrar los términos" }).click();
  await expect(page.getByRole("checkbox", { name: /Leí y acepto/ })).not.toBeChecked();

  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("lee y acepta los términos");
  await expect(panel(page)).toBeVisible();
  await expect(page).toHaveURL(/\/registro/);
});

test("se guarda la versión y la hora de aceptación, y se ve en «Tu cuenta»", async ({ page }) => {
  const antes = Date.now();
  const { email } = await signUpVerified(page, "acepto", "Ana Acepta");
  const fila = await withDb(async (c) => {
    const { rows } = await c.query<{ terms_version: string; terms_accepted_at: Date }>(
      `select terms_version, terms_accepted_at from "user" where email = $1`,
      [email],
    );
    return rows[0];
  });
  expect(fila.terms_version).toBe(VERSION_TERMINOS);
  expect(fila.terms_accepted_at.getTime()).toBeGreaterThanOrEqual(antes - 60_000);

  await page.goto("/cuenta");
  await expect(page.getByTestId("terminos-aceptados")).toContainText(`Aceptaste la versión ${VERSION_TERMINOS}`);
  await page.getByRole("link", { name: "Ver los términos y la política de datos" }).click();
  await expect(panel(page)).toBeVisible();
  await expect(panel(page).getByRole("button", { name: "Aceptar", exact: true })).toHaveCount(0);
});

test("el servidor no crea la cuenta sin la versión vigente ni deja cambiarla después", async ({ page, request }) => {
  const { email, phoneDigits } = uniqueAccount("apisinterminos");
  const sin = await request.post("/api/auth/sign-up/email", {
    headers: { origin: "http://localhost:3100" },
    data: { email, password: "unaClaveLarga1", name: "X", phoneNumber: `+57${phoneDigits}` },
  });
  expect(sin.status()).toBe(400);
  expect((await sin.json()).code).toBe("TERMS_REQUIRED");

  await signUpVerified(page, "cambia", "Carlos Cambia");
  const cambio = await page.request.post("/api/auth/update-user", {
    headers: { origin: "http://localhost:3100" },
    data: { termsVersion: "99" },
  });
  expect(cambio.status()).toBe(400);
  expect((await cambio.json()).code).toBe("TERMS_READONLY");
});

test.describe("sin JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("el texto completo está en /legal", async ({ page }) => {
    await page.goto("/legal");
    await expect(page.getByRole("heading", { name: "13. Política de tratamiento de datos personales" })).toBeVisible();
  });
});

test("aceptar desde el registro deja crear la cuenta", async ({ page }) => {
  const { email, phoneDigits } = uniqueAccount("acepta");
  await page.goto("/registro");
  await page.getByLabel("Nombre").fill("Acepta Todo");
  await page.getByLabel("Correo").fill(email);
  await page.getByLabel("Celular").fill(phoneDigits);
  await page.getByLabel("Contraseña").fill("unaClaveLarga1");
  await page.getByLabel("Fecha de nacimiento").fill("1995-05-20");
  await aceptarTerminos(page);
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page).toHaveURL(/\/verificar/);
});

// Hallazgos de Luna, fila 11 — decisiones de Nicolás.
test("un menor de 18 no puede crear cuenta, ni por la pantalla ni por la API", async ({ page, request }) => {
  const { email, phoneDigits } = uniqueAccount("menor");
  const hace17 = `${new Date().getFullYear() - 17}-01-01`;
  await page.goto("/registro");
  await page.getByLabel("Fecha de nacimiento").fill(hace17);
  await page.getByLabel("Nombre").click();
  await expect(page.getByText("Para usar 2venta debes tener 18 años o más.")).toBeVisible();

  const res = await request.post("/api/auth/sign-up/email", {
    headers: { origin: "http://localhost:3100" },
    data: {
      email,
      password: "unaClaveLarga1",
      name: "Menor",
      phoneNumber: `+57${phoneDigits}`,
      termsVersion: VERSION_TERMINOS,
      birthDate: hace17,
    },
  });
  expect(res.status()).toBe(400);
  expect((await res.json()).code).toBe("UNDERAGE");
});

test("la verificación de identidad pide autorizar los datos biométricos y la guarda", async ({ page }) => {
  const { email } = await signUpVerified(page, "biometrico", "Beto Biométrico");
  await page.goto("/vender?tipo=natural");
  await page.getByLabel("Dirección de notificaciones").fill("Calle 72 # 10-34");
  const empezar = page.getByRole("button", { name: "Empezar verificación" });
  // Sin la casilla el navegador no envía (required); el servidor también la exige.
  await empezar.click();
  await expect(page).toHaveURL(/\/vender/);

  await page.getByLabel(/Autorizo que el proveedor/).check();
  await empezar.click();
  await expect(page).toHaveURL(/\/dev\/kyc\//);
  const consentimiento = await withDb(async (c) => {
    const { rows } = await c.query<{ biometric_consent_at: Date | null }>(
      `select k.biometric_consent_at from kyc_verifications k join "user" u on u.id = k.user_id where u.email = $1`,
      [email],
    );
    return rows[0]?.biometric_consent_at;
  });
  expect(consentimiento).toBeTruthy();
});

test("la API distingue una fecha imposible de un menor, y no deja cambiar la fecha", async ({ page, request }) => {
  const { email, phoneDigits } = uniqueAccount("fechaimposible");
  const res = await request.post("/api/auth/sign-up/email", {
    headers: { origin: "http://localhost:3100" },
    data: {
      email,
      password: "unaClaveLarga1",
      name: "Fecha Rara",
      phoneNumber: `+57${phoneDigits}`,
      termsVersion: VERSION_TERMINOS,
      birthDate: "1995-02-31",
    },
  });
  expect((await res.json()).code).toBe("INVALID_BIRTHDATE");

  await signUpVerified(page, "cambiafecha", "Carla Fecha");
  const cambio = await page.request.post("/api/auth/update-user", {
    headers: { origin: "http://localhost:3100" },
    data: { birthDate: "2000-01-01" },
  });
  expect((await cambio.json()).code).toBe("BIRTHDATE_READONLY");
});
