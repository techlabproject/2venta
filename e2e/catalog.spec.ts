import { test, expect, type Page } from "@playwright/test";

// La prueba de punta a punta de la rebanada S-00.
// Ver slices/00-esqueleto-caminante.md

// Desde que la tarjeta del feed muestra los mismos datos que la ficha, buscar
// texto suelto encuentra ambas. Cada aserción dice explícitamente en qué región
// de la página espera encontrar el dato.
const detail = (page: Page) => page.getByRole("main").getByRole("definition");

test("la lista muestra los productos sembrados con precio en pesos", async ({ page }) => {
  await page.goto("/");
  // No se cuenta el total: las pruebas de publicar agregan artículos a la misma
  // base. Se comprueba que los sembrados estén y con el precio correcto.
  const cards = page.getByRole("main").getByRole("listitem");
  await expect(cards.filter({ hasText: "iPhone 13 128 GB" })).toContainText("$ 1.850.000");
  await expect(cards.filter({ hasText: "Chaqueta de jean talla M" })).toContainText("$ 95.000");
  await expect(cards.filter({ hasText: "Coche Chicco reclinable" })).toContainText("$ 260.000");
});

test("la ficha muestra el detalle y el alias del vendedor", async ({ page }) => {
  await page.goto("/");
  await page
    .getByRole("main")
    .getByRole("listitem")
    .filter({ hasText: "iPhone 13 128 GB" })
    .getByRole("link")
    .click();

  await expect(page).toHaveURL(/\/producto\//);
  await expect(page.getByRole("heading", { name: "iPhone 13 128 GB" })).toBeVisible();
  await expect(page.getByRole("main")).toContainText("$ 1.850.000");
  // D-04: alias y zona, nunca nombre completo ni dirección exacta.
  await expect(detail(page)).toContainText([
    "Tecnología",
    "Usado, buen estado",
    "Camila R.",
  ]);
  await expect(page.getByRole("main")).toContainText("Chapinero");
});

test("la ficha se sirve como HTML, sin depender de JavaScript del cliente", async ({
  browser,
}) => {
  // D-25: si el contenido no está en el HTML que llega del servidor, Google no lo
  // indexa, y con eso se cae el argumento entero de la decisión de tecnología.
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/");
  const href = await page
    .getByRole("main")
    .getByRole("listitem")
    .filter({ hasText: "iPhone 13 128 GB" })
    .getByRole("link")
    .getAttribute("href");
  await page.goto(href!);
  await expect(page.getByRole("heading", { name: "iPhone 13 128 GB" })).toBeVisible();
  await expect(detail(page)).toContainText(["Tecnología"]);
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

test("la marca aplica la tipografía y el color del manual", async ({ page }) => {
  await page.goto("/");
  // Opción 1 del manual: verde bosque de marca en la cabecera, Poppins en títulos.
  const header = page.getByRole("banner");
  await expect(header).toHaveCSS("background-color", "rgb(45, 89, 64)"); // #2D5940
  const heading = page.getByRole("heading", { name: "Cerca de ti" });
  await expect(heading).toHaveCSS("font-family", /Poppins/);
});
