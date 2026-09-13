import { test, expect } from "@playwright/test";
import { createHmac } from "node:crypto";
import {
  signUpVerified,
  sellerWithListing,
  withDb,
} from "../../helpers";

// Agente funcional — Parte 2, promesa 3: "Marcarte como verificado o marcar un
// pago sin que el proveedor lo diga". Probamos los webhooks reales
// (/api/kyc/webhook y /api/pagos/webhook), no el puente de desarrollo, con:
// sin firma, con firma mala, y con el mismo evento repetido.

const KYC_SECRET = process.env.KYC_WEBHOOK_SECRET!;
const PAGOS_SECRET = process.env.PAYMENTS_WEBHOOK_SECRET!;

function sign(secret: string, raw: string) {
  return createHmac("sha256", secret).update(raw).digest("hex");
}

test.describe("Webhook de KYC: no se puede marcar verificado sin que el proveedor firme", () => {
  test("sin firma y con firma mala se rechazan (401) y no cambian el estado; con firma correcta sí", async ({
    page,
    request,
  }) => {
    test.skip(!KYC_SECRET, "Falta KYC_WEBHOOK_SECRET en .env.local para firmar de prueba.");

    const { email } = await signUpVerified(page, "webhkyc", "Webhook Kyc");

    // Arrancamos una verificación real por la pantalla para tener una referencia
    // válida en estado "pendiente".
    await page.goto("/vender");
    await page.getByRole("button", { name: "Empezar verificación" }).click();
    await expect(page).toHaveURL(/\/dev\/kyc\//, { timeout: 10_000 });
    const ref = page.url().split("/dev/kyc/")[1].split("?")[0];

    const estadoInicial = await withDb((c) =>
      c.query(`select status from kyc_verifications where reference = $1`, [ref])
    );
    expect(estadoInicial.rows[0].status).toBe("pendiente");

    const body = JSON.stringify({ reference: ref, status: "aprobado", reason: null });

    // 1) Sin firma.
    const sinFirma = await request.post("/api/kyc/webhook", {
      data: body,
      headers: { "content-type": "application/json" },
    });
    expect(sinFirma.status()).toBe(401);

    // 2) Con firma mala.
    const firmaMala = await request.post("/api/kyc/webhook", {
      data: body,
      headers: {
        "content-type": "application/json",
        "x-kyc-signature": "0".repeat(64),
      },
    });
    expect(firmaMala.status()).toBe(401);

    const estadoTrasIntentos = await withDb((c) =>
      c.query(`select status from kyc_verifications where reference = $1`, [ref])
    );
    expect(estadoTrasIntentos.rows[0].status).toBe("pendiente");

    // 3) Con firma correcta: sí cambia.
    const firmaBuena = await request.post("/api/kyc/webhook", {
      data: body,
      headers: {
        "content-type": "application/json",
        "x-kyc-signature": sign(KYC_SECRET, body),
      },
    });
    expect(firmaBuena.status()).toBe(200);

    const estadoFinal = await withDb((c) =>
      c.query(`select status from kyc_verifications where reference = $1`, [ref])
    );
    expect(estadoFinal.rows[0].status).toBe("aprobado");
  });

  test("repetir el mismo evento firmado no rompe nada (segunda vez sigue en 200, sigue aprobado)", async ({
    page,
    request,
  }) => {
    test.skip(!KYC_SECRET, "Falta KYC_WEBHOOK_SECRET en .env.local para firmar de prueba.");

    await signUpVerified(page, "webhkyc2", "Webhook Kyc Repetido");
    await page.goto("/vender");
    await page.getByRole("button", { name: "Empezar verificación" }).click();
    await expect(page).toHaveURL(/\/dev\/kyc\//, { timeout: 10_000 });
    const ref = page.url().split("/dev/kyc/")[1].split("?")[0];

    const body = JSON.stringify({ reference: ref, status: "aprobado", reason: null });
    const headers = {
      "content-type": "application/json",
      "x-kyc-signature": sign(KYC_SECRET, body),
    };

    const r1 = await request.post("/api/kyc/webhook", { data: body, headers });
    expect(r1.status()).toBe(200);
    const r2 = await request.post("/api/kyc/webhook", { data: body, headers });
    expect(r2.status()).toBe(200);

    const estado = await withDb((c) =>
      c.query(`select status from kyc_verifications where reference = $1`, [ref])
    );
    expect(estado.rows[0].status).toBe("aprobado");
  });
});

test.describe("Webhook de pagos: no se puede marcar pagado sin que el proveedor firme", () => {
  test("sin firma y con firma mala se rechazan (401) y no cambian el pedido; con firma correcta sí; repetido no dobla el efecto", async ({
    browser,
    request,
  }) => {
    test.skip(!PAGOS_SECRET, "Falta PAYMENTS_WEBHOOK_SECRET en .env.local para firmar de prueba.");

    const { context, page, listingId } = await sellerWithListing(
      browser,
      "Webhook pagos QA " + Date.now(),
      95_000
    );
    await context.close(); // ya no necesitamos al vendedor

    const buyerCtx = await browser.newContext();
    const buyer = await buyerCtx.newPage();
    await signUpVerified(buyer, "webhpago", "Webhook Pago Comprador");

    await buyer.goto(`/comprar/${listingId}`);
    await buyer.getByLabel("Quién recibe").fill("Comprador QA");
    await buyer.getByLabel("Celular de quien recibe").fill("3004010101");
    await buyer.getByLabel("Dirección").fill("Calle QA 1-23");
    await buyer.getByLabel("Zona").selectOption({ index: 1 });
    await buyer.getByRole("button", { name: "Ir a pagar" }).click();
    await expect(buyer).toHaveURL(/\/dev\/pago\//, { timeout: 15_000 });
    const orderId = buyer.url().split("/dev/pago/")[1].split("?")[0];
    await buyerCtx.close();

    const row = await withDb((c) =>
      c.query(`select provider_ref, status from orders where id = $1`, [orderId])
    );
    const providerRef = row.rows[0].provider_ref as string;
    expect(row.rows[0].status).toBe("pendiente_pago");

    const eventId = `evt_qa_${Date.now()}`;
    const body = JSON.stringify({ eventId, reference: providerRef, type: "pago.aprobado" });

    // 1) Sin firma.
    const sinFirma = await request.post("/api/pagos/webhook", {
      data: body,
      headers: { "content-type": "application/json" },
    });
    expect(sinFirma.status()).toBe(401);

    // 2) Firma mala.
    const firmaMala = await request.post("/api/pagos/webhook", {
      data: body,
      headers: { "content-type": "application/json", "x-pagos-signature": "f".repeat(64) },
    });
    expect(firmaMala.status()).toBe(401);

    const estadoTrasIntentos = await withDb((c) =>
      c.query(`select status from orders where id = $1`, [orderId])
    );
    expect(estadoTrasIntentos.rows[0].status).toBe("pendiente_pago");

    // 3) Firma correcta: sí se marca pagado.
    const headers = {
      "content-type": "application/json",
      "x-pagos-signature": sign(PAGOS_SECRET, body),
    };
    const firmaBuena = await request.post("/api/pagos/webhook", { data: body, headers });
    expect(firmaBuena.status()).toBe(200);
    const j1 = await firmaBuena.json();
    expect(j1.aplicado).toBe(true);

    const estadoPagado = await withDb((c) =>
      c.query(`select status from orders where id = $1`, [orderId])
    );
    expect(estadoPagado.rows[0].status).toBe("pagado");

    // 4) El MISMO evento (mismo eventId) repetido: no debe volver a aplicar ni
    // duplicar el registro de auditoría.
    const repetido = await request.post("/api/pagos/webhook", { data: body, headers });
    expect(repetido.status()).toBe(200);
    const j2 = await repetido.json();
    expect(j2.aplicado).toBe(false);

    const eventos = await withDb((c) =>
      c.query(`select count(*)::int as n from order_events where provider_event_id = $1`, [eventId])
    );
    expect(eventos.rows[0].n).toBe(1);
  });
});
