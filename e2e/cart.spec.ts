import { test, expect, type Browser, type Page } from "@playwright/test";
import { alertIn, signUpVerified, withDb, sellerWithListing } from "./helpers";

// La prueba de punta a punta de la rebanada S-22.
// Ver slices/22-carrito.md

/** Un vendedor con varios artículos, para poder juntarlos en un pedido. */
async function sellerWithMany(browser: Browser, titles: string[], price: number) {
  const seller = await sellerWithListing(browser, titles[0], price, "ropa");
  const sellerId = await withDb(async (c) => {
    const { rows } = await c.query<{ seller_id: string }>(
      `select seller_id from listings where id = $1`,
      [seller.listingId]
    );
    return rows[0].seller_id;
  });

  const ids = [seller.listingId];
  for (const title of titles.slice(1)) {
    const id = await withDb(async (c) => {
      const { rows } = await c.query<{ id: string }>(
        `insert into listings (seller_id, title, description, category, condition,
                               price_cop, video_path, poster_path)
         values ($1, $2, 'Prenda de prueba.', 'ropa', 'usado_bueno', $3,
                 'seed/demo.webm', 'seed/demo.jpg')
         returning id`,
        [sellerId, title, price]
      );
      return rows[0].id;
    });
    ids.push(id);
  }
  return { ...seller, sellerId, ids };
}

async function addAll(page: Page, ids: string[]) {
  for (const id of ids) {
    await page.goto(`/producto/${id}`);
    await page.getByRole("button", { name: "Agregar al carrito" }).click();
    await expect(page.getByRole("main")).toContainText("Está en tu carrito");
  }
}

