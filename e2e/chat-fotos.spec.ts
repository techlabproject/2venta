import { expect, test, type Browser } from "@playwright/test";
import {
  hidratado,
  makeAdmin,
  sellerWithListing,
  signUpVerified,
  withDb,
} from "./helpers";

// La prueba de punta a punta de la S-37.
// Ver slices/37-fotos-y-reportar-el-chat.md
//
// Dos cosas que van juntas porque la segunda es la condición de la primera: abrir
// un canal por el que entran imágenes a una conversación privada entre
// desconocidos, sin salida para quien recibe algo que no pidió, sería añadir una
// superficie de abuso y ninguna defensa.

/** Una conversación abierta, con el comprador dentro. */
async function conversacion(browser: Browser, titulo: string) {
  const seller = await sellerWithListing(browser, titulo, 120_000, "ropa");
  const ctx = await browser.newContext();
  const buyer = await ctx.newPage();
  await signUpVerified(buyer, "comprador", "Laura Compradora");

  await buyer.goto(`/producto/${seller.listingId}`);
  await buyer.getByRole("button", { name: "Escribirle al vendedor" }).click();
  await expect(buyer).toHaveURL(/\/chat\//);
  const chatId = new URL(buyer.url()).pathname.split("/").pop()!;

  return { seller, ctx, buyer, chatId };
}

// Corrección 21, versión 3 (D-129): Catalina insistió y Nicolás decidió quitar las
// fotos del chat. Lo que se enseña va en las fotos y el video del artículo, que sí
// pasan por la publicación. Las fotos que ya se mandaron se siguen viendo.

test("nadie tiene el control de adjuntar fotos en el chat", async ({ browser }) => {
  const titulo = `Buzo sin foto ${Date.now()}`;
  const { seller, ctx, buyer } = await conversacion(browser, titulo);

  await expect(buyer.getByLabel("Mensaje")).toBeVisible();
  await expect(buyer.getByLabel("Adjuntar una foto")).toHaveCount(0);
  await expect(buyer.locator('input[type="file"]')).toHaveCount(0);
  await seller.page.goto(buyer.url());
  await expect(seller.page.getByLabel("Mensaje")).toBeVisible();
  await expect(seller.page.getByLabel("Adjuntar una foto")).toHaveCount(0);
  await expect(seller.page.locator('input[type="file"]')).toHaveCount(0);

  await ctx.close();
  await seller.context.close();
});

test("una foto metida a mano en el formulario se rechaza", async ({ browser }) => {
  const titulo = `Camiseta forzada ${Date.now()}`;
  const { seller, ctx, chatId } = await conversacion(browser, titulo);

  await seller.page.goto(`/chat/${chatId}`);
  const mensaje = seller.page.getByLabel("Mensaje");
  await hidratado(mensaje);
  await mensaje.evaluate((el) => {
    const i = document.createElement("input");
    i.type = "hidden";
    i.name = "imageKey";
    i.value = "uploads/cualquiera/foto.png";
    el.closest("form")!.appendChild(i);
  });
  await mensaje.fill("Aquí la tienes de cerca");
  await seller.page.getByRole("button", { name: "Enviar" }).click();
  await expect(seller.page.getByRole("main").getByRole("alert")).toContainText(
    "En el chat no se mandan fotos",
  );
  const [fila] = await withDb(async (c) =>
    (await c.query(`select count(*)::int as n from messages where conversation_id = $1`, [chatId])).rows,
  );
  expect(fila.n).toBe(0);

  await ctx.close();
  await seller.context.close();
});

test("las fotos que ya se habían mandado se siguen viendo", async ({ browser }) => {
  const titulo = `Foto vieja ${Date.now()}`;
  const { seller, ctx, buyer, chatId } = await conversacion(browser, titulo);
  await withDb(async (c) => {
    const { rows } = await c.query<{ seller_id: string }>(
      `select seller_id from conversations where id = $1`,
      [chatId],
    );
    await c.query(
      `insert into messages (conversation_id, sender_id, body, image_path)
       values ($1, $2, 'Aquí la tienes de cerca', 'uploads/vieja/foto.png')`,
      [chatId, rows[0].seller_id],
    );
  });
  await buyer.reload();
  await expect(buyer.getByTestId("mensajes").getByRole("img", { name: /Foto que mandó/ })).toHaveCount(1);

  await ctx.close();
  await seller.context.close();
});

// Corrección 71 (D-129): la frase fija «Cierra el trato aquí…» se quita. El aviso que
// sale cuando alguien intenta pasar un teléfono se queda: ahí sí explica algo.
test("el chat ya no tiene la frase fija, y el aviso al ocultar un dato sigue", async ({ browser }) => {
  const titulo = `Sin frase ${Date.now()}`;
  const { seller, ctx, buyer } = await conversacion(browser, titulo);
  await expect(buyer.getByLabel("Mensaje")).toBeVisible();
  await expect(buyer.getByRole("main")).not.toContainText("Cierra el trato aquí");

  await buyer.getByLabel("Mensaje").fill("Mi cel es 3004128805");
  await buyer.getByRole("button", { name: "Enviar" }).click();
  await expect(buyer.getByRole("main")).toContainText("Ocultamos ese dato");

  await ctx.close();
  await seller.context.close();
});

// La clave de la imagen la comprueba `claim()` contra el bucket, y esos guardias
// ya tienen sus propias pruebas unitarias en `src/features/publish/claim.test.ts`:
// una clave que nunca se subió, una de otra persona, y una foto pasada por video.
// Repetirlas aquí por HTTP no se puede —una acción de servidor no se dispara con un
// POST crudo— y tampoco añadiría nada.

test("el comprador reporta la conversación y entra a la cola de moderación", async ({
  browser,
}) => {
  const titulo = `Chat feo ${Date.now()}`;
  const { seller, ctx, buyer, chatId } = await conversacion(browser, titulo);

  // Con algo dicho: quien modera tiene que poder leer lo que pasó, y una
  // conversación vacía no prueba que pueda.
  await buyer.getByLabel("Mensaje").fill("Hola, ¿sigue disponible?");
  await buyer.getByRole("button", { name: "Enviar" }).click();
  await expect(buyer.getByTestId("mensajes")).toContainText("sigue disponible");

  await buyer.getByTestId("reportar").click();
  await buyer.getByLabel("Qué está pasando").selectOption("insultos");
  await buyer.getByLabel("Cuéntanos qué pasó").fill("Me está insultando.");
  await buyer.getByRole("button", { name: "Enviar el reporte" }).click();

  // Se le dice que nadie le avisa a la otra parte: quien está pasando un mal rato
  // es justo quien menos puede permitirse el miedo a represalias.
  await expect(buyer.getByTestId("reporte-hecho")).toContainText(
    "No le avisamos a la otra persona",
  );

  // Al volver, el reporte se recuerda: ya no se ofrece reportar otra vez, y se
  // dice que la otra persona dejó de llegarle (bloqueo silencioso, corrección 22).
  // El índice único de la base sigue impidiendo un segundo reporte.
  await buyer.reload();
  await expect(buyer.getByTestId("reportar")).toHaveCount(0);
  await expect(buyer.getByTestId("reporte-hecho")).toContainText("Reportaste esta conversación");

  const cuantos = await withDb(async (c) => {
    const { rows } = await c.query<{ n: string }>(
      `select count(*) as n from chat_reports where conversation_id = $1`,
      [chatId],
    );
    return Number(rows[0].n);
  });
  expect(cuantos).toBe(1);

  // Y llega a quien modera, que puede leer la conversación.
  const adminCtx = await browser.newContext();
  const admin = await adminCtx.newPage();
  const { email } = await signUpVerified(admin, "admin", "Ada Administradora");
  await makeAdmin(email);

  await admin.goto("/admin/conversaciones");
  await expect(admin.getByTestId("cola-conversaciones")).toContainText(
    "sin revisar",
  );
  await expect(admin.getByRole("main")).toContainText("Insultos o amenazas");
  // Se va directo a ESTA conversación en vez de al primer enlace de la cola: la
  // cola acumula reportes de corridas anteriores y `.first()` abría otra.
  await admin.goto(`/admin/conversaciones/${chatId}`);
  await expect(admin.getByTestId("conversacion")).toContainText(
    "sigue disponible",
  );

  await ctx.close();
  await adminCtx.close();
  await seller.context.close();
});

test("una conversación sin reporte no la puede leer ni quien modera", async ({
  browser,
}) => {
  // La única puerta por la que alguien que no es parte lee una conversación es un
  // reporte abierto, y esa condición vive en la consulta.
  const titulo = `Chat tranquilo ${Date.now()}`;
  const { seller, ctx, chatId } = await conversacion(browser, titulo);

  const adminCtx = await browser.newContext();
  const admin = await adminCtx.newPage();
  const { email } = await signUpVerified(admin, "admin", "Ada Administradora");
  await makeAdmin(email);

  const res = await admin.goto(`/admin/conversaciones/${chatId}`);
  expect(res?.status()).toBe(404);

  await ctx.close();
  await adminCtx.close();
  await seller.context.close();
});

test("quien no es parte de la conversación no puede reportarla", async ({
  browser,
}) => {
  const titulo = `Chat ajeno ${Date.now()}`;
  const { seller, ctx, chatId } = await conversacion(browser, titulo);

  const otroCtx = await browser.newContext();
  const otro = await otroCtx.newPage();
  await signUpVerified(otro, "ajeno", "Persona Ajena");
  const res = await otro.goto(`/chat/${chatId}`);
  expect(res?.status()).toBe(404);

  await ctx.close();
  await otroCtx.close();
  await seller.context.close();
});
