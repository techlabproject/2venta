import { test, expect, type Browser } from "@playwright/test";
import { makeAdmin, sellerWithListing, signUpVerified, withDb } from "./helpers";

// La prueba de punta a punta de la rebanada S-25, parte 2 (RF-42).
// Ver slices/25-configuracion-y-reportes.md

async function adminPage(browser: Browser) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const { email } = await signUpVerified(page, "admin", "Equipo 2venta");
  await makeAdmin(email);
  return { ctx, page };
}

/** Una venta completada, para que haya cifras que reportar. */
async function completedSale(browser: Browser, price: number) {
  const seller = await sellerWithListing(browser, `Venta ${Date.now()}`, price, "ropa");
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
  await buyer.getByRole("button", { name: "Ya lo recibí, liberar pago" }).click();
  await expect(buyer.getByTestId("estado")).toHaveText("Pago liberado al vendedor");

  return { seller, ctx, buyer };
}

test("un administrador ve las cifras del periodo", async ({ browser }) => {
  const venta = await completedSale(browser, 200_000);
  const admin = await adminPage(browser);

  await admin.page.goto("/admin/reportes");
  await expect(admin.page.getByTestId("cifras")).toBeVisible();
  // El volumen incluye al menos esta venta.
  await expect(admin.page.getByTestId("cifras")).toContainText("Volumen");
  await expect(admin.page.getByRole("main")).toContainText("Por categoría");

  await venta.seller.context.close();
  await venta.ctx.close();
  await admin.ctx.close();
});

test("la tasa de disputa se muestra sola y con el objetivo al lado", async ({
  browser,
}) => {
  // De todas las cifras es la única que dice si el producto está funcionando.
  const venta = await completedSale(browser, 150_000);
  const admin = await adminPage(browser);

  await admin.page.goto("/admin/reportes");
  await expect(admin.page.getByTestId("tasa-disputa")).toBeVisible();
  await expect(admin.page.getByRole("main")).toContainText("El objetivo es menos del 5%");

  await venta.seller.context.close();
  await venta.ctx.close();
  await admin.ctx.close();
});

test("un periodo sin ventas no rompe ni inventa un promedio", async ({ browser }) => {
  const admin = await adminPage(browser);

  // Un periodo lejano en el pasado, donde no hay nada.
  await admin.page.goto("/admin/reportes?desde=2020-01-01&hasta=2020-01-31");
  await expect(admin.page.getByTestId("tasa-disputa")).toHaveText("Sin ventas");
  await expect(admin.page.getByRole("main")).toContainText("Sin ventas completadas");

  await admin.ctx.close();
});

test("fechas al revés o inválidas no rompen la pantalla", async ({ browser }) => {
  const admin = await adminPage(browser);

  // Al revés: se ordenan solas.
  let res = await admin.page.goto("/admin/reportes?desde=2026-12-31&hasta=2026-01-01");
  expect(res?.status()).toBe(200);
  await expect(admin.page.getByTestId("cifras")).toBeVisible();

  // Basura: se ignora y se usa el periodo por defecto.
  res = await admin.page.goto("/admin/reportes?desde=hola&hasta=--");
  expect(res?.status()).toBe(200);
  await expect(admin.page.getByTestId("cifras")).toBeVisible();

  await admin.ctx.close();
});

test("el archivo se descarga y trae las mismas cifras", async ({ browser }) => {
  const venta = await completedSale(browser, 300_000);
  const admin = await adminPage(browser);

  const res = await admin.page.request.get("/api/admin/reportes.csv");
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("text/csv");
  expect(res.headers()["content-disposition"]).toContain("attachment");

  const csv = await res.text();
  expect(csv).toContain("Ventas completadas");
  expect(csv).toContain("Tasa de disputa");
  expect(csv).toContain("Categoría,Ventas");

  await venta.seller.context.close();
  await venta.ctx.close();
  await admin.ctx.close();
});

