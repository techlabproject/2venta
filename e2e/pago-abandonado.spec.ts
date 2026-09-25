import { expect, test, type Page } from "@playwright/test";
import {
  enqueueJob,
  makeAdmin,
  runWorkerOnce,
  sellerWithListing,
  signUpVerified,
  withDb,
} from "./helpers";

// Los tres hallazgos de dinero de la ronda de usuario del 2026-09-14.
//
// Cada prueba reproduce primero lo que se reportó y después comprueba el arreglo.

/** Lleva una compra hasta la pasarela y devuelve el pedido que quedó sin pagar. */
async function llegarAlPago(page: Page, listingId: string): Promise<string> {
  await page.goto(`/comprar/${listingId}`);
  await page.getByLabel("Quién recibe").fill("Laura Torres");
  await page.getByLabel("Celular de quien recibe").fill("300 412 88 05");
  await page.getByLabel("Dirección").fill("Calle 72 #10-34");
  await page.getByLabel("Zona").selectOption("Chapinero");
  await page.getByRole("button", { name: "Ir a pagar" }).click();
  await expect(page).toHaveURL(/\/dev\/pago\//);
  return new URL(page.url()).pathname.split("/").pop()!;
}

test("la pasarela cobra producto más envío, no solo el producto", async ({ browser }) => {
  const seller = await sellerWithListing(browser, "Atrapasueños de prueba", 35_000);

  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await signUpVerified(page, "compradora", "Laura Torres");
  await llegarAlPago(page, seller.listingId);

  // El defecto: la pasarela decía «Total a pagar $35.000» justo después de que el
  // checkout dijera $47.000, porque leía el subtotal en vez del total. El monto
  // que se le manda al proveedor siempre estuvo bien; lo que mentía era la
  // pantalla donde uno revisa que las cuentas cuadren. Con el envío de $10.000
  // (corrección 47) son $45.000.
  await expect(page.getByTestId("total-a-pagar")).toContainText("45.000");

  await ctx.close();
  await seller.context.close();
});

test("abandonar el pago no deja el artículo bloqueado para siempre", async ({ browser }) => {
  const seller = await sellerWithListing(browser, "Guante de prueba", 60_000);

  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await signUpVerified(page, "compradora", "Laura Torres");
  const pedido = await llegarAlPago(page, seller.listingId);

  // Lo reportado: al volver e intentar comprar otra vez decía «alguien más se
  // adelantó», y ese alguien era ella misma.
  await page.goto(`/producto/${seller.listingId}`);
  await expect(page.getByText("Lo tienes apartado con un pago sin terminar")).toBeVisible();
  await page.getByRole("link", { name: "Ir a tu pedido" }).click();
  await expect(page).toHaveURL(new RegExp(`/pedido/${pedido}`));
  await expect(page.getByRole("heading", { name: "Te falta terminar el pago" })).toBeVisible();

  // Y ahora puede soltarlo, que era lo que no existía por ninguna parte.
  await page.getByRole("button", { name: "Cancelar este pedido" }).click();
  await expect(page.getByRole("heading", { name: "Te falta terminar el pago" })).toBeHidden();

  const estado = await withDb(async (c) => {
    const { rows } = await c.query<{ status: string }>(
      `select status from listings where id = $1`,
      [seller.listingId]
    );
    return rows[0].status;
  });
  expect(estado).toBe("activa");

  // Y al soltarlo, vuelve a poder comprarlo de verdad.
  await page.goto(`/producto/${seller.listingId}`);
  await expect(page.getByRole("link", { name: "Comprar con pago protegido" })).toBeVisible();

  await ctx.close();
  await seller.context.close();
});

test("un pedido abandonado caduca solo y devuelve el artículo al catálogo", async ({
  browser,
}) => {
  const seller = await sellerWithListing(browser, "Mesa de prueba caducada", 80_000);

  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await signUpVerified(page, "compradora", "Laura Torres");
  const pedido = await llegarAlPago(page, seller.listingId);

  // Se envejece el pedido en vez de esperar media hora: lo que se prueba es el
  // barrido, no el reloj.
  await withDb((c) =>
    c.query(`update orders set created_at = now() - interval '2 hours' where id = $1`, [
      pedido,
    ])
  );

  await enqueueJob({ type: "caducar" });
  await runWorkerOnce();

  const despues = await withDb(async (c) => {
    const { rows } = await c.query<{ estado: string; pedido: string }>(
      `select (select status from listings where id = $1) as estado,
              (select status from orders   where id = $2) as pedido`,
      [seller.listingId, pedido]
    );
    return rows[0];
  });
  expect(despues.pedido).toBe("cancelado");
  expect(despues.estado).toBe("activa");

  // La cola entrega al menos una vez: repetir el barrido no puede romper nada ni
  // tocar una publicación que el vendedor ya movió.
  await enqueueJob({ type: "caducar" });
  await runWorkerOnce();

  await ctx.close();
  await seller.context.close();
});

test("la comisión por categoría no se multiplica por el número de artículos", async ({
  browser,
}) => {
  const seller = await sellerWithListing(browser, "Artículo del informe", 100_000);

  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const { email } = await signUpVerified(page, "admin", "Ada Administradora");
  await makeAdmin(email);

  // Un pedido liberado con DOS renglones: el error sumaba la comisión del pedido
  // una vez por renglón, así que la fila de la categoría reportaba el doble que el
  // resumen de arriba para la misma venta.
  await withDb(async (c) => {
    const { rows: pedido } = await c.query<{ id: string }>(
      `insert into orders (buyer_id, seller_id, status, subtotal_cop, commission_cop,
                           seller_payout_cop, provider, idempotency_key)
       select $1, l.seller_id, 'liberado', 100000, 5000, 95000, 'prueba', $2
         from listings l where l.id = $3
       returning id`,
      [
        (await c.query<{ id: string }>(`select id from "user" where email = $1`, [email]))
          .rows[0].id,
        `informe-${Date.now()}`,
        seller.listingId,
      ]
    );
    // Dos renglones distintos: la clave de order_items no admite el mismo
    // artículo dos veces, y el error que se prueba aparece con dos líneas.
    const { rows: segundo } = await c.query<{ id: string }>(
      `insert into listings (seller_id, title, description, category, condition,
                             price_cop, video_path, poster_path, status)
       select seller_id, 'Segundo renglón del informe', 'Prueba.', category,
              'usado_bueno', 50000, 'seed/demo.webm', 'seed/demo.jpg', 'vendida'
         from listings where id = $1
       returning id`,
      [seller.listingId]
    );
    for (const listingId of [seller.listingId, segundo[0].id]) {
      await c.query(
        `insert into order_items (order_id, listing_id, title_cop, price_cop)
         values ($1, $2, 'Renglón de prueba', 50000)`,
        [pedido[0].id, listingId]
      );
    }
  });

  await page.goto("/admin/reportes");

  // La suma de lo que reportan las categorías no puede pasarse de la comisión del
  // periodo. Antes se pasaba, y por eso el administrador veía dos cifras que no
  // cuadraban en la misma pantalla.
  const num = (t: string) => Number(t.replace(/[^\d]/g, ""));
  const resumen = num(await page.getByTestId("comisiones").innerText());
  const filas = await page.getByTestId("comision-categoria").allInnerTexts();
  const porCategoria = filas.reduce((t, f) => t + num(f), 0);

  expect(resumen).toBeGreaterThan(0);
  expect(porCategoria).toBeLessThanOrEqual(resumen);

  await ctx.close();
  await seller.context.close();
});
