import { test, expect } from "@playwright/test";
import { sellerWithListing } from "./helpers";

// Revisión de diseño (D-130, decisión 5 de Nicolás): cuando una foto no carga, la
// tarjeta mostraba el ícono de imagen rota; cuando el video no carga, la ficha se
// quedaba en «0:00» diciendo «Grabado por el vendedor». Los artículos de
// `sellerWithListing` apuntan a archivos que no existen (seed/demo.*): sirven justo
// para esto.

test("una foto que no carga se cambia por «Sin foto»", async ({ browser, page }) => {
  const titulo = `Foto rota ${Date.now()}`;
  const { context } = await sellerWithListing(browser, titulo, 55_000, "ropa");
  await context.close();
  await page.goto(`/buscar?q=${encodeURIComponent(titulo)}`);
  const tarjeta = page.getByRole("main").getByRole("listitem").filter({ hasText: titulo });
  await expect(tarjeta.getByText("Sin foto")).toBeVisible();
  await expect(tarjeta.locator("img")).toHaveCount(0);
});

test("un video que no carga lo dice en la ficha", async ({ browser, page }) => {
  const titulo = `Video roto ${Date.now()}`;
  const { context, listingId } = await sellerWithListing(browser, titulo, 55_000, "ropa");
  await context.close();
  await page.goto(`/producto/${listingId}`);
  await expect(page.getByTestId("video-no-cargo")).toHaveText("El video no cargó. Intenta de nuevo más tarde.");
  await expect(page.getByText("Grabado por el vendedor")).toHaveCount(0);
});
