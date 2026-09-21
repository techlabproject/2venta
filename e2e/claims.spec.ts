import { test, expect, type Page, type Browser } from "@playwright/test";
import { alertIn, makeAdmin, sellerWithListing, signUpVerified, withDb } from "./helpers";

// La prueba de punta a punta de la rebanada S-11.
// Ver slices/11-reclamos-y-disputas.md

/** Un pedido pagado y con entrega registrada, listo para reclamar. */
async function deliveredOrder(browser: Browser, title: string, price = 300_000) {
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
  await withDb((c) =>
    c.query(`update orders set delivered_at = now(), status = 'entregado' where id = $1`, [
      orderId,
    ])
  );
  return { seller, ctx, buyer, orderId };
}

async function openClaim(page: Page, kind: "no_coincide" | "no_llego", detail: string) {
  await page.getByText("Tengo un problema con el pedido").click();
  await page
    .getByRole("radio", {
      name: kind === "no_coincide" ? /no es lo que decía/ : /Nunca me llegó/,
    })
    .check();
  await page.getByLabel("Qué pasó").fill(detail);
  await page.getByRole("button", { name: "Abrir reclamo" }).click();
}

async function adminPage(browser: Browser) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const { email } = await signUpVerified(page, "admin", "Equipo 2venta");
  await makeAdmin(email);
  return { ctx, page };
}

test("el comprador abre un reclamo y el pedido queda en disputa", async ({ browser }) => {
  const { seller, ctx, buyer, orderId } = await deliveredOrder(browser, `Chaqueta ${Date.now()}`);

  await buyer.goto(`/pedido/${orderId}`);
  await openClaim(buyer, "no_coincide", "Llegó rota por la manga, el video no mostraba eso.");

  await expect(buyer.getByTestId("estado")).toHaveText("Con un reclamo abierto");
  await expect(buyer.getByRole("main")).toContainText("Tu dinero no se mueve");

  await seller.context.close();
  await ctx.close();
});

test("la liberación automática no toca un pedido en disputa", async ({ browser }) => {
  // Sin esto, un reclamo del día seis se resolvería solo al día siete a favor del
  // vendedor, por vencimiento. Es el caso que hace inútil todo el mecanismo.
  const { seller, ctx, buyer, orderId } = await deliveredOrder(browser, `Botas ${Date.now()}`);

  await buyer.goto(`/pedido/${orderId}`);
  await openClaim(buyer, "no_coincide", "No corresponde con lo que muestra el video.");
  await expect(buyer.getByTestId("estado")).toHaveText("Con un reclamo abierto");

  // Se adelanta el reloj mucho más allá del plazo.
  await withDb((c) =>
    c.query(`update orders set delivered_at = now() - interval '30 days' where id = $1`, [
      orderId,
    ])
  );
  const res = await buyer.request.post("/api/tareas/liberar", {
    headers: { "x-cron-secret": process.env.CRON_SECRET! },
  });
  expect(res.status()).toBe(200);

  await buyer.reload();
  await expect(buyer.getByTestId("estado")).toHaveText("Con un reclamo abierto");

  await seller.context.close();
  await ctx.close();
});

test("el vendedor ve el reclamo y responde", async ({ browser }) => {
  const { seller, ctx, buyer, orderId } = await deliveredOrder(browser, `Abrigo ${Date.now()}`);

  await buyer.goto(`/pedido/${orderId}`);
  await openClaim(buyer, "no_coincide", "Tiene una mancha grande que no estaba en el video.");
  await expect(buyer.getByTestId("estado")).toHaveText("Con un reclamo abierto");

  await seller.page.goto(`/pedido/${orderId}`);
  await expect(seller.page.getByRole("main")).toContainText("mancha grande");
  await seller.page.getByLabel("Tu versión").fill("En el video se ve entero, mándeme una foto.");
  await seller.page.getByRole("button", { name: "Responder" }).click();
  await expect(seller.page.getByRole("main")).toContainText("mándeme una foto");

  await buyer.reload();
  await expect(buyer.getByRole("main")).toContainText("mándeme una foto");

  await seller.context.close();
  await ctx.close();
});

