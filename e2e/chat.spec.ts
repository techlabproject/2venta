import { test, expect, type Page } from "@playwright/test";
import {
  alertIn,
  ofertar,
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
  const seller = await sellerWithListing(
    browser,
    `Bicicleta ${Date.now()}`,
    400_000,
  );
  const ctx = await browser.newContext();
  const buyer = await ctx.newPage();
  await signUpVerified(buyer, "comprador", "Laura Compradora");

  const chatId = await openChat(buyer, seller.listingId);
  await buyer.getByLabel("Mensaje").fill("Hola, ¿sigue disponible?");
  await buyer.getByRole("button", { name: "Enviar" }).click();
  await expect(buyer.getByRole("main")).toContainText("¿sigue disponible?");

  await seller.page.goto(`/chat/${chatId}`);
  await expect(seller.page.getByRole("main")).toContainText(
    "¿sigue disponible?",
  );
  await seller.page.getByLabel("Mensaje").fill("Sí, todavía la tengo.");
  await seller.page.getByRole("button", { name: "Enviar" }).click();
  // Esperar a que el mensaje exista antes de recargar la otra punta: recargar justo
  // después del clic a veces llegaba antes que la acción y la prueba fallaba sola.
  await expect(seller.page.getByRole("main")).toContainText("Sí, todavía la tengo.");

  await buyer.reload();
  await expect(buyer.getByRole("main")).toContainText("Sí, todavía la tengo.");

  await seller.context.close();
  await ctx.close();
});

test("volver a escribirle al mismo vendedor retoma el hilo, no abre otro", async ({
  browser,
}) => {
  const seller = await sellerWithListing(
    browser,
    `Patines ${Date.now()}`,
    120_000,
  );
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
  const seller = await sellerWithListing(
    browser,
    `Consola ${Date.now()}`,
    900_000,
  );
  const ctx = await browser.newContext();
  const buyer = await ctx.newPage();
  await signUpVerified(buyer, "comprador", "Laura Compradora");

  await openChat(buyer, seller.listingId);
  await buyer
    .getByLabel("Mensaje")
    .fill("Te paso mi Nequi 3004128805 para que me consignes");
  await buyer.getByRole("button", { name: "Enviar" }).click();

  const main = buyer.getByRole("main");
  await expect(main).toContainText("•••••");
  await expect(main).not.toContainText("3004128805");
  await expect(buyer.getByTestId("aviso-filtro")).toContainText(
    "pierdes el pago protegido",
  );

  await seller.context.close();
  await ctx.close();
});

