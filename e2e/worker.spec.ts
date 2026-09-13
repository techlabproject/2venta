import { test, expect, type Page } from "@playwright/test";
import { enqueueJob, runWorkerOnce, sellerWithListing, signUpVerified, withDb } from "./helpers";
import { requestTranscode } from "../src/features/video/queries";
import { notifyForListing } from "../src/features/alerts/queries";

// Las pruebas de punta a punta de S-28 (cola) y S-30 (transcodificación).
// Ver slices/28-worker-y-cola.md y slices/30-transcodificar-video.md
//
// Las pruebas corren en paralelo y comparten la cola: el worker que lanza otra
// prueba puede procesar nuestro mensaje. Por eso se afirma sobre el estado en la
// base, nunca sobre la salida de consola de "nuestra" corrida.

test.setTimeout(120_000);

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
  await runWorkerOnce();

  await buyer.goto(`/pedido/${orderId}`);
  await expect(buyer.getByTestId("estado")).toHaveText("Pago liberado al vendedor");

  // SQS entrega al menos una vez: el mismo mensaje otra vez no libera nada más.
  await enqueueJob({ type: "liberar" });
  await runWorkerOnce();

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

test("un trabajo sobre algo que no existe se descarta sin tumbar el worker", async () => {
  await enqueueJob({ type: "avisar", listingId: "00000000-0000-4000-8000-000000000000" });
  const salida = await runWorkerOnce();
  expect(salida).toContain("[worker] fin");
  // El manejador, directo: es lo que el worker llama.
  expect(await notifyForListing("00000000-0000-4000-8000-000000000000")).toBeNull();
});

test("la ruta manual sigue existiendo y sigue exigiendo el secreto", async ({ request }) => {
  const sin = await request.post("/api/tareas/liberar");
  expect(sin.status()).toBe(401);
  const con = await request.post("/api/tareas/liberar", {
    headers: { "x-cron-secret": process.env.CRON_SECRET! },
  });
  expect(con.status()).toBe(200);
});

test("el video se transcodifica por la cola y la ficha pasa a servir la salida", async ({
  browser,
}) => {
  // Con el proveedor de prueba la "salida" es el mismo archivo; lo que se
  // comprueba es el circuito: transcodificar → video_listo → publicación
  // actualizada, y que repetirlo no rompe.
  const seller = await sellerWithListing(browser, `Parlante ${Date.now()}`, 90_000);
  const before = await withDb(async (c) => {
    const { rows } = await c.query<{ video_path: string }>(
      `select video_path from listings where id = $1`,
      [seller.listingId]
    );
    return rows[0].video_path;
  });

  // transcodificar → (proveedor de prueba) → video_listo → publicación actualizada.
  await enqueueJob({ type: "transcodificar", key: before });
  await runWorkerOnce();
  await runWorkerOnce(); // el segundo mensaje lo encoló el proveedor durante el primero

  const after = await withDb(async (c) => {
    const { rows } = await c.query<{ video_path: string; video_original_path: string }>(
      `select video_path, video_original_path from listings where id = $1`,
      [seller.listingId]
    );
    return rows[0];
  });
  expect(after.video_original_path).toBe(before);
  expect(after.video_path).toBeTruthy();

  // Repetido: no duplica ni rompe.
  await enqueueJob({ type: "video_listo", original: before, salida: after.video_path });
  await runWorkerOnce();
  const again = await withDb(async (c) => {
    const { rows } = await c.query<{ video_path: string; video_original_path: string }>(
      `select video_path, video_original_path from listings where id = $1`,
      [seller.listingId]
    );
    return rows[0];
  });
  expect(again).toEqual(after);

  // Una clave que no es de ninguna publicación se descarta. El manejador, directo.
  expect(await requestTranscode("2026-01/00000000-0000-4000-8000-000000000000.webm")).toContain(
    "descartado"
  );

  await seller.context.close();
});
