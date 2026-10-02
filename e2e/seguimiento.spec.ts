import { expect, test, type Page } from "@playwright/test";
import { sellerWithListing, signUpVerified, withDb } from "./helpers";

// La prueba de punta a punta de la S-33.
// Ver slices/33-seguimiento-del-pedido.md
//
// Lo que se comprueba no es que la línea de tiempo exista, sino que diga la verdad:
// qué ya pasó, con su hora, y qué falta. Antes el estado era un rótulo arriba y una
// lista de movimientos abajo, y ninguno de los dos decía nunca qué venía después.

const seguimiento = (page: Page) => page.getByTestId("seguimiento");
const pasos = (page: Page) => seguimiento(page).getByRole("listitem");

async function pagar(page: Page, listingId: string, presencial = false): Promise<string> {
  await page.goto(`/comprar/${listingId}`);
  if (presencial) {
    await page.getByRole("radio", { name: /Nos vemos en persona/ }).check();
    await page.getByLabel("¿En qué zona se ven?").selectOption("Chapinero");
  } else {
    await page.getByLabel("Quién recibe").fill("Laura Torres");
    await page.getByLabel("Celular de quien recibe").fill("300 412 88 05");
    await page.getByLabel("Dirección").fill("Calle 72 #10-34");
    await page.getByLabel("Zona").selectOption("Chapinero");
  }
  await page.getByRole("button", { name: "Ir a pagar" }).click();
  await page.getByRole("button", { name: "Simular pago aprobado" }).click();
  await expect(page).toHaveURL(/\/pedido\//);
  return new URL(page.url()).pathname.split("/").pop()!;
}

test("un pedido con envío muestra los cuatro pasos y dónde va", async ({ browser }) => {
  const seller = await sellerWithListing(browser, `Licuadora ${Date.now()}`, 200_000);
  const ctx = await browser.newContext();
  const buyer = await ctx.newPage();
  await signUpVerified(buyer, "comprador", "Laura Compradora");
  const orderId = await pagar(buyer, seller.listingId);

  await expect(pasos(buyer)).toHaveCount(4);
  await expect(seguimiento(buyer)).toContainText("Pago recibido y guardado");
  // Luna y la revisión de diseño (D-129): recién pagado, los pasos que faltan no
  // pueden sonar a hechos («Ya lo entregó a la transportadora», «Entregado»). El
  // que sigue dice que se espera; los demás, qué va a pasar.
  await expect(pasos(buyer).nth(1)).toContainText("Esperando el despacho");
  await expect(pasos(buyer).nth(1)).toContainText("El vendedor lo lleva a la transportadora.");
  await expect(pasos(buyer).nth(2)).toContainText("Entrega");
  await expect(pasos(buyer).nth(2)).toContainText("La transportadora avisa cuando lo entregue.");
  await expect(pasos(buyer).nth(3)).toContainText("Pago al vendedor");
  await expect(seguimiento(buyer)).not.toContainText("Ya lo entregó");
  await expect(seguimiento(buyer)).not.toContainText("El vendedor despachó");

  // El paso cumplido trae su hora y su título en pasado.
  await expect(pasos(buyer).first().getByRole("time")).toBeVisible();

  // Al despachar, el segundo paso queda cumplido y aparece su hora.
  await seller.page.goto(`/pedido/${orderId}`);
  await seller.page.getByRole("button", { name: "Generar guía y despachar" }).click();
  await expect(seller.page.getByTestId("estado")).toHaveText("El vendedor despachó");

  await buyer.reload();
  await expect(pasos(buyer).nth(1).getByRole("time")).toBeVisible();
  await expect(pasos(buyer).nth(1)).toContainText("El vendedor despachó");
  await expect(pasos(buyer).nth(2)).toContainText("En camino");

  await ctx.close();
  await seller.context.close();
});

test("un pedido en persona no inventa pasos de envío", async ({ browser }) => {
  const seller = await sellerWithListing(browser, `Bicicleta ${Date.now()}`, 300_000);
  const ctx = await browser.newContext();
  const buyer = await ctx.newPage();
  await signUpVerified(buyer, "comprador", "Laura Compradora");
  await pagar(buyer, seller.listingId, true);

  // Dos pasos, no cuatro: en persona no hay transportadora que despache ni que
  // reporte una entrega.
  await expect(pasos(buyer)).toHaveCount(2);
  await expect(seguimiento(buyer)).not.toContainText("transportadora");
  // El paso que sigue dice lo que se espera, no que ya pasó (D-129).
  await expect(seguimiento(buyer)).toContainText("Encuentro y código");

  await ctx.close();
  await seller.context.close();
});

test("un pedido cancelado no se dibuja como si siguiera en camino", async ({ browser }) => {
  const seller = await sellerWithListing(browser, `Mesa ${Date.now()}`, 120_000);
  const ctx = await browser.newContext();
  const buyer = await ctx.newPage();
  await signUpVerified(buyer, "comprador", "Laura Compradora");

  // Se llega a la pasarela y se abandona; el pedido queda sin pagar y se cancela.
  await buyer.goto(`/comprar/${seller.listingId}`);
  await buyer.getByLabel("Quién recibe").fill("Laura Torres");
  await buyer.getByLabel("Celular de quien recibe").fill("300 412 88 05");
  await buyer.getByLabel("Dirección").fill("Calle 72 #10-34");
  await buyer.getByLabel("Zona").selectOption("Chapinero");
  await buyer.getByRole("button", { name: "Ir a pagar" }).click();
  await expect(buyer).toHaveURL(/\/dev\/pago\//);
  const orderId = new URL(buyer.url()).pathname.split("/").pop()!;

  await buyer.goto(`/pedido/${orderId}`);
  await buyer.getByRole("button", { name: "Cancelar este pedido" }).click();

  await expect(seguimiento(buyer)).toContainText("Pedido cancelado");
  await expect(seguimiento(buyer)).not.toContainText("El vendedor despachó");

  await ctx.close();
  await seller.context.close();
});

test("con un reclamo abierto el seguimiento dice que nada avanza", async ({ browser }) => {
  const seller = await sellerWithListing(browser, `Plancha ${Date.now()}`, 90_000);
  const ctx = await browser.newContext();
  const buyer = await ctx.newPage();
  await signUpVerified(buyer, "comprador", "Laura Compradora");
  const orderId = await pagar(buyer, seller.listingId);

  await withDb(async (c) => {
    await c.query(`update orders set status = 'en_disputa' where id = $1`, [orderId]);
    await c.query(
      `insert into order_events (order_id, from_status, to_status, source, detail)
       values ($1, 'pagado', 'en_disputa', 'comprador', 'Reclamo de prueba')`,
      [orderId]
    );
  });

  await buyer.goto(`/pedido/${orderId}`);
  await expect(seguimiento(buyer)).toContainText("Con un reclamo abierto");
  await expect(seguimiento(buyer)).toContainText("El dinero no se mueve");

  await ctx.close();
  await seller.context.close();
});
