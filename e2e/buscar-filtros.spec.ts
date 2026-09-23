import { test, expect, type Page } from "@playwright/test";
import { soloDe } from "./helpers";

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

    await botonFiltros(page).click();
    const panel = page.getByRole("dialog", { name: "Filtros" });
    await expect(panel.getByLabel("Ropa")).toBeChecked();
    await panel.getByLabel("Niños").check();
    await panel.getByRole("button", { name: /^Ver \d+ resultados?$/ }).click();

    await expect(page).toHaveURL(/\/buscar\?categoria=ropa&categoria=ninos$/);
    await soloDe(page, "Ropa", "Niños");
  });

  test("el panel conserva la palabra buscada", async ({ page }) => {
    await page.goto("/buscar?q=chaqueta");
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
      await columna(page).getByLabel("Niños").check();
      await columna(page).getByRole("button", { name: "Aplicar" }).click();
      await expect(page).toHaveURL(/categoria=ninos/);
      await soloDe(page, "Niños");
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
