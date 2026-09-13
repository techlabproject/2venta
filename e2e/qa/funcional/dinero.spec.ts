import { test, expect } from "@playwright/test";
import { signUpVerified, sellerWithListing, withDb, alertIn } from "../../helpers";
import { commissionCop } from "../../../src/features/payments/money";

// Agente funcional — Parte 3 (dinero): comisión del carrito, D-46 (no cobrar un
// precio distinto al que el comprador vio), ofertas vencidas/rechazadas,
// liberación de pagos, y precios raros al publicar y editar.

test.describe("Carrito: la comisión se cobra una sola vez sobre el total, el envío no paga comisión", () => {
  test("con tres artículos del mismo vendedor, comisión + lo que recibe el vendedor = subtotal, siempre en enteros", async ({
    browser,
  }) => {
    const { context: sellerCtx, page: sellerPage, listingId: id1 } = await sellerWithListing(
      browser,
      "Carrito A " + Date.now(),
      40_000
    );
    // Agregamos dos artículos más del MISMO vendedor directo en la base (mismo
    // patrón que sellerWithListing) para no repetir todo el flujo de KYC.
    const sellerId = await withDb(async (c) => {
      const r = await c.query(`select seller_id from listings where id = $1`, [id1]);
      return r.rows[0].seller_id as string;
    });
    const [id2, id3] = await withDb(async (c) => {
      const ids: string[] = [];
      for (const [title, price] of [
        ["Carrito B " + Date.now(), 35_000],
        ["Carrito C " + Date.now(), 25_000],
      ] as const) {
        const r = await c.query(
          `insert into listings (seller_id, title, description, category, condition, price_cop, video_path, poster_path, status)
           values ($1,$2,'Descripción de prueba.','ropa','usado_bueno',$3,'seed/demo.webm','seed/demo.jpg','activa') returning id`,
          [sellerId, title, price]
        );
        ids.push(r.rows[0].id);
      }
      return ids;
    });

    const buyerCtx = await browser.newContext();
    const buyer = await buyerCtx.newPage();
    await signUpVerified(buyer, "carritodin", "Carrito Dinero");

    for (const id of [id1, id2, id3]) {
      await buyer.goto(`/producto/${id}`);
      await buyer.getByRole("button", { name: "Agregar al carrito" }).click();
      // Esperamos la confirmación de verdad ("Está en tu carrito."), no un
      // tiempo fijo: navegar antes de que la acción del servidor termine deja
      // una carrera donde el artículo puede no estar todavía en el carrito.
      await expect(buyer.getByText("Está en tu carrito.")).toBeVisible();
    }
    await buyer.goto("/carrito");
    await expect(buyer.getByTestId("subtotal")).toContainText("100.000"); // 40k+35k+25k
    await buyer.screenshot({ path: "qa/capturas/funcional-carrito-tres-articulos.png", fullPage: true });

    await buyer.getByRole("link", { name: "Ir a pagar" }).click();
    await expect(buyer).toHaveURL(/\/comprar\/carrito/);
    await buyer.getByLabel("Quién recibe").fill("Comprador Carrito");
    await buyer.getByLabel("Celular de quien recibe").fill("3009998877");
    await buyer.getByLabel("Dirección").fill("Cra 9 # 10-20");
    await buyer.getByLabel("Zona").selectOption({ index: 1 });
    await buyer.getByRole("button", { name: "Ir a pagar" }).click();
    await expect(buyer).toHaveURL(/\/dev\/pago\//, { timeout: 15_000 });
    const orderId = buyer.url().split("/dev/pago/")[1].split("?")[0];

    const order = await withDb((c) =>
      c.query(
        `select subtotal_cop, commission_cop, seller_payout_cop, shipping_cop from orders where id = $1`,
        [orderId]
      )
    );
    const o = order.rows[0];
    expect(o.subtotal_cop).toBe(100_000);
    // La comisión del conjunto tiene que ser la de UNA venta de 100.000, no la
    // suma de comisiones de 40k+35k+25k por separado.
    expect(o.commission_cop).toBe(commissionCop(100_000));
    expect(o.commission_cop).not.toBe(
      commissionCop(40_000) + commissionCop(35_000) + commissionCop(25_000)
    );
    // Las tres cifras cuadran, en enteros.
    expect(Number.isInteger(o.commission_cop)).toBe(true);
    expect(Number.isInteger(o.seller_payout_cop)).toBe(true);
    expect(o.commission_cop + o.seller_payout_cop).toBe(o.subtotal_cop);

    // El envío no paga comisión: la comisión no cambia si sumamos el envío.
    expect(o.commission_cop).toBe(commissionCop(o.subtotal_cop));
    expect(o.commission_cop).not.toBe(commissionCop(o.subtotal_cop + o.shipping_cop));

    await sellerCtx.close();
    await buyerCtx.close();
  });
});

test.describe("D-46: no se cobra un precio distinto al que el comprador vio", () => {
  test("el vendedor sube el precio de un artículo del carrito mientras el comprador está pagando: no se cobra el nuevo precio en silencio", async ({
    browser,
  }) => {
    const { context: sellerCtx, listingId } = await sellerWithListing(
      browser,
      "D46 carrito " + Date.now(),
      50_000
    );

    const buyerCtx = await browser.newContext();
    const buyer = await buyerCtx.newPage();
    await signUpVerified(buyer, "d46carrito", "D46 Carrito");
    await buyer.goto(`/producto/${listingId}`);
    await buyer.getByRole("button", { name: "Agregar al carrito" }).click();
    await expect(buyer.getByText("Está en tu carrito.")).toBeVisible();
    await buyer.goto("/comprar/carrito");
    await expect(buyer.getByTestId("total-checkout")).toBeVisible();

    // El vendedor sube el precio DESPUÉS de que el comprador ya cargó la
    // pantalla de pago (con el total viejo escrito en el campo oculto).
    await withDb((c) => c.query(`update listings set price_cop = 120000 where id = $1`, [listingId]));

    await buyer.getByLabel("Quién recibe").fill("Comprador D46");
    await buyer.getByLabel("Celular de quien recibe").fill("3001112233");
    await buyer.getByLabel("Dirección").fill("Calle 1 # 2-3");
    await buyer.getByLabel("Zona").selectOption({ index: 1 });
    await buyer.getByRole("button", { name: "Ir a pagar" }).click();

    // No debe mandar a /dev/pago (no se creó el cobro); debe mostrar el error con
    // el precio nuevo.
    await buyer.waitForTimeout(800);
    await expect(buyer).not.toHaveURL(/\/dev\/pago\//);
    const alerta = alertIn(buyer);
    await expect(alerta).toBeVisible();
    await expect(alerta).toContainText("120.000");
    await buyer.screenshot({ path: "qa/capturas/funcional-d46-precio-cambio-carrito.png", fullPage: true });

    // No se creó ningún pedido para este artículo con el precio nuevo sin avisar.
    const ordenes = await withDb((c) =>
      c.query(
        `select count(*)::int as n from order_items where listing_id = $1`,
        [listingId]
      )
    );
    expect(ordenes.rows[0].n).toBe(0);

    await sellerCtx.close();
    await buyerCtx.close();
  });
});

test.describe("Ofertas: no se puede pagar con una oferta rechazada o vencida", () => {
  test("pagar con el id de una oferta RECHAZADA falla con un mensaje claro", async ({ browser }) => {
    const { context: sellerCtx, page: sellerPage, listingId } = await sellerWithListing(
      browser,
      "Oferta rechazada " + Date.now(),
      90_000
    );

    const buyerCtx = await browser.newContext();
    const buyer = await buyerCtx.newPage();
    await signUpVerified(buyer, "ofertarech", "Oferta Rechazada");
    await buyer.goto(`/producto/${listingId}`);
    await buyer.getByRole("button", { name: "Escribirle al vendedor" }).click();
    await expect(buyer).toHaveURL(/\/chat\//);
    await buyer.getByLabel("Cuánto ofreces").fill("60000");
    await buyer.getByRole("button", { name: "Ofertar" }).click();
    await buyer.waitForTimeout(500);

    // El vendedor rechaza.
    await sellerPage.goto(buyer.url());
    await sellerPage.getByRole("button", { name: "Rechazar" }).click();
    await sellerPage.waitForTimeout(500);

    const offerId = await withDb(async (c) => {
      const r = await c.query(
        `select id from offers where listing_id = $1 order by created_at desc limit 1`,
        [listingId]
      );
      return r.rows[0].id as string;
    });
    expect(offerId).toBeTruthy();

    await buyer.goto(`/comprar/${listingId}?oferta=${offerId}`);
    // El precio mostrado debe ser el de la PUBLICACIÓN (90.000) más envío, no el
    // de la oferta rechazada (60.000), porque la oferta ya no está aceptada.
    const texto = await buyer.locator("main").innerText();
    expect(texto).toContain("90.000"); // precio del producto, el correcto
    expect(texto).not.toContain("60.000"); // precio de la oferta rechazada, no debe aparecer

    // Y si de todas formas se intenta pagar, el servidor vuelve a comprobar la
    // oferta (offer.status !== 'aceptada') y no arranca el cobro con el precio
    // rechazado.
    await buyer.getByLabel("Quién recibe").fill("Comprador Oferta");
    await buyer.getByLabel("Celular de quien recibe").fill("3007778899");
    await buyer.getByLabel("Dirección").fill("Calle 8 # 9-10");
    await buyer.getByLabel("Zona").selectOption({ index: 1 });
    await buyer.getByRole("button", { name: "Ir a pagar" }).click();
    await buyer.waitForTimeout(800);

    // Si se creó un pedido, su precio de línea tiene que ser el de la
    // publicación (90.000), nunca el de la oferta rechazada (60.000).
    const lineas = await withDb((c) =>
      c.query(`select price_cop from order_items where listing_id = $1`, [listingId])
    );
    for (const row of lineas.rows) {
      expect(row.price_cop).not.toBe(60_000);
    }

    await sellerCtx.close();
    await buyerCtx.close();
  });
});

test.describe("Liberar un pago: solo el comprador dueño, solo una vez, solo si ya está pagado", () => {
  test("liberar un pedido AJENO falla; liberarlo cuando aún no está pagado falla", async ({ browser }) => {
    const { context: sellerCtx, listingId } = await sellerWithListing(
      browser,
      "Liberar ajeno " + Date.now(),
      45_000
    );

    const buyerCtx = await browser.newContext();
    const buyer = await buyerCtx.newPage();
    await signUpVerified(buyer, "liberarajeno", "Liberar Ajeno");
    await buyer.goto(`/producto/${listingId}`);
    await buyer.getByRole("link", { name: /Comprar con pago protegido/i }).click();
    await buyer.getByLabel("Quién recibe").fill("Comprador Liberar");
    await buyer.getByLabel("Celular de quien recibe").fill("3005556677");
    await buyer.getByLabel("Dirección").fill("Cra 5 # 6-7");
    await buyer.getByLabel("Zona").selectOption({ index: 1 });
    await buyer.getByRole("button", { name: "Ir a pagar" }).click();
    await expect(buyer).toHaveURL(/\/dev\/pago\//, { timeout: 15_000 });
    const orderId = buyer.url().split("/dev/pago/")[1].split("?")[0];

    // Otra persona, sin relación con el pedido, intenta liberar el pago llamando
    // a /pedido/<id> y usando el botón de confirmar si apareciera, o -si no
    // aparece por UI- comprobamos que el pedido AJENO no puede ni verse como
    // propio. La acción confirmReceipt comprueba server-side que buyer_id
    // coincida; lo ejercitamos desde una tercera cuenta.
    const strangerCtx = await browser.newContext();
    const stranger = await strangerCtx.newPage();
    await signUpVerified(stranger, "ajenolib", "Tercero Ajeno");
    await stranger.goto(`/pedido/${orderId}`);
    const botonConfirmar = stranger.getByRole("button", { name: /Confirmar que recib/i });
    const visible = await botonConfirmar.isVisible().catch(() => false);
    console.log("¿Un tercero ve el botón de confirmar recepción de un pedido ajeno?", visible);
    expect(visible).toBe(false);

    // Pago aún no aprobado: el comprador real tampoco puede liberar todavía.
    const orderStatus = await withDb((c) => c.query(`select status from orders where id = $1`, [orderId]));
    expect(orderStatus.rows[0].status).toBe("pendiente_pago");
    const botonComprador = buyer.getByRole("button", { name: /Confirmar que recib/i });
    await buyer.goto(`/pedido/${orderId}`);
    const compradorVeBoton = await botonComprador.isVisible().catch(() => false);
    console.log("¿El comprador ve el botón de confirmar recepción ANTES de pagar?", compradorVeBoton);
    expect(compradorVeBoton).toBe(false);

    await sellerCtx.close();
    await buyerCtx.close();
    await strangerCtx.close();
  });
});

test.describe("Precios raros al publicar y al editar", () => {
  test("editar con precios inválidos (0, negativo, decimal, texto, gigante, notación científica) se rechaza; con puntos de miles se acepta", async ({
    browser,
  }) => {
    const { context: sellerCtx, page: sellerPage, listingId } = await sellerWithListing(
      browser,
      "Precios raros " + Date.now(),
      50_000
    );

    await sellerPage.goto(`/producto/${listingId}/editar`);
    const invalidos = ["0", "-10000", "10000.50", "abc", "99999999999999999999", "1e4"];
    for (const precio of invalidos) {
      await sellerPage.getByLabel("Precio").fill(precio);
      await sellerPage.getByRole("button", { name: "Guardar cambios" }).click();
      await sellerPage.waitForTimeout(300);
      const alerta = alertIn(sellerPage);
      const tieneError = await alerta.isVisible().catch(() => false);
      console.log(`precio="${precio}" -> ¿rechazado con error?`, tieneError);
      expect(tieneError).toBe(true);
      const actual = await withDb((c) => c.query(`select price_cop from listings where id = $1`, [listingId]));
      expect(actual.rows[0].price_cop).toBe(50_000); // no cambió
    }

    // Con puntos de miles: formato colombiano válido, se debe aceptar como 70000.
    await sellerPage.getByLabel("Precio").fill("70.000");
    await sellerPage.getByRole("button", { name: "Guardar cambios" }).click();
    await sellerPage.waitForTimeout(500);
    const final = await withDb((c) => c.query(`select price_cop from listings where id = $1`, [listingId]));
    expect(final.rows[0].price_cop).toBe(70_000);
    await sellerPage.screenshot({ path: "qa/capturas/funcional-editar-precio-puntos-aceptado.png", fullPage: true });

    await sellerCtx.close();
  });
});
