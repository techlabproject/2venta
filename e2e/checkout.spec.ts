import { test, expect, type Page } from "@playwright/test";
import { createHmac, randomUUID } from "node:crypto";
import {
  alertIn,
  approveKycFor,
  sellerWithListing,
  signUpVerified,
  withDb,
} from "./helpers";

// La prueba de punta a punta de la rebanada S-05.
// Ver slices/05-comprar-con-pago-retenido.md


/**
 * Recorre el paso de dirección y deja al comprador en la pantalla del proveedor.
 * Desde S-06, comprar pasa primero por la dirección de entrega.
 */
async function goToPayment(page: Page, listingId: string) {
  await page.goto(`/producto/${listingId}`);
  await page.getByRole("link", { name: "Comprar con pago protegido" }).click();
  await expect(page).toHaveURL(/\/comprar\//);

  await page.getByLabel("Quién recibe").fill("Laura Torres");
  await page.getByLabel("Celular de quien recibe").fill("300 412 88 05");
  await page.getByLabel("Dirección").fill("Calle 72 #10-34");
  await page.getByLabel("Zona").selectOption("Chapinero");
  await page.getByRole("button", { name: "Ir a pagar" }).click();
}

/** Un vendedor verificado con un artículo publicado, en su propio contexto. */
test("un comprador paga, el dinero queda retenido y el artículo sale del catálogo", async ({
  browser,
}) => {
  const titulo = `Monitor curvo ${Date.now()}`;
  const seller = await sellerWithListing(browser, titulo, 800_000);

  const buyerContext = await browser.newContext();
  const buyer = await buyerContext.newPage();
  await signUpVerified(buyer, "comprador", "Laura Compradora");

  await goToPayment(buyer, seller.listingId);
  await expect(buyer).toHaveURL(/\/dev\/pago\//);
  await buyer.getByRole("button", { name: "Simular pago aprobado" }).click();

  await expect(buyer).toHaveURL(/\/pedido\//);
  await expect(buyer.getByTestId("estado")).toHaveText("Pago recibido y guardado");
  await expect(buyer.getByTestId("total")).toHaveText("$ 812.000"); // 800.000 + 12.000 de envío
  await expect(buyer.getByRole("main")).toContainText("Tenemos guardados");

  // El artículo ya no aparece como disponible.
  await buyer.goto("/buscar?q=" + encodeURIComponent(titulo.split(" ")[0]));
  await expect(
    buyer.getByRole("main").getByRole("listitem").filter({ hasText: titulo })
  ).toHaveCount(0);

  await seller.context.close();
  await buyerContext.close();
});

test("el comprador confirma y el dinero se libera con la comisión correcta", async ({
  browser,
}) => {
  const titulo = `Portátil ${Date.now()}`;
  // 5% de 800.000 = 40.000, dentro del tramo normal.
  const seller = await sellerWithListing(browser, titulo, 800_000);

  const buyerContext = await browser.newContext();
  const buyer = await buyerContext.newPage();
  await signUpVerified(buyer, "comprador", "Laura Compradora");

  await goToPayment(buyer, seller.listingId);
  await buyer.getByRole("button", { name: "Simular pago aprobado" }).click();
  await expect(buyer).toHaveURL(/\/pedido\//);
  const orderUrl = buyer.url();

  await buyer.getByRole("button", { name: "Ya lo recibí, liberar pago" }).click();
  await expect(buyer.getByTestId("estado")).toHaveText("Pago liberado al vendedor");

  // El vendedor ve el desglose: 800.000 menos 40.000 de comisión.
  await seller.page.goto(orderUrl);
  await expect(seller.page.getByTestId("comision")).toHaveText("$ 40.000");
  await expect(seller.page.getByTestId("recibe")).toHaveText("$ 760.000");

  await seller.context.close();
  await buyerContext.close();
});

test("con la entrega registrada hace ocho días, el pago se libera solo", async ({
  browser,
}) => {
  const titulo = `Nevera ${Date.now()}`;
  const seller = await sellerWithListing(browser, titulo, 500_000);

  const buyerContext = await browser.newContext();
  const buyer = await buyerContext.newPage();
  await signUpVerified(buyer, "comprador", "Laura Compradora");

  await goToPayment(buyer, seller.listingId);
  await buyer.getByRole("button", { name: "Simular pago aprobado" }).click();
  await expect(buyer).toHaveURL(/\/pedido\//);
  const orderId = new URL(buyer.url()).pathname.split("/").pop()!;

  // S-06 escribirá esta fecha cuando la transportadora reporte la entrega.
  await withDb((c) =>
    c.query(`update orders set delivered_at = now() - interval '8 days' where id = $1`, [
      orderId,
    ])
  );

  const res = await buyer.request.post("/api/tareas/liberar", {
    headers: { "x-cron-secret": process.env.CRON_SECRET! },
  });
  expect(res.status()).toBe(200);
  expect((await res.json()).liberados).toBeGreaterThanOrEqual(1);

  await buyer.goto(`/pedido/${orderId}`);
  await expect(buyer.getByTestId("estado")).toHaveText("Pago liberado al vendedor");

  await seller.context.close();
  await buyerContext.close();
});

test("un pago rechazado deja el artículo disponible otra vez", async ({ browser }) => {
  const titulo = `Guitarra ${Date.now()}`;
  const seller = await sellerWithListing(browser, titulo, 300_000);

  const buyerContext = await browser.newContext();
  const buyer = await buyerContext.newPage();
  await signUpVerified(buyer, "comprador", "Laura Compradora");

  await goToPayment(buyer, seller.listingId);
  await buyer.getByRole("button", { name: "Simular pago rechazado" }).click();

  await expect(buyer.getByTestId("estado")).toHaveText("Cancelado");
  await expect(buyer.getByRole("main")).not.toContainText("Tenemos guardados");

  await buyer.goto("/buscar?q=" + encodeURIComponent(titulo.split(" ")[0]));
  await expect(
    buyer.getByRole("main").getByRole("listitem").filter({ hasText: titulo })
  ).toHaveCount(1);

  await seller.context.close();
  await buyerContext.close();
});

test("no se puede comprar el propio artículo", async ({ browser }) => {
  const titulo = `Escritorio ${Date.now()}`;
  const seller = await sellerWithListing(browser, titulo, 200_000);

  await goToPayment(seller.page, seller.listingId);
  await expect(alertIn(seller.page)).toContainText("tu propio artículo");

  await seller.context.close();
});

test("no se puede publicar por debajo del precio mínimo", async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  const { email } = await signUpVerified(page, "vendedor", "Camila Vendedora");
  await approveKycFor(email);

  await page.goto("/publicar");
  await page.getByRole("button", { name: "Abrir cámara" }).click();
  await page.getByRole("button", { name: /^Grabar/ }).click();
  await page.getByRole("button", { name: "Terminar" }).click();
  await expect(page.getByRole("status")).toContainText("Video listo");

  await page.getByLabel("Título").fill("Llavero barato");
  await page.getByLabel("Precio").fill("3000");
  await page.getByLabel("Descripción").fill("Muy barato.");
  await page.getByRole("button", { name: "Publicar" }).click();

  await expect(alertIn(page)).toContainText("precio mínimo");
  await context.close();
});

// ---------------------------------------------------------------------------
// Webhooks. Llegan repetidos y a destiempo por diseño del proveedor.
// ---------------------------------------------------------------------------

function signed(body: object) {
  const payload = JSON.stringify(body);
  return {
    data: JSON.parse(payload),
    headers: {
      "content-type": "application/json",
      "x-pagos-signature": createHmac("sha256", process.env.PAYMENTS_WEBHOOK_SECRET!)
        .update(payload)
        .digest("hex"),
    },
  };
}

test("un webhook con firma inválida se rechaza", async ({ request }) => {
  const res = await request.post("/api/pagos/webhook", {
    headers: { "x-pagos-signature": "firma-inventada" },
    data: { eventId: "evt_1", reference: "pay_x", type: "pago.aprobado" },
  });
  expect(res.status()).toBe(401);
});

test("un webhook sin firma se rechaza", async ({ request }) => {
  const res = await request.post("/api/pagos/webhook", {
    data: { eventId: "evt_2", reference: "pay_x", type: "pago.aprobado" },
  });
  expect(res.status()).toBe(401);
});

test("un webhook de un pedido que no existe se rechaza", async ({ request }) => {
  const res = await request.post(
    "/api/pagos/webhook",
    signed({ eventId: `evt_${randomUUID()}`, reference: "pay_inexistente", type: "pago.aprobado" })
  );
  expect(res.status()).toBe(404);
});

test("un webhook repetido no libera ni cobra dos veces", async ({ browser }) => {
  const titulo = `Cámara ${Date.now()}`;
  const seller = await sellerWithListing(browser, titulo, 400_000);

  const buyerContext = await browser.newContext();
  const buyer = await buyerContext.newPage();
  await signUpVerified(buyer, "comprador", "Laura Compradora");

  await goToPayment(buyer, seller.listingId);
  await expect(buyer).toHaveURL(/\/dev\/pago\//);
  const orderId = new URL(buyer.url()).pathname.split("/").pop()!;

  const ref = await withDb(async (c) => {
    const { rows } = await c.query<{ provider_ref: string }>(
      `select provider_ref from orders where id = $1`,
      [orderId]
    );
    return rows[0].provider_ref;
  });

  const evento = { eventId: `evt_${randomUUID()}`, reference: ref, type: "pago.aprobado" };

  const primera = await buyer.request.post("/api/pagos/webhook", signed(evento));
  expect((await primera.json()).aplicado).toBe(true);

  // El mismo aviso, tres veces más. Ninguna vuelve a aplicar.
  for (let i = 0; i < 3; i++) {
    const res = await buyer.request.post("/api/pagos/webhook", signed(evento));
    expect(res.status()).toBe(200);
    expect((await res.json()).aplicado).toBe(false);
  }

  // Un solo movimiento de "pagado" en el registro de auditoría.
  const veces = await withDb(async (c) => {
    const { rows } = await c.query<{ n: string }>(
      `select count(*)::text as n from order_events where order_id = $1 and to_status = 'pagado'`,
      [orderId]
    );
    return Number(rows[0].n);
  });
  expect(veces).toBe(1);

  await seller.context.close();
  await buyerContext.close();
});

test("un webhook fuera de orden no retrocede un estado más avanzado", async ({
  browser,
}) => {
  const titulo = `Bafle ${Date.now()}`;
  const seller = await sellerWithListing(browser, titulo, 250_000);

  const buyerContext = await browser.newContext();
  const buyer = await buyerContext.newPage();
  await signUpVerified(buyer, "comprador", "Laura Compradora");

  await goToPayment(buyer, seller.listingId);
  await buyer.getByRole("button", { name: "Simular pago aprobado" }).click();
  await expect(buyer).toHaveURL(/\/pedido\//);
  const orderId = new URL(buyer.url()).pathname.split("/").pop()!;

  await buyer.getByRole("button", { name: "Ya lo recibí, liberar pago" }).click();
  await expect(buyer.getByTestId("estado")).toHaveText("Pago liberado al vendedor");

  const ref = await withDb(async (c) => {
    const { rows } = await c.query<{ provider_ref: string }>(
      `select provider_ref from orders where id = $1`,
      [orderId]
    );
    return rows[0].provider_ref;
  });

  // Llega tarde un aviso de "aprobado" cuando el pedido ya está liberado.
  const res = await buyer.request.post(
    "/api/pagos/webhook",
    signed({ eventId: `evt_${randomUUID()}`, reference: ref, type: "pago.aprobado" })
  );
  expect((await res.json()).aplicado).toBe(false);

  await buyer.reload();
  await expect(buyer.getByTestId("estado")).toHaveText("Pago liberado al vendedor");

  await seller.context.close();
  await buyerContext.close();
});

test("nadie más que el comprador puede liberar el pago, ni ver el pedido", async ({
  browser,
}) => {
  const titulo = `Impresora ${Date.now()}`;
  const seller = await sellerWithListing(browser, titulo, 350_000);

  const buyerContext = await browser.newContext();
  const buyer = await buyerContext.newPage();
  await signUpVerified(buyer, "comprador", "Laura Compradora");
  await goToPayment(buyer, seller.listingId);
  await buyer.getByRole("button", { name: "Simular pago aprobado" }).click();
  await expect(buyer).toHaveURL(/\/pedido\//);
  const orderId = new URL(buyer.url()).pathname.split("/").pop()!;

  // Una tercera persona, ajena a la transacción.
  const otroContext = await browser.newContext();
  const otro = await otroContext.newPage();
  await signUpVerified(otro, "curioso", "Persona Ajena");

  const res = await otro.goto(`/pedido/${orderId}`);
  expect(res?.status()).toBe(404);

  // El vendedor sí lo ve, pero sin el botón de liberar.
  await seller.page.goto(`/pedido/${orderId}`);
  await expect(seller.page.getByTestId("estado")).toHaveText("Pago recibido y guardado");
  await expect(
    seller.page.getByRole("button", { name: "Ya lo recibí, liberar pago" })
  ).toHaveCount(0);

  await seller.context.close();
  await buyerContext.close();
  await otroContext.close();
});

test("la tarea de liberación automática exige su secreto", async ({ request }) => {
  const sin = await request.post("/api/tareas/liberar");
  expect(sin.status()).toBe(401);

  const malo = await request.post("/api/tareas/liberar", {
    headers: { "x-cron-secret": "no-es" },
  });
  expect(malo.status()).toBe(401);
});
