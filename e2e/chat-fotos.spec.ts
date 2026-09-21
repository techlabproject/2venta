import { expect, test, type Browser, type Page } from "@playwright/test";
import {
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

/** Un PNG de 1×1 real, para que el bucket reciba bytes de imagen de verdad. */
const PNG_1X1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

async function adjuntar(page: Page) {
  await page.setInputFiles('input[type="file"]', {
    name: "camiseta.png",
    mimeType: "image/png",
    buffer: PNG_1X1,
  });
}

test("el vendedor manda una foto y las dos partes la ven", async ({
  browser,
}) => {
  // El disparador fue literal: en la captura de Nicolás el comprador escribe
  // «puedo ver mas fotos» y no había forma de contestar con una.
  const titulo = `Camiseta con foto ${Date.now()}`;
  const { seller, ctx, buyer, chatId } = await conversacion(browser, titulo);

  await seller.page.goto(`/chat/${chatId}`);
  await adjuntar(seller.page);
  await seller.page.getByLabel("Mensaje").fill("Aquí la tienes de cerca");
  await seller.page.getByRole("button", { name: "Enviar" }).click();

  const foto = seller.page
    .getByTestId("mensajes")
    .getByRole("img", { name: /Foto que mandó/ });
  await expect(foto).toBeVisible();

  // Y el comprador la ve, que es el punto.
  await buyer.reload();
  await expect(
    buyer.getByTestId("mensajes").getByRole("img", { name: /Foto que mandó/ }),
  ).toBeVisible();

  await ctx.close();
  await seller.context.close();
});

test("el comprador no tiene el control de adjuntar", async ({ browser }) => {
  const titulo = `Buzo sin foto ${Date.now()}`;
  const { seller, ctx, buyer } = await conversacion(browser, titulo);

  await expect(buyer.getByLabel("Adjuntar una foto")).toHaveCount(0);
  // Y el vendedor sí lo tiene, para que la prueba distinga «no está» de «no existe».
  await seller.page.goto(buyer.url());
  await expect(seller.page.getByLabel("Adjuntar una foto")).toBeVisible();

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

  // Reportar dos veces no duplica el reporte.
  await buyer.reload();
  await buyer.getByTestId("reportar").click();
  await buyer.getByLabel("Qué está pasando").selectOption("insultos");
  await buyer.getByRole("button", { name: "Enviar el reporte" }).click();

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
