import { expect, test, type Browser, type Page } from "@playwright/test";
import { makeAdmin, sellerWithListing, signUpVerified, withDb } from "./helpers";

// Corrección 20 (Catalina: «no entiendo si los mensajes sí se envían»): con el chat
// abierto, lo nuevo aparece sin recargar. Corrección 22: reportar bloquea en
// silencio y la cola de moderación va por gravedad. Ver docs/alcance/chat.md.

async function conversacion(browser: Browser, titulo: string) {
  const seller = await sellerWithListing(browser, titulo, 150_000, "ropa");
  const ctx = await browser.newContext();
  const buyer = await ctx.newPage();
  const { email } = await signUpVerified(buyer, "envivo", "Laura Envivo");
  await buyer.goto(`/producto/${seller.listingId}`);
  await buyer.getByRole("button", { name: "Escribirle al vendedor" }).click();
  await expect(buyer).toHaveURL(/\/chat\/[0-9a-f-]{36}$/);
  const chat = new URL(buyer.url()).pathname;
  const chatId = chat.split("/").pop()!;
  return { seller, ctx, buyer, chat, chatId, buyerEmail: email };
}

async function escribir(page: Page, texto: string) {
  await page.getByLabel("Mensaje", { exact: true }).fill(texto);
  await page.getByRole("button", { name: "Enviar", exact: true }).click();
  await expect(page.getByTestId("mensajes")).toContainText(texto);
}

async function reportar(page: Page, motivo: string) {
  await page.getByTestId("reportar").click();
  await page.getByLabel("Qué está pasando").selectOption(motivo);
  await page.getByRole("button", { name: "Enviar el reporte" }).click();
  await expect(page.getByTestId("reporte-hecho")).toBeVisible();
}

test("con el chat abierto, el mensaje de la otra persona aparece sin recargar", async ({ browser }) => {
  const { seller, ctx, buyer, chat } = await conversacion(browser, `Silla ${Date.now()}`);
  await seller.page.goto(chat);
  await expect(seller.page.getByTestId("chat-vacio")).toBeVisible();

  // Lo que el vendedor está escribiendo no se pierde cuando llega algo.
  await seller.page.getByLabel("Mensaje", { exact: true }).fill("Hola, sí está dispo");

  await escribir(buyer, "¿Sigue disponible la silla?");
  await expect(seller.page.getByTestId("mensajes")).toContainText("¿Sigue disponible la silla?", {
    timeout: 5_000,
  });
  await expect(seller.page.getByLabel("Mensaje", { exact: true })).toHaveValue("Hola, sí está dispo");

  // Y al revés, con una oferta: el comprador la ve llegar.
  await seller.page.getByLabel("Mensaje", { exact: true }).fill("Sí, está disponible.");
  await seller.page.getByRole("button", { name: "Enviar", exact: true }).click();
  await expect(buyer.getByTestId("mensajes")).toContainText("Sí, está disponible.", { timeout: 5_000 });

  await buyer.getByRole("link", { name: "Hacer una oferta" }).click();
  await buyer.getByLabel("Cuánto ofreces").fill("130000");
  await buyer.getByRole("button", { name: "Enviar la oferta" }).click();
  await expect(seller.page.getByText(/Te ofrecieron \$\s?130\.000/)).toBeVisible({ timeout: 5_000 });

  await ctx.close();
  await seller.context.close();
});

test("solo las dos partes pueden escuchar una conversación", async ({ browser }) => {
  const { seller, ctx, buyer, chatId } = await conversacion(browser, `Mesa ${Date.now()}`);
  const url = `/api/chat/${chatId}/eventos`;

  // Quien es parte abre el flujo de eventos.
  const parte = await buyer.evaluate(async (u) => {
    const control = new AbortController();
    const r = await fetch(u, { signal: control.signal });
    const tipo = r.headers.get("content-type");
    control.abort();
    return { status: r.status, tipo };
  }, url);
  expect(parte.status).toBe(200);
  expect(parte.tipo).toContain("text/event-stream");

  // Sin sesión y con una cuenta ajena, no.
  const anon = await browser.newContext();
  expect((await anon.request.get(url)).status()).toBe(401);
  const ajenoCtx = await browser.newContext();
  const ajeno = await ajenoCtx.newPage();
  await signUpVerified(ajeno, "ajeno", "Persona Ajena");
  expect((await ajeno.request.get(url)).status()).toBe(404);

  await anon.close();
  await ajenoCtx.close();
  await ctx.close();
  await seller.context.close();
});