test("tres artículos del mismo vendedor se pagan en un solo pedido", async ({
  browser,
}) => {
  const marca = Date.now();
  const seller = await sellerWithMany(
    browser,
    [`Camiseta A ${marca}`, `Camiseta B ${marca}`, `Camiseta C ${marca}`],
    30_000
  );

  const ctx = await browser.newContext();
  const buyer = await ctx.newPage();
  await signUpVerified(buyer, "comprador", "Laura Compradora");
  await addAll(buyer, seller.ids);

  await buyer.goto("/carrito");
  await expect(buyer.getByTestId("carrito").getByRole("listitem")).toHaveCount(3);
  await expect(buyer.getByTestId("subtotal")).toHaveText("$ 90.000");

  await buyer.getByRole("link", { name: "Ir a pagar" }).click();
  await expect(buyer).toHaveURL(/\/comprar\/carrito/);
  // Un solo envío: 90.000 + 12.000.
  await expect(buyer.getByTestId("total-checkout")).toHaveText("$ 102.000");

  await buyer.getByLabel("Quién recibe").fill("Laura Torres");
  await buyer.getByLabel("Celular de quien recibe").fill("300 412 88 05");
  await buyer.getByLabel("Dirección").fill("Calle 72 #10-34");
  await buyer.getByLabel("Zona").selectOption("Chapinero");
  await buyer.getByRole("button", { name: "Ir a pagar" }).click();
  await expect(buyer).toHaveURL(/\/dev\/pago\//);
  await buyer.getByRole("button", { name: "Simular pago aprobado" }).click();
  await expect(buyer).toHaveURL(/\/pedido\//);

  // Los tres artículos están en el pedido.
  for (const t of ["Camiseta A", "Camiseta B", "Camiseta C"]) {
    await expect(buyer.getByRole("main")).toContainText(t);
  }

  await seller.context.close();
  await ctx.close();
});

test("la comisión se cobra una vez sobre el total, no una por prenda", async ({
  browser,
}) => {
  // Es la mitigación de la D-09c: el piso de $2.500 equivale a más del 8% en una
  // camiseta de $30.000. Comprando tres juntas se cobra 5% de 90.000.
  const marca = Date.now();
  const seller = await sellerWithMany(
    browser,
    [`Prenda A ${marca}`, `Prenda B ${marca}`, `Prenda C ${marca}`],
    30_000
  );

  const ctx = await browser.newContext();
  const buyer = await ctx.newPage();
  await signUpVerified(buyer, "comprador", "Laura Compradora");
  await addAll(buyer, seller.ids);

  await buyer.goto("/carrito");
  // Tres pisos de 2.500 son 7.500; el 5% de 90.000 son 4.500.
  await expect(buyer.getByTestId("ahorro")).toBeVisible();

  await buyer.goto("/comprar/carrito");
  await buyer.getByLabel("Quién recibe").fill("Laura Torres");
  await buyer.getByLabel("Celular de quien recibe").fill("300 412 88 05");
  await buyer.getByLabel("Dirección").fill("Calle 72 #10-34");
  await buyer.getByLabel("Zona").selectOption("Chapinero");
  await buyer.getByRole("button", { name: "Ir a pagar" }).click();
  await buyer.getByRole("button", { name: "Simular pago aprobado" }).click();
  await expect(buyer).toHaveURL(/\/pedido\//);
  const orderId = new URL(buyer.url()).pathname.split("/").pop()!;

  const money = await withDb(async (c) => {
    const { rows } = await c.query<{ commission_cop: number; seller_payout_cop: number }>(
      `select commission_cop, seller_payout_cop from orders where id = $1`,
      [orderId]
    );
    return rows[0];
  });
  expect(money.commission_cop).toBe(4_500);
  expect(money.seller_payout_cop).toBe(85_500);

  await seller.context.close();
  await ctx.close();
});

test("agregar algo de otro vendedor avisa en vez de mezclar", async ({ browser }) => {
  // D-20: un pedido es un envío, un escrow y una disputa.
  const marca = Date.now();
  const uno = await sellerWithListing(browser, `Del uno ${marca}`, 50_000, "ropa");
  const dos = await sellerWithListing(browser, `Del dos ${marca}`, 60_000, "ropa");

  const ctx = await browser.newContext();
  const buyer = await ctx.newPage();
  await signUpVerified(buyer, "comprador", "Laura Compradora");

  await buyer.goto(`/producto/${uno.listingId}`);
  await buyer.getByRole("button", { name: "Agregar al carrito" }).click();
  await expect(buyer.getByRole("main")).toContainText("Está en tu carrito");

  await buyer.goto(`/producto/${dos.listingId}`);
  await buyer.getByRole("button", { name: "Agregar al carrito" }).click();
  await expect(alertIn(buyer)).toContainText("un solo vendedor");

  await buyer.goto("/carrito");
  await expect(buyer.getByTestId("carrito").getByRole("listitem")).toHaveCount(1);

  await uno.context.close();
  await dos.context.close();
  await ctx.close();
});

test("un artículo que se vende mientras está en el carrito bloquea el pago", async ({
  browser,
}) => {
  const marca = Date.now();
  const seller = await sellerWithMany(browser, [`Uno ${marca}`, `Dos ${marca}`], 40_000);

  const ctx = await browser.newContext();
  const buyer = await ctx.newPage();
  await signUpVerified(buyer, "comprador", "Laura Compradora");
  await addAll(buyer, seller.ids);

  await withDb((c) =>
    c.query(`update listings set status = 'vendida' where id = $1`, [seller.ids[1]])
  );

  await buyer.goto("/carrito");
  await expect(buyer.getByRole("main")).toContainText("ya no está disponible");
  await expect(buyer.getByRole("link", { name: "Ir a pagar" })).toHaveCount(0);

  await seller.context.close();
  await ctx.close();
});

test("no se puede agregar el propio artículo", async ({ browser }) => {
  const seller = await sellerWithListing(browser, `Propio ${Date.now()}`, 50_000, "ropa");
  await seller.page.goto(`/producto/${seller.listingId}`);
  await expect(seller.page.getByRole("button", { name: "Agregar al carrito" })).toHaveCount(0);
  await seller.context.close();
});

test("el carrito de otro no se ve", async ({ browser }) => {
  const marca = Date.now();
  const seller = await sellerWithListing(browser, `Privado ${marca}`, 50_000, "ropa");

  const unoCtx = await browser.newContext();
  const uno = await unoCtx.newPage();
  await signUpVerified(uno, "uno", "Persona Uno");
  await uno.goto(`/producto/${seller.listingId}`);
  await uno.getByRole("button", { name: "Agregar al carrito" }).click();
  await expect(uno.getByRole("main")).toContainText("Está en tu carrito");

  const dosCtx = await browser.newContext();
  const dos = await dosCtx.newPage();
  await signUpVerified(dos, "dos", "Persona Dos");
  await dos.goto("/carrito");
  await expect(dos.getByRole("main")).not.toContainText(`Privado ${marca}`);
  await expect(dos.getByRole("main")).toContainText("Está vacío");

  await seller.context.close();
  await unoCtx.close();
  await dosCtx.close();
});

test("pagar un carrito vacío manda de vuelta al carrito", async ({ browser }) => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await signUpVerified(page, "vacio", "Laura Compradora");
  await page.goto("/comprar/carrito");
  await expect(page).toHaveURL(/\/carrito/);
  await ctx.close();
});

test("sin sesión no hay carrito", async ({ browser }) => {
  const anonCtx = await browser.newContext();
  const anon = await anonCtx.newPage();
  const res = await anon.goto("/carrito");
  expect(res?.url()).toMatch(/\/ingresar/);
  await anonCtx.close();
});