test("quien no es administrador no ve la pantalla ni el archivo", async ({ browser }) => {
  // Sin esto, cualquiera con la dirección se llevaría las cifras del negocio.
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await signUpVerified(page, "normal", "Persona Normal");

  const pantalla = await page.goto("/admin/reportes");
  expect(pantalla?.status()).toBe(404);

  const archivo = await page.request.get("/api/admin/reportes.csv");
  expect(archivo.status()).toBe(404);

  await ctx.close();
});

test("sin sesión tampoco", async ({ request }) => {
  const res = await request.get("/api/admin/reportes.csv");
  expect(res.status()).toBe(404);
});

test("la comisión reportada coincide con la de los pedidos", async ({ browser }) => {
  // Si el reporte y los pedidos no cuadran, el reporte no sirve para nada.
  const venta = await completedSale(browser, 400_000);
  const admin = await adminPage(browser);

  const suma = await withDb(async (c) => {
    const { rows } = await c.query<{ total: string }>(
      `select coalesce(sum(commission_cop), 0)::text as total from orders
        where status = 'liberado' and created_at >= now() - interval '30 days'`
    );
    return Number(rows[0].total);
  });

  const res = await admin.page.request.get("/api/admin/reportes.csv");
  const csv = await res.text();
  const linea = csv.split("\n").find((l) => l.startsWith("Comisiones cobradas"))!;
  expect(Number(linea.split(",")[1])).toBe(suma);

  await venta.seller.context.close();
  await venta.ctx.close();
  await admin.ctx.close();
});

/*
 * Ronda de verificación 2026-09-20 (hallazgo H-1 de Luna).
 *
 * El resumen contaba como «ventas» los pedidos liberados MÁS los reembolsados,
 * pero el volumen, la comisión y la tabla por categoría solo contaban los
 * liberados. El ticket promedio dividía la plata de unos entre el número de los
 * otros, así que una sola venta de $300.000 con un reembolso al lado se reportaba
 * como «Ventas 2 · Volumen $300.000 · Ticket promedio $150.000»: un promedio que
 * no corresponde a ningún pedido que haya existido.
 */
test("el ticket promedio no se diluye con los pedidos reembolsados", async ({
  browser,
}) => {
  const venta = await completedSale(browser, 300_000);
  const admin = await adminPage(browser);

  // El panel agrega todo el periodo, así que lo que se mide no es una cifra
  // absoluta sino un efecto: meter un pedido devuelto no puede mover el promedio
  // de las ventas que sí ocurrieron.
  await admin.page.goto("/admin/reportes");
  const antes = await admin.page.getByTestId("ticket").textContent();
  const leerVentas = async () => {
    const t = (await admin.page.getByTestId("ventas").textContent()) ?? "";
    const m = t.match(/(\d+)\s+de\s+(\d+)/);
    return m ? { cerradas: Number(m[1]), total: Number(m[2]) } : null;
  };
  const ventasAntes = await leerVentas();

  await withDb(async (c) => {
    const { rows } = await c.query<{ seller_id: string; buyer_id: string }>(
      `select seller_id, buyer_id from orders order by created_at desc limit 1`,
    );
    const { seller_id, buyer_id } = rows[0];
    await c.query(
      `insert into orders
         (buyer_id, seller_id, status, provider, idempotency_key,
          subtotal_cop, shipping_cop, commission_cop, seller_payout_cop)
       values ($1, $2, 'reembolsado', 'prueba', $3, 900000, 12000, 45000, 855000)`,
      [buyer_id, seller_id, `devuelto-${Date.now()}`],
    );
  });

  await admin.page.reload();

  // Antes, un reembolso de $900.000 entraba al denominador sin entrar al volumen
  // y bajaba el promedio de todo el mes. Ahora no lo toca.
  await expect(admin.page.getByTestId("ticket")).toHaveText(antes!);
  // Y la cifra separa las dos cosas: un pedido más que terminó, ninguna venta más.
  const ventasDespues = await leerVentas();
  expect(ventasDespues!.total).toBe(ventasAntes!.total + 1);
  expect(ventasDespues!.cerradas).toBe(ventasAntes!.cerradas);

  await venta.seller.context.close();
  await venta.ctx.close();
  await admin.ctx.close();
});
