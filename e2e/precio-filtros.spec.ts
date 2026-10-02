import { test, expect, type Page } from "@playwright/test";
import { hidratado, preciosVisibles, sellerWithListing } from "./helpers";

// Corrección 4 (Catalina, 2026-09-22): «Desde» y «Hasta» admitían letras. En la
// versión 3 (2026-10-01) Catalina pidió quitar las etiquetas de rango; Nicolás eligió
// un deslizador de dos puntas, como en otros sitios (D-129). Sin JavaScript quedan
// las dos casillas, que funcionan como formulario normal.
//
// Escalones: sin mínimo, 10.000, 20.000, 30.000, 50.000, 80.000, 100.000, 150.000,
// 200.000, 300.000, 500.000, 800.000, 1.000.000, 1.500.000, 2.000.000, 3.000.000,
// 5.000.000, sin máximo.
//
// Sembrados: Chaqueta de jean ($95.000), Coche Chicco ($260.000), iPhone 13
// ($1.850.000).

const tarjeta = (page: Page, texto: string) =>
  page.getByRole("main").getByRole("listitem").filter({ hasText: texto });

async function abrirPanel(page: Page, url = "/") {
  await page.goto(url);
  const boton = page.getByRole("navigation", { name: "Atajos" }).getByRole("link", { name: /^Filtros/ });
  await hidratado(boton);
  await boton.click();
  return page.getByRole("dialog", { name: "Filtros" });
}

test("el precio es un deslizador de dos puntas, sin etiquetas de rango", async ({ page }) => {
  const panel = await abrirPanel(page);
  await expect(panel.getByRole("slider", { name: "Precio mínimo" })).toBeVisible();
  await expect(panel.getByRole("slider", { name: "Precio máximo" })).toBeVisible();
  await expect(panel.getByRole("button", { name: /Menos de|Más de|\$50\.000 a/ })).toHaveCount(0);
  await expect(panel.getByTestId("rango-precio")).toHaveText("Cualquier precio");
});

test("mover las dos puntas cuenta, filtra y deja el rango en la dirección", async ({ page }) => {
  const panel = await abrirPanel(page);
  const minimo = panel.getByRole("slider", { name: "Precio mínimo" });
  const maximo = panel.getByRole("slider", { name: "Precio máximo" });
  await minimo.focus();
  for (let i = 0; i < 4; i++) await page.keyboard.press("ArrowRight");
  await expect(minimo).toHaveAttribute("aria-valuetext", "$ 50.000");
  await maximo.focus();
  for (let i = 0; i < 9; i++) await page.keyboard.press("ArrowLeft");
  await expect(maximo).toHaveAttribute("aria-valuetext", "$ 200.000");
  await expect(panel.getByTestId("rango-precio")).toHaveText("$ 50.000 – $ 200.000");

  await panel.getByRole("button", { name: /^Ver \d+ resultados?$/ }).click();
  await expect(page).toHaveURL(/min=50000&max=200000/);
  for (const p of await preciosVisibles(page)) {
    expect(p).toBeGreaterThanOrEqual(50_000);
    expect(p).toBeLessThanOrEqual(200_000);
  }
});

test("las puntas no se cruzan y en los extremos quedan sin límite", async ({ page }) => {
  const panel = await abrirPanel(page);
  const minimo = panel.getByRole("slider", { name: "Precio mínimo" });
  const maximo = panel.getByRole("slider", { name: "Precio máximo" });
  await minimo.focus();
  await page.keyboard.press("End");
  // La punta de abajo se detiene un escalón antes de la de arriba.
  await expect(minimo).toHaveAttribute("aria-valuetext", "$ 5.000.000");
  await expect(maximo).toHaveAttribute("aria-valuetext", "Sin máximo");
  await expect(panel.getByTestId("rango-precio")).toHaveText("Desde $ 5.000.000");
  await page.keyboard.press("Home");
  await expect(minimo).toHaveAttribute("aria-valuetext", "Sin mínimo");
  await maximo.focus();
  await page.keyboard.press("Home");
  await expect(maximo).toHaveAttribute("aria-valuetext", "$ 10.000");
  await expect(panel.getByTestId("rango-precio")).toHaveText("Hasta $ 10.000");
});

