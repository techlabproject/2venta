import { test, expect, type Page } from "@playwright/test";
import { enqueueJob, runWorkerOnce, sellerWithListing, signUpVerified, withDb } from "./helpers";

// La prueba de punta a punta de la rebanada S-28.
// Ver slices/28-worker-y-cola.md

async function payFor(page: Page, listingId: string) {
  await page.goto(`/comprar/${listingId}`);
  await page.getByLabel("Quién recibe").fill("Laura Compradora");
  await page.getByLabel("Celular de quien recibe").fill("300 412 88 05");
  await page.getByLabel("Dirección").fill("Calle 45 # 13-20, apto 301");
  await page.getByLabel("Zona").selectOption("Chapinero");
  await page.getByRole("button", { name: "Ir a pagar" }).click();
  await expect(page).toHaveURL(/\/dev\/pago\//);
  await page.getByRole("button", { name: "Simular pago aprobado" }).click();
  await expect(page).toHaveURL(/\/pedido\//);
  return new URL(page.url()).pathname.split("/").pop()!;
}

test("la liberación automática llega por la cola, sin tocar la ruta manual", async ({
  browser,
}) => {
  const seller = await sellerWithListing(browser, `Licuadora ${Date.now()}`, 150_000);
  const ctx = await browser.newContext();
  const buyer = await ctx.newPage();
  await signUpVerified(buyer, "comprador", "Laura Compradora");
  const orderId = await payFor(buyer, seller.listingId);

  // D-11b: entregado hace más de siete días.
  await withDb((c) =>
    c.query(`update orders set delivered_at = now() - interval '8 days' where id = $1`, [
      orderId,
    ])
  );

  // Lo que hace EventBridge cada hora (D-51).
  await enqueueJob({ type: "liberar" });
  const salida = await runWorkerOnce();
  expect(salida).toMatch(/liberar → liberados: [1-9]/);

  await buyer.goto(`/pedido/${orderId}`);
  await expect(buyer.getByTestId("estado")).toHaveText("Pago liberado al vendedor");

  // SQS entrega al menos una vez: el mismo mensaje otra vez no libera nada más.
  await enqueueJob({ type: "liberar" });
  const repetida = await runWorkerOnce();
  expect(repetida).toMatch(/liberar → liberados: 0/);

  const historial = await withDb(async (c) => {
    const { rows } = await c.query<{ n: string }>(
      `select count(*)::text as n from order_events where order_id = $1 and to_status = 'liberado'`,
      [orderId]
    );
    return Number(rows[0].n);
  });
  expect(historial).toBe(1);

  await seller.context.close();
  await ctx.close();
});

test("un mensaje sin forma conocida se descarta y el worker sigue", async () => {
  await enqueueJob({ type: "avisar", listingId: "00000000-0000-4000-8000-000000000000" });
  await enqueueJob({ type: "liberar" });
  const salida = await runWorkerOnce();
  expect(salida).toContain("publicación inexistente, descartado");
  expect(salida).toContain("liberar → liberados");
  expect(salida).toContain("[worker] fin");
});

test("la ruta manual sigue existiendo y sigue exigiendo el secreto", async ({ request }) => {
  const sin = await request.post("/api/tareas/liberar");
  expect(sin.status()).toBe(401);
  const con = await request.post("/api/tareas/liberar", {
    headers: { "x-cron-secret": process.env.CRON_SECRET! },
  });
  expect(con.status()).toBe(200);
});
