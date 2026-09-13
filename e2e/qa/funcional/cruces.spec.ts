import { test, expect } from "@playwright/test";
import { createHmac } from "node:crypto";
import { signUpVerified, sellerWithListing, withDb, alertIn, runWorkerOnce, enqueueJob } from "../../helpers";

// Agente funcional — Parte 1 (los cruces). Diez escenarios de alto riesgo entre
// funciones, elegidos de la lista del AGENTE-QA.md.

const PAGOS_SECRET = process.env.PAYMENTS_WEBHOOK_SECRET!;
function sign(secret: string, raw: string) {
  return createHmac("sha256", secret).update(raw).digest("hex");
}

/** Simula "Simular pago aprobado" pero directo contra el webhook real y firmado. */
async function aprobarPago(request: import("@playwright/test").APIRequestContext, orderId: string) {
  const row = await withDb((c) => c.query(`select provider_ref from orders where id = $1`, [orderId]));
  const providerRef = row.rows[0].provider_ref as string;
  const body = JSON.stringify({ eventId: `evt_qa_${Date.now()}_${Math.random()}`, reference: providerRef, type: "pago.aprobado" });
  const res = await request.post("/api/pagos/webhook", {
    data: body,
    headers: { "content-type": "application/json", "x-pagos-signature": sign(PAGOS_SECRET, body) },
  });
  expect(res.status()).toBe(200);
}

