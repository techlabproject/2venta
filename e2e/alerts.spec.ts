import { test, expect, type Browser } from "@playwright/test";
import { approveKycFor, runWorkerOnce, sellerWithListing, signUpVerified, withDb } from "./helpers";

// La prueba de punta a punta de la rebanada S-15.
// Ver slices/15-alertas-metricas-precio.md

async function buyerWithSavedSearch(browser: Browser, params: string, label: string) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await signUpVerified(page, "comprador", "Laura Compradora");

  await page.goto(`/buscar?${params}`);
  await page.getByText("Avísame cuando aparezca algo así").click();
  await page.getByLabel("Nombre de la búsqueda").fill(label);
  await page.getByRole("button", { name: "Guardar" }).click();
  await expect(page.getByRole("status")).toContainText("Guardada");

  return { ctx, page };
}

/** Publica por la interfaz, que es lo que dispara los avisos. */
async function publish(browser: Browser, title: string, price: number, category = "ropa") {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const { email } = await signUpVerified(page, "vendedor", "Camila Vendedora");
  await approveKycFor(email);

  await page.goto("/publicar");
  await page.getByRole("button", { name: "Abrir cámara" }).click();
  await page.getByRole("button", { name: /^Grabar/ }).click();
  await page.getByRole("button", { name: "Terminar" }).click();
  await expect(page.getByRole("status")).toContainText("Video listo");
  await page.getByLabel("Título").fill(title);
  await page.getByLabel("Categoría").selectOption(category);
  await page.getByLabel("Precio").fill(String(price));
  await page.getByLabel("Descripción").fill("Descripción de prueba.");
  await page.getByRole("button", { name: "Publicar" }).click();
  await expect(page).toHaveURL(/\/producto\//);

  return { ctx, page, listingId: new URL(page.url()).pathname.split("/").pop()! };
}

test("una búsqueda guardada avisa cuando aparece algo que coincide", async ({
  browser,
}) => {
  const marca = Date.now();
  const buyer = await buyerWithSavedSearch(browser, "categoria=ropa", `Ropa ${marca}`);
  const seller = await publish(browser, `Camisa avisada ${marca}`, 70_000);

  // El aviso lo produce el worker, no la acción de publicar (D-51).
  await runWorkerOnce();
  await buyer.page.goto("/avisos");
  await expect(buyer.page.getByTestId("avisos")).toContainText(`Camisa avisada ${marca}`);

  await buyer.ctx.close();
  await seller.ctx.close();
});

test("el aviso respeta los filtros de la búsqueda guardada", async ({ browser }) => {
  const marca = Date.now();
  const buyer = await buyerWithSavedSearch(
    browser,
    "categoria=ropa&max=100000",
    `Ropa barata ${marca}`
  );

  const caro = await publish(browser, `Abrigo caro ${marca}`, 800_000);
  await runWorkerOnce();
  await buyer.page.goto("/avisos");
  await expect(buyer.page.getByRole("main")).not.toContainText(`Abrigo caro ${marca}`);

  const barato = await publish(browser, `Camisa barata ${marca}`, 60_000);
  await runWorkerOnce();
  await buyer.page.goto("/avisos");
  await expect(buyer.page.getByTestId("avisos")).toContainText(`Camisa barata ${marca}`);

  await buyer.ctx.close();
  await caro.ctx.close();
  await barato.ctx.close();
});

test("no avisa de la publicación de uno mismo", async ({ browser }) => {
  const marca = Date.now();
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const { email } = await signUpVerified(page, "ambos", "Camila Vendedora");
  await approveKycFor(email);

  await page.goto("/buscar?categoria=ropa");
  await page.getByText("Avísame cuando aparezca algo así").click();
  await page.getByLabel("Nombre de la búsqueda").fill(`Mi ropa ${marca}`);
  await page.getByRole("button", { name: "Guardar" }).click();
  await expect(page.getByRole("status")).toContainText("Guardada");

  await page.goto("/publicar");
  await page.getByRole("button", { name: "Abrir cámara" }).click();
  await page.getByRole("button", { name: /^Grabar/ }).click();
  await page.getByRole("button", { name: "Terminar" }).click();
  await expect(page.getByRole("status")).toContainText("Video listo");
  await page.getByLabel("Título").fill(`Propia ${marca}`);
  await page.getByLabel("Categoría").selectOption("ropa");
  await page.getByLabel("Precio").fill("55000");
  await page.getByLabel("Descripción").fill("Mía.");
  await page.getByRole("button", { name: "Publicar" }).click();
  await expect(page).toHaveURL(/\/producto\//);

  await page.goto("/avisos");
  await expect(page.getByRole("main")).not.toContainText(`Propia ${marca}`);

  await ctx.close();
});

test("no se avisa dos veces de la misma publicación", async ({ browser }) => {
  const marca = Date.now();
  const buyer = await buyerWithSavedSearch(browser, "categoria=ninos", `Niños ${marca}`);
  // Dos búsquedas guardadas del mismo usuario que coinciden con lo mismo.
  await buyer.page.goto("/buscar?categoria=ninos&estado=usado_bueno");
  await buyer.page.getByText("Avísame cuando aparezca algo así").click();
  await buyer.page.getByLabel("Nombre de la búsqueda").fill(`Niños usados ${marca}`);
  await buyer.page.getByRole("button", { name: "Guardar" }).click();
  await expect(buyer.page.getByRole("status")).toContainText("Guardada");

  const seller = await publish(browser, `Coche avisado ${marca}`, 200_000, "ninos");
  await runWorkerOnce();

  await buyer.page.goto("/avisos");
  const avisos = buyer.page.getByTestId("avisos").getByRole("listitem");
  await expect(avisos.filter({ hasText: `Coche avisado ${marca}` })).toHaveCount(1);

  await buyer.ctx.close();
  await seller.ctx.close();
});

test("una búsqueda guardada ajena no se puede borrar", async ({ browser }) => {
  const marca = Date.now();
  const dueño = await buyerWithSavedSearch(browser, "categoria=ropa", `Mía ${marca}`);
  const id = await withDb(async (c) => {
    const { rows } = await c.query<{ id: string }>(
      `select id from saved_searches where label = $1`,
      [`Mía ${marca}`]
    );
    return rows[0].id;
  });

  const otroCtx = await browser.newContext();
  const otro = await otroCtx.newPage();
  await signUpVerified(otro, "ajeno", "Persona Ajena");
  await otro.goto("/avisos");
  await otro.evaluate(async (searchId) => {
    const form = new FormData();
    form.set("id", searchId);
    await fetch("/avisos", { method: "POST", body: form }).catch(() => {});
  }, id);

  const sigue = await withDb(async (c) => {
    const { rows } = await c.query(`select 1 from saved_searches where id = $1`, [id]);
    return rows.length;
  });
  expect(sigue).toBe(1);

  await dueño.ctx.close();
  await otroCtx.close();
});

test("el vendedor ve las vistas de su publicación, sin contar las suyas", async ({
  browser,
}) => {
  const seller = await sellerWithListing(browser, `Visto ${Date.now()}`, 90_000, "ropa");

  // El vendedor abre su propia ficha tres veces: no cuentan.
  for (let i = 0; i < 3; i++) await seller.page.goto(`/producto/${seller.listingId}`);

  const anonCtx = await browser.newContext();
  const anon = await anonCtx.newPage();
  await anon.goto(`/producto/${seller.listingId}`);
  await anon.goto(`/producto/${seller.listingId}`);

  await seller.page.goto("/vender/metricas");
  await expect(seller.page.getByTestId(`vistas-${seller.listingId}`)).toHaveText("2");

  await seller.context.close();
  await anonCtx.close();
});

test("sin suficientes ventas no se sugiere un precio", async ({ browser }) => {
  // Un promedio de dos ventas es ruido presentado como consejo, y quien fija su
  // precio por un dato inventado se lleva la peor parte.
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const { email } = await signUpVerified(page, "vendedor", "Camila Vendedora");
  await approveKycFor(email);

  await page.goto("/publicar");
  await expect(page.getByTestId("precio-sugerido")).toHaveCount(0);

  await ctx.close();
});

test("sin sesión no se puede guardar una búsqueda", async ({ browser }) => {
  const anonCtx = await browser.newContext();
  const anon = await anonCtx.newPage();
  await anon.goto("/buscar?categoria=ropa");
  await expect(anon.getByText("Avísame cuando aparezca algo así")).toHaveCount(0);
  await anonCtx.close();
});
