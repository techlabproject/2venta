import { test, expect } from "@playwright/test";
import { sellerWithListing, signUpVerified, withDb } from "./helpers";

// La prueba de punta a punta de la rebanada S-16.
// Ver slices/16-favoritos-y-filtros.md

test("guardar y quitar un favorito", async ({ browser }) => {
  const titulo = `Chaqueta guardada ${Date.now()}`;
  const seller = await sellerWithListing(browser, titulo, 90_000, "ropa");

  const ctx = await browser.newContext();
  const buyer = await ctx.newPage();
  await signUpVerified(buyer, "comprador", "Laura Compradora");

  await buyer.goto(`/producto/${seller.listingId}`);
  await buyer.getByTestId("favorito").click();
  await expect(buyer.getByTestId("favorito")).toHaveText("Guardado");

  await buyer.goto("/favoritos");
  await expect(buyer.getByTestId("favoritos")).toContainText(titulo);

  await buyer.goto(`/producto/${seller.listingId}`);
  await buyer.getByTestId("favorito").click();
  await expect(buyer.getByTestId("favorito")).toHaveText("Guardar");

  await buyer.goto("/favoritos");
  await expect(buyer.getByRole("main")).not.toContainText(titulo);

  await seller.context.close();
  await ctx.close();
});

test("guardar dos veces no duplica", async ({ browser }) => {
  const seller = await sellerWithListing(browser, `Botas ${Date.now()}`, 80_000, "ropa");
  const ctx = await browser.newContext();
  const buyer = await ctx.newPage();
  await signUpVerified(buyer, "comprador", "Laura Compradora");

  await buyer.goto(`/producto/${seller.listingId}`);
  await buyer.getByTestId("favorito").click();
  await expect(buyer.getByTestId("favorito")).toHaveText("Guardado");

  // Se llama la acción varias veces con el estado ya guardado.
  await buyer.evaluate(async (id) => {
    for (let i = 0; i < 2; i++) {
      const form = new FormData();
      form.set("listingId", id);
      await fetch(`/producto/${id}`, { method: "POST", body: form }).catch(() => {});
    }
  }, seller.listingId);

  const cuantos = await withDb(async (c) => {
    const { rows } = await c.query(`select 1 from favorites where listing_id = $1`, [
      seller.listingId,
    ]);
    return rows.length;
  });
  expect(cuantos).toBeLessThanOrEqual(1);

  await seller.context.close();
  await ctx.close();
});

test("un artículo vendido sigue en la lista, marcado como ya no disponible", async ({
  browser,
}) => {
  // Hacerlo desaparecer en silencio se siente como un error de la app, y al
  // comprador le sirve saber que eso que le gustaba ya se fue.
  const titulo = `Abrigo vendido ${Date.now()}`;
  const seller = await sellerWithListing(browser, titulo, 200_000, "ropa");
  const ctx = await browser.newContext();
  const buyer = await ctx.newPage();
  await signUpVerified(buyer, "comprador", "Laura Compradora");

  await buyer.goto(`/producto/${seller.listingId}`);
  await buyer.getByTestId("favorito").click();
  await expect(buyer.getByTestId("favorito")).toHaveText("Guardado");

  await withDb((c) =>
    c.query(`update listings set status = 'vendida' where id = $1`, [seller.listingId])
  );

  await buyer.goto("/favoritos");
  await expect(buyer.getByTestId("favoritos-vendidos")).toContainText(titulo);
  await expect(buyer.getByRole("main")).toContainText("Ya no están");

  await seller.context.close();
  await ctx.close();
});

test("el favorito cuenta en las métricas del vendedor", async ({ browser }) => {
  const seller = await sellerWithListing(browser, `Bufanda ${Date.now()}`, 40_000, "ropa");
  const ctx = await browser.newContext();
  const buyer = await ctx.newPage();
  await signUpVerified(buyer, "comprador", "Laura Compradora");

  await buyer.goto(`/producto/${seller.listingId}`);
  await buyer.getByTestId("favorito").click();
  await expect(buyer.getByTestId("favorito")).toHaveText("Guardado");

  await seller.page.goto("/vender/metricas");
  const fila = seller.page.getByRole("listitem").filter({ hasText: "Bufanda" });
  await expect(fila).toContainText("1");

  await seller.context.close();
  await ctx.close();
});

test("sin sesión no se puede guardar", async ({ browser }) => {
  const seller = await sellerWithListing(browser, `Gorra ${Date.now()}`, 30_000, "ropa");
  const anonCtx = await browser.newContext();
  const anon = await anonCtx.newPage();
  await anon.goto(`/producto/${seller.listingId}`);
  await expect(anon.getByTestId("favorito")).toHaveCount(0);

  const res = await anon.goto("/favoritos");
  expect(res?.url()).toMatch(/\/ingresar/);

  await seller.context.close();
  await anonCtx.close();
});

test("los favoritos de otro no se ven", async ({ browser }) => {
  const titulo = `Reloj privado ${Date.now()}`;
  const seller = await sellerWithListing(browser, titulo, 150_000, "ropa");

  const unoCtx = await browser.newContext();
  const uno = await unoCtx.newPage();
  await signUpVerified(uno, "uno", "Persona Uno");
  await uno.goto(`/producto/${seller.listingId}`);
  await uno.getByTestId("favorito").click();
  await expect(uno.getByTestId("favorito")).toHaveText("Guardado");

  const dosCtx = await browser.newContext();
  const dos = await dosCtx.newPage();
  await signUpVerified(dos, "dos", "Persona Dos");
  await dos.goto("/favoritos");
  await expect(dos.getByRole("main")).not.toContainText(titulo);

  await seller.context.close();
  await unoCtx.close();
  await dosCtx.close();
});
