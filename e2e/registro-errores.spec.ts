import { test, expect, type Page } from "@playwright/test";
import { aceptarTerminos, signUpVerified, uniqueAccount, withDb } from "./helpers";

// Corrección 13 (Catalina, 2026-09-22): el registro decía «No pudimos crear tu
// cuenta» sin decir por qué. Los errores de cada campo los cubren las filas 6 a 11;
// aquí, el celular que ya tiene cuenta y la falla desconocida.

async function llenarRegistro(page: Page, email: string, celular: string) {
  await page.goto("/registro");
  await page.getByLabel("Nombre").fill("Rosa Registro");
  await page.getByLabel("Correo").fill(email);
  await page.getByLabel("Celular").fill(celular);
  await page.getByLabel("Contraseña").fill("unaClaveLarga1");
  await page.getByLabel("Fecha de nacimiento").fill("1995-05-20");
  await aceptarTerminos(page);
}

const alerta = (page: Page) => page.getByRole("main").getByRole("alert");

test("un celular que ya tiene cuenta se avisa al registrarse, con salidas", async ({ browser, page }) => {
  const otro = await browser.newContext();
  const { email: primero } = await signUpVerified(await otro.newPage(), "dueno", "Dueño Celular");
  await otro.close();
  const celular = await withDb(async (c) => {
    const { rows } = await c.query<{ phoneNumber: string }>(
      `select "phoneNumber" from "user" where email = $1`,
      [primero],
    );
    return rows[0].phoneNumber.replace("+57", "");
  });

  const { email } = uniqueAccount("repetido");
  await llenarRegistro(page, email, celular);
  await page.getByRole("button", { name: "Continuar" }).click();

  await expect(alerta(page)).toContainText("Ese celular ya tiene una cuenta");
  await expect(alerta(page).getByRole("link", { name: "Iniciar sesión" })).toBeVisible();
  await expect(alerta(page).getByRole("link", { name: "Recuperar contraseña" })).toHaveAttribute("href", "/recuperar");
  await expect(page).toHaveURL(/\/registro/);
  const creadas = await withDb(async (c) => {
    const { rows } = await c.query(`select 1 from "user" where email = $1`, [email]);
    return rows.length;
  });
  expect(creadas).toBe(0);
});

test("una falla desconocida se dice con calidez, con código, y no borra lo escrito", async ({ page }) => {
  await page.route("**/api/auth/sign-up/email", (route) =>
    route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({ code: "ALGO_RARO", message: "boom" }),
    }),
  );
  const { email, phoneDigits } = uniqueAccount("rara");
  await llenarRegistro(page, email, phoneDigits);
  await page.getByRole("button", { name: "Continuar" }).click();

  await expect(alerta(page)).toContainText("Algo falló de nuestro lado");
  await expect(alerta(page)).toContainText("(Código: ALGO_RARO)");
  await expect(page.getByLabel("Correo")).toHaveValue(email);
  await expect(page.getByLabel("Nombre")).toHaveValue("Rosa Registro");
});

// Luna, fila 13: con el nombre vacío se creaba una cuenta sin nombre.
test("sin nombre no hay cuenta, ni por la pantalla ni por la API", async ({ page, request }) => {
  const { email, phoneDigits } = uniqueAccount("sinnombre");
  await llenarRegistro(page, email, phoneDigits);
  await page.getByLabel("Nombre").fill("   ");
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page).toHaveURL(/\/registro/);
  await expect(page.getByText("Escribe tu nombre.")).toBeVisible();

  const otro = uniqueAccount("sinnombreapi");
  const res = await request.post("/api/auth/sign-up/email", {
    headers: { origin: "http://localhost:3100" },
    data: {
      email: otro.email,
      password: "unaClaveLarga1",
      name: "   ",
      phoneNumber: `+57${otro.phoneDigits}`,
      termsVersion: "1",
      birthDate: "1995-05-20",
    },
  });
  expect((await res.json()).code).toBe("NAME_REQUIRED");
});
