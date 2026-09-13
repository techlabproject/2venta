import { test, expect } from "@playwright/test";
import { config } from "dotenv";
import { createHmac, randomUUID } from "node:crypto";
import { alertIn, sellerWithListing, signUpVerified, withDb } from "../../helpers";

config({ path: ".env.local" });

// Concurrencia: dos peticiones a la vez para la misma transición de dinero. Ver
// AGENTE-QA.md, "Concurrencia", y src/features/payments/orders.ts::transition,
// que bloquea la fila con `for update` y comprueba la transición dentro de la
// misma transacción — es justo lo que aquí se pone a prueba de verdad.

function sign(secret: string, body: string): string {
  return createHmac("sha256", secret).update(body).digest("hex");
}

test("dos liberaciones a la vez del mismo pedido: solo un evento, released_at fijo", async ({
  browser,
  request,
}) => {
  const seller = await sellerWithListing(browser, `Concurrencia liberar ${Date.now()}`, 260_000);
  const buyerCtx = await browser.newContext();
  const buyer = await buyerCtx.newPage();
  await signUpVerified(buyer, "tecconcurr1", "Comprador Concurrencia");

  await buyer.goto(`/comprar/${seller.listingId}`);
  await buyer.getByLabel("Quién recibe").fill("Prueba Concurrencia");
  await buyer.getByLabel("Celular de quien recibe").fill("300 412 88 05");
  await buyer.getByLabel("Dirección").fill("Calle 1 #2-3");
  await buyer.getByLabel("Zona").selectOption("Chapinero");
  await buyer.getByRole("button", { name: "Ir a pagar" }).click();
  await expect(buyer).toHaveURL(/\/dev\/pago\//);
  await buyer.getByRole("button", { name: "Simular pago aprobado" }).click();
  await expect(buyer).toHaveURL(/\/pedido\//);
  const orderId = new URL(buyer.url()).pathname.split("/").pop()!;

  // Prepara el estado: entregado hace 8 días, más allá del plazo de D-11b.
  await withDb((c) =>
    c.query(
      `update orders set status = 'entregado', delivered_at = now() - interval '8 days' where id = $1`,
      [orderId]
    )
  );

  const secret = process.env.CRON_SECRET!;
  const [r1, r2] = await Promise.all([
    request.post("/api/tareas/liberar", { headers: { "x-cron-secret": secret } }),
    request.post("/api/tareas/liberar", { headers: { "x-cron-secret": secret } }),
  ]);
  expect(r1.status()).toBe(200);
  expect(r2.status()).toBe(200);

  const row = await withDb(async (c) => {
    const { rows } = await c.query(
      `select status, released_at from orders where id = $1`,
      [orderId]
    );
    return rows[0];
  });
  expect(row.status).toBe("liberado");
  expect(row.released_at).not.toBeNull();

  const liberadoEvents = await withDb(async (c) => {
    const { rows } = await c.query(
      `select count(*)::int as n from order_events where order_id = $1 and to_status = 'liberado'`,
      [orderId]
    );
    return rows[0].n;
  });
  expect(liberadoEvents).toBe(1);

  await buyerCtx.close();
  await seller.context.close();
});

test("dos avisos de pago aprobado a la vez (distinto eventId, como un reintento del proveedor): solo una transición a pagado", async ({
  browser,
  request,
}) => {
  const seller = await sellerWithListing(browser, `Concurrencia pago ${Date.now()}`, 190_000);
  const buyerCtx = await browser.newContext();
  const buyer = await buyerCtx.newPage();
  await signUpVerified(buyer, "tecconcurr2", "Comprador Concurrencia Pago");

  await buyer.goto(`/comprar/${seller.listingId}`);
  await buyer.getByLabel("Quién recibe").fill("Prueba Concurrencia");
  await buyer.getByLabel("Celular de quien recibe").fill("300 412 88 05");
  await buyer.getByLabel("Dirección").fill("Calle 1 #2-3");
  await buyer.getByLabel("Zona").selectOption("Chapinero");
  await buyer.getByRole("button", { name: "Ir a pagar" }).click();
  await expect(buyer).toHaveURL(/\/dev\/pago\//);
  const orderId = new URL(buyer.url()).pathname.split("/").pop()!;

  const reference = await withDb(async (c) => {
    const { rows } = await c.query(`select provider_ref from orders where id = $1`, [orderId]);
    return rows[0].provider_ref;
  });

  const bodyA = JSON.stringify({ eventId: randomUUID(), reference, type: "pago.aprobado" });
  const bodyB = JSON.stringify({ eventId: randomUUID(), reference, type: "pago.aprobado" });
  const secret = process.env.PAYMENTS_WEBHOOK_SECRET!;

  const [r1, r2] = await Promise.all([
    request.post("/api/pagos/webhook", {
      data: Buffer.from(bodyA),
      headers: { "content-type": "application/json", "x-pagos-signature": sign(secret, bodyA) },
    }),
    request.post("/api/pagos/webhook", {
      data: Buffer.from(bodyB),
      headers: { "content-type": "application/json", "x-pagos-signature": sign(secret, bodyB) },
    }),
  ]);
  expect(r1.status()).toBe(200);
  expect(r2.status()).toBe(200);
  const [j1, j2] = await Promise.all([r1.json(), r2.json()]);
  // Exactamente una de las dos aplicó la transición; la otra encontró el pedido
  // ya pagado y no hizo nada (aplicado: false), que es el comportamiento correcto.
  expect([j1.aplicado, j2.aplicado].filter(Boolean).length).toBe(1);

  const row = await withDb(async (c) => {
    const { rows } = await c.query(`select status from orders where id = $1`, [orderId]);
    return rows[0];
  });
  expect(row.status).toBe("pagado");

  const pagadoEvents = await withDb(async (c) => {
    const { rows } = await c.query(
      `select count(*)::int as n from order_events where order_id = $1 and to_status = 'pagado'`,
      [orderId]
    );
    return rows[0].n;
  });
  expect(pagadoEvents).toBe(1);

  // Una sola comisión: la fila del pedido no cambia entre los dos avisos.
  const money = await withDb(async (c) => {
    const { rows } = await c.query(
      `select subtotal_cop, commission_cop, seller_payout_cop from orders where id = $1`,
      [orderId]
    );
    return rows[0];
  });
  expect(Number(money.commission_cop) + Number(money.seller_payout_cop)).toBe(
    Number(money.subtotal_cop)
  );

  await buyerCtx.close();
  await seller.context.close();
});

test("dos compradores intentan pagar el mismo artículo a la vez: solo uno se queda con él", async ({
  browser,
}) => {
  const seller = await sellerWithListing(browser, `Concurrencia venta doble ${Date.now()}`, 340_000);

  const ctxA = await browser.newContext();
  const pageA = await ctxA.newPage();
  await signUpVerified(pageA, "tecconcurra", "Comprador A Concurrencia");

  const ctxB = await browser.newContext();
  const pageB = await ctxB.newPage();
  await signUpVerified(pageB, "tecconcurrb", "Comprador B Concurrencia");

  async function fillCheckout(page: typeof pageA) {
    await page.goto(`/comprar/${seller.listingId}`);
    await page.getByLabel("Quién recibe").fill("Comprador Concurrencia");
    await page.getByLabel("Celular de quien recibe").fill("300 412 88 05");
    await page.getByLabel("Dirección").fill("Calle 9 #9-09");
    await page.getByLabel("Zona").selectOption("Chapinero");
  }

  await fillCheckout(pageA);
  await fillCheckout(pageB);

  // Los dos mandan "Ir a pagar" casi a la vez. Solo uno puede reservar el
  // artículo: la reserva es una sola sentencia SQL condicionada al estado
  // (`update ... where status = 'activa'`), así que no debería haber ventana.
  const [resultA, resultB] = await Promise.all([
    pageA.getByRole("button", { name: "Ir a pagar" }).click().then(() => "clicked"),
    pageB.getByRole("button", { name: "Ir a pagar" }).click().then(() => "clicked"),
  ]);

  await pageA.waitForTimeout(800);
  await pageB.waitForTimeout(800);

  const aWentToPay = /\/dev\/pago\//.test(pageA.url());
  const bWentToPay = /\/dev\/pago\//.test(pageB.url());

  // Exactamente uno de los dos debe haber llegado a la pantalla de pago.
  expect([aWentToPay, bWentToPay].filter(Boolean).length).toBe(1);

  const orderCount = await withDb(async (c) => {
    const { rows } = await c.query(
      `select count(*)::int as n from orders o
         join order_items oi on oi.order_id = o.id
        where oi.listing_id = $1`,
      [seller.listingId]
    );
    return rows[0].n;
  });
  expect(orderCount).toBe(1);

  await ctxA.close();
  await ctxB.close();
  await seller.context.close();
});
