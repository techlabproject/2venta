import { test, expect, type Browser, type Page } from "@playwright/test";
import { alertIn, sellerWithListing, signUpVerified, withDb } from "./helpers";

// La prueba de punta a punta de la rebanada S-12.
// Ver slices/12-calificaciones.md

/** Un pedido liberado: comprador y vendedor ya pueden calificarse. */
async function completedOrder(browser: Browser, title: string, price = 200_000) {
  const seller = await sellerWithListing(browser, title, price, "ropa");
  const ctx = await browser.newContext();
  const buyer = await ctx.newPage();
  await signUpVerified(buyer, "comprador", "Laura Compradora");

  await buyer.goto(`/comprar/${seller.listingId}`);
  await buyer.getByLabel("Quién recibe").fill("Laura Torres");
  await buyer.getByLabel("Celular de quien recibe").fill("300 412 88 05");
  await buyer.getByLabel("Dirección").fill("Calle 72 #10-34");
  await buyer.getByLabel("Zona").selectOption("Chapinero");
  await buyer.getByRole("button", { name: "Ir a pagar" }).click();
  await expect(buyer).toHaveURL(/\/dev\/pago\//);
  await buyer.getByRole("button", { name: "Simular pago aprobado" }).click();
  await expect(buyer).toHaveURL(/\/pedido\//);
  const orderId = new URL(buyer.url()).pathname.split("/").pop()!;

  await buyer.getByRole("button", { name: "Ya lo recibí, liberar pago" }).click();
  await expect(buyer.getByTestId("estado")).toHaveText("Pago liberado al vendedor");

  const sellerId = await withDb(async (c) => {
    const { rows } = await c.query<{ seller_id: string }>(
      `select seller_id from orders where id = $1`,
      [orderId]
    );
    return rows[0].seller_id;
  });

  return { seller, ctx, buyer, orderId, sellerId };
}

async function rate(page: Page, stars: number, review?: string) {
  await page.getByRole("radio", { name: `${stars} de 5` }).check();
  if (review) await page.getByLabel("Tu reseña").fill(review);
  await page.getByRole("button", { name: "Calificar" }).click();
}

test("comprador y vendedor se califican tras completar el pedido", async ({
  browser,
}) => {
  const { seller, ctx, buyer, orderId } = await completedOrder(browser, `Chaleco ${Date.now()}`);

  await rate(buyer, 5, "Todo tal cual la publicación.");
  await expect(buyer.getByTestId("ya-calificado")).toBeVisible();

  await seller.page.goto(`/pedido/${orderId}`);
  await rate(seller.page, 5, "Pagó rápido y confirmó enseguida.");
  await expect(seller.page.getByTestId("ya-calificado")).toBeVisible();

  await seller.context.close();
  await ctx.close();
});

test("la calificación aparece en el perfil público del vendedor", async ({ browser }) => {
  const { seller, ctx, buyer, sellerId } = await completedOrder(browser, `Gorro ${Date.now()}`);
  await rate(buyer, 5, "Impecable, llegó antes de lo previsto.");
  await expect(buyer.getByTestId("ya-calificado")).toBeVisible();

  const anonCtx = await browser.newContext();
  const anon = await anonCtx.newPage();
  await anon.goto(`/vendedor/${sellerId}`);
  await expect(anon.getByTestId("reputacion")).toContainText("5,0");
  await expect(anon.getByTestId("reputacion")).toContainText("1");
  await expect(anon.getByRole("main")).toContainText("llegó antes de lo previsto");

  await seller.context.close();
  await ctx.close();
  await anonCtx.close();
});

test("un vendedor sin ventas no muestra cifras en cero", async ({ browser }) => {
  // D-17: "0 ventas, 0 estrellas" parece mal desempeño cuando en realidad es
  // ausencia de datos, y en una plataforma que arranca eso son todos.
  const seller = await sellerWithListing(browser, `Estuche ${Date.now()}`, 50_000, "ropa");
  const sellerId = await withDb(async (c) => {
    const { rows } = await c.query<{ seller_id: string }>(
      `select seller_id from listings where id = $1`,
      [seller.listingId]
    );
    return rows[0].seller_id;
  });

  const anonCtx = await browser.newContext();
  const anon = await anonCtx.newPage();
  await anon.goto(`/vendedor/${sellerId}`);
  await expect(anon.getByTestId("sin-ventas")).toBeVisible();
  await expect(anon.getByTestId("reputacion")).toHaveCount(0);
  await expect(anon.getByRole("main")).not.toContainText("0 ventas");

  await seller.context.close();
  await anonCtx.close();
});

test("el promedio se calcula sobre varias calificaciones", async ({ browser }) => {
  const primero = await completedOrder(browser, `Maleta ${Date.now()}`);
  await rate(primero.buyer, 5);
  await expect(primero.buyer.getByTestId("ya-calificado")).toBeVisible();

  // Una segunda compra al mismo vendedor, calificada con menos estrellas.
  const otroCtx = await browser.newContext();
  const otro = await otroCtx.newPage();
  await signUpVerified(otro, "comprador2", "Otro Comprador");

  const segundaId = await withDb(async (c) => {
    const { rows } = await c.query<{ id: string }>(
      `insert into listings (seller_id, title, description, category, condition,
                             price_cop, video_path, poster_path)
       values ($1, $2, 'Otra cosa.', 'ropa', 'usado_bueno', 100000,
               'seed/demo.webm', 'seed/demo.jpg')
       returning id`,
      [primero.sellerId, `Maleta dos ${Date.now()}`]
    );
    return rows[0].id;
  });

  await otro.goto(`/comprar/${segundaId}`);
  await otro.getByLabel("Quién recibe").fill("Otro Comprador");
  await otro.getByLabel("Celular de quien recibe").fill("300 412 88 06");
  await otro.getByLabel("Dirección").fill("Carrera 15 #80-20");
  await otro.getByLabel("Zona").selectOption("Chapinero");
  await otro.getByRole("button", { name: "Ir a pagar" }).click();
  await otro.getByRole("button", { name: "Simular pago aprobado" }).click();
  await expect(otro).toHaveURL(/\/pedido\//);
  await otro.getByRole("button", { name: "Ya lo recibí, liberar pago" }).click();
  await expect(otro.getByTestId("estado")).toHaveText("Pago liberado al vendedor");
  await rate(otro, 3);
  await expect(otro.getByTestId("ya-calificado")).toBeVisible();

  const anonCtx = await browser.newContext();
  const anon = await anonCtx.newPage();
  await anon.goto(`/vendedor/${primero.sellerId}`);
  // Promedio de 5 y 3.
  await expect(anon.getByTestId("reputacion")).toContainText("4,0");

  await primero.seller.context.close();
  await primero.ctx.close();
  await otroCtx.close();
  await anonCtx.close();
});

test("no se puede calificar un pedido que todavía no terminó", async ({ browser }) => {
  const seller = await sellerWithListing(browser, `Billetera ${Date.now()}`, 80_000, "ropa");
  const ctx = await browser.newContext();
  const buyer = await ctx.newPage();
  await signUpVerified(buyer, "comprador", "Laura Compradora");

  await buyer.goto(`/comprar/${seller.listingId}`);
  await buyer.getByLabel("Quién recibe").fill("Laura Torres");
  await buyer.getByLabel("Celular de quien recibe").fill("300 412 88 05");
  await buyer.getByLabel("Dirección").fill("Calle 72 #10-34");
  await buyer.getByLabel("Zona").selectOption("Chapinero");
  await buyer.getByRole("button", { name: "Ir a pagar" }).click();
  await buyer.getByRole("button", { name: "Simular pago aprobado" }).click();
  await expect(buyer).toHaveURL(/\/pedido\//);

  // Pagado pero no liberado: no hay formulario de calificación.
  await expect(buyer.getByRole("button", { name: "Calificar" })).toHaveCount(0);

  await seller.context.close();
  await ctx.close();
});

test("no se puede calificar dos veces el mismo pedido", async ({ browser }) => {
  const { seller, ctx, buyer, orderId } = await completedOrder(browser, `Reloj ${Date.now()}`);
  await rate(buyer, 4, "Bien.");
  await expect(buyer.getByTestId("ya-calificado")).toBeVisible();

  await buyer.goto(`/pedido/${orderId}`);
  await expect(buyer.getByRole("button", { name: "Calificar" })).toHaveCount(0);

  const cuantas = await withDb(async (c) => {
    const { rows } = await c.query(`select 1 from ratings where order_id = $1`, [orderId]);
    return rows.length;
  });
  expect(cuantas).toBe(1);

  await seller.context.close();
  await ctx.close();
});

test("el filtro anti-desvío también se aplica a las reseñas", async ({ browser }) => {
  // Las reseñas son públicas: un número ahí lo ve cualquiera que abra el perfil.
  const { seller, ctx, buyer, sellerId } = await completedOrder(browser, `Cartera ${Date.now()}`);
  await rate(buyer, 5, "Muy bueno, escríbanle al 3001234567");
  await expect(buyer.getByTestId("ya-calificado")).toBeVisible();

  const anonCtx = await browser.newContext();
  const anon = await anonCtx.newPage();
  await anon.goto(`/vendedor/${sellerId}`);
  await expect(anon.getByRole("main")).not.toContainText("3001234567");
  await expect(anon.getByRole("main")).toContainText("•••••");

  await seller.context.close();
  await ctx.close();
  await anonCtx.close();
});

test("una calificación fuera de rango se rechaza en el servidor", async ({ browser }) => {
  const { seller, ctx, buyer, orderId } = await completedOrder(browser, `Anillo ${Date.now()}`);

  // Se salta la pantalla: el control tiene que estar en el servidor.
  await buyer.evaluate(async (id) => {
    for (const stars of ["0", "6", "-1", "abc"]) {
      const form = new FormData();
      form.set("orderId", id);
      form.set("stars", stars);
      await fetch(`/pedido/${id}`, { method: "POST", body: form }).catch(() => {});
    }
  }, orderId);

  const cuantas = await withDb(async (c) => {
    const { rows } = await c.query(`select 1 from ratings where order_id = $1`, [orderId]);
    return rows.length;
  });
  expect(cuantas).toBe(0);

  await seller.context.close();
  await ctx.close();
});

test("no se puede calificar un pedido ajeno", async ({ browser }) => {
  const { seller, ctx, orderId } = await completedOrder(browser, `Pulsera ${Date.now()}`);

  const otroCtx = await browser.newContext();
  const otro = await otroCtx.newPage();
  await signUpVerified(otro, "curioso", "Persona Ajena");
  const res = await otro.goto(`/pedido/${orderId}`);
  expect(res?.status()).toBe(404);

  await seller.context.close();
  await ctx.close();
  await otroCtx.close();
});
