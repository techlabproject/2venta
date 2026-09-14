import { expect, test } from "@playwright/test";
import { sellerWithListing } from "./helpers";

// Ver slices/31-panel-y-navegacion.md
//
// Lo que de verdad se prueba aquí no es que la pantalla exista, sino que **se pueda
// llegar a ella siguiendo enlaces**. La versión anterior de /vender/metricas existía
// y funcionaba; el defecto era que ningún enlace de la interfaz llevaba hasta allá.

test("un vendedor llega a sus publicaciones y las gestiona desde ahí", async ({
  browser,
}) => {
  const { context, page } = await sellerWithListing(browser, "Consola usada", 420_000);

  // 1. Desde la portada, solo con lo que se ve en pantalla.
  await page.goto("/");
  await page.getByRole("link", { name: "Vender" }).click();
  await expect(page.getByRole("heading", { name: "Tu espacio de vendedor" })).toBeVisible();

  await page.getByRole("link", { name: "Tus publicaciones" }).click();
  await expect(page).toHaveURL(/\/vender\/metricas/);

  // 2. La tarjeta dice qué es, cuánto vale y en qué estado está.
  const tarjeta = page.getByTestId("metricas").getByRole("listitem").first();
  await expect(tarjeta.getByRole("link", { name: "Consola usada" })).toBeVisible();
  await expect(tarjeta).toContainText(/420\.000/);
  await expect(tarjeta).toContainText("Activa");

  // 3. Y se puede cambiar de estado sin salir de la pantalla, que era el hueco.
  await tarjeta.getByRole("button", { name: "Reservar" }).click();
  await expect(tarjeta).toContainText("Reservada");

  await tarjeta.getByRole("button", { name: "Republicar" }).click();
  await expect(tarjeta).toContainText("Activa");

  await context.close();
});

test("una publicación retirada ya no ofrece acciones", async ({ browser }) => {
  const { context, page } = await sellerWithListing(browser, "Mesa de centro", 180_000);

  await page.goto("/vender/metricas");
  const tarjeta = page.getByTestId("metricas").getByRole("listitem").first();
  await tarjeta.getByRole("button", { name: "Retirar" }).click();
  await expect(tarjeta).toContainText("Retirada");

  // Retirar es terminal (RF-17): ni editar ni volver a publicar.
  await expect(tarjeta.getByRole("button")).toHaveCount(0);
  await expect(tarjeta.getByRole("link", { name: "Editar" })).toHaveCount(0);

  await context.close();
});

test("en pantalla angosta la navegación cabe detrás de un solo botón", async ({
  browser,
}) => {
  const { context, page } = await sellerWithListing(browser, "Bicicleta vieja", 300_000);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const cabecera = page.getByRole("banner");
  // Cerrado, el menú no muestra sus enlaces: eso es lo que hacía que la cabecera
  // se partiera en dos renglones.
  await expect(cabecera.getByRole("link", { name: "Guardados" })).toBeHidden();

  await cabecera.locator("summary").click();
  await expect(cabecera.getByRole("link", { name: "Guardados" })).toBeVisible();
  await expect(cabecera.getByRole("link", { name: "Tus publicaciones" })).toBeVisible();

  await context.close();
});
