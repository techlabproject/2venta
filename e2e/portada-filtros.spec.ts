import { test, expect, type Page } from "@playwright/test";
import { soloDe } from "./helpers";

// Corrección 2 (Catalina, 2026-09-22): tocar una etiqueta de la portada llevaba a
// la pantalla de búsqueda con el formulario de filtros abierto. Ahora filtra en la
// portada misma, las etiquetas se suman y «Filtros» abre un panel lateral.
//
// Las demás pruebas crean artículos todo el tiempo, y una grilla filtrada trae los
// 60 más recientes: aquí no se busca un artículo sembrado concreto en una grilla sin
// palabra, se comprueba la categoría de TODAS las tarjetas. Cuando hace falta uno
// concreto, se acota con `q`.

const atajos = (page: Page) => page.getByRole("navigation", { name: "Atajos" });
const etiqueta = (page: Page, nombre: string) =>
  atajos(page).getByRole("link", { name: new RegExp(`^${nombre}`) });
const tarjetas = (page: Page) => page.getByRole("main").getByRole("listitem");
const tarjeta = (page: Page, texto: string) => tarjetas(page).filter({ hasText: texto });

/** Cuántos artículos dan unos filtros, contados por el servidor. */
async function contar(page: Page, qs: string): Promise<number> {
  const res = await page.request.get(`/api/buscar/conteo?${qs}`);
  return ((await res.json()) as { total: number }).total;
}

test("una etiqueta filtra en la portada y se quita tocándola otra vez", async ({ page }) => {
  await page.goto("/");
  await etiqueta(page, "Ropa").click();

  await expect(page).toHaveURL(/\/\?categoria=ropa$/);
  await expect(page.getByRole("heading", { name: /Compra usado/ })).toBeVisible();
  await expect(page.getByTestId("conteo")).toHaveText(/resultados?$/);
  await soloDe(page, "Ropa");
  await expect(etiqueta(page, "Ropa")).toHaveAttribute("aria-current", "true");

  await etiqueta(page, "Ropa").click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { name: "Cerca de ti" })).toBeVisible();
});

test("las etiquetas se suman entre sí", async ({ page }) => {
  // Sumar es exacto: dos categorías juntas dan lo de una más lo de la otra.
  const [ropa, ninos, juntas] = await Promise.all([
    contar(page, "categoria=ropa"),
    contar(page, "categoria=ninos"),
    contar(page, "categoria=ropa&categoria=ninos"),
  ]);
  expect(ropa).toBeGreaterThan(0);
  expect(ninos).toBeGreaterThan(0);
  expect(juntas).toBe(ropa + ninos);

  await page.goto("/");
  await etiqueta(page, "Ropa").click();
  await expect(page).toHaveURL(/categoria=ropa/);
  await etiqueta(page, "Niños").click();
  await expect(page).toHaveURL(/categoria=ropa&categoria=ninos/);
  await soloDe(page, "Ropa", "Niños");
  await expect(page.getByTestId("conteo")).toHaveText(new RegExp(`^${juntas} resultados?$`));
  await expect(etiqueta(page, "Ropa")).toHaveAttribute("aria-current", "true");
  await expect(etiqueta(page, "Niños")).toHaveAttribute("aria-current", "true");

  // «Verificados» encima: todas las tarjetas de vendedor verificado.
  await etiqueta(page, "Verificados").click();
  await expect(page).toHaveURL(/verificados=1/);
  for (const t of await tarjetas(page).allInnerTexts()) expect(t).toContain("Verificado");
});

test("«Verificados» deja fuera a un vendedor sin verificar", async ({ page }) => {
  // La chaqueta sembrada es de un vendedor sin verificar.
  await page.goto("/buscar?q=chaqueta");
  await expect(tarjeta(page, "Chaqueta de jean")).toHaveCount(1);
  await page.goto("/buscar?q=chaqueta&verificados=1");
  await expect(tarjeta(page, "Chaqueta de jean")).toHaveCount(0);
});