test("un precio de la dirección que no es un escalón se respeta tal cual", async ({ page }) => {
  const panel = await abrirPanel(page, "/?min=95000");
  await expect(panel.getByTestId("rango-precio")).toHaveText("Desde $ 95.000");
  await panel.getByRole("button", { name: /^Ver \d+ resultados?$/ }).click();
  await expect(page).toHaveURL(/min=95000/);
});

test("en la dirección, un precio con letras o negativo se ignora", async ({ page }) => {
  // Antes «-999999» filtraba por un mínimo de 999.999 y «1abc2» por 12.
  // Acotado con `q`: la grilla trae los 60 más recientes y las demás pruebas
  // crean artículos todo el tiempo.
  await page.goto("/buscar?q=chaqueta&min=-999999");
  await expect(tarjeta(page, "Chaqueta de jean")).toHaveCount(1);
  await page.goto("/buscar?q=iphone&min=1abc2&max=xyz");
  await expect(tarjeta(page, "iPhone 13")).toHaveCount(1);
  // Con puntos de miles, sí.
  await page.goto("/buscar?q=coche&min=200.000&max=%24%20300.000");
  await expect(tarjeta(page, "Coche Chicco")).toHaveCount(1);
  await page.goto("/buscar?q=chaqueta&min=200.000&max=%24%20300.000");
  await expect(tarjeta(page, "Chaqueta de jean")).toHaveCount(0);
});

test.describe("sin JavaScript", () => {
  test.use({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });

  test("los campos funcionan como un formulario normal", async ({ page }) => {
    await page.goto("/buscar");
    const columna = page.getByRole("complementary", { name: "Filtros" });
    await expect(columna.getByRole("button", { name: "$50.000 a $200.000" })).toHaveCount(0);
    await columna.getByLabel("Precio máximo").fill("100000");
    await columna.getByRole("button", { name: "Aplicar" }).click();
    await expect(page).toHaveURL(/max=100000/);
    for (const p of await preciosVisibles(page)) expect(p).toBeLessThanOrEqual(100_000);
  });
});

// Luna, fila 4.
test("un precio enorme no tumba la página", async ({ page, request }) => {
  for (const url of ["/?max=123.456.789.012", "/buscar?max=123.456.789.012", "/buscar?min=99999999999"]) {
    const res = await request.get(url);
    expect(res.status(), url).toBe(200);
  }
  const conteo = await request.get("/api/buscar/conteo?max=123456789012");
  expect(conteo.status()).toBe(200);
  // Un mínimo de veinte dígitos es «más que cualquier precio»: cero, no ignorado.
  const minimo = await request.get("/api/buscar/conteo?min=12345678901234567890");
  expect(await minimo.json()).toEqual({ total: 0 });
  const largo = await request.get(`/api/buscar/conteo?min=${"9".repeat(41)}`);
  expect(await largo.json()).toEqual({ total: 0 });

  // Un máximo enorme es «sin límite»: no esconde nada.
  await page.goto("/buscar?q=iphone&max=123.456.789.012");
  await expect(tarjeta(page, "iPhone 13")).toHaveCount(1);
});

test("un decimal en la dirección se ignora en vez de leerse como otro número", async ({ page }) => {
  await page.goto("/buscar?q=chaqueta&max=1.5");
  await expect(tarjeta(page, "Chaqueta de jean")).toHaveCount(1);
  await expect(page.getByTestId("rango-precio").first()).toHaveText("Cualquier precio");
});

test("los límites de los rangos incluyen el precio exacto", async ({ browser, request }) => {
  const titulo = `Borde cincuenta ${Date.now()}`;
  const { context } = await sellerWithListing(browser, titulo, 50_000, "ropa");
  await context.close();
  const q = encodeURIComponent(titulo);
  for (const rango of ["max=50.000", "min=50.000&max=200.000"]) {
    const res = await request.get(`/api/buscar/conteo?q=${q}&${rango}`);
    expect(await res.json(), rango).toEqual({ total: 1 });
  }
  const fuera = await request.get(`/api/buscar/conteo?q=${q}&min=50.001`);
  expect(await fuera.json()).toEqual({ total: 0 });
});
