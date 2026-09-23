import { test, expect, type Page } from "@playwright/test";
import { preciosVisibles, sellerWithListing } from "./helpers";

// Corrección 4 (Catalina, 2026-09-22): «Desde» y «Hasta» admitían letras. Ahora
// solo aceptan dígitos, se formatean en pesos y hay cuatro rangos rápidos.
//
// Sembrados: Chaqueta de jean ($95.000), Coche Chicco ($260.000), iPhone 13
// ($1.850.000).

const tarjeta = (page: Page, texto: string) =>
  page.getByRole("main").getByRole("listitem").filter({ hasText: texto });

async function abrirPanel(page: Page) {
  await page.goto("/");
  await page.getByRole("navigation", { name: "Atajos" }).getByRole("link", { name: /^Filtros/ }).click();
  return page.getByRole("dialog", { name: "Filtros" });
}

test("los campos de precio solo aceptan dígitos y ponen los puntos de miles", async ({ page }) => {
  const panel = await abrirPanel(page);
  const desde = panel.getByLabel("Precio mínimo");
  await desde.pressSequentially("12abc3-,.x4");
  await expect(desde).toHaveValue("1.234");
  await desde.fill("");
  await desde.pressSequentially("150000");
  await expect(desde).toHaveValue("150.000");
});

test("un rango rápido llena los dos campos, cuenta y filtra", async ({ page }) => {
  const panel = await abrirPanel(page);
  const rango = panel.getByRole("button", { name: "$50.000 a $200.000" });
  await rango.click();
  await expect(rango).toHaveAttribute("aria-pressed", "true");
  await expect(panel.getByLabel("Precio mínimo")).toHaveValue("50.000");
  await expect(panel.getByLabel("Precio máximo")).toHaveValue("200.000");

  await panel.getByRole("button", { name: /^Ver \d+ resultados?$/ }).click();
  await expect(page).toHaveURL(/min=50\.000&max=200\.000/);
  for (const p of await preciosVisibles(page)) {
    expect(p).toBeGreaterThanOrEqual(50_000);
    expect(p).toBeLessThanOrEqual(200_000);
  }
});

test("tocar el rango puesto lo quita, y los abiertos dejan un lado vacío", async ({ page }) => {
  const panel = await abrirPanel(page);
  const mas = panel.getByRole("button", { name: "Más de $1.000.000" });
  await mas.click();
  await expect(panel.getByLabel("Precio mínimo")).toHaveValue("1.000.000");
  await expect(panel.getByLabel("Precio máximo")).toHaveValue("");

  await mas.click();
  await expect(mas).toHaveAttribute("aria-pressed", "false");
  await expect(panel.getByLabel("Precio mínimo")).toHaveValue("");
});

test("avisa cuando el mínimo queda mayor que el máximo", async ({ page }) => {
  const panel = await abrirPanel(page);
  await panel.getByLabel("Precio mínimo").pressSequentially("300000");
  await panel.getByLabel("Precio máximo").pressSequentially("100000");
  await expect(panel.getByRole("status")).toContainText("mayor que el máximo");
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
  await expect(page.getByRole("main").getByLabel("Precio máximo").first()).toHaveValue("");
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