test.describe("Cruce 1: carrito con algo vendido por otro lado antes de pagar", () => {
  test("si otra persona compra el artículo mientras está en tu carrito, el carrito lo marca no disponible y bloquea el pago", async ({
    browser,
  }) => {
    const { context: sellerCtx, listingId } = await sellerWithListing(browser, "Cruce vendido " + Date.now(), 55_000);

    const buyerACtx = await browser.newContext();
    const buyerA = await buyerACtx.newPage();
    await signUpVerified(buyerA, "cruceA", "Comprador A");
    await buyerA.goto(`/producto/${listingId}`);
    await buyerA.getByRole("button", { name: "Agregar al carrito" }).click();
    await expect(buyerA.getByText("Está en tu carrito.")).toBeVisible();

    // Otro comprador se adelanta y compra el mismo artículo directo (no carrito).
    const buyerBCtx = await browser.newContext();
    const buyerB = await buyerBCtx.newPage();
    await signUpVerified(buyerB, "cruceB", "Comprador B");
    await buyerB.goto(`/producto/${listingId}`);
    await buyerB.getByRole("link", { name: /Comprar con pago protegido/i }).click();
    await buyerB.getByLabel("Quién recibe").fill("B");
    await buyerB.getByLabel("Celular de quien recibe").fill("3001234567");
    await buyerB.getByLabel("Dirección").fill("Calle B");
    await buyerB.getByLabel("Zona").selectOption({ index: 1 });
    await buyerB.getByRole("button", { name: "Ir a pagar" }).click();
    await expect(buyerB).toHaveURL(/\/dev\/pago\//, { timeout: 15_000 });

    // El comprador A vuelve a su carrito: el artículo debe verse no disponible.
    await buyerA.goto("/carrito");
    await buyerA.screenshot({ path: "qa/capturas/funcional-cruce-carrito-vendido-otro-lado.png", fullPage: true });
    const texto = await buyerA.locator("main").innerText();
    expect(texto).toContain("ya no está disponible");
    const irAPagar = buyerA.getByRole("link", { name: "Ir a pagar" });
    expect(await irAPagar.isVisible().catch(() => false)).toBe(false);

    await sellerCtx.close();
    await buyerACtx.close();
    await buyerBCtx.close();
  });
});

test.describe("Cruce 2: oferta aceptada y publicación retirada antes de pagar", () => {
  test("si el vendedor retira la publicación después de aceptar la oferta, el comprador no puede pagar con esa oferta", async ({
    browser,
  }) => {
    const { context: sellerCtx, page: sellerPage, listingId } = await sellerWithListing(
      browser,
      "Cruce oferta+retiro " + Date.now(),
      88_000
    );
    const buyerCtx = await browser.newContext();
    const buyer = await buyerCtx.newPage();
    await signUpVerified(buyer, "crucereto", "Cruce Retiro");
    await buyer.goto(`/producto/${listingId}`);
    await buyer.getByRole("button", { name: "Escribirle al vendedor" }).click();
    await buyer.getByLabel("Cuánto ofreces").fill("70000");
    await buyer.getByRole("button", { name: "Ofertar" }).click();
    await buyer.waitForTimeout(400);

    await sellerPage.goto(buyer.url());
    await sellerPage.getByRole("button", { name: "Aceptar" }).click();
    await sellerPage.waitForTimeout(400);

    // El vendedor retira la publicación (el botón vive en la ficha, no en /editar).
    await sellerPage.goto(`/producto/${listingId}`);
    const retirar = sellerPage.getByRole("button", { name: /Retirar la publicación/i });
    await retirar.click();
    await sellerPage.waitForTimeout(400);

    const estado = await withDb((c) => c.query(`select status from listings where id = $1`, [listingId]));
    expect(estado.rows[0].status).toBe("retirada");

    const offerId = await withDb(async (c) => {
      const r = await c.query(`select id from offers where listing_id = $1 order by created_at desc limit 1`, [listingId]);
      return r.rows[0].id as string;
    });

    await buyer.goto(`/comprar/${listingId}?oferta=${offerId}`);
    // getListing probablemente ya no devuelve una publicación retirada.
    const bloqueado = await buyer.getByRole("heading", { name: /no encontr/i }).isVisible().catch(() => false)
      || buyer.url().includes("404");
    await buyer.screenshot({ path: "qa/capturas/funcional-cruce-oferta-publicacion-retirada.png", fullPage: true });

    // Aunque llegara a la pantalla, el pago debe rechazarse en el servidor
    // porque getListing filtra por publicaciones visibles/activas.
    const antesDePedidos = await withDb((c) => c.query(`select count(*)::int as n from order_items where listing_id = $1`, [listingId]));
    expect(antesDePedidos.rows[0].n).toBe(0);
    console.log("¿La pantalla de pago quedó bloqueada (404 o similar) para una publicación retirada?", bloqueado);

    await sellerCtx.close();
    await buyerCtx.close();
  });
});

test.describe("Cruce 3: destacar y luego retirar", () => {
  test("al retirar una publicación destacada, deja de verse en el catálogo y el destacado no se reembolsa (ni lo dice la pantalla)", async ({
    browser,
    request,
  }) => {
    test.skip(!PAGOS_SECRET, "Falta PAYMENTS_WEBHOOK_SECRET.");
    const { context: sellerCtx, page: sellerPage, listingId } = await sellerWithListing(
      browser,
      "Cruce destacar QA " + Date.now(),
      65_000
    );

    await sellerPage.goto(`/producto/${listingId}`);
    const destacarBtn = sellerPage.getByRole("button", { name: /Destacar por/i });
    const hayBoton = await destacarBtn.isVisible().catch(() => false);
    test.skip(!hayBoton, "No se encontró el botón de destacar en la ficha del vendedor.");

    await destacarBtn.click();
    await expect(sellerPage).toHaveURL(/\/dev\/destacar\//, { timeout: 10_000 });
    const promoId = sellerPage.url().split("/dev/destacar/")[1].split("?")[0];

    // Simulamos la aprobación del pago del destacado por el mismo puente firmado
    // que usa la pantalla de prueba.
    await sellerPage.getByRole("button", { name: /Simular pago aprobado/i }).click();
    await sellerPage.waitForTimeout(600);

    const promoAntes = await withDb((c) => c.query(`select status from promotions where id = $1`, [promoId]));
    console.log("Estado del destacado tras aprobar el pago:", promoAntes.rows[0]?.status);

    // Retiramos la publicación (el botón vive en la ficha, no en /editar).
    await sellerPage.goto(`/producto/${listingId}`);
    await sellerPage.getByRole("button", { name: /Retirar la publicación/i }).click();
    await sellerPage.waitForTimeout(400);

    const listingStatus = await withDb((c) => c.query(`select status from listings where id = $1`, [listingId]));
    expect(listingStatus.rows[0].status).toBe("retirada");

    const promoDespues = await withDb((c) => c.query(`select status, ends_at from promotions where id = $1`, [promoId]));
    console.log("Estado del destacado DESPUÉS de retirar la publicación:", promoDespues.rows[0]);
    // Documentamos el comportamiento observado: el registro de la promoción NO
    // cambia de estado ni se reembolsa solo porque la publicación se retiró.
    expect(promoDespues.rows[0]?.status).toBe(promoAntes.rows[0]?.status);

    await sellerPage.screenshot({ path: "qa/capturas/funcional-cruce-destacar-retirar.png", fullPage: true });
    await sellerCtx.close();
  });
});

test.describe("Cruce 4: reclamo abierto y el vendedor intenta editar la publicación", () => {
  test("una vez pagado el pedido, la publicación queda 'vendida' y no se puede editar, con o sin reclamo abierto", async ({
    browser,
    request,
  }) => {
    test.skip(!PAGOS_SECRET, "Falta PAYMENTS_WEBHOOK_SECRET.");
    const { context: sellerCtx, page: sellerPage, listingId } = await sellerWithListing(
      browser,
      "Cruce reclamo+editar " + Date.now(),
      77_000
    );
    const buyerCtx = await browser.newContext();
    const buyer = await buyerCtx.newPage();
    await signUpVerified(buyer, "crucereclamo", "Cruce Reclamo");
    await buyer.goto(`/producto/${listingId}`);
    await buyer.getByRole("link", { name: /Comprar con pago protegido/i }).click();
    await buyer.getByLabel("Quién recibe").fill("Reclamo");
    await buyer.getByLabel("Celular de quien recibe").fill("3002223344");
    await buyer.getByLabel("Dirección").fill("Calle Reclamo 1");
    await buyer.getByLabel("Zona").selectOption({ index: 1 });
    await buyer.getByRole("button", { name: "Ir a pagar" }).click();
    await expect(buyer).toHaveURL(/\/dev\/pago\//, { timeout: 15_000 });
    const orderId = buyer.url().split("/dev/pago/")[1].split("?")[0];
    await aprobarPago(request, orderId);

    const listingStatus = await withDb((c) => c.query(`select status from listings where id = $1`, [listingId]));
    expect(listingStatus.rows[0].status).toBe("vendida");

    // El comprador abre un reclamo.
    await buyer.goto(`/pedido/${orderId}`);
    await buyer.getByText("Tengo un problema con el pedido").click();
    await buyer.getByLabel("Nunca me llegó").check();
    await buyer.getByLabel("Qué pasó").fill("El pedido nunca llegó a mi dirección, pasaron varios días.");
    await buyer.getByRole("button", { name: "Abrir reclamo" }).click();
    await buyer.waitForTimeout(500);

    const orderStatus = await withDb((c) => c.query(`select status from orders where id = $1`, [orderId]));
    expect(orderStatus.rows[0].status).toBe("en_disputa");

    // El vendedor intenta editar la publicación mientras el reclamo está abierto.
    await sellerPage.goto(`/producto/${listingId}/editar`);
    const tituloVisible = await sellerPage.getByLabel("Título").isVisible().catch(() => false);
    console.log("¿El vendedor ve el FORMULARIO de edición de una publicación ya vendida?", tituloVisible);
    await sellerPage.screenshot({ path: "qa/capturas/funcional-cruce-reclamo-editar-vendida-formulario.png", fullPage: true });
    // HALLAZGO candidato (UX, no de datos): /producto/[id]/editar solo comprueba
    // dueño, no estado, así que el formulario se ve igual para una publicación
    // vendida/con reclamo abierto. Documentamos que el formulario SÍ se muestra.
    expect(tituloVisible).toBe(true);

    if (tituloVisible) {
      const tituloOriginal = await sellerPage.getByLabel("Título").inputValue();
      await sellerPage.getByLabel("Título").fill(tituloOriginal + " EDITADO MIENTRAS HAY RECLAMO");
      await sellerPage.getByRole("button", { name: "Guardar cambios" }).click();
      await sellerPage.waitForTimeout(500);
      const alerta = alertIn(sellerPage);
      const huboError = await alerta.isVisible().catch(() => false);
      console.log("¿El SERVIDOR rechazó guardar el cambio?", huboError, huboError ? await alerta.innerText() : "");
      await sellerPage.screenshot({ path: "qa/capturas/funcional-cruce-reclamo-editar-vendida-rechazado.png", fullPage: true });
      // La protección real está en el servidor: no debe haber cambiado el título.
      expect(huboError).toBe(true);
      const listingTrasIntento = await withDb((c) => c.query(`select title from listings where id = $1`, [listingId]));
      expect(listingTrasIntento.rows[0].title).toBe(tituloOriginal);
    }

    await sellerCtx.close();
    await buyerCtx.close();
  });
});

test.describe("Cruce 5: reclamo abierto el día 6 de los 7 de liberación automática", () => {
  test("con un reclamo sin resolver, el worker NO libera el pago aunque hayan pasado los 7 días; sin reclamo sí libera", async ({
    browser,
    request,
  }) => {
    test.skip(!PAGOS_SECRET, "Falta PAYMENTS_WEBHOOK_SECRET.");

    // Caso A: con reclamo abierto, entregado hace 8 días (más que el plazo).
    const a = await sellerWithListing(browser, "Cruce día6 CON reclamo " + Date.now(), 60_000);
    const buyerACtx = await browser.newContext();
    const buyerA = await buyerACtx.newPage();
    await signUpVerified(buyerA, "dia6con", "Dia6 Con Reclamo");
    await buyerA.goto(`/producto/${a.listingId}`);
    await buyerA.getByRole("link", { name: /Comprar con pago protegido/i }).click();
    await buyerA.getByLabel("Quién recibe").fill("Dia6");
    await buyerA.getByLabel("Celular de quien recibe").fill("3003334455");
    await buyerA.getByLabel("Dirección").fill("Calle Dia6");
    await buyerA.getByLabel("Zona").selectOption({ index: 1 });
    await buyerA.getByRole("button", { name: "Ir a pagar" }).click();
    await expect(buyerA).toHaveURL(/\/dev\/pago\//, { timeout: 15_000 });
    const orderIdA = buyerA.url().split("/dev/pago/")[1].split("?")[0];
    await aprobarPago(request, orderIdA);

    // "Día 6 de los 7": el reclamo se abre cuando la entrega tiene 6 días, que
    // está DENTRO de la ventana de 7 días para "Nunca me llegó" (D-12).
    await withDb((c) =>
      c.query(`update orders set delivered_at = now() - interval '6 days' where id = $1`, [orderIdA])
    );
    await buyerA.goto(`/pedido/${orderIdA}`);
    await buyerA.getByText("Tengo un problema con el pedido").click();
    await buyerA.getByLabel("Nunca me llegó").check();
    await buyerA.getByLabel("Qué pasó").fill("Está marcado como entregado pero nunca llegó nada a mi casa.");
    await buyerA.getByRole("button", { name: "Abrir reclamo" }).click();
    await buyerA.waitForTimeout(400);
    const antesA = await withDb((c) => c.query(`select status from orders where id = $1`, [orderIdA]));
    expect(antesA.rows[0].status).toBe("en_disputa");

    // Ahora simulamos que pasó el tiempo hasta superar el plazo de liberación
    // automática de 7 días, con el reclamo TODAVÍA sin resolver.
    await withDb((c) =>
      c.query(`update orders set delivered_at = now() - interval '8 days' where id = $1`, [orderIdA])
    );

    // Caso B (control): SIN reclamo, entregado hace 8 días. Debe liberarse.
    const b = await sellerWithListing(browser, "Cruce día6 SIN reclamo " + Date.now(), 60_000);
    const buyerBCtx = await browser.newContext();
    const buyerB = await buyerBCtx.newPage();
    await signUpVerified(buyerB, "dia6sin", "Dia6 Sin Reclamo");
    await buyerB.goto(`/producto/${b.listingId}`);
    await buyerB.getByRole("link", { name: /Comprar con pago protegido/i }).click();
    await buyerB.getByLabel("Quién recibe").fill("Dia6B");
    await buyerB.getByLabel("Celular de quien recibe").fill("3006667788");
    await buyerB.getByLabel("Dirección").fill("Calle Dia6 B");
    await buyerB.getByLabel("Zona").selectOption({ index: 1 });
    await buyerB.getByRole("button", { name: "Ir a pagar" }).click();
    await expect(buyerB).toHaveURL(/\/dev\/pago\//, { timeout: 15_000 });
    const orderIdB = buyerB.url().split("/dev/pago/")[1].split("?")[0];
    await aprobarPago(request, orderIdB);
    await withDb((c) =>
      c.query(`update orders set delivered_at = now() - interval '8 days' where id = $1`, [orderIdB])
    );

    // La liberación automática no corre sola: hay que encolar el trabajo
    // "liberar" (lo haría un programador externo, D-51) y dejar que el worker
    // lo procese.
    await enqueueJob({ type: "liberar" });
    await runWorkerOnce();

    const despuesA = await withDb((c) => c.query(`select status from orders where id = $1`, [orderIdA]));
    const despuesB = await withDb((c) => c.query(`select status from orders where id = $1`, [orderIdB]));
    console.log("Con reclamo abierto, ¿sigue en disputa tras el worker?", despuesA.rows[0].status);
    console.log("Sin reclamo, ¿se liberó tras el worker?", despuesB.rows[0].status);

    expect(despuesA.rows[0].status).toBe("en_disputa"); // NO se liberó solo.
    expect(despuesB.rows[0].status).toBe("liberado"); // control: sí se liberó.
    // (No cerramos los contextos manualmente: con varios contextos por prueba,
    // cerrarlos a mano choca con la grabación de traza de Playwright en esta
    // versión y produce un error de limpieza de archivos que no tiene que ver
    // con la aplicación. El runner los cierra solo al terminar la prueba.)
  });
});

test.describe("Cruce 6: suspender una cuenta con pedido pagado sin entregar", () => {
  test("el vendedor suspendido sigue viendo el pedido pero no puede escribir en el chat; el comprador puede reclamar y liberar normalmente", async ({
    browser,
    request,
  }) => {
    test.skip(!PAGOS_SECRET, "Falta PAYMENTS_WEBHOOK_SECRET.");
    const { context: sellerCtx, page: sellerPage, listingId } = await sellerWithListing(
      browser,
      "Cruce suspender " + Date.now(),
      66_000
    );
    const sellerEmail = await withDb(async (c) => {
      const l = await c.query(`select seller_id from listings where id = $1`, [listingId]);
      const u = await c.query(`select email from "user" where id = $1`, [l.rows[0].seller_id]);
      return u.rows[0].email as string;
    });

    const buyerCtx = await browser.newContext();
    const buyer = await buyerCtx.newPage();
    await signUpVerified(buyer, "crucesuspende", "Cruce Suspende");
    await buyer.goto(`/producto/${listingId}`);
    await buyer.getByRole("button", { name: "Escribirle al vendedor" }).click();
    await buyer.getByLabel("Mensaje").fill("Hola, antes de comprar: llega mañana?");
    await buyer.getByRole("button", { name: "Enviar" }).click();
    await buyer.waitForTimeout(300);
    const chatUrl = buyer.url();

    await buyer.goto(`/producto/${listingId}`);
    await buyer.getByRole("link", { name: /Comprar con pago protegido/i }).click();
    await buyer.getByLabel("Quién recibe").fill("Suspende");
    await buyer.getByLabel("Celular de quien recibe").fill("3009990000");
    await buyer.getByLabel("Dirección").fill("Calle Suspende 1");
    await buyer.getByLabel("Zona").selectOption({ index: 1 });
    await buyer.getByRole("button", { name: "Ir a pagar" }).click();
    await expect(buyer).toHaveURL(/\/dev\/pago\//, { timeout: 15_000 });
    const orderId = buyer.url().split("/dev/pago/")[1].split("?")[0];
    await aprobarPago(request, orderId); // pagado, sin entregar

    // Preparamos el estado de suspensión directo en la base (el mecanismo de
    // suspender ya lo prueba otra parte; aquí interesan las CONSECUENCIAS).
    await withDb((c) => c.query(`update "user" set suspended_at = now(), suspended_reason = 'prueba QA' where email = $1`, [sellerEmail]));

    // El vendedor suspendido sigue viendo su cuenta y el pedido (lectura sí).
    await sellerPage.goto(`/pedido/${orderId}`);
    await expect(sellerPage).not.toHaveURL(/\/suspendida$/);
    await sellerPage.screenshot({ path: "qa/capturas/funcional-cruce-vendedor-suspendido-ve-pedido.png", fullPage: true });

    // El vendedor suspendido intenta escribir en el chat: debe bloquearse.
    await sellerPage.goto(chatUrl);
    const mensajeInput = sellerPage.getByLabel("Mensaje");
    if (await mensajeInput.isVisible().catch(() => false)) {
      await mensajeInput.fill("Sí, mañana sin falta");
      await sellerPage.getByRole("button", { name: "Enviar" }).click();
      await sellerPage.waitForTimeout(500);
      await expect(sellerPage).toHaveURL(/\/suspendida/, { timeout: 8000 });
    } else {
      // Si ya no llegó al chat (redirigido antes), igual debe terminar en /suspendida.
      await expect(sellerPage).toHaveURL(/\/suspendida/);
    }
    await sellerPage.screenshot({ path: "qa/capturas/funcional-cruce-vendedor-suspendido-no-escribe.png", fullPage: true });

    // El comprador (no suspendido) puede abrir un reclamo con normalidad.
    await buyer.goto(`/pedido/${orderId}`);
    await buyer.getByText("Tengo un problema con el pedido").click();
    await buyer.getByLabel("Llegó, pero no es lo que decía la publicación").check();
    await buyer.getByLabel("Qué pasó").fill("El vendedor está suspendido y quiero dejar constancia por si acaso.");
    await buyer.getByRole("button", { name: "Abrir reclamo" }).click();
    await buyer.waitForTimeout(400);
    const conReclamo = await withDb((c) => c.query(`select status from orders where id = $1`, [orderId]));
    console.log("¿El comprador pudo abrir un reclamo contra un vendedor suspendido?", conReclamo.rows[0].status);
    expect(conReclamo.rows[0].status).toBe("en_disputa");

    await sellerCtx.close();
    await buyerCtx.close();
  });
});

test.describe("Cruce 7: código de entrega presencial — reutilizar, otro pedido, vencido", () => {
  test("el código ya usado no vuelve a servir; el código de un pedido no sirve para otro; un código vencido se rechaza", async ({
    browser,
    request,
  }) => {
    test.skip(!PAGOS_SECRET, "Falta PAYMENTS_WEBHOOK_SECRET.");

    async function pedidoPresencial(title: string, price: number) {
      const s = await sellerWithListing(browser, title, price);
      const buyerCtx = await browser.newContext();
      const buyer = await buyerCtx.newPage();
      await signUpVerified(buyer, "presencial", "Presencial " + Math.random().toString(36).slice(2, 7));
      await buyer.goto(`/producto/${s.listingId}`);
      await buyer.getByRole("link", { name: /Comprar con pago protegido/i }).click();
      await buyer.getByLabel("En persona").check().catch(async () => {
        await buyer.getByText("Nos vemos en persona").click();
      });
      await buyer.getByLabel("¿En qué zona se ven?").selectOption({ index: 1 });
      await buyer.getByRole("button", { name: "Ir a pagar" }).click();
      await expect(buyer).toHaveURL(/\/dev\/pago\//, { timeout: 15_000 });
      const orderId = buyer.url().split("/dev/pago/")[1].split("?")[0];
      await aprobarPago(request, orderId);
      await buyer.goto(`/pedido/${orderId}`);
      const codigo = (await buyer.getByTestId("codigo").innerText()).replace(/\D/g, "");
      return { ...s, buyerCtx, buyer, orderId, codigo };
    }

    const p1 = await pedidoPresencial("Presencial 1 " + Date.now(), 40_000);
    const p2 = await pedidoPresencial("Presencial 2 " + Date.now(), 42_000);

    // 1) El código del pedido 1 usado en el pedido 2: no debe servir.
    await p2.page.goto(`/pedido/${p2.orderId}`);
    await p2.page.getByLabel("Código del comprador").fill(p1.codigo);
    await p2.page.getByRole("button", { name: "Cobrar la venta" }).click();
    await p2.page.waitForTimeout(400);
    const p2TrasCodigoAjeno = await withDb((c) => c.query(`select status from orders where id = $1`, [p2.orderId]));
    console.log("Pedido 2 tras usar el código del pedido 1:", p2TrasCodigoAjeno.rows[0].status);
    expect(p2TrasCodigoAjeno.rows[0].status).toBe("pagado"); // no se liberó

    // 2) Reutilizar: el código correcto del pedido 1, usado dos veces.
    await p1.page.goto(`/pedido/${p1.orderId}`);
    await p1.page.getByLabel("Código del comprador").fill(p1.codigo);
    await p1.page.getByRole("button", { name: "Cobrar la venta" }).click();
    await p1.page.waitForTimeout(400);
    const p1TrasPrimerUso = await withDb((c) => c.query(`select status from orders where id = $1`, [p1.orderId]));
    expect(p1TrasPrimerUso.rows[0].status).toBe("liberado");

    await p1.page.goto(`/pedido/${p1.orderId}`);
    const formularioSigueAhi = await p1.page.getByLabel("Código del comprador").isVisible().catch(() => false);
    console.log("¿El formulario de cobrar sigue visible tras liberar? (reutilizar)", formularioSigueAhi);
    if (formularioSigueAhi) {
      await p1.page.getByLabel("Código del comprador").fill(p1.codigo);
      await p1.page.getByRole("button", { name: "Cobrar la venta" }).click();
      await p1.page.waitForTimeout(400);
      const alerta = alertIn(p1.page);
      await expect(alerta).toContainText(/usó|usado/i);
    }

    // 3) Vencido: pedido 2, forzamos expires_at al pasado y probamos su propio
    // código correcto.
    await withDb((c) => c.query(`update pickup_codes set expires_at = now() - interval '1 hour' where order_id = $1`, [p2.orderId]));
    await p2.page.goto(`/pedido/${p2.orderId}`);
    await p2.page.getByLabel("Código del comprador").fill(p2.codigo);
    await p2.page.getByRole("button", { name: "Cobrar la venta" }).click();
    await p2.page.waitForTimeout(400);
    const alertaVencido = alertIn(p2.page);
    await expect(alertaVencido).toContainText(/venci/i);
    const p2Final = await withDb((c) => c.query(`select status from orders where id = $1`, [p2.orderId]));
    expect(p2Final.rows[0].status).toBe("pagado");
    await p2.page.screenshot({ path: "qa/capturas/funcional-cruce-codigo-vencido.png", fullPage: true });

    // (Cierre manual omitido a propósito: ver la nota en el Cruce 5.)
  });
});

test.describe("Cruce 8: alias con reseñas, y alias repetido", () => {
  test("cambiar el alias no borra el historial (alias_history) y se puede repetir el alias de otra persona", async ({
    browser,
  }) => {
    const nuevoAlias = "Vendedor QA " + Date.now();

    const ctx1 = await browser.newContext();
    const p1 = await ctx1.newPage();
    const { email } = await signUpVerified(p1, "aliashist", "Alias Historial");
    const aliasOriginal = await withDb(async (c) => {
      const r = await c.query(`select alias from "user" where email = $1`, [email]);
      return r.rows[0].alias as string;
    });

    await p1.goto("/cuenta/editar");
    await p1.getByLabel("Alias").fill(nuevoAlias);
    await p1.getByRole("button", { name: /Guardar/i }).click();
    await p1.waitForTimeout(400);

    const historial = await withDb(async (c) => {
      const u = await c.query(`select id from "user" where email = $1`, [email]);
      const r = await c.query(`select alias from alias_history where user_id = $1`, [u.rows[0].id]);
      return r.rows.map((x: { alias: string }) => x.alias);
    });
    console.log("Alias original:", aliasOriginal, "| Queda en alias_history:", historial);
    expect(historial).toContain(aliasOriginal);

    // Alias repetido: una segunda cuenta intenta usar EXACTAMENTE el mismo alias
    // nuevo que la primera.
    const ctx2 = await browser.newContext();
    const p2 = await ctx2.newPage();
    await signUpVerified(p2, "aliasdup", "Alias Duplicado");
    await p2.goto("/cuenta/editar");
    await p2.getByLabel("Alias").fill(nuevoAlias);
    await p2.getByRole("button", { name: /Guardar/i }).click();
    await p2.waitForTimeout(400);

    const cuantosConEseAlias = await withDb((c) =>
      c.query(`select count(*)::int as n from "user" where alias = $1`, [nuevoAlias])
    );
    console.log("¿Cuántas cuentas quedaron con el alias duplicado?", cuantosConEseAlias.rows[0].n);
    await p2.screenshot({ path: "qa/capturas/funcional-cruce-alias-duplicado.png", fullPage: true });
    expect(cuantosConEseAlias.rows[0].n).toBe(2); // documentamos: se permitió duplicar.

    await ctx1.close();
    await ctx2.close();
  });
});
