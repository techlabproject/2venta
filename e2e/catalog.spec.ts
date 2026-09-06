import { test, expect } from "@playwright/test";

// La prueba de punta a punta de la rebanada S-00.
// Ver slices/00-esqueleto-caminante.md

test("la lista muestra los productos sembrados con precio en pesos", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "iPhone 13 128 GB" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Chaqueta de cuero talla M" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Mesa de comedor para cuatro" })).toBeVisible();
  await expect(page.getByText("$ 1.850.000")).toBeVisible();
});

test("la ficha muestra el detalle y el alias del vendedor", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "iPhone 13 128 GB" }).click();

  await expect(page.getByRole("heading", { name: "iPhone 13 128 GB" })).toBeVisible();
  await expect(page.getByText("$ 1.850.000")).toBeVisible();
  await expect(page.getByText("Tecnología")).toBeVisible();
  await expect(page.getByText("Usado, buen estado")).toBeVisible();
  await expect(page.getByText("Camila R. · Chapinero")).toBeVisible();
});

test("la ficha se sirve como HTML, sin depender de JavaScript del cliente", async ({
  browser,
}) => {
  // D-25: si el contenido no está en el HTML que llega del servidor, Google no lo
  // indexa, y con eso se cae el argumento entero de la decisión de tecnología.
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/");
  const href = await page.getByRole("link", { name: "iPhone 13 128 GB" }).getAttribute("href");
  await page.goto(href!);
  await expect(page.getByRole("heading", { name: "iPhone 13 128 GB" })).toBeVisible();
  await context.close();
});

test("un producto inexistente devuelve 404", async ({ page }) => {
  const res = await page.goto("/producto/00000000-0000-4000-8000-000000000000");
  expect(res?.status()).toBe(404);
});

test("un identificador con formato inválido devuelve 404, no un error de servidor", async ({
  page,
}) => {
  const res = await page.goto("/producto/no-es-un-uuid");
  expect(res?.status()).toBe(404);
});