test("el panel de filtros cuenta en vivo y aplica en la portada", async ({ page }) => {
  await page.goto("/");
  await atajos(page).getByRole("link", { name: /^Filtros/ }).click();

  const panel = page.getByRole("dialog", { name: "Filtros" });
  await expect(panel).toBeVisible();
  await panel.getByLabel("Tecnología").check();
  await expect(panel.getByRole("button", { name: /^Ver \d+ resultados?$/ })).toBeVisible();
  // Algo imposible: tecnología por menos de mil pesos.
  await panel.getByLabel("Precio máximo").fill("999");
  await expect(panel.getByRole("button", { name: "Ningún resultado" })).toBeDisabled();

  await panel.getByLabel("Precio máximo").fill("");
  await expect(panel.getByRole("button", { name: /^Ver \d+ resultados?$/ })).toBeEnabled();
  await panel.getByRole("button", { name: /^Ver \d+ resultados?$/ }).click();

  await expect(panel).toBeHidden();
  await expect(page).toHaveURL(/\/\?categoria=tecnologia$/);
  await soloDe(page, "Tecnología");
  await expect(atajos(page).getByRole("link", { name: /^Filtros/ })).toContainText("1");
});

test("el panel se cierra sin aplicar nada", async ({ page }) => {
  await page.goto("/");
  await atajos(page).getByRole("link", { name: /^Filtros/ }).click();
  const panel = page.getByRole("dialog", { name: "Filtros" });
  await panel.getByLabel("Ropa").check();
  await panel.getByRole("button", { name: "Cerrar filtros" }).click();
  await expect(panel).toBeHidden();
  await expect(page).toHaveURL(/\/$/);
});

test.describe("sin JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("las etiquetas siguen filtrando y «Filtros» lleva a la búsqueda", async ({ page }) => {
    await page.goto("/?categoria=ninos");
    await soloDe(page, "Niños");
    await expect(atajos(page).getByRole("link", { name: /^Filtros/ })).toHaveAttribute(
      "href",
      "/buscar?categoria=ninos",
    );
  });
});

test("la búsqueda acepta varias categorías", async ({ page }) => {
  const [ropa, tecno] = await Promise.all([
    contar(page, "categoria=ropa"),
    contar(page, "categoria=tecnologia"),
  ]);
  await page.goto("/buscar?categoria=ropa&categoria=tecnologia");
  await soloDe(page, "Ropa", "Tecnología");
  await expect(page.getByTestId("conteo")).toHaveText(`${ropa + tecno} resultados`);
});

// Luna, fila 2: una categoría que no existe contaba como filtro puesto.
test("una categoría inventada en la dirección se ignora", async ({ page }) => {
  await page.goto("/?categoria=inventada");
  await expect(page.getByRole("heading", { name: "Cerca de ti" })).toBeVisible();
  await expect(atajos(page).getByRole("link", { name: /^Filtros/ })).not.toContainText(/\d/);

  await page.goto("/?categoria=inventada&categoria=ropa");
  await expect(etiqueta(page, "Ropa")).toHaveAttribute("aria-current", "true");
  await expect(atajos(page).getByRole("link", { name: /^Filtros/ })).toContainText("1");
  await soloDe(page, "Ropa");

  await page.goto("/buscar?q=iphone&categoria=inventada");
  await expect(tarjeta(page, "iPhone 13")).toHaveCount(1);
});

test("muchas categorías inventadas delante no se comen las válidas", async ({ page }) => {
  const basura = Array.from({ length: 18 }, (_, i) => `categoria=inventada${i + 1}`);
  const qs = [...basura.slice(0, 10), "categoria=ropa", "categoria=ninos", ...basura.slice(10)].join("&");
  await page.goto(`/?${qs}`);
  await expect(etiqueta(page, "Ropa")).toHaveAttribute("aria-current", "true");
  await expect(etiqueta(page, "Niños")).toHaveAttribute("aria-current", "true");
  await soloDe(page, "Ropa", "Niños");
});
