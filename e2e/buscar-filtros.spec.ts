import { test, expect, type Page } from "@playwright/test";
import { hidratado, soloDe } from "./helpers";

// Corrección 3 (Catalina, 2026-09-22): en la búsqueda los filtros eran un bloque
// plegable encima de los resultados que, abierto, se comía la pantalla. Ahora en
// el teléfono van en el panel lateral y en escritorio en una columna fija.
//
// Sembrados: Chaqueta de jean (ropa, $95.000), Coche Chicco (niños, $260.000),
// iPhone 13 (tecnología, $1.850.000).

const tarjeta = (page: Page, texto: string) =>
  page.getByRole("main").getByRole("listitem").filter({ hasText: texto });
const botonFiltros = (page: Page) => page.getByRole("main").getByRole("link", { name: /^Filtros/ });
const columna = (page: Page) => page.getByRole("complementary", { name: "Filtros" });

test.describe("en el teléfono", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("los resultados van primero y los filtros en el panel", async ({ page }) => {
    await page.goto("/buscar?categoria=ropa");
    await expect(columna(page)).toBeHidden();
    await expect(page.getByRole("main").getByRole("listitem").first()).toBeInViewport();
    await expect(botonFiltros(page)).toContainText("1");

    await hidratado(botonFiltros(page));
    await botonFiltros(page).click();
    const panel = page.getByRole("dialog", { name: "Filtros" });
    await expect(panel.getByLabel("Ropa")).toBeChecked();
    await panel.getByLabel("Artículos para niños").check();
    await panel.getByRole("button", { name: /^Ver \d+ resultados?$/ }).click();

    await expect(page).toHaveURL(/\/buscar\?categoria=ropa&categoria=ninos$/);
    await soloDe(page, "Ropa", "Artículos para niños");
  });

  test("el panel conserva la palabra buscada", async ({ page }) => {
    await page.goto("/buscar?q=chaqueta");
    await hidratado(botonFiltros(page));
    await botonFiltros(page).click();
    const panel = page.getByRole("dialog", { name: "Filtros" });
    await panel.getByLabel("Ropa").check();
    await panel.getByRole("button", { name: /^Ver \d+ resultados?$/ }).click();
    await expect(page).toHaveURL(/q=chaqueta/);
    await expect(page).toHaveURL(/categoria=ropa/);
    await expect(tarjeta(page, "Chaqueta de jean")).toHaveCount(1);
  });

  test.describe("sin JavaScript", () => {
    test.use({ javaScriptEnabled: false });

    test("el botón lleva a los filtros, que se muestran y funcionan", async ({ page }) => {
      await page.goto("/buscar");
      await expect(botonFiltros(page)).toHaveAttribute("href", "#filtros");
      await expect(columna(page)).toBeVisible();
      await columna(page).getByLabel("Artículos para niños").check();
      await columna(page).getByRole("button", { name: "Aplicar" }).click();
      await expect(page).toHaveURL(/categoria=ninos/);
      await soloDe(page, "Artículos para niños");
    });
  });
});

test.describe("en escritorio", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("los filtros quedan fijos a la izquierda de la grilla", async ({ page }) => {
    await page.goto("/buscar");
    await expect(columna(page)).toBeVisible();
    await expect(botonFiltros(page)).toBeHidden();

    const filtros = await columna(page).boundingBox();
    const primera = await page.getByRole("main").getByRole("listitem").first().boundingBox();
    expect(filtros!.x + filtros!.width).toBeLessThanOrEqual(primera!.x);

    await columna(page).getByLabel("Tecnología").check();
    await columna(page).getByRole("button", { name: "Aplicar" }).click();
    await expect(page).toHaveURL(/categoria=tecnologia/);
    await soloDe(page, "Tecnología");
    await expect(columna(page).getByLabel("Tecnología")).toBeChecked();
  });
  // Luna, fila 3: la columna no se quedaba fija y «Aplicar» quedaba bajo el pliegue.
  test("la columna se queda a la vista al bajar, con «Aplicar» alcanzable", async ({ page }) => {
    await page.goto("/buscar");
    const aplicar = columna(page).getByRole("button", { name: "Aplicar" });
    await expect(aplicar).toBeInViewport();
    await page.mouse.wheel(0, 1500);
    await expect(columna(page).getByRole("heading", { name: "Filtros" })).toBeInViewport();
    await expect(aplicar).toBeInViewport();
  });
});

test("buscar otra palabra no borra los filtros puestos", async ({ page }) => {
  await page.goto("/buscar?categoria=ropa&max=200000");
  await page.getByRole("main").getByLabel("Buscar").fill("jean");
  await page.getByRole("button", { name: "Buscar", exact: true }).click();
  await expect(page).toHaveURL(/q=jean/);
  await expect(page).toHaveURL(/categoria=ropa/);
  await expect(page).toHaveURL(/max=200000/);
  await expect(tarjeta(page, "Chaqueta de jean")).toHaveCount(1);
});

// Revisión de diseño (D-130, decisión 3 de Nicolás): en el celular el panel era
// angosto y, una vez aplicados, no se veía qué filtros estaban puestos. Ahora el panel
// ocupa la pantalla y arriba de los resultados quedan como etiquetas con X.
test.describe("filtros puestos", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("el panel ocupa toda la pantalla del teléfono", async ({ page }) => {
    await page.goto("/buscar");
    await hidratado(botonFiltros(page));
    await botonFiltros(page).click();
    const panel = page.getByRole("dialog", { name: "Filtros" });
    await expect(panel).toBeVisible();
    await expect.poll(async () => Math.round((await panel.boundingBox())!.width)).toBe(390);
    await expect(panel.getByLabel("Zona del vendedor")).toBeVisible();
    await expect(panel).toContainText("Dónde está quien vende");
  });

  test("cada filtro puesto se ve y se quita con su X", async ({ page }) => {
    await page.goto("/buscar?q=chaqueta&categoria=ropa&max=200000&verificados=1&estado=usado_bueno");
    const puestos = page.getByRole("group", { name: "Filtros puestos" });
    await expect(puestos.getByTestId("filtro-puesto")).toHaveText([
      "Ropa", "Hasta $ 200.000", "Usado, buen estado", "Solo verificados",
    ]);
    await expect(puestos.getByRole("link", { name: "Quitar todo" })).toBeVisible();
    await puestos.getByRole("link", { name: "Quitar Ropa" }).click();
    await expect(page).toHaveURL(/\/buscar\?q=chaqueta&max=200000&verificados=1&estado=usado_bueno$/);
    await expect(puestos.getByTestId("filtro-puesto")).toHaveCount(3);
    // «Quitar todo» conserva la palabra buscada.
    await puestos.getByRole("link", { name: "Quitar todo" }).click();
    await expect(page).toHaveURL(/\/buscar\?q=chaqueta$/);
    await expect(puestos).toHaveCount(0);
  });

  test("en la portada también, y sin JavaScript funcionan como enlaces", async ({ browser }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    await page.goto("/?categoria=ninos&min=50000");
    const puestos = page.getByRole("group", { name: "Filtros puestos" });
    await expect(puestos).toContainText("Artículos para niños");
    await expect(puestos).toContainText("Desde $ 50.000");
    await puestos.getByRole("link", { name: "Quitar Desde $ 50.000" }).click();
    await expect(page).toHaveURL(/\/\?categoria=ninos$/);
    await ctx.close();
  });
});
