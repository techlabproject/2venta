import { test, expect, type Page } from "@playwright/test";
import {
  alertIn,
  sellerWithListing,
  signUpVerified,
  withDb,
} from "./helpers";

// La prueba de punta a punta de la rebanada S-08.
// Ver slices/08-chat-ofertas-preguntas.md

async function openChat(page: Page, listingId: string) {
  await page.goto(`/producto/${listingId}`);
  await page.getByRole("button", { name: "Escribirle al vendedor" }).click();
  await expect(page).toHaveURL(/\/chat\//);
  return new URL(page.url()).pathname.split("/").pop()!;
}

test("comprador y vendedor conversan en el mismo hilo", async ({ browser }) => {
  const seller = await sellerWithListing(browser, `Bicicleta ${Date.now()}`, 400_000);
  const ctx = await browser.newContext();
  const buyer = await ctx.newPage();
  await signUpVerified(buyer, "comprador", "Laura Compradora");

  const chatId = await openChat(buyer, seller.listingId);
  await buyer.getByLabel("Mensaje").fill("Hola, ¿sigue disponible?");
  await buyer.getByRole("button", { name: "Enviar" }).click();
  await expect(buyer.getByRole("main")).toContainText("¿sigue disponible?");

  await seller.page.goto(`/chat/${chatId}`);
  await expect(seller.page.getByRole("main")).toContainText("¿sigue disponible?");
  await seller.page.getByLabel("Mensaje").fill("Sí, todavía la tengo.");
  await seller.page.getByRole("button", { name: "Enviar" }).click();

  await buyer.reload();
  await expect(buyer.getByRole("main")).toContainText("Sí, todavía la tengo.");

  await seller.context.close();
  await ctx.close();
});

test("volver a escribirle al mismo vendedor retoma el hilo, no abre otro", async ({
  browser,
}) => {
  const seller = await sellerWithListing(browser, `Patines ${Date.now()}`, 120_000);
  const ctx = await browser.newContext();
  const buyer = await ctx.newPage();
  await signUpVerified(buyer, "comprador", "Laura Compradora");

  const primero = await openChat(buyer, seller.listingId);
  const segundo = await openChat(buyer, seller.listingId);
  expect(segundo).toBe(primero);

  await seller.context.close();
  await ctx.close();
});

test("el filtro oculta el número y explica por qué", async ({ browser }) => {
  const seller = await sellerWithListing(browser, `Consola ${Date.now()}`, 900_000);
  const ctx = await browser.newContext();
  const buyer = await ctx.newPage();
  await signUpVerified(buyer, "comprador", "Laura Compradora");

  await openChat(buyer, seller.listingId);
  await buyer.getByLabel("Mensaje").fill("Te paso mi Nequi 3004128805 para que me consignes");
  await buyer.getByRole("button", { name: "Enviar" }).click();

  const main = buyer.getByRole("main");
  await expect(main).toContainText("•••••");
  await expect(main).not.toContainText("3004128805");
  await expect(buyer.getByTestId("aviso-filtro")).toContainText("pierdes el pago protegido");

  await seller.context.close();
  await ctx.close();
});

test("el número tachado no queda guardado en la base", async ({ browser }) => {
  // Guardar el original con el número visible solo tachado en pantalla dejaría el
  // dato disponible para quien tenga acceso a la base, que es lo que el filtro
  // pretende evitar.
  const seller = await sellerWithListing(browser, `Teclado ${Date.now()}`, 150_000);
  const ctx = await browser.newContext();
  const buyer = await ctx.newPage();
  await signUpVerified(buyer, "comprador", "Laura Compradora");

  const chatId = await openChat(buyer, seller.listingId);
  await buyer.getByLabel("Mensaje").fill("mi celu es 3009998877");
  await buyer.getByRole("button", { name: "Enviar" }).click();
  await expect(buyer.getByRole("main")).toContainText("•••••");

  const guardado = await withDb(async (c) => {
    const { rows } = await c.query<{ body: string }>(
      `select body from messages where conversation_id = $1 order by created_at desc limit 1`,
      [chatId]
    );
    return rows[0].body;
  });
  expect(guardado).not.toContain("3009998877");

  await seller.context.close();
  await ctx.close();
});

test("negociar el precio en el chat no se ve afectado por el filtro", async ({
  browser,
}) => {
  // Si el filtro tacha los precios, rompe justo la conversación para la que existe.
  const seller = await sellerWithListing(browser, `Nevera ${Date.now()}`, 1_800_000);
  const ctx = await browser.newContext();
  const buyer = await ctx.newPage();
  await signUpVerified(buyer, "comprador", "Laura Compradora");

  await openChat(buyer, seller.listingId);
  await buyer.getByLabel("Mensaje").fill("¿me la dejas en 1.700.000?");
  await buyer.getByRole("button", { name: "Enviar" }).click();

  await expect(buyer.getByRole("main")).toContainText("1.700.000");
  await expect(buyer.getByTestId("aviso-filtro")).toHaveCount(0);

  await seller.context.close();
  await ctx.close();
});

test("una oferta aceptada lleva a pagar el precio acordado", async ({ browser }) => {
  const seller = await sellerWithListing(browser, `Portátil ${Date.now()}`, 2_000_000);
  const ctx = await browser.newContext();
  const buyer = await ctx.newPage();
  await signUpVerified(buyer, "comprador", "Laura Compradora");

  const chatId = await openChat(buyer, seller.listingId);
  await buyer.getByLabel("Cuánto ofreces").fill("1700000");
  await buyer.getByRole("button", { name: "Ofertar" }).click();
  await expect(buyer.getByTestId("oferta")).toContainText("$ 1.700.000");

  // Quien ofrece no puede aceptar su propia oferta.
  await expect(buyer.getByRole("button", { name: "Aceptar" })).toHaveCount(0);

  await seller.page.goto(`/chat/${chatId}`);
  await seller.page.getByRole("button", { name: "Aceptar" }).click();

  await buyer.reload();
  await buyer.getByRole("link", { name: /Pagar \$ 1\.700\.000/ }).click();
  await expect(buyer).toHaveURL(/\/comprar\//);
  // El total sale del precio acordado, no del publicado.
  await expect(buyer.getByTestId("total-checkout")).toHaveText("$ 1.712.000");

  await seller.context.close();
  await ctx.close();
});

test("una oferta rechazada no deja pagar el precio ofrecido", async ({ browser }) => {
  const seller = await sellerWithListing(browser, `Cámara ${Date.now()}`, 1_000_000);
  const ctx = await browser.newContext();
  const buyer = await ctx.newPage();
  await signUpVerified(buyer, "comprador", "Laura Compradora");

  const chatId = await openChat(buyer, seller.listingId);
  await buyer.getByLabel("Cuánto ofreces").fill("400000");
  await buyer.getByRole("button", { name: "Ofertar" }).click();
  await expect(buyer.getByTestId("oferta")).toContainText("$ 400.000");

  await seller.page.goto(`/chat/${chatId}`);
  await seller.page.getByRole("button", { name: "Rechazar" }).click();

  const offerId = await withDb(async (c) => {
    const { rows } = await c.query<{ id: string }>(
      `select id from offers where conversation_id = $1 order by created_at desc limit 1`,
      [chatId]
    );
    return rows[0].id;
  });

  // Aun con el identificador en la mano, el precio rechazado no sirve.
  await buyer.goto(`/comprar/${seller.listingId}?oferta=${offerId}`);
  await expect(buyer.getByTestId("total-checkout")).toHaveText("$ 1.012.000");

  await seller.context.close();
  await ctx.close();
});

test("una oferta vencida no se puede aceptar", async ({ browser }) => {
  const seller = await sellerWithListing(browser, `Guitarra ${Date.now()}`, 700_000);
  const ctx = await browser.newContext();
  const buyer = await ctx.newPage();
  await signUpVerified(buyer, "comprador", "Laura Compradora");

  const chatId = await openChat(buyer, seller.listingId);
  await buyer.getByLabel("Cuánto ofreces").fill("500000");
  await buyer.getByRole("button", { name: "Ofertar" }).click();
  // Sin esperar a que la oferta exista, el vencimiento se escribiría antes de
  // que hubiera algo que vencer.
  await expect(buyer.getByTestId("oferta")).toContainText("$ 500.000");

  await withDb((c) =>
    c.query(
      `update offers set expires_at = now() - interval '1 hour' where conversation_id = $1`,
      [chatId]
    )
  );

  await seller.page.goto(`/chat/${chatId}`);
  // Al abrir, la oferta ya figura como vencida y no hay nada que aceptar.
  await expect(seller.page.getByRole("button", { name: "Aceptar" })).toHaveCount(0);

  await seller.context.close();
  await ctx.close();
});

test("una conversación ajena no se puede leer", async ({ browser }) => {
  const seller = await sellerWithListing(browser, `Impresora ${Date.now()}`, 300_000);
  const ctx = await browser.newContext();
  const buyer = await ctx.newPage();
  await signUpVerified(buyer, "comprador", "Laura Compradora");
  const chatId = await openChat(buyer, seller.listingId);
  await buyer.getByLabel("Mensaje").fill("un mensaje privado");
  await buyer.getByRole("button", { name: "Enviar" }).click();

  const otroCtx = await browser.newContext();
  const otro = await otroCtx.newPage();
  await signUpVerified(otro, "curioso", "Persona Ajena");
  const res = await otro.goto(`/chat/${chatId}`);
  expect(res?.status()).toBe(404);
  expect(await otro.content()).not.toContain("un mensaje privado");

  await seller.context.close();
  await ctx.close();
  await otroCtx.close();
});

test("no se puede abrir chat con uno mismo", async ({ browser }) => {
  const seller = await sellerWithListing(browser, `Escritorio ${Date.now()}`, 250_000);
  await seller.page.goto(`/producto/${seller.listingId}`);
  await expect(
    seller.page.getByRole("button", { name: "Escribirle al vendedor" })
  ).toHaveCount(0);
  await seller.context.close();
});

test("las preguntas son públicas y el vendedor las responde", async ({ browser }) => {
  const seller = await sellerWithListing(browser, `Mesa ${Date.now()}`, 350_000);
  const ctx = await browser.newContext();
  const buyer = await ctx.newPage();
  await signUpVerified(buyer, "comprador", "Laura Compradora");

  await buyer.goto(`/producto/${seller.listingId}`);
  await buyer.getByLabel("Tu pregunta").fill("¿Tiene alguna rayadura?");
  await buyer.getByRole("button", { name: "Preguntar" }).click();
  await expect(buyer.getByRole("main")).toContainText("¿Tiene alguna rayadura?");

  await seller.page.goto(`/producto/${seller.listingId}`);
  await seller.page.getByLabel("Tu respuesta").fill("Ninguna, está impecable.");
  await seller.page.getByRole("button", { name: "Responder" }).click();
  await expect(seller.page.getByRole("main")).toContainText("Ninguna, está impecable.");

  // Cualquiera que abra la ficha ve la pregunta y la respuesta, sin cuenta.
  const anonCtx = await browser.newContext();
  const anon = await anonCtx.newPage();
  await anon.goto(`/producto/${seller.listingId}`);
  await expect(anon.getByRole("main")).toContainText("¿Tiene alguna rayadura?");
  await expect(anon.getByRole("main")).toContainText("Ninguna, está impecable.");

  await seller.context.close();
  await ctx.close();
  await anonCtx.close();
});

test("el filtro también se aplica a las preguntas públicas", async ({ browser }) => {
  // Aquí importa más que en el chat: un número en una pregunta lo ve cualquiera.
  const seller = await sellerWithListing(browser, `Sofá ${Date.now()}`, 600_000);
  const ctx = await browser.newContext();
  const buyer = await ctx.newPage();
  await signUpVerified(buyer, "comprador", "Laura Compradora");

  await buyer.goto(`/producto/${seller.listingId}`);
  await buyer.getByLabel("Tu pregunta").fill("Llámame al 3001234567");
  await buyer.getByRole("button", { name: "Preguntar" }).click();

  await expect(buyer.getByRole("main")).not.toContainText("3001234567");
  await expect(buyer.getByRole("main")).toContainText("•••••");

  await seller.context.close();
  await ctx.close();
});

test("solo el vendedor del artículo puede responder sus preguntas", async ({
  browser,
}) => {
  const seller = await sellerWithListing(browser, `Silla ${Date.now()}`, 180_000);
  const ctx = await browser.newContext();
  const buyer = await ctx.newPage();
  await signUpVerified(buyer, "comprador", "Laura Compradora");

  await buyer.goto(`/producto/${seller.listingId}`);
  await buyer.getByLabel("Tu pregunta").fill("¿La entregas armada?");
  await buyer.getByRole("button", { name: "Preguntar" }).click();
  await expect(buyer.getByRole("main")).toContainText("¿La entregas armada?");

  // Quien preguntó no ve el campo de responder.
  await expect(buyer.getByLabel("Tu respuesta")).toHaveCount(0);
  await expect(buyer.getByRole("main")).toContainText("Sin responder todavía");

  await seller.context.close();
  await ctx.close();
});

test("sin sesión no se puede escribir ni preguntar", async ({ browser }) => {
  const seller = await sellerWithListing(browser, `Lámpara ${Date.now()}`, 90_000);
  const anonCtx = await browser.newContext();
  const anon = await anonCtx.newPage();

  await anon.goto(`/producto/${seller.listingId}`);
  await expect(anon.getByLabel("Tu pregunta")).toHaveCount(0);

  await seller.context.close();
  await anonCtx.close();
});