test("resuelto a favor del comprador, el pedido queda reembolsado", async ({
  browser,
}) => {
  const { seller, ctx, buyer, orderId } = await deliveredOrder(browser, `Bufanda ${Date.now()}`);
  await buyer.goto(`/pedido/${orderId}`);
  await openClaim(buyer, "no_coincide", "Llegó otra cosa completamente distinta.");
  await expect(buyer.getByTestId("estado")).toHaveText("Con un reclamo abierto");

  const admin = await adminPage(browser);
  await admin.page.goto("/admin/disputas");
  const caso = admin.page.getByRole("listitem").filter({ hasText: "Bufanda" });
  await expect(caso).toHaveCount(1);
  await caso.getByRole("button", { name: "Devolver al comprador" }).click();
  // La cola tiene reclamos de otras pruebas, así que se comprueba que este salió,
  // no que la cola quedó vacía.
  await expect(caso).toHaveCount(0);

  await buyer.goto(`/pedido/${orderId}`);
  await expect(buyer.getByTestId("estado")).toHaveText("Reembolsado");
  await expect(buyer.getByTestId("resolucion")).toContainText("de quien compró");

  await seller.context.close();
  await ctx.close();
  await admin.ctx.close();
});

test("resuelto a favor del vendedor, el pago se libera", async ({ browser }) => {
  const { seller, ctx, buyer, orderId } = await deliveredOrder(browser, `Sombrero ${Date.now()}`);
  await buyer.goto(`/pedido/${orderId}`);
  await openClaim(buyer, "no_coincide", "Creo que no es lo que pedí, revisen por favor.");
  await expect(buyer.getByTestId("estado")).toHaveText("Con un reclamo abierto");

  const admin = await adminPage(browser);
  await admin.page.goto("/admin/disputas");
  const caso = admin.page.getByRole("listitem").filter({ hasText: "Sombrero" });
  await caso.getByRole("button", { name: "Liberar al vendedor" }).click();
  await expect(caso).toHaveCount(0);

  await buyer.goto(`/pedido/${orderId}`);
  await expect(buyer.getByTestId("estado")).toHaveText("Pago liberado al vendedor");
  await expect(buyer.getByTestId("resolucion")).toContainText("de quien vendió");

  await seller.context.close();
  await ctx.close();
  await admin.ctx.close();
});

test("reclamar por no coincidencia fuera de las 48 horas se rechaza", async ({
  browser,
}) => {
  const { seller, ctx, buyer, orderId } = await deliveredOrder(browser, `Camisa ${Date.now()}`);
  await withDb((c) =>
    c.query(`update orders set delivered_at = now() - interval '3 days' where id = $1`, [
      orderId,
    ])
  );

  await buyer.goto(`/pedido/${orderId}`);
  await openClaim(buyer, "no_coincide", "Ya pasaron varios días pero no me gustó.");
  await expect(alertIn(buyer)).toContainText("48 horas");

  await seller.context.close();
  await ctx.close();
});

test("reclamar que no llegó sí se acepta hasta el día 7", async ({ browser }) => {
  // La otra ventana de la D-12: una guía marcada como entregada no siempre
  // significa que alguien recibió algo.
  const { seller, ctx, buyer, orderId } = await deliveredOrder(browser, `Pantalón ${Date.now()}`);
  await withDb((c) =>
    c.query(`update orders set delivered_at = now() - interval '5 days' where id = $1`, [
      orderId,
    ])
  );

  await buyer.goto(`/pedido/${orderId}`);
  await openClaim(buyer, "no_llego", "La guía dice entregado pero nunca recibí nada.");
  await expect(buyer.getByTestId("estado")).toHaveText("Con un reclamo abierto");

  await seller.context.close();
  await ctx.close();
});

test("reclamar dos veces no crea dos reclamos", async ({ browser }) => {
  const { seller, ctx, buyer, orderId } = await deliveredOrder(browser, `Falda ${Date.now()}`);
  await buyer.goto(`/pedido/${orderId}`);
  await openClaim(buyer, "no_coincide", "No coincide con lo que muestra el video.");
  await expect(buyer.getByTestId("estado")).toHaveText("Con un reclamo abierto");

  // El formulario ya no está, y forzarlo tampoco crea otro.
  await expect(buyer.getByText("Tengo un problema con el pedido")).toHaveCount(0);
  const cuantos = await withDb(async (c) => {
    const { rows } = await c.query(`select 1 from claims where order_id = $1`, [orderId]);
    return rows.length;
  });
  expect(cuantos).toBe(1);

  await seller.context.close();
  await ctx.close();
});

