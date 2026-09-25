import { expect, test } from "@playwright/test";
import { sellerWithListing, withDb } from "./helpers";

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

// Correcciones 30 y 31 (decisión de Nicolás): retirar pide confirmación, y lo
// retirado queda aparte y se puede volver a publicar.
test("retirar pide confirmación, y lo retirado se recupera desde Retiradas", async ({ browser }) => {
  const titulo = `Mesa de centro ${Date.now()}`;
  const { context, page, listingId } = await sellerWithListing(browser, titulo, 180_000);

  await page.goto("/vender/metricas");
  const tarjeta = page.getByTestId("metricas").getByRole("listitem").filter({ hasText: titulo });
  await tarjeta.getByRole("button", { name: "Retirar" }).click();

  // Cancelar no cambia nada.
  const dialogo = page.getByRole("dialog", { name: `¿Retirar «${titulo}»?` });
  await expect(dialogo).toContainText("la puedes volver a publicar");
  await dialogo.getByRole("button", { name: "Cancelar" }).click();
  await expect(dialogo).toBeHidden();
  await expect(tarjeta).toContainText("Activa");

  // Tocar fuera también cierra sin cambiar nada (Luna).
  await tarjeta.getByRole("button", { name: "Retirar" }).click();
  await expect(dialogo).toBeVisible();
  await page.mouse.click(5, 5);
  await expect(dialogo).toBeHidden();
  await expect(tarjeta).toContainText("Activa");

  await tarjeta.getByRole("button", { name: "Retirar" }).click();
  await dialogo.getByRole("button", { name: "Sí, retirarla" }).click();
  await expect(page.getByTestId("recien-retirada")).toContainText(titulo);

  // Queda en Retiradas, sin editar, con «Republicar».
  const retirada = page.getByTestId("retiradas").getByRole("listitem").filter({ hasText: titulo });
  await expect(retirada).toContainText("Retirada");
  await expect(retirada.getByRole("link", { name: "Editar" })).toHaveCount(0);
  await retirada.getByRole("button", { name: "Republicar" }).click();
  await expect(page.getByTestId("metricas").getByRole("listitem").filter({ hasText: titulo })).toContainText(
    "Activa",
  );
  const estado = await withDb(async (c) => {
    const { rows } = await c.query<{ status: string }>(`select status from listings where id = $1`, [listingId]);
    return rows[0].status;
  });
  expect(estado).toBe("activa");

  await context.close();
});

test("lo que estaba en revisión vuelve a revisión al republicarlo, no al catálogo", async ({ browser }) => {
  const titulo = `En revisión ${Date.now()}`;
  const { context, page, listingId } = await sellerWithListing(browser, titulo, 180_000);
  await withDb((c) => c.query(`update listings set status = 'en_revision' where id = $1`, [listingId]));

  await page.goto("/vender/metricas");
  const tarjeta = page.getByTestId("metricas").getByRole("listitem").filter({ hasText: titulo });
  await tarjeta.getByRole("button", { name: "Retirar" }).click();
  await page.getByRole("button", { name: "Sí, retirarla" }).click();
  await page
    .getByTestId("retiradas")
    .getByRole("listitem")
    .filter({ hasText: titulo })
    .getByRole("button", { name: "Republicar" })
    .click();
  await expect(page.getByTestId("metricas").getByRole("listitem").filter({ hasText: titulo })).toContainText(
    "En revisión",
  );

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

// Corrección 32 (decisión de Nicolás con Catalina): las visitas van en rango, no
// exactas; el detalle queda para un panel más completo a futuro.
test("las visitas se muestran en rango", async ({ browser }) => {
  const titulo = `Rango ${Date.now()}`;
  const { context, page, listingId } = await sellerWithListing(browser, titulo, 90_000);
  await withDb((c) =>
    c.query(
      `insert into listing_views (listing_id) select $1 from generate_series(1, 60)`,
      [listingId],
    ),
  );

  await page.goto("/vender/metricas");
  await expect(page.getByTestId(`vistas-${listingId}`)).toHaveText("50 a 100");
  await expect(page.getByTestId(`vistas-${listingId}`)).not.toHaveText(/60/);

  // El rango más largo cabe en un renglón del resumen en un celular (Luna).
  await withDb((c) =>
    c.query(
      `insert into listing_views (listing_id) select $1 from generate_series(1, 500)`,
      [listingId],
    ),
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  const resumen = page.getByTestId("resumen-visitas");
  await expect(resumen).toHaveText("Más de 500");
  const caja = await resumen.boundingBox();
  expect(caja!.height).toBeLessThan(30);

  await context.close();
});
