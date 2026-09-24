import { test, expect } from "@playwright/test";
import { uniqueAccount, withDb, aceptarTerminos } from "./helpers";

// Corrección 6 (Catalina, 2026-09-22): el correo no se validaba. Con «cata@mail»
// el registro respondía «No pudimos crear tu cuenta» sin decir por qué. Ahora se
// revisa al salir del campo, se explica qué falta y se sugieren dominios comunes.

test("el caso de Catalina se explica al salir del campo y se va al corregirlo", async ({ page }) => {
  await page.goto("/registro");
  const correo = page.getByLabel("Correo");
  await correo.fill("cata@mail");
  // Mientras escribe no regaña.
  await expect(correo).not.toHaveAttribute("aria-invalid", "true");

  await page.getByLabel("Celular").click();
  await expect(correo).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByText("Le falta el final del dominio: ¿cata@mail.com?")).toBeVisible();

  await correo.fill("cata@mail.com");
  await expect(correo).not.toHaveAttribute("aria-invalid", "true");
  await expect(page.getByText("Le falta el final del dominio")).toHaveCount(0);
});

test("un correo mal escrito no deja registrarse y no crea la cuenta", async ({ page }) => {
  const { phoneDigits } = uniqueAccount("malo");
  const malo = `malo.${Date.now()}@correo`;
  await page.goto("/registro");
  await page.getByLabel("Nombre").fill("Mala Escritura");
  await page.getByLabel("Correo").fill(malo);
  await page.getByLabel("Celular").fill(phoneDigits);
  await page.getByLabel("Contraseña").fill("unaClaveLarga1");
  await page.getByLabel("Fecha de nacimiento").fill("1995-05-20");
  await aceptarTerminos(page);
  await page.getByRole("button", { name: "Continuar" }).click();

  await expect(page).toHaveURL(/\/registro/);
  await expect(page.getByLabel("Correo")).toBeFocused();
  await expect(page.getByLabel("Correo")).toHaveAttribute("aria-invalid", "true");
  const cuentas = await withDb(async (c) => {
    const { rows } = await c.query(`select 1 from "user" where email = $1`, [malo]);
    return rows.length;
  });
  expect(cuentas).toBe(0);
});

test("sugiere el dominio bien escrito y lo corrige con un toque", async ({ page }) => {
  await page.goto("/registro");
  const correo = page.getByLabel("Correo");
  await correo.fill("cata@gmial.com");
  await page.getByLabel("Nombre").click();
  await page.getByRole("button", { name: "cata@gmail.com" }).click();
  await expect(correo).toHaveValue("cata@gmail.com");
  await expect(page.getByText("¿Quisiste decir")).toHaveCount(0);
});

test("al entrar también se revisa antes de enviar", async ({ page }) => {
  await page.goto("/ingresar");
  let intentos = 0;
  page.on("request", (r) => {
    if (r.url().includes("/api/auth/sign-in")) intentos++;
  });
  await page.getByLabel("Correo").fill("laura2venta.demo");
  await page.getByLabel("Contraseña").fill("loquesea123");
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page.getByText("¡Uy! Le falta la @.")).toBeVisible();
  await expect(page).toHaveURL(/\/ingresar/);
  expect(intentos).toBe(0);
});

// Luna, fila 6.
test("un correo imposible no intenta entrar", async ({ page }) => {
  await page.goto("/ingresar");
  let intentos = 0;
  page.on("request", (r) => {
    if (r.url().includes("/api/auth/sign-in")) intentos++;
  });
  await page.getByLabel("Correo").fill("luna.@gmail.com");
  await page.getByLabel("Contraseña").fill("loquesea123");
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page.getByLabel("Correo")).toHaveAttribute("aria-invalid", "true");
  expect(intentos).toBe(0);
});

test("si el servidor recibe un correo inválido, lo dice en vez del error genérico", async ({ page }) => {
  // Simula quien se salta la pantalla: el correo se cambia en tránsito.
  await page.route("**/api/auth/sign-up/email", async (route) => {
    const cuerpo = JSON.parse(route.request().postData() ?? "{}");
    await route.continue({ postData: JSON.stringify({ ...cuerpo, email: "correo-invalido" }) });
  });
  const { email, phoneDigits } = uniqueAccount("transito");
  await page.goto("/registro");
  await page.getByLabel("Nombre").fill("Tránsito Raro");
  await page.getByLabel("Correo").fill(email);
  await page.getByLabel("Celular").fill(phoneDigits);
  await page.getByLabel("Contraseña").fill("unaClaveLarga1");
  await page.getByLabel("Fecha de nacimiento").fill("1995-05-20");
  await aceptarTerminos(page);
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("Ese correo no parece válido");
});