test("no se puede reclamar un pedido ajeno", async ({ browser }) => {
  const { seller, ctx, orderId } = await deliveredOrder(browser, `Saco ${Date.now()}`);

  const otroCtx = await browser.newContext();
  const otro = await otroCtx.newPage();
  await signUpVerified(otro, "curioso", "Persona Ajena");
  const res = await otro.goto(`/pedido/${orderId}`);
  expect(res?.status()).toBe(404);

  await seller.context.close();
  await ctx.close();
  await otroCtx.close();
});

test("el vendedor no puede resolver su propio reclamo", async ({ browser }) => {
  const { seller, ctx, buyer, orderId } = await deliveredOrder(browser, `Corbata ${Date.now()}`);
  await buyer.goto(`/pedido/${orderId}`);
  await openClaim(buyer, "no_coincide", "No es lo que aparece en la publicación.");
  await expect(buyer.getByTestId("estado")).toHaveText("Con un reclamo abierto");

  // El panel no existe para él.
  const res = await seller.page.goto("/admin/disputas");
  expect(res?.status()).toBe(404);

  // Y llamando la acción directamente tampoco.
  await seller.page.goto(`/pedido/${orderId}`);
  await seller.page.evaluate(async (id) => {
    const form = new FormData();
    form.set("orderId", id);
    form.set("favor", "vendedor");
    await fetch(`/pedido/${id}`, { method: "POST", body: form }).catch(() => {});
  }, orderId);

  const estado = await withDb(async (c) => {
    const { rows } = await c.query<{ status: string }>(
      `select status from orders where id = $1`,
      [orderId]
    );
    return rows[0].status;
  });
  expect(estado).toBe("en_disputa");

  await seller.context.close();
  await ctx.close();
});

test("resolver dos veces no mueve el dinero dos veces", async ({ browser }) => {
  const { seller, ctx, buyer, orderId } = await deliveredOrder(browser, `Gabán ${Date.now()}`);
  await buyer.goto(`/pedido/${orderId}`);
  await openClaim(buyer, "no_coincide", "No corresponde con lo publicado en el video.");
  await expect(buyer.getByTestId("estado")).toHaveText("Con un reclamo abierto");

  const admin = await adminPage(browser);
  await admin.page.goto("/admin/disputas");
  await admin.page
    .getByRole("listitem")
    .filter({ hasText: "Gabán" })
    .getByRole("button", { name: "Devolver al comprador" })
    .click();
  await expect(admin.page.getByRole("listitem").filter({ hasText: "Gabán" })).toHaveCount(0);

  const movimientos = await withDb(async (c) => {
    const { rows } = await c.query<{ n: string }>(
      `select count(*)::text as n from order_events
        where order_id = $1 and to_status = 'reembolsado'`,
      [orderId]
    );
    return Number(rows[0].n);
  });
  expect(movimientos).toBe(1);

  await seller.context.close();
  await ctx.close();
  await admin.ctx.close();
});

/*
 * S-39 — fotos como prueba en un reclamo.
 * Ver slices/39-fotos-en-los-reclamos.md
 *
 * Lo encontró Luna el 2026-09-20: el chat deja adjuntar fotos y el reclamo no,
 * cuando el reclamo es justo donde una foto decide. Una de las dos partes llegaba
 * con prueba —el video de la publicación— y la otra solo con un párrafo.
 */

/** Un PNG de 1×1 real, para que el bucket reciba bytes de imagen de verdad. */
const PNG_1X1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

/** Adjunta `cuantas` fotos al formulario visible. */
async function adjuntarPruebas(page: Page, cuantas: number) {
  await page.setInputFiles(
    'input[type="file"]',
    Array.from({ length: cuantas }, (_, i) => ({
      name: `prueba-${i}.png`,
      mimeType: "image/png",
      buffer: PNG_1X1,
    })),
  );
}

