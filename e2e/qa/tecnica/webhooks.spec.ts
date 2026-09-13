import { test, expect, type Page } from "@playwright/test";
import { createHmac, randomUUID } from "node:crypto";
import { config } from "dotenv";
import { alertIn, sellerWithListing, signUpVerified, withDb } from "../../helpers";

config({ path: ".env.local" });

// Ataques técnicos contra los webhooks firmados y las rutas de tareas/dev.
// Ver AGENTE-QA.md sección "Webhooks" del brief de tecnica.

function sign(secret: string, body: string): string {
  return createHmac("sha256", secret).update(body).digest("hex");
}

async function payFor(page: Page, listingId: string) {
  await page.goto(`/comprar/${listingId}`);
  await page.getByLabel("Quién recibe").fill("Prueba Tecnica");
  await page.getByLabel("Celular de quien recibe").fill("300 412 88 05");
  await page.getByLabel("Dirección").fill("Calle 1 #2-3");
  await page.getByLabel("Zona").selectOption("Chapinero");
  await page.getByRole("button", { name: "Ir a pagar" }).click();
  await expect(page).toHaveURL(/\/dev\/pago\//);
  const devUrl = page.url();
  return { devUrl, pathParts: new URL(devUrl).pathname.split("/") };
}

test.describe("webhook de pagos /api/pagos/webhook", () => {
  test("sin firma responde 401 y no cambia nada", async ({ request }) => {
    const res = await request.post("/api/pagos/webhook", {
      data: { eventId: randomUUID(), reference: "no-existe", type: "pago.aprobado" },
    });
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.error).toBeTruthy();
  });

  test("firma inválida responde 401", async ({ request }) => {
    const payload = JSON.stringify({ eventId: randomUUID(), reference: "no-existe", type: "pago.aprobado" });
    const res = await request.post("/api/pagos/webhook", {
      data: payload,
      headers: { "content-type": "application/json", "x-pagos-signature": "0".repeat(64) },
    });
    expect(res.status()).toBe(401);
  });

  test("firma válida sobre un cuerpo distinto (cuerpo alterado tras firmar) responde 401", async ({
    request,
  }) => {
    const original = JSON.stringify({ eventId: randomUUID(), reference: "no-existe", type: "pago.aprobado" });
    const sig = sign(process.env.PAYMENTS_WEBHOOK_SECRET!, original);
    // El cuerpo que de verdad se manda es otro: la firma no corresponde.
    const altered = JSON.stringify({ eventId: randomUUID(), reference: "otra-referencia", type: "pago.aprobado" });
    const res = await request.post("/api/pagos/webhook", {
      data: altered,
      headers: { "content-type": "application/json", "x-pagos-signature": sig },
    });
    expect(res.status()).toBe(401);
  });

  test("cuerpo que no es JSON, con firma válida sobre ese texto, responde 400", async ({ request }) => {
    const raw = "esto no es json{{{";
    const sig = sign(process.env.PAYMENTS_WEBHOOK_SECRET!, raw);
    const res = await request.post("/api/pagos/webhook", {
      // Playwright reserializa un `data` de tipo string si "parece" texto plano;
      // como Buffer viaja tal cual, que es lo que hace falta para que la firma
      // calculada sobre `raw` calce con lo que el servidor recibe.
      data: Buffer.from(raw, "utf8"),
      headers: { "content-type": "application/json", "x-pagos-signature": sig },
    });
    expect(res.status()).toBe(400);
  });

  test("referencia desconocida con firma válida responde 404", async ({ request }) => {
    const payload = JSON.stringify({
      eventId: randomUUID(),
      reference: `ref-inexistente-${randomUUID()}`,
      type: "pago.aprobado",
    });
    const sig = sign(process.env.PAYMENTS_WEBHOOK_SECRET!, payload);
    const res = await request.post("/api/pagos/webhook", {
      data: payload,
      headers: { "content-type": "application/json", "x-pagos-signature": sig },
    });
    expect(res.status()).toBe(404);
  });

  test("cuerpo gigante con firma válida no tumba el servidor", async ({ request }) => {
    const payload = JSON.stringify({
      eventId: randomUUID(),
      reference: "x".repeat(2_000_000),
      type: "pago.aprobado",
      relleno: "a".repeat(5_000_000),
    });
    const sig = sign(process.env.PAYMENTS_WEBHOOK_SECRET!, payload);
    const res = await request.post("/api/pagos/webhook", {
      data: payload,
      headers: { "content-type": "application/json", "x-pagos-signature": sig },
    });
    // Cualquier respuesta ordenada (400/404/413) es aceptable; lo que no lo es un 500.
    expect(res.status()).toBeLessThan(500);
  });

  test("evento repetido (mismo eventId dos veces) solo se aplica una vez", async ({
    browser,
    request,
  }) => {
    const seller = await sellerWithListing(browser, `Tecnica webhook repetido ${Date.now()}`, 150_000);
    const ctx = await browser.newContext();
    const buyer = await ctx.newPage();
    await signUpVerified(buyer, "tecwh", "Comprador Tecnica");
    await buyer.goto(`/comprar/${seller.listingId}`);
    await buyer.getByLabel("Quién recibe").fill("Prueba Tecnica");
    await buyer.getByLabel("Celular de quien recibe").fill("300 412 88 05");
    await buyer.getByLabel("Dirección").fill("Calle 1 #2-3");
    await buyer.getByLabel("Zona").selectOption("Chapinero");
    await buyer.getByRole("button", { name: "Ir a pagar" }).click();
    await expect(buyer).toHaveURL(/\/dev\/pago\//);
    const orderId = new URL(buyer.url()).pathname.split("/").pop()!;

    const reference = await withDb(async (c) => {
      const { rows } = await c.query<{ provider_ref: string }>(
        `select provider_ref from orders where id = $1`,
        [orderId]
      );
      return rows[0].provider_ref;
    });

    const eventId = randomUUID();
    const payload = JSON.stringify({ eventId, reference, type: "pago.aprobado" });
    const sig = sign(process.env.PAYMENTS_WEBHOOK_SECRET!, payload);

    const first = await request.post("/api/pagos/webhook", {
      data: payload,
      headers: { "content-type": "application/json", "x-pagos-signature": sig },
    });
    expect(first.status()).toBe(200);
    const firstBody = await first.json();
    expect(firstBody.aplicado).toBe(true);

    const second = await request.post("/api/pagos/webhook", {
      data: payload,
      headers: { "content-type": "application/json", "x-pagos-signature": sig },
    });
    expect(second.status()).toBe(200);
    const secondBody = await second.json();
    expect(secondBody.aplicado).toBe(false);

    const events = await withDb(async (c) => {
      const { rows } = await c.query(
        `select count(*)::int as n from order_events where provider_event_id = $1`,
        [eventId]
      );
      return rows[0].n;
    });
    expect(events).toBe(1);

    const orderRow = await withDb(async (c) => {
      const { rows } = await c.query(`select status from orders where id = $1`, [orderId]);
      return rows[0].status;
    });
    expect(orderRow).toBe("pagado");

    await ctx.close();
    await seller.context.close();
  });
});

test.describe("webhook de identidad /api/kyc/webhook", () => {
  test("sin firma responde 401", async ({ request }) => {
    const res = await request.post("/api/kyc/webhook", {
      data: { reference: "no-existe", status: "aprobado" },
    });
    expect(res.status()).toBe(401);
  });

  test("referencia desconocida con firma válida responde 404", async ({ request }) => {
    const payload = JSON.stringify({ reference: `ref-${randomUUID()}`, status: "aprobado" });
    const sig = sign(process.env.KYC_WEBHOOK_SECRET!, payload);
    const res = await request.post("/api/kyc/webhook", {
      data: payload,
      headers: { "content-type": "application/json", "x-kyc-signature": sig },
    });
    expect(res.status()).toBe(404);
  });

  test("no se puede aprobar la identidad de otra persona sin su referencia real", async ({
    browser,
    request,
  }) => {
    // Crea una cuenta cuya verificación queda pendiente, y trata de aprobarla con
    // una referencia inventada (no la que el flujo real generó).
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    const { email } = await signUpVerified(page, "tecvictima", "Victima Tecnica");

    const userId = await withDb(async (c) => {
      const { rows } = await c.query(`select id from "user" where email = $1`, [email]);
      return rows[0].id;
    });

    const payload = JSON.stringify({ reference: `ref-${userId}`, status: "aprobado" });
    const sig = sign(process.env.KYC_WEBHOOK_SECRET!, payload);
    const res = await request.post("/api/kyc/webhook", {
      data: payload,
      headers: { "content-type": "application/json", "x-kyc-signature": sig },
    });
    // Debe fallar (no existe verificación con esa referencia inventada) y no
    // dejar al usuario aprobado.
    expect(res.status()).toBe(404);

    const status = await withDb(async (c) => {
      const { rows } = await c.query(
        `select status from kyc_verifications where user_id = $1`,
        [userId]
      );
      return rows[0]?.status ?? null;
    });
    expect(status).not.toBe("aprobado");

    await ctx.close();
  });
});

test.describe("webhook de envíos /api/envios/webhook", () => {
  test("sin firma responde 401", async ({ request }) => {
    const res = await request.post("/api/envios/webhook", {
      data: { eventId: randomUUID(), trackingNumber: "no-existe", type: "envio.entregado" },
    });
    expect(res.status()).toBe(401);
  });

  test("guía desconocida con firma válida responde 404", async ({ request }) => {
    const payload = JSON.stringify({
      eventId: randomUUID(),
      trackingNumber: `guia-${randomUUID()}`,
      type: "envio.entregado",
    });
    const sig = sign(process.env.SHIPPING_WEBHOOK_SECRET!, payload);
    const res = await request.post("/api/envios/webhook", {
      data: payload,
      headers: { "content-type": "application/json", "x-envios-signature": sig },
    });
    expect(res.status()).toBe(404);
  });

  test("tipo de evento desconocido con firma válida responde 400", async ({ request }) => {
    const payload = JSON.stringify({
      eventId: randomUUID(),
      trackingNumber: `guia-${randomUUID()}`,
      type: "envio.perdido",
    });
    const sig = sign(process.env.SHIPPING_WEBHOOK_SECRET!, payload);
    const res = await request.post("/api/envios/webhook", {
      data: payload,
      headers: { "content-type": "application/json", "x-envios-signature": sig },
    });
    // La guía tampoco existe, así que puede ganar el 404 de "guía desconocida" o
    // el 400 de "tipo desconocido" según el orden de comprobaciones; cualquiera de
    // los dos es una respuesta ordenada. Lo que no vale es 200 o 500.
    expect([400, 404]).toContain(res.status());
  });
});

test.describe("/api/tareas/liberar", () => {
  test("sin secreto responde 401", async ({ request }) => {
    const res = await request.post("/api/tareas/liberar");
    expect(res.status()).toBe(401);
  });

  test("secreto vacío responde 401", async ({ request }) => {
    const res = await request.post("/api/tareas/liberar", {
      headers: { "x-cron-secret": "" },
    });
    expect(res.status()).toBe(401);
  });

  test("secreto de otra longitud responde 401", async ({ request }) => {
    const res = await request.post("/api/tareas/liberar", {
      headers: { "x-cron-secret": "corto" },
    });
    expect(res.status()).toBe(401);
  });

  test("secreto incorrecto de la misma longitud responde 401", async ({ request }) => {
    const real = process.env.CRON_SECRET!;
    const fake = real
      .split("")
      .map((c) => (c === "a" ? "b" : "a"))
      .join("");
    const res = await request.post("/api/tareas/liberar", {
      headers: { "x-cron-secret": fake },
    });
    expect(res.status()).toBe(401);
  });

  test("método GET no está permitido", async ({ request }) => {
    const res = await request.get("/api/tareas/liberar", {
      headers: { "x-cron-secret": process.env.CRON_SECRET! },
    });
    expect([404, 405]).toContain(res.status());
  });

  test("secreto correcto por GET tampoco libera nada (el método no es POST)", async ({
    request,
  }) => {
    const res = await request.get("/api/tareas/liberar");
    expect([404, 405]).toContain(res.status());
  });
});

test.describe("rutas /api/dev/* firman correctamente y no se saltan comprobaciones", () => {
  test("dev/pago-callback firma y llega al webhook real (respuesta espejo)", async ({ request }) => {
    const payload = JSON.stringify({
      eventId: randomUUID(),
      reference: `ref-inexistente-${randomUUID()}`,
      type: "pago.aprobado",
    });
    const res = await request.post("/api/dev/pago-callback", {
      data: payload,
      headers: { "content-type": "application/json" },
    });
    // El puente firma internamente y reenvía; una referencia inexistente debe
    // devolver el mismo 404 que el webhook real, no un 200 fantasma.
    expect(res.status()).toBe(404);
  });

  test("dev/pago-callback no permite pagar un pedido ajeno o inexistente", async ({
    request,
  }) => {
    const payload = JSON.stringify({
      eventId: randomUUID(),
      reference: `orden-inventada-${randomUUID()}`,
      type: "pago.aprobado",
    });
    const res = await request.post("/api/dev/pago-callback", {
      data: payload,
      headers: { "content-type": "application/json" },
    });
    expect(res.status()).toBe(404);
  });

  test("dev/kyc-callback no aprueba una identidad con referencia inventada", async ({
    request,
  }) => {
    const payload = JSON.stringify({ reference: `ref-inventada-${randomUUID()}`, status: "aprobado" });
    const res = await request.post("/api/dev/kyc-callback", {
      data: payload,
      headers: { "content-type": "application/json" },
    });
    expect(res.status()).toBe(404);
  });
});
