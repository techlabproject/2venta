import { test, expect, type Page } from "@playwright/test";
import { createHmac, randomUUID } from "node:crypto";
import {
  alertIn,
  sellerWithListing,
  signUpVerified,
  withDb,
} from "./helpers";

// La prueba de punta a punta de la rebanada S-06.
// Ver slices/06-envio-y-guia.md


const DIRECCION = "Calle 72 #10-34";
const QUIEN_RECIBE = "Laura Torres";

async function payFor(page: Page, listingId: string) {
  await page.goto(`/comprar/${listingId}`);
  await page.getByLabel("Quién recibe").fill(QUIEN_RECIBE);
  await page.getByLabel("Celular de quien recibe").fill("300 412 88 05");
  await page.getByLabel("Dirección").fill(DIRECCION);
  await page.getByLabel("Zona").selectOption("Chapinero");
  await page.getByRole("button", { name: "Ir a pagar" }).click();
  await expect(page).toHaveURL(/\/dev\/pago\//);
  await page.getByRole("button", { name: "Simular pago aprobado" }).click();
  await expect(page).toHaveURL(/\/pedido\//);
  return new URL(page.url()).pathname.split("/").pop()!;
}

function signed(body: object) {
  const payload = JSON.stringify(body);
  return {
    data: JSON.parse(payload),
    headers: {
      "content-type": "application/json",
      "x-envios-signature": createHmac("sha256", process.env.SHIPPING_WEBHOOK_SECRET!)
        .update(payload)
        .digest("hex"),
    },
  };
}

test("el comprador ve el envío y el total antes de pagar", async ({ browser }) => {
  const seller = await sellerWithListing(browser, `Tostadora ${Date.now()}`, 200_000);
  const ctx = await browser.newContext();
  const buyer = await ctx.newPage();
  await signUpVerified(buyer, "comprador", "Laura Compradora");

  await buyer.goto(`/comprar/${seller.listingId}`);
  await expect(buyer.getByTestId("envio")).toHaveText("$ 12.000");
  await expect(buyer.getByTestId("total-checkout")).toHaveText("$ 212.000");

  await seller.context.close();
  await ctx.close();
});

test("el comprador paga producto más envío, y la comisión sale solo del producto", async ({
  browser,
}) => {
  const seller = await sellerWithListing(browser, `Licuadora ${Date.now()}`, 200_000);
  const ctx = await browser.newContext();
  const buyer = await ctx.newPage();
  await signUpVerified(buyer, "comprador", "Laura Compradora");

  const orderId = await payFor(buyer, seller.listingId);
  await expect(buyer.getByTestId("total")).toHaveText("$ 212.000");

  // 5% de 200.000. El envío no paga comisión: 2venta no gana sobre la plata de la
  // transportadora.
  await seller.page.goto(`/pedido/${orderId}`);
  await expect(seller.page.getByTestId("comision")).toHaveText("$ 10.000");
  await expect(seller.page.getByTestId("recibe")).toHaveText("$ 190.000");

  await seller.context.close();
  await ctx.close();
});

test("el vendedor genera la guía y el pedido queda despachado", async ({ browser }) => {
  const seller = await sellerWithListing(browser, `Ventilador ${Date.now()}`, 150_000);
  const ctx = await browser.newContext();
  const buyer = await ctx.newPage();
  await signUpVerified(buyer, "comprador", "Laura Compradora");
  const orderId = await payFor(buyer, seller.listingId);

  await seller.page.goto(`/pedido/${orderId}`);
  await seller.page.getByRole("button", { name: "Generar guía y despachar" }).click();
  await expect(seller.page.getByTestId("estado")).toHaveText("El vendedor despachó");
  await expect(seller.page.getByRole("main")).toContainText("GUIA-");

  await seller.context.close();
  await ctx.close();
});

test("la transportadora reporta la entrega y a los siete días el pago se libera solo", async ({
  browser,
}) => {
  const seller = await sellerWithListing(browser, `Aspiradora ${Date.now()}`, 300_000);
  const ctx = await browser.newContext();
  const buyer = await ctx.newPage();
  await signUpVerified(buyer, "comprador", "Laura Compradora");
  const orderId = await payFor(buyer, seller.listingId);

  await seller.page.goto(`/pedido/${orderId}`);
  await seller.page.getByRole("button", { name: "Generar guía y despachar" }).click();
  // Sin esperar a que el estado cambie, la guía todavía no está escrita.
  await expect(seller.page.getByTestId("estado")).toHaveText("El vendedor despachó");

  const guia = await withDb(async (c) => {
    const { rows } = await c.query<{ tracking_number: string }>(
      `select tracking_number from orders where id = $1`,
      [orderId]
    );
    return rows[0].tracking_number;
  });

  const res = await buyer.request.post(
    "/api/envios/webhook",
    signed({ eventId: `evt_${randomUUID()}`, trackingNumber: guia, type: "envio.entregado" })
  );
  expect((await res.json()).aplicado).toBe(true);

  await buyer.goto(`/pedido/${orderId}`);
  await expect(buyer.getByTestId("estado")).toHaveText("Entregado");

  // D-11b: siete días desde la entrega registrada.
  await withDb((c) =>
    c.query(`update orders set delivered_at = now() - interval '8 days' where id = $1`, [
      orderId,
    ])
  );
  const cron = await buyer.request.post("/api/tareas/liberar", {
    headers: { "x-cron-secret": process.env.CRON_SECRET! },
  });
  expect((await cron.json()).liberados).toBeGreaterThanOrEqual(1);

  await buyer.goto(`/pedido/${orderId}`);
  await expect(buyer.getByTestId("estado")).toHaveText("Pago liberado al vendedor");

  await seller.context.close();
  await ctx.close();
});

test("no se puede pagar sin dirección", async ({ browser }) => {
  const seller = await sellerWithListing(browser, `Plancha ${Date.now()}`, 80_000);
  const ctx = await browser.newContext();
  const buyer = await ctx.newPage();
  await signUpVerified(buyer, "comprador", "Laura Compradora");

  await buyer.goto(`/comprar/${seller.listingId}`);
  // Se salta la pantalla: el control tiene que estar en el servidor.
  const quedaronPedidos = await buyer.evaluate(async (listingId) => {
    const form = new FormData();
    form.set("listingId", listingId);
    const res = await fetch(window.location.pathname, { method: "POST", body: form });
    return res.status;
  }, seller.listingId);
  expect(quedaronPedidos).toBeGreaterThanOrEqual(200);

  // El artículo sigue disponible: no se creó ningún pedido.
  await buyer.goto(`/producto/${seller.listingId}`);
  await expect(
    buyer.getByRole("link", { name: "Comprar con pago protegido" })
  ).toBeVisible();

  await seller.context.close();
  await ctx.close();
});

test("una dirección incompleta se rechaza", async ({ browser }) => {
  const seller = await sellerWithListing(browser, `Secadora ${Date.now()}`, 90_000);
  const ctx = await browser.newContext();
  const buyer = await ctx.newPage();
  await signUpVerified(buyer, "comprador", "Laura Compradora");

  await buyer.goto(`/comprar/${seller.listingId}`);
  await buyer.getByLabel("Quién recibe").fill(QUIEN_RECIBE);
  await buyer.getByLabel("Celular de quien recibe").fill("300 412 88 05");
  // Falta la dirección y la zona.
  await buyer.evaluate(() => {
    document.querySelector("form")?.setAttribute("novalidate", "true");
  });
  await buyer.getByRole("button", { name: "Ir a pagar" }).click();
  await expect(alertIn(buyer)).toContainText("Completa la dirección");

  await seller.context.close();
  await ctx.close();
});

test("la dirección solo la ven las dos partes del pedido", async ({ browser }) => {
  const seller = await sellerWithListing(browser, `Nevera ${Date.now()}`, 400_000);
  const ctx = await browser.newContext();
  const buyer = await ctx.newPage();
  await signUpVerified(buyer, "comprador", "Laura Compradora");
  const orderId = await payFor(buyer, seller.listingId);

  // El comprador la ve.
  await expect(buyer.getByRole("main")).toContainText(DIRECCION);
  // El vendedor también, desde que el pedido está pagado: la necesita para despachar.
  await seller.page.goto(`/pedido/${orderId}`);
  await expect(seller.page.getByRole("main")).toContainText(DIRECCION);

  // Una persona ajena, no.
  const otroCtx = await browser.newContext();
  const otro = await otroCtx.newPage();
  await signUpVerified(otro, "curioso", "Persona Ajena");
  const res = await otro.goto(`/pedido/${orderId}`);
  expect(res?.status()).toBe(404);

  // Y no aparece en ninguna pantalla pública.
  await otro.goto(`/producto/${seller.listingId}`);
  expect(await otro.content()).not.toContain(DIRECCION);
  await otro.goto("/");
  expect(await otro.content()).not.toContain(DIRECCION);

  await seller.context.close();
  await ctx.close();
  await otroCtx.close();
});

test("un webhook de envío con firma inválida se rechaza", async ({ request }) => {
  const res = await request.post("/api/envios/webhook", {
    headers: { "x-envios-signature": "inventada" },
    data: { eventId: "e1", trackingNumber: "GUIA-X", type: "envio.entregado" },
  });
  expect(res.status()).toBe(401);
});

test("un webhook de envío sin firma se rechaza", async ({ request }) => {
  const res = await request.post("/api/envios/webhook", {
    data: { eventId: "e2", trackingNumber: "GUIA-X", type: "envio.entregado" },
  });
  expect(res.status()).toBe(401);
});

test("un webhook con una guía desconocida se rechaza", async ({ request }) => {
  const res = await request.post(
    "/api/envios/webhook",
    signed({ eventId: `evt_${randomUUID()}`, trackingNumber: "GUIA-NOEXISTE", type: "envio.entregado" })
  );
  expect(res.status()).toBe(404);
});

test("un webhook de entrega repetido no reinicia el plazo de liberación", async ({
  browser,
}) => {
  const seller = await sellerWithListing(browser, `Horno ${Date.now()}`, 250_000);
  const ctx = await browser.newContext();
  const buyer = await ctx.newPage();
  await signUpVerified(buyer, "comprador", "Laura Compradora");
  const orderId = await payFor(buyer, seller.listingId);

  await seller.page.goto(`/pedido/${orderId}`);
  await seller.page.getByRole("button", { name: "Generar guía y despachar" }).click();
  // Sin esperar a que el estado cambie, la guía todavía no está escrita.
  await expect(seller.page.getByTestId("estado")).toHaveText("El vendedor despachó");

  const guia = await withDb(async (c) => {
    const { rows } = await c.query<{ tracking_number: string }>(
      `select tracking_number from orders where id = $1`,
      [orderId]
    );
    return rows[0].tracking_number;
  });

  const evento = {
    eventId: `evt_${randomUUID()}`,
    trackingNumber: guia,
    type: "envio.entregado",
  };
  const primera = await buyer.request.post("/api/envios/webhook", signed(evento));
  expect((await primera.json()).aplicado).toBe(true);

  const fecha1 = await withDb(async (c) => {
    const { rows } = await c.query<{ delivered_at: Date }>(
      `select delivered_at from orders where id = $1`,
      [orderId]
    );
    return rows[0].delivered_at.getTime();
  });

  // El mismo aviso otra vez, y también uno nuevo con la misma guía.
  await buyer.request.post("/api/envios/webhook", signed(evento));
  await buyer.request.post(
    "/api/envios/webhook",
    signed({ ...evento, eventId: `evt_${randomUUID()}` })
  );

  const fecha2 = await withDb(async (c) => {
    const { rows } = await c.query<{ delivered_at: Date }>(
      `select delivered_at from orders where id = $1`,
      [orderId]
    );
    return rows[0].delivered_at.getTime();
  });

  // Si la fecha se reescribiera, el vendedor esperaría siete días más por un aviso
  // repetido de la transportadora.
  expect(fecha2).toBe(fecha1);

  await seller.context.close();
  await ctx.close();
});

test("el vendedor no puede despachar un pedido ajeno", async ({ browser }) => {
  const seller = await sellerWithListing(browser, `Batidora ${Date.now()}`, 120_000);
  const ctx = await browser.newContext();
  const buyer = await ctx.newPage();
  await signUpVerified(buyer, "comprador", "Laura Compradora");
  const orderId = await payFor(buyer, seller.listingId);

  const otroCtx = await browser.newContext();
  const otro = await otroCtx.newPage();
  await signUpVerified(otro, "ajeno", "Vendedor Ajeno");

  // Llama la acción directamente, sin pasar por ninguna pantalla.
  const antes = await withDb(async (c) => {
    const { rows } = await c.query<{ status: string }>(
      `select status from orders where id = $1`,
      [orderId]
    );
    return rows[0].status;
  });

  await otro.goto("/");
  await otro.evaluate(async (id) => {
    const form = new FormData();
    form.set("orderId", id);
    await fetch("/pedido/" + id, { method: "POST", body: form }).catch(() => {});
  }, orderId);

  const despues = await withDb(async (c) => {
    const { rows } = await c.query<{ status: string }>(
      `select status from orders where id = $1`,
      [orderId]
    );
    return rows[0].status;
  });
  expect(despues).toBe(antes);

  await seller.context.close();
  await ctx.close();
  await otroCtx.close();
});

// Hallazgo de la ronda de agentes (2026-09-13): al vendedor se le explicaba el
// plazo de cobro a medias y solo antes de despachar.
test("al vendedor se le dice cuándo cobra, en todos los estados del pedido", async ({
  browser,
}) => {
  const seller = await sellerWithListing(browser, `Plancha ${Date.now()}`, 180_000);
  const ctx = await browser.newContext();
  const buyer = await ctx.newPage();
  await signUpVerified(buyer, "comprador", "Laura Compradora");
  const orderId = await payFor(buyer, seller.listingId);

  await seller.page.goto(`/pedido/${orderId}`);
  await expect(seller.page.getByRole("main")).toContainText("siete días de la entrega");

  await seller.page.getByRole("button", { name: "Generar guía y despachar" }).click();
  await expect(seller.page.getByTestId("estado")).toHaveText("El vendedor despachó");
  // Y sigue diciéndolo después de despachar, que es cuando más falta hace.
  await expect(seller.page.getByRole("main")).toContainText("siete días de la entrega");

  await seller.context.close();
  await ctx.close();
});

/*
 * Ronda de verificación 2026-09-20.
 *
 * La pantalla del pedido llevaba escrito, en un comentario, que «el vendedor ve la
 * dirección solo desde que el pedido está pagado, que es cuando la necesita para
 * despachar. Nunca antes». El código no lo hacía: pintaba la sección en cuanto
 * existía una dirección, y la dirección se captura ANTES de pagar. Un vendedor
 * veía dónde vive alguien que se arrepintió a medio pago.
 *
 * Un comentario que explica por qué algo es seguro no es prueba de que lo sea.
 */
test("el vendedor no ve la dirección de un pedido que nadie pagó", async ({
  browser,
}) => {
  const seller = await sellerWithListing(
    browser,
    `Escritorio ${Date.now()}`,
    300_000,
  );
  const ctx = await browser.newContext();
  const buyer = await ctx.newPage();
  await signUpVerified(buyer, "comprador", "Laura Compradora");

  // Se llena la dirección y se llega a la pasarela, pero no se paga.
  await buyer.goto(`/comprar/${seller.listingId}`);
  await buyer.getByLabel("Quién recibe").fill(QUIEN_RECIBE);
  await buyer.getByLabel("Celular de quien recibe").fill("300 412 88 05");
  await buyer.getByLabel("Dirección").fill(DIRECCION);
  await buyer.getByLabel("Zona").selectOption("Chapinero");
  await buyer.getByRole("button", { name: "Ir a pagar" }).click();
  await expect(
    buyer.getByRole("button", { name: "Simular pago aprobado" }),
  ).toBeVisible();

  const orderId = await withDb(async (c) => {
    const { rows } = await c.query<{ id: string }>(
      `select o.id from orders o
         join order_items i on i.order_id = o.id
        where i.listing_id = $1 and o.status = 'pendiente_pago'
        order by o.created_at desc limit 1`,
      [seller.listingId],
    );
    return rows[0].id;
  });

  await seller.page.goto(`/pedido/${orderId}`);
  await expect(seller.page.getByRole("main")).not.toContainText(DIRECCION);
  await expect(seller.page.getByRole("main")).not.toContainText(QUIEN_RECIBE);

  // El comprador sí ve la suya: es la que acaba de escribir.
  await buyer.goto(`/pedido/${orderId}`);
  await expect(buyer.getByRole("main")).toContainText(DIRECCION);

  await seller.context.close();
  await ctx.close();
});