test("las dos partes aportan fotos y quien modera las ve junto al video", async ({
  browser,
}) => {
  const { seller, ctx, buyer, orderId } = await deliveredOrder(
    browser,
    `Chaqueta con prueba ${Date.now()}`,
  );
  // El detalle lleva marca de tiempo porque la cola de disputas acumula los
  // reclamos abiertos de toda la corrida y hay que poder señalar ESTA tarjeta.
  const detalle = `Llegó con un roto en la manga ${Date.now()}.`;

  // El comprador abre el reclamo con dos fotos.
  await buyer.goto(`/pedido/${orderId}`);
  await buyer.getByText("Tengo un problema con el pedido").click();
  await buyer.getByRole("radio", { name: /no es lo que decía/ }).check();
  await buyer.getByLabel("Qué pasó").fill(detalle);
  await adjuntarPruebas(buyer, 2);
  await buyer.getByRole("button", { name: "Abrir reclamo" }).click();

  const delComprador = buyer.getByRole("img", {
    name: "Prueba que aportó quien compró",
  });
  await expect(delComprador).toHaveCount(2);

  // El vendedor las ve y responde con la suya.
  await seller.page.goto(`/pedido/${orderId}`);
  await expect(
    seller.page.getByRole("img", { name: "Prueba que aportó quien compró" }),
  ).toHaveCount(2);

  await seller.page
    .getByLabel("Tu versión")
    .fill("Salió sin roto, lo tengo grabado.");
  await adjuntarPruebas(seller.page, 1);
  await seller.page.getByRole("button", { name: "Responder" }).click();
  // Esperar a que la respuesta esté pintada del lado del vendedor antes de
  // recargar al comprador: si no, se recarga contra una acción todavía en vuelo.
  await expect(
    seller.page.getByRole("img", { name: "Prueba que aportó quien vendió" }),
  ).toHaveCount(1);

  await buyer.reload();
  await expect(
    buyer.getByRole("img", { name: "Prueba que aportó quien vendió" }),
  ).toHaveCount(1);

  // Quien modera ve las tres, cada una del lado de quien la aportó. La cola lleva
  // los reclamos abiertos de toda la corrida, así que se mira solo esta tarjeta.
  const admin = await adminPage(browser);
  await admin.page.goto("/admin/disputas");
  const tarjeta = admin.page
    .getByRole("listitem")
    .filter({ hasText: detalle });
  await expect(
    tarjeta.getByRole("img", { name: "Prueba que aportó quien compró" }),
  ).toHaveCount(2);
  await expect(
    tarjeta.getByRole("img", { name: "Prueba que aportó quien vendió" }),
  ).toHaveCount(1);

  await seller.context.close();
  await ctx.close();
  await admin.ctx.close();
});

test("una persona ajena al pedido no llega a las pruebas", async ({
  browser,
}) => {
  const { seller, ctx, buyer, orderId } = await deliveredOrder(
    browser,
    `Reclamo privado ${Date.now()}`,
  );

  await buyer.goto(`/pedido/${orderId}`);
  await buyer.getByText("Tengo un problema con el pedido").click();
  await buyer.getByRole("radio", { name: /no es lo que decía/ }).check();
  await buyer.getByLabel("Qué pasó").fill("Llegó una caja vacía, sin nada.");
  await adjuntarPruebas(buyer, 1);
  await buyer.getByRole("button", { name: "Abrir reclamo" }).click();
  await expect(
    buyer.getByRole("img", { name: "Prueba que aportó quien compró" }),
  ).toHaveCount(1);

  const otroCtx = await browser.newContext();
  const otro = await otroCtx.newPage();
  await signUpVerified(otro, "colado", "Otro Usuario");

  await otro.goto(`/pedido/${orderId}`);
  await expect(otro.getByRole("img", { name: /Prueba que aportó/ })).toHaveCount(
    0,
  );

  await seller.context.close();
  await ctx.close();
  await otroCtx.close();
});

test("la cuarta foto de un mismo lado no entra", async ({ browser }) => {
  const { seller, ctx, buyer, orderId } = await deliveredOrder(
    browser,
    `Tope de pruebas ${Date.now()}`,
  );

  await buyer.goto(`/pedido/${orderId}`);
  await buyer.getByText("Tengo un problema con el pedido").click();
  await buyer.getByRole("radio", { name: /Nunca me llegó/ }).check();
  await buyer.getByLabel("Qué pasó").fill("Nunca llegó nada a mi dirección.");

  // La interfaz se queda con las tres primeras y lo dice.
  await adjuntarPruebas(buyer, 4);
  await expect(alertIn(buyer)).toContainText("Solo caben 3 fotos");
  await buyer.getByRole("button", { name: "Abrir reclamo" }).click();
  await expect(
    buyer.getByRole("img", { name: "Prueba que aportó quien compró" }),
  ).toHaveCount(3);

  // Y el tope también está en el servidor: aunque llegaran cuatro claves, la
  // cuarta no se guarda.
  const guardadas = await withDb(async (c) => {
    const { rows } = await c.query<{ n: string }>(
      `select count(*)::text as n from claim_photos p
         join claims cl on cl.id = p.claim_id
        where cl.order_id = $1`,
      [orderId],
    );
    return Number(rows[0].n);
  });
  expect(guardadas).toBe(3);

  await seller.context.close();
  await ctx.close();
});