test("el número tachado no queda guardado en la base", async ({ browser }) => {
  // Guardar el original con el número visible solo tachado en pantalla dejaría el
  // dato disponible para quien tenga acceso a la base, que es lo que el filtro
  // pretende evitar.
  const seller = await sellerWithListing(
    browser,
    `Teclado ${Date.now()}`,
    150_000,
  );
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
      [chatId],
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
  const seller = await sellerWithListing(
    browser,
    `Nevera ${Date.now()}`,
    1_800_000,
  );
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

test("una oferta aceptada lleva a pagar el precio acordado", async ({
  browser,
}) => {
  const seller = await sellerWithListing(
    browser,
    `Portátil ${Date.now()}`,
    2_000_000,
  );
  const ctx = await browser.newContext();
  const buyer = await ctx.newPage();
  await signUpVerified(buyer, "comprador", "Laura Compradora");

  const chatId = await openChat(buyer, seller.listingId);
  await ofertar(buyer, 1700000);
  await expect(buyer.getByTestId("oferta")).toContainText("$ 1.700.000");

  // Quien ofrece no puede aceptar su propia oferta.
  await expect(buyer.getByRole("button", { name: "Aceptar" })).toHaveCount(0);

  await seller.page.goto(`/chat/${chatId}`);
  await seller.page.getByRole("button", { name: "Aceptar" }).click();
  // Sin esperar a que la oferta quede aceptada, el comprador recarga antes de que
  // exista el botón de pagar.
  await expect(
    seller.page.getByRole("button", { name: "Aceptar" }),
  ).toHaveCount(0);

  await buyer.reload();
  await buyer.getByRole("link", { name: /Pagar \$ 1\.700\.000/ }).click();
  await expect(buyer).toHaveURL(/\/comprar\//);
  // El total sale del precio acordado, no del publicado.
  await expect(buyer.getByTestId("total-checkout")).toHaveText("$ 1.712.000");

  await seller.context.close();
  await ctx.close();
});

test("una oferta rechazada no deja pagar el precio ofrecido", async ({
  browser,
}) => {
  const seller = await sellerWithListing(
    browser,
    `Cámara ${Date.now()}`,
    1_000_000,
  );
  const ctx = await browser.newContext();
  const buyer = await ctx.newPage();
  await signUpVerified(buyer, "comprador", "Laura Compradora");

  const chatId = await openChat(buyer, seller.listingId);
  await ofertar(buyer, 400000);
  await expect(buyer.getByTestId("oferta")).toContainText("$ 400.000");

  await seller.page.goto(`/chat/${chatId}`);
  await seller.page.getByRole("button", { name: "Rechazar" }).click();
  await expect(
    seller.page.getByRole("button", { name: "Rechazar" }),
  ).toHaveCount(0);

  const offerId = await withDb(async (c) => {
    const { rows } = await c.query<{ id: string }>(
      `select id from offers where conversation_id = $1 order by created_at desc limit 1`,
      [chatId],
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
  const seller = await sellerWithListing(
    browser,
    `Guitarra ${Date.now()}`,
    700_000,
  );
  const ctx = await browser.newContext();
  const buyer = await ctx.newPage();
  await signUpVerified(buyer, "comprador", "Laura Compradora");

  const chatId = await openChat(buyer, seller.listingId);
  await ofertar(buyer, 500000);
  // Sin esperar a que la oferta exista, el vencimiento se escribiría antes de
  // que hubiera algo que vencer.
  await expect(buyer.getByTestId("oferta")).toContainText("$ 500.000");

  await withDb((c) =>
    c.query(
      `update offers set expires_at = now() - interval '1 hour' where conversation_id = $1`,
      [chatId],
    ),
  );

  await seller.page.goto(`/chat/${chatId}`);
  // Al abrir, la oferta ya figura como vencida y no hay nada que aceptar.
  await expect(
    seller.page.getByRole("button", { name: "Aceptar" }),
  ).toHaveCount(0);

  await seller.context.close();
  await ctx.close();
});

test("una conversación ajena no se puede leer", async ({ browser }) => {
  const seller = await sellerWithListing(
    browser,
    `Impresora ${Date.now()}`,
    300_000,
  );
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
  const seller = await sellerWithListing(
    browser,
    `Escritorio ${Date.now()}`,
    250_000,
  );
  await seller.page.goto(`/producto/${seller.listingId}`);
  await expect(
    seller.page.getByRole("button", { name: "Escribirle al vendedor" }),
  ).toHaveCount(0);
  await seller.context.close();
});

test("las preguntas son públicas y el vendedor las responde", async ({
  browser,
}) => {
  const seller = await sellerWithListing(
    browser,
    `Mesa ${Date.now()}`,
    350_000,
  );
  const ctx = await browser.newContext();
  const buyer = await ctx.newPage();
  await signUpVerified(buyer, "comprador", "Laura Compradora");

  await buyer.goto(`/producto/${seller.listingId}`);
  await buyer.getByLabel("Tu pregunta").fill("¿Tiene alguna rayadura?");
  await buyer.getByRole("button", { name: "Preguntar" }).click();
  await expect(buyer.getByRole("main")).toContainText(
    "¿Tiene alguna rayadura?",
  );

  await seller.page.goto(`/producto/${seller.listingId}`);
  await seller.page.getByLabel("Tu respuesta").fill("Ninguna, está impecable.");
  await seller.page.getByRole("button", { name: "Responder" }).click();
  await expect(seller.page.getByRole("main")).toContainText(
    "Ninguna, está impecable.",
  );

  // Cualquiera que abra la ficha ve la pregunta y la respuesta, sin cuenta.
  const anonCtx = await browser.newContext();
  const anon = await anonCtx.newPage();
  await anon.goto(`/producto/${seller.listingId}`);
  await expect(anon.getByRole("main")).toContainText("¿Tiene alguna rayadura?");
  await expect(anon.getByRole("main")).toContainText(
    "Ninguna, está impecable.",
  );

  await seller.context.close();
  await ctx.close();
  await anonCtx.close();
});

test("el filtro también se aplica a las preguntas públicas", async ({
  browser,
}) => {
  // Aquí importa más que en el chat: un número en una pregunta lo ve cualquiera.
  const seller = await sellerWithListing(
    browser,
    `Sofá ${Date.now()}`,
    600_000,
  );
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
  const seller = await sellerWithListing(
    browser,
    `Silla ${Date.now()}`,
    180_000,
  );
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
  const seller = await sellerWithListing(
    browser,
    `Lámpara ${Date.now()}`,
    90_000,
  );
  const anonCtx = await browser.newContext();
  const anon = await anonCtx.newPage();

  await anon.goto(`/producto/${seller.listingId}`);
  await expect(anon.getByLabel("Tu pregunta")).toHaveCount(0);

  await seller.context.close();
  await anonCtx.close();
});

// --- S-36: el chat parece un chat. Ver slices/36-el-chat-parece-un-chat.md ---

test("los mensajes caen en lados distintos y cada uno lleva su hora", async ({
  browser,
}) => {
  const seller = await sellerWithListing(
    browser,
    `Lámpara hablada ${Date.now()}`,
    80_000,
  );
  const ctx = await browser.newContext();
  const buyer = await ctx.newPage();
  await signUpVerified(buyer, "comprador", "Laura Compradora");

  await openChat(buyer, seller.listingId);
  await buyer.getByLabel("Mensaje").fill("Hola, ¿sigue disponible?");
  await buyer.getByRole("button", { name: "Enviar" }).click();
  await expect(buyer.getByTestId("mensajes")).toContainText(
    "¿sigue disponible?",
  );

  // Cada burbuja trae su hora: sin ella una conversación es una lista de frases
  // sin saber cuándo se dijo ninguna.
  await expect(
    buyer.getByTestId("mensajes").getByRole("time").first(),
  ).toBeVisible();

  // Y hay separador de día. Todo lo de hoy va bajo «Hoy».
  await expect(buyer.getByTestId("mensajes")).toContainText("Hoy");

  await ctx.close();
  await seller.context.close();
});

test("en la conversación no hay campo de precio: ofertar es un panel aparte", async ({
  browser,
}) => {
  // Este es el defecto que reportó Nicolás: «Ofertar» pesaba lo mismo que
  // «Enviar», con su propio campo siempre visible debajo del de escribir.
  const seller = await sellerWithListing(
    browser,
    `Silla negociada ${Date.now()}`,
    150_000,
  );
  const ctx = await browser.newContext();
  const buyer = await ctx.newPage();
  await signUpVerified(buyer, "comprador", "Laura Compradora");

  await openChat(buyer, seller.listingId);
  await expect(buyer.getByLabel("Cuánto ofreces")).toHaveCount(0);
  await expect(
    buyer.getByRole("link", { name: "Hacer una oferta" }),
  ).toBeVisible();

  await ofertar(buyer, 120_000);

  // La oferta se ve dentro de la conversación, no en un bloque suelto al final.
  await expect(
    buyer.getByTestId("mensajes").getByTestId("oferta"),
  ).toContainText("$ 120.000");

  await ctx.close();
  await seller.context.close();
});

test("el panel de oferta es de la conversación: quien no es parte no entra", async ({
  browser,
}) => {
  const seller = await sellerWithListing(
    browser,
    `Mesa ajena ${Date.now()}`,
    200_000,
  );
  const ctx = await browser.newContext();
  const buyer = await ctx.newPage();
  await signUpVerified(buyer, "comprador", "Laura Compradora");
  await openChat(buyer, seller.listingId);
  const chatId = new URL(buyer.url()).pathname.split("/").pop()!;

  const otroCtx = await browser.newContext();
  const otro = await otroCtx.newPage();
  await signUpVerified(otro, "ajeno", "Persona Ajena");
  const res = await otro.goto(`/chat/${chatId}/oferta`);
  expect(res?.status()).toBe(404);

  await ctx.close();
  await otroCtx.close();
  await seller.context.close();
});

test("dentro de una conversación no se dibuja la barra inferior", async ({
  browser,
}) => {
  // Es lo que hace cualquier app de chat: ahí abajo el pulgar quiere el campo de
  // escribir, no navegar a otra parte.
  const seller = await sellerWithListing(
    browser,
    `Cojín ${Date.now()}`,
    40_000,
  );
  const ctx = await browser.newContext();
  const buyer = await ctx.newPage();
  await buyer.setViewportSize({ width: 390, height: 844 });
  await signUpVerified(buyer, "comprador", "Laura Compradora");

  const barra = buyer.getByRole("navigation", { name: "Navegación principal" });
  await buyer.goto("/chats");
  await expect(barra).toBeVisible();

  await openChat(buyer, seller.listingId);
  await expect(barra).toHaveCount(0);

  await ctx.close();
  await seller.context.close();
});

/*
 * Ronda de verificación 2026-09-20.
 *
 * La prueba «una oferta aceptada lleva a pagar el precio acordado» llegaba a la
 * pantalla de pago, comprobaba el total en pantalla y se detenía ahí. Nunca pulsó
 * el botón. Debajo de ese punto exacto vivía el defecto: la acción de pago
 * comparaba el total que manda el comprador contra el precio PUBLICADO antes de
 * aplicar el de la oferta, así que toda oferta aceptada —que por definición vale
 * distinto— se rechazaba con «el precio cambió mientras comprabas».
 *
 * Negociar y luego no poder pagar es el peor final posible para esta función.
 */
test("una oferta aceptada se puede pagar hasta el final", async ({
  browser,
}) => {
  const seller = await sellerWithListing(
    browser,
    `Guitarra ${Date.now()}`,
    900_000,
  );
  const ctx = await browser.newContext();
  const buyer = await ctx.newPage();
  await signUpVerified(buyer, "comprador", "Laura Compradora");

  const chatId = await openChat(buyer, seller.listingId);
  await ofertar(buyer, 700000);
  await seller.page.goto(`/chat/${chatId}`);
  await seller.page.getByRole("button", { name: "Aceptar" }).click();
  await expect(
    seller.page.getByRole("button", { name: "Aceptar" }),
  ).toHaveCount(0);

  await buyer.reload();
  await buyer.getByRole("link", { name: /Pagar \$ 700\.000/ }).click();
  await buyer.getByLabel("Quién recibe").fill("Laura Torres");
  await buyer.getByLabel("Celular de quien recibe").fill("300 412 88 05");
  await buyer.getByLabel("Dirección").fill("Calle 72 #10-34");
  await buyer.getByLabel("Zona").selectOption("Chapinero");
  await buyer.getByRole("button", { name: "Ir a pagar" }).click();

  // Aquí fallaba: en vez de la pasarela salía el aviso del precio.
  await expect(buyer.getByRole("button", { name: "Simular pago aprobado" }))
    .toBeVisible();
  await buyer.getByRole("button", { name: "Simular pago aprobado" }).click();
  await expect(buyer).toHaveURL(/\/pedido\//);
  // Y se cobró lo acordado, no lo publicado.
  await expect(buyer.getByRole("main")).toContainText("$ 700.000");

  await seller.context.close();
  await ctx.close();
});

/*
 * La oferta se resolvía solo por su identificador: se comprobaba que fuera de ese
 * artículo y que siguiera aceptada, pero no de QUIÉN era. El comentario del código
 * afirmaba que sí. Quien consiguiera el identificador de una oferta ajena —de una
 * dirección compartida, del historial de un navegador prestado— compraba al precio
 * que negoció otra persona.
 */
test("la oferta aceptada de otra persona no sirve para pagar", async ({
  browser,
}) => {
  const seller = await sellerWithListing(
    browser,
    `Consola ${Date.now()}`,
    1_200_000,
  );
  const ctx = await browser.newContext();
  const buyer = await ctx.newPage();
  await signUpVerified(buyer, "comprador", "Laura Compradora");

  const chatId = await openChat(buyer, seller.listingId);
  await ofertar(buyer, 600000);
  await seller.page.goto(`/chat/${chatId}`);
  await seller.page.getByRole("button", { name: "Aceptar" }).click();
  await expect(
    seller.page.getByRole("button", { name: "Aceptar" }),
  ).toHaveCount(0);

  const offerId = await withDb(async (c) => {
    const { rows } = await c.query<{ id: string }>(
      `select id from offers where conversation_id = $1 and status = 'aceptada'`,
      [chatId],
    );
    return rows[0].id;
  });

  // Una tercera persona, con el identificador de la oferta ajena en la mano.
  const otroCtx = await browser.newContext();
  const otro = await otroCtx.newPage();
  await signUpVerified(otro, "colado", "Otro Comprador");

  await otro.goto(`/comprar/${seller.listingId}?oferta=${offerId}`);

  // La oferta ajena se ignora entera: ni se le enseña el precio negociado ni se
  // le manda al servidor. Paga lo que vale publicado, como cualquiera que llegue
  // de la calle.
  await expect(otro.getByRole("main")).toContainText("$ 1.200.000");
  await expect(otro.getByRole("main")).not.toContainText("$ 600.000");

  await seller.context.close();
  await ctx.close();
  await otroCtx.close();
});

/*
 * Aceptar una oferta sobre un artículo que ya se vendió o se reservó dejaba al
 * vendedor prometiendo algo que el comprador no podía pagar: el pago sí comprueba
 * que la publicación siga activa.
 */
test("no se puede ofertar por un artículo que ya no está disponible", async ({
  browser,
}) => {
  const seller = await sellerWithListing(
    browser,
    `Nevera ${Date.now()}`,
    800_000,
  );
  const ctx = await browser.newContext();
  const buyer = await ctx.newPage();
  await signUpVerified(buyer, "comprador", "Laura Compradora");

  await openChat(buyer, seller.listingId);

  await withDb((c) =>
    c.query(`update listings set status = 'vendida' where id = $1`, [
      seller.listingId,
    ]),
  );

  await buyer.getByRole("link", { name: "Hacer una oferta" }).click();
  await buyer.getByLabel("Cuánto ofreces").fill("500000");
  await buyer.getByRole("button", { name: "Enviar la oferta" }).click();
  await expect(alertIn(buyer)).toContainText("ya no está disponible");

  await seller.context.close();
  await ctx.close();
});

// Corrección 19 (Catalina): en un chat todavía vacío, quien vende veía el consejo
// para el comprador («Pregúntale lo que necesites saber antes de comprar…»).
test("el chat vacío le habla a cada lado desde su punto de vista", async ({ browser, page }) => {
  const titulo = `Parlante ${Date.now()}`;
  const vendedor = await sellerWithListing(browser, titulo, 85_000, "tecnologia");

  await signUpVerified(page, "vacio", "Valeria Vacío");
  await page.goto(`/producto/${vendedor.listingId}`);
  await page.getByRole("button", { name: "Escribirle al vendedor" }).click();
  await expect(page).toHaveURL(/\/chat\/[0-9a-f-]{36}$/);
  await expect(page.getByTestId("chat-vacio")).toContainText("Pregúntale lo que necesites saber antes de comprar");

  await vendedor.page.goto(new URL(page.url()).pathname);
  const vacio = vendedor.page.getByTestId("chat-vacio");
  await expect(vacio).toContainText("le echó el ojo a tu artículo");
  await expect(vacio).not.toContainText("antes de comprar");

  await vendedor.context.close();
});
