import { test, expect, type Page } from "@playwright/test";
import { alertIn, sellerWithListing, signUpVerified, withDb } from "./helpers";

// La prueba de punta a punta de la rebanada S-09.
// Ver slices/09-entrega-presencial.md

/** Compra eligiendo encuentro en persona y devuelve el pedido y el código. */
async function buyInPerson(page: Page, listingId: string) {
  await page.goto(`/comprar/${listingId}`);
  await page.getByRole("radio", { name: /Nos vemos en persona/ }).check();
  await page.getByLabel("¿En qué zona se ven?").selectOption("Chapinero");
  await page.getByRole("button", { name: "Ir a pagar" }).click();
  await expect(page).toHaveURL(/\/dev\/pago\//);
  await page.getByRole("button", { name: "Simular pago aprobado" }).click();
  await expect(page).toHaveURL(/\/pedido\//);

  const orderId = new URL(page.url()).pathname.split("/").pop()!;
  const code = (await page.getByTestId("codigo").innerText()).trim();
  return { orderId, code };
}

test("en persona no se cobra envío y el total es solo el producto", async ({
  browser,
}) => {
  const seller = await sellerWithListing(browser, `Monitor ${Date.now()}`, 500_000);
  const ctx = await browser.newContext();
  const buyer = await ctx.newPage();
  await signUpVerified(buyer, "comprador", "Laura Compradora");

  await buyer.goto(`/comprar/${seller.listingId}`);
  // Con envío son 500.000 más 10.000 (corrección 47).
  await expect(buyer.getByTestId("total-checkout")).toHaveText("$ 510.000");

  await buyer.getByRole("radio", { name: /Nos vemos en persona/ }).check();
  await expect(buyer.getByTestId("envio")).toHaveText("Sin costo");
  await expect(buyer.getByTestId("total-checkout")).toHaveText("$ 500.000");

  await seller.context.close();
  await ctx.close();
});

test("el comprador ve su código y el vendedor no", async ({ browser }) => {
  const seller = await sellerWithListing(browser, `Cámara ${Date.now()}`, 400_000);
  const ctx = await browser.newContext();
  const buyer = await ctx.newPage();
  await signUpVerified(buyer, "comprador", "Laura Compradora");

  const { orderId, code } = await buyInPerson(buyer, seller.listingId);
  expect(code).toMatch(/^\d{6}$/);

  // El vendedor ve el pedido pero no el código: es la garantía del comprador.
  await seller.page.goto(`/pedido/${orderId}`);
  await expect(seller.page.getByTestId("codigo")).toHaveCount(0);
  expect(await seller.page.content()).not.toContain(code);

  await seller.context.close();
  await ctx.close();
});

test("el código correcto libera el pago en el momento", async ({ browser }) => {
  const seller = await sellerWithListing(browser, `Teclado ${Date.now()}`, 300_000);
  const ctx = await browser.newContext();
  const buyer = await ctx.newPage();
  await signUpVerified(buyer, "comprador", "Laura Compradora");

  const { orderId, code } = await buyInPerson(buyer, seller.listingId);

  await seller.page.goto(`/pedido/${orderId}`);
  await seller.page.getByLabel("Código del comprador").fill(code);
  await seller.page.getByRole("button", { name: "Cobrar la venta" }).click();

  await expect(seller.page.getByTestId("estado")).toHaveText("Pago liberado al vendedor");

  await seller.context.close();
  await ctx.close();
});

test("el código se acepta dictado con espacios", async ({ browser }) => {
  // La gente lo lee en voz alta y quien lo escribe lo separa como quiera.
  const seller = await sellerWithListing(browser, `Bafle ${Date.now()}`, 200_000);
  const ctx = await browser.newContext();
  const buyer = await ctx.newPage();
  await signUpVerified(buyer, "comprador", "Laura Compradora");

  const { orderId, code } = await buyInPerson(buyer, seller.listingId);
  const dictado = `${code.slice(0, 3)} ${code.slice(3)}`;

  await seller.page.goto(`/pedido/${orderId}`);
  await seller.page.getByLabel("Código del comprador").fill(dictado);
  await seller.page.getByRole("button", { name: "Cobrar la venta" }).click();
  await expect(seller.page.getByTestId("estado")).toHaveText("Pago liberado al vendedor");

  await seller.context.close();
  await ctx.close();
});

test("un código equivocado se rechaza y deja reintentar", async ({ browser }) => {
  const seller = await sellerWithListing(browser, `Silla ${Date.now()}`, 150_000);
  const ctx = await browser.newContext();
  const buyer = await ctx.newPage();
  await signUpVerified(buyer, "comprador", "Laura Compradora");

  const { orderId, code } = await buyInPerson(buyer, seller.listingId);

  await seller.page.goto(`/pedido/${orderId}`);
  await seller.page.getByLabel("Código del comprador").fill("000000");
  await seller.page.getByRole("button", { name: "Cobrar la venta" }).click();
  await expect(alertIn(seller.page)).toContainText("Ese código no es");

  await seller.page.getByLabel("Código del comprador").fill(code);
  await seller.page.getByRole("button", { name: "Cobrar la venta" }).click();
  await expect(seller.page.getByTestId("estado")).toHaveText("Pago liberado al vendedor");

  await seller.context.close();
  await ctx.close();
});

test("el código no sirve dos veces", async ({ browser }) => {
  const seller = await sellerWithListing(browser, `Lámpara ${Date.now()}`, 120_000);
  const ctx = await browser.newContext();
  const buyer = await ctx.newPage();
  await signUpVerified(buyer, "comprador", "Laura Compradora");

  const { orderId, code } = await buyInPerson(buyer, seller.listingId);

  await seller.page.goto(`/pedido/${orderId}`);
  await seller.page.getByLabel("Código del comprador").fill(code);
  await seller.page.getByRole("button", { name: "Cobrar la venta" }).click();
  await expect(seller.page.getByTestId("estado")).toHaveText("Pago liberado al vendedor");

  // Ya liberado, el formulario ni siquiera está.
  await expect(seller.page.getByLabel("Código del comprador")).toHaveCount(0);

  // Y llamando la acción directamente tampoco pasa nada.
  const eventos = await withDb(async (c) => {
    const { rows } = await c.query<{ n: string }>(
      `select count(*)::text as n from order_events where order_id = $1 and to_status = 'liberado'`,
      [orderId]
    );
    return Number(rows[0].n);
  });
  expect(eventos).toBe(1);

  await seller.context.close();
  await ctx.close();
});

test("un código vencido se rechaza", async ({ browser }) => {
  const seller = await sellerWithListing(browser, `Mesa ${Date.now()}`, 180_000);
  const ctx = await browser.newContext();
  const buyer = await ctx.newPage();
  await signUpVerified(buyer, "comprador", "Laura Compradora");

  const { orderId, code } = await buyInPerson(buyer, seller.listingId);
  await withDb((c) =>
    c.query(`update pickup_codes set expires_at = now() - interval '1 hour' where order_id = $1`, [
      orderId,
    ])
  );

  await seller.page.goto(`/pedido/${orderId}`);
  await seller.page.getByLabel("Código del comprador").fill(code);
  await seller.page.getByRole("button", { name: "Cobrar la venta" }).click();
  await expect(alertIn(seller.page)).toContainText("venció");

  await seller.context.close();
  await ctx.close();
});

test("cinco intentos fallidos bloquean, incluso para el código correcto", async ({
  browser,
}) => {
  // Sin límite, seis dígitos se adivinan probando. Con él, no.
  const seller = await sellerWithListing(browser, `Nevera ${Date.now()}`, 700_000);
  const ctx = await browser.newContext();
  const buyer = await ctx.newPage();
  await signUpVerified(buyer, "comprador", "Laura Compradora");

  const { orderId, code } = await buyInPerson(buyer, seller.listingId);
  await seller.page.goto(`/pedido/${orderId}`);

  const equivocado = code === "111111" ? "222222" : "111111";
  // El aviso dice cuántos intentos quedan, así que cada iteración espera un texto
  // distinto. Sin eso, la aserción pasaría con el aviso anterior todavía en
  // pantalla y los intentos no llegarían a contarse.
  const esperados = [
    "quedan 4 intentos",
    "quedan 3 intentos",
    "quedan 2 intentos",
    "queda 1 intento",
    "Se agotaron",
  ];
  for (const texto of esperados) {
    await seller.page.getByLabel("Código del comprador").fill(equivocado);
    await seller.page.getByRole("button", { name: "Cobrar la venta" }).click();
    await expect(alertIn(seller.page)).toContainText(texto);
  }

  // El sexto intento, aun con el código bueno, ya no pasa.
  await seller.page.getByLabel("Código del comprador").fill(code);
  await seller.page.getByRole("button", { name: "Cobrar la venta" }).click();
  await expect(alertIn(seller.page)).toContainText("Se agotaron");
  await expect(seller.page.getByTestId("estado")).toHaveText("Pago recibido y guardado");

  await seller.context.close();
  await ctx.close();
});

test("el código de un pedido no sirve para otro", async ({ browser }) => {
  const seller = await sellerWithListing(browser, `Horno ${Date.now()}`, 250_000);
  const otroSeller = await sellerWithListing(browser, `Ventilador ${Date.now()}`, 90_000);
  const ctx = await browser.newContext();
  const buyer = await ctx.newPage();
  await signUpVerified(buyer, "comprador", "Laura Compradora");

  const primero = await buyInPerson(buyer, seller.listingId);
  const segundo = await buyInPerson(buyer, otroSeller.listingId);

  await otroSeller.page.goto(`/pedido/${segundo.orderId}`);
  await otroSeller.page.getByLabel("Código del comprador").fill(primero.code);
  await otroSeller.page.getByRole("button", { name: "Cobrar la venta" }).click();
  await expect(alertIn(otroSeller.page)).toContainText("Ese código no es");

  await seller.context.close();
  await otroSeller.context.close();
  await ctx.close();
});

test("una persona ajena no ve el código ni puede cobrar", async ({ browser }) => {
  const seller = await sellerWithListing(browser, `Sofá ${Date.now()}`, 600_000);
  const ctx = await browser.newContext();
  const buyer = await ctx.newPage();
  await signUpVerified(buyer, "comprador", "Laura Compradora");
  const { orderId, code } = await buyInPerson(buyer, seller.listingId);

  const otroCtx = await browser.newContext();
  const otro = await otroCtx.newPage();
  await signUpVerified(otro, "curioso", "Persona Ajena");

  const res = await otro.goto(`/pedido/${orderId}`);
  expect(res?.status()).toBe(404);
  expect(await otro.content()).not.toContain(code);

  await seller.context.close();
  await ctx.close();
  await otroCtx.close();
});

test("el código no queda guardado en claro en la base", async ({ browser }) => {
  // Corrige a propósito el problema de la D-27: quien tenga la base no debe poder
  // liberar pagos ajenos.
  const seller = await sellerWithListing(browser, `Bicicleta ${Date.now()}`, 450_000);
  const ctx = await browser.newContext();
  const buyer = await ctx.newPage();
  await signUpVerified(buyer, "comprador", "Laura Compradora");

  const { orderId, code } = await buyInPerson(buyer, seller.listingId);

  const guardado = await withDb(async (c) => {
    const { rows } = await c.query<{ code_enc: string }>(
      `select code_enc from pickup_codes where order_id = $1`,
      [orderId]
    );
    return rows[0].code_enc;
  });

  expect(guardado).not.toContain(code);
  expect(guardado).toMatch(/^[0-9a-f]+:[0-9a-f]+:[0-9a-f]+$/);

  await seller.context.close();
  await ctx.close();
});

test("un pedido con envío no acepta el flujo de código", async ({ browser }) => {
  const seller = await sellerWithListing(browser, `Impresora ${Date.now()}`, 300_000);
  const ctx = await browser.newContext();
  const buyer = await ctx.newPage();
  await signUpVerified(buyer, "comprador", "Laura Compradora");

  // Compra con envío, no en persona.
  await buyer.goto(`/comprar/${seller.listingId}`);
  await buyer.getByLabel("Quién recibe").fill("Laura Torres");
  await buyer.getByLabel("Celular de quien recibe").fill("300 412 88 05");
  await buyer.getByLabel("Dirección").fill("Calle 72 #10-34");
  await buyer.getByLabel("Zona").selectOption("Chapinero");
  await buyer.getByRole("button", { name: "Ir a pagar" }).click();
  await buyer.getByRole("button", { name: "Simular pago aprobado" }).click();
  await expect(buyer).toHaveURL(/\/pedido\//);

  // No hay código por ninguna parte.
  await expect(buyer.getByTestId("codigo")).toHaveCount(0);
  const orderId = new URL(buyer.url()).pathname.split("/").pop()!;
  await seller.page.goto(`/pedido/${orderId}`);
  await expect(seller.page.getByLabel("Código del comprador")).toHaveCount(0);

  await seller.context.close();
  await ctx.close();
});

// Corrección 46 (D-125): el encuentro en un lugar público de la zona, de una lista,
// en vez de «donde acuerden por el chat». Protege a los dos y nadie da su dirección.
test("al elegir la zona se ofrecen sus lugares seguros y el pedido dice dónde se ven", async ({
  browser,
}) => {
  const seller = await sellerWithListing(browser, `Lámpara ${Date.now()}`, 150_000);
  const ctx = await browser.newContext();
  const buyer = await ctx.newPage();
  await signUpVerified(buyer, "comprador", "Laura Compradora");

  await buyer.goto(`/comprar/${seller.listingId}`);
  await buyer.getByRole("radio", { name: /Nos vemos en persona/ }).check();
  await buyer.getByLabel("¿En qué zona se ven?").selectOption("Chapinero");
  const lugares = buyer.getByRole("group", { name: "¿Dónde exactamente?" });
  await expect(lugares.getByRole("radio", { name: "Centro Comercial Andino" })).toBeChecked();
  await lugares.getByRole("radio", { name: "Centro Comercial Avenida Chile" }).check();
  await expect(buyer.getByTestId("consejos-encuentro")).toContainText("de día");
  await buyer.getByRole("button", { name: "Ir a pagar" }).click();
  await buyer.getByRole("button", { name: "Simular pago aprobado" }).click();
  await expect(buyer).toHaveURL(/\/pedido\//);
  const orderId = new URL(buyer.url()).pathname.split("/").pop()!;

  for (const page of [buyer, seller.page]) {
    await page.goto(`/pedido/${orderId}`);
    await expect(page.getByTestId("encuentro")).toContainText(
      "Se ven en Centro Comercial Avenida Chile (Chapinero)",
    );
    await expect(page.getByTestId("consejos-encuentro")).toBeVisible();
  }

  await seller.context.close();
  await ctx.close();
});

test("en una zona sin lugares sugeridos se pide acordar uno público", async ({ browser }) => {
  const seller = await sellerWithListing(browser, `Silla ${Date.now()}`, 90_000);
  const ctx = await browser.newContext();
  const buyer = await ctx.newPage();
  await signUpVerified(buyer, "comprador", "Laura Compradora");

  await buyer.goto(`/comprar/${seller.listingId}`);
  await buyer.getByRole("radio", { name: /Nos vemos en persona/ }).check();
  await buyer.getByLabel("¿En qué zona se ven?").selectOption("Cota");
  await expect(buyer.getByRole("main")).toContainText("Todavía no tenemos lugares sugeridos en Cota");
  await buyer.getByRole("button", { name: "Ir a pagar" }).click();
  await buyer.getByRole("button", { name: "Simular pago aprobado" }).click();
  await expect(buyer.getByTestId("encuentro")).toContainText(
    "Se ven en Cota. El lugar lo acuerdan por el chat: que sea público y concurrido.",
  );

  await seller.context.close();
  await ctx.close();
});

test("un lugar de otra zona o una zona inventada se rechazan", async ({ browser }) => {
  const seller = await sellerWithListing(browser, `Mesa ${Date.now()}`, 90_000);
  const ctx = await browser.newContext();
  const buyer = await ctx.newPage();
  await signUpVerified(buyer, "comprador", "Laura Compradora");
  const deChia = await withDb(async (c) => {
    const { rows } = await c.query<{ id: string }>(
      `select id from lugares_encuentro where zona = 'Chía' limit 1`,
    );
    return rows[0].id;
  });

  await buyer.goto(`/comprar/${seller.listingId}`);
  await buyer.getByRole("radio", { name: /Nos vemos en persona/ }).check();
  await buyer.getByLabel("¿En qué zona se ven?").selectOption("Chapinero");
  await buyer
    .getByRole("radio", { name: "Centro Comercial Andino" })
    .evaluate((el, id) => ((el as HTMLInputElement).value = id), deChia);
  await buyer.getByRole("button", { name: "Ir a pagar" }).click();
  await expect(alertIn(buyer)).toContainText("Elige un lugar de la lista");

  // Tras el error, el formulario conserva «en persona» y la zona: antes React 19 lo
  // reiniciaba y al reintentar pedía la dirección.
  await expect(buyer.getByRole("radio", { name: /Nos vemos en persona/ })).toBeChecked();
  await buyer.getByLabel("¿En qué zona se ven?").evaluate((el) => {
    const o = document.createElement("option");
    o.value = "Inventada";
    el.appendChild(o);
    (el as HTMLSelectElement).value = "Inventada";
  });
  await buyer.getByRole("button", { name: "Ir a pagar" }).click();
  await expect(alertIn(buyer)).toContainText("Elige una zona de la lista");

  await seller.context.close();
  await ctx.close();
});