test("quien reporta deja de recibir mensajes y ofertas de esa persona, sin que ella lo sepa", async ({ browser }) => {
  const { seller, ctx, buyer, chat, chatId } = await conversacion(browser, `Bicicleta ${Date.now()}`);
  await seller.page.goto(chat);
  await escribir(seller.page, "Hola, cuéntame qué necesitas.");

  await buyer.reload();
  await expect(buyer.getByTestId("mensajes")).toContainText("cuéntame qué necesitas");
  await reportar(buyer, "insultos");

  // Después del reporte, el vendedor sigue escribiendo y ofertando como si nada.
  await seller.page.reload();
  await expect(seller.page.getByTestId("reporte-hecho")).toHaveCount(0);
  await escribir(seller.page, "Mensaje después del reporte");
  await seller.page.getByRole("link", { name: "Hacer una oferta" }).click();
  await seller.page.getByLabel("Cuánto ofreces").fill("140000");
  await seller.page.getByRole("button", { name: "Enviar la oferta" }).click();
  await expect(seller.page.getByTestId("mensajes")).toContainText("140.000");

  // A quien reportó no le llega: ni en el chat, ni en la bandeja, ni en avisos.
  await buyer.reload();
  await expect(buyer.getByTestId("mensajes")).toContainText("cuéntame qué necesitas");
  await expect(buyer.getByTestId("mensajes")).not.toContainText("después del reporte");
  await expect(buyer.getByText(/Te ofrecieron/)).toHaveCount(0);
  await expect(buyer.getByTestId("reporte-hecho")).toContainText("ya no te llegan sus mensajes ni sus ofertas");
  await buyer.goto("/chats");
  await expect(buyer.getByTestId("chats")).not.toContainText("después del reporte");
  const avisos = await withDb(async (c) => {
    const { rows } = await c.query(
      `select 1 from notifications n join conversations c on n.href = '/chat/' || c.id
        where c.id = $1 and n.user_id = c.buyer_id
          and n.created_at > (select created_at from chat_reports where conversation_id = $1)`,
      [chatId],
    );
    return rows.length;
  });
  expect(avisos).toBe(0);

  // Quien modera sí lo ve todo.
  const adminCtx = await browser.newContext();
  const admin = await adminCtx.newPage();
  const { email } = await signUpVerified(admin, "admin", "Ada Administradora");
  await makeAdmin(email);
  await admin.goto(`/admin/conversaciones/${chatId}`);
  await expect(admin.getByTestId("conversacion")).toContainText("Mensaje después del reporte");
  // Con las ofertas y el momento del reporte: lo que el bloqueo le ocultó a quien
  // reportó es justo lo que el equipo tiene que poder ver (Luna, filas 19–23).
  await expect(admin.getByTestId("conversacion")).toContainText("140.000");
  await expect(admin.getByTestId("conversacion")).toContainText("reportó la conversación");

  await adminCtx.close();
  await ctx.close();
  await seller.context.close();
});

test("la cola de reportes pone primero lo grave y a quien más personas reportaron", async ({ browser }) => {
  // Dos compradoras distintas reportan al mismo vendedor, y otra reporta a otro
  // vendedor por «otra cosa» antes que ellas.
  const tituloLeve = `Leve ${Date.now()}`;
  const tituloGrave = `Grave ${Date.now()}`;
  const leve = await conversacion(browser, tituloLeve);
  await reportar(leve.buyer, "otro");

  const grave = await conversacion(browser, tituloGrave);
  await reportar(grave.buyer, "estafa");
  const segundoCtx = await browser.newContext();
  const segunda = await segundoCtx.newPage();
  await signUpVerified(segunda, "segunda", "Sara Segunda");
  const otro = await withDb(async (c) => {
    const { rows } = await c.query<{ id: string }>(
      `insert into listings (seller_id, title, description, category, condition, price_cop, video_path, poster_path)
       select seller_id, 'Otro de ' || title, 'Descripción de prueba.', 'ropa', 'usado_bueno', 90000, 'seed/demo.webm', 'seed/demo.jpg'
         from listings where id = $1 returning id`,
      [grave.seller.listingId],
    );
    return rows[0].id;
  });
  await segunda.goto(`/producto/${otro}`);
  await segunda.getByRole("button", { name: "Escribirle al vendedor" }).click();
  await expect(segunda).toHaveURL(/\/chat\//);
  await reportar(segunda, "insultos");

  const adminCtx = await browser.newContext();
  const admin = await adminCtx.newPage();
  const { email } = await signUpVerified(admin, "admin", "Ada Administradora");
  await makeAdmin(email);
  await admin.goto("/admin/conversaciones");

  const items = admin.getByRole("main").getByRole("listitem");
  const textos = await items.allTextContents();
  const posGrave = textos.findIndex((t) => t.includes(`Sobre «${tituloGrave}»`));
  const posLeve = textos.findIndex((t) => t.includes(`Sobre «${tituloLeve}»`));
  expect(posGrave).toBeGreaterThanOrEqual(0);
  expect(posGrave).toBeLessThan(posLeve);
  const tarjeta = items.filter({ hasText: `Sobre «${tituloGrave}»` });
  await expect(tarjeta.getByTestId("urgente")).toBeVisible();
  await expect(tarjeta.getByTestId("reportes-contra")).toContainText("2 personas distintas");
  await expect(items.filter({ hasText: `Sobre «${tituloLeve}»` }).getByTestId("urgente")).toHaveCount(0);

  await adminCtx.close();
  await segundoCtx.close();
  for (const x of [leve, grave]) {
    await x.ctx.close();
    await x.seller.context.close();
  }
});
