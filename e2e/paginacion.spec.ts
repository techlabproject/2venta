import { test, expect } from "@playwright/test";
import { sellerWithListing, signUpVerified, withDb } from "./helpers";

// Correcciones 33 y 34 (decisión de Nicolás): 24 por página y «Ver más», que es un
// enlace de verdad (`?pagina=N` muestra los primeros N × 24): con JavaScript lo
// nuevo aparece debajo sin mover el scroll; sin JavaScript es una página que un
// buscador sigue (D-25).

/** Crea `n` publicaciones activas del vendedor, la más nueva al final. */
async function publicar(sellerId: string, marca: string, n: number) {
  await withDb((c) =>
    c.query(
      `insert into listings (seller_id, title, description, category, condition, price_cop,
                             video_path, poster_path, created_at)
       select $1, $2 || ' ' || g, 'Descripción de prueba.', 'ropa', 'usado_bueno', 50000 + g,
              'seed/demo.webm', 'seed/demo.jpg', now() - (($3 - g) || ' minutes')::interval
         from generate_series(1, $3) g`,
      [sellerId, marca, n],
    ),
  );
}

async function idDelVendedor(listingId: string) {
  return withDb(async (c) => {
    const { rows } = await c.query<{ seller_id: string }>(`select seller_id from listings where id = $1`, [listingId]);
    return rows[0].seller_id;
  });
}

test("la búsqueda trae 24 y «Ver más» agrega los siguientes debajo, sin volver arriba", async ({ browser, page }) => {
  const marca = `Paginado${Date.now()}`;
  const vendedor = await sellerWithListing(browser, `${marca} 0`, 50_000, "ropa");
  await publicar(await idDelVendedor(vendedor.listingId), marca, 29);
  await vendedor.context.close();

  await page.goto(`/buscar?q=${marca}`);
  const tarjetas = page.getByRole("main").getByRole("listitem").filter({ hasText: marca });
  await expect(tarjetas).toHaveCount(24);
  await expect(page.getByTestId("ver-mas")).toContainText("Ves 24 de 30 artículos");

  await page.getByRole("link", { name: "Ver más" }).scrollIntoViewIfNeeded();
  const antes = await page.evaluate(() => window.scrollY);
  await page.getByRole("link", { name: "Ver más" }).click();
  await expect(tarjetas).toHaveCount(30);
  await expect(page).toHaveURL(new RegExp(`q=${marca}.*pagina=2|pagina=2.*q=${marca}`));
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(antes / 2);
  // Ya no hay más.
  await expect(page.getByTestId("ver-mas")).toHaveCount(0);
});

test("«Ver más» funciona sin JavaScript (D-25)", async ({ browser }) => {
  const marca = `SinJs${Date.now()}`;
  const vendedor = await sellerWithListing(browser, `${marca} 0`, 50_000, "ropa");
  await publicar(await idDelVendedor(vendedor.listingId), marca, 25);
  await vendedor.context.close();

  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto(`/buscar?q=${marca}`);
  const tarjetas = page.getByRole("main").getByRole("listitem").filter({ hasText: marca });
  await expect(tarjetas).toHaveCount(24);
  await page.getByRole("link", { name: "Ver más" }).click();
  await expect(tarjetas).toHaveCount(26);
  await ctx.close();
});

test("un destacado viejo sigue arriba en la primera página", async ({ browser, page }) => {
  const marca = `Destacado${Date.now()}`;
  const vendedor = await sellerWithListing(browser, `${marca} viejo`, 50_000, "ropa");
  const sellerId = await idDelVendedor(vendedor.listingId);
  await withDb(async (c) => {
    await c.query(`update listings set created_at = now() - interval '30 days' where id = $1`, [vendedor.listingId]);
    await c.query(
      `insert into promotions (listing_id, seller_id, price_cop, status, provider, idempotency_key, starts_at, ends_at)
       values ($1, $2, 9900, 'activa', 'prueba', gen_random_uuid()::text, now(), now() + interval '7 days')`,
      [vendedor.listingId, sellerId],
    );
  });
  await publicar(sellerId, marca, 30);
  await vendedor.context.close();

  await page.goto(`/buscar?q=${marca}`);
  const primera = page.getByRole("main").getByRole("listitem").filter({ hasText: marca }).first();
  await expect(primera).toContainText(`${marca} viejo`);
});

test("en «Tus publicaciones» también van de a 24", async ({ browser }) => {
  const marca = `Mias${Date.now()}`;
  const vendedor = await sellerWithListing(browser, `${marca} 0`, 50_000, "ropa");
  await publicar(await idDelVendedor(vendedor.listingId), marca, 27);

  await vendedor.page.goto("/vender/metricas");
  const tarjetas = vendedor.page.getByTestId("metricas").getByRole("listitem");
  await expect(tarjetas).toHaveCount(24);
  await expect(vendedor.page.getByTestId("ver-mas")).toContainText("Ves 24 de 28 publicaciones");
  // El resumen cuenta todas, no solo las cargadas.
  await expect(vendedor.page.getByRole("main")).toContainText("Activas");
  await vendedor.page.getByRole("link", { name: "Ver más" }).click();
  await expect(tarjetas).toHaveCount(28);

  await vendedor.context.close();
});

test("la portada sin filtros ya no carga todo", async ({ page }) => {
  await page.goto("/");
  const total = await withDb(async (c) => {
    const { rows } = await c.query<{ n: number }>(`select count(*)::int as n from listings where status = 'activa'`);
    return rows[0].n;
  });
  const tarjetas = page.getByRole("main").getByRole("listitem");
  expect(await tarjetas.count()).toBeLessThanOrEqual(24);
  if (total > 24) await expect(page.getByTestId("ver-mas")).toBeVisible();
});

test("una búsqueda guardada desde la página 2 se guarda sin la página", async ({ browser, page }) => {
  // Luna (filas 33 y 34): guardar no mueve a nadie de donde está, pero la alerta
  // guardada es la búsqueda, no la página 2 de la búsqueda.
  const marca = `Guardada${Date.now()}`;
  const vendedor = await sellerWithListing(browser, `${marca} 0`, 50_000, "ropa");
  await publicar(await idDelVendedor(vendedor.listingId), marca, 30);
  await vendedor.context.close();

  const { email } = await signUpVerified(page, "guarda", "Gabriela Guarda");
  await page.goto(`/buscar?q=${marca}&orden=precio_desc&pagina=2`);
  await page.getByText("Avísame cuando aparezca algo así").click();
  await page.getByLabel("Nombre de la búsqueda").fill(`Alerta ${marca}`);
  await page.getByRole("button", { name: "Guardar", exact: true }).click();
  await expect(page.getByText("Guardada.")).toBeVisible();

  const params = await withDb(async (c) => {
    const { rows } = await c.query<{ params: string }>(
      `select s.params from saved_searches s join "user" u on u.id = s.user_id where u.email = $1`,
      [email],
    );
    return rows.map((r) => r.params);
  });
  expect(params).toEqual([`q=${marca}&orden=precio_desc`]);
});
