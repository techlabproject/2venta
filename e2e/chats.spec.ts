import { expect, test, type Browser, type Page } from "@playwright/test";
import { sellerWithListing, signUpVerified, withDb } from "./helpers";

// La prueba de punta a punta de la S-35.
// Ver slices/35-bandeja-de-conversaciones.md
//
// Lo que se comprueba no es que la lista exista, sino que diga lo único que le
// importa a quien la abre: con quién, de qué, y qué hay sin leer.

const bandeja = (page: Page) => page.getByTestId("chats");
const fila = (page: Page, titulo: string) =>
  bandeja(page).getByRole("listitem").filter({ hasText: titulo });

/** Deja una conversación abierta con un mensaje del comprador. */
async function conversar(browser: Browser, titulo: string, mensaje: string) {
  const seller = await sellerWithListing(browser, titulo, 200_000, "ropa");
  const ctx = await browser.newContext();
  const buyer = await ctx.newPage();
  await signUpVerified(buyer, "comprador", "Laura Compradora");

  await buyer.goto(`/producto/${seller.listingId}`);
  await buyer.getByRole("button", { name: "Escribirle al vendedor" }).click();
  await expect(buyer).toHaveURL(/\/chat\//);
  const chatId = new URL(buyer.url()).pathname.split("/").pop()!;

  await buyer.getByLabel("Mensaje").fill(mensaje);
  await buyer.getByRole("button", { name: "Enviar" }).click();
  await expect(buyer.getByRole("main")).toContainText(mensaje);

  return { seller, ctx, buyer, chatId };
}

test("las dos partes encuentran la conversación en la bandeja", async ({ browser }) => {
  const titulo = `Abrigo hablado ${Date.now()}`;
  const { seller, ctx, buyer } = await conversar(browser, titulo, "¿Sigue disponible?");

  await buyer.goto("/chats");
  await expect(fila(buyer, titulo)).toContainText("¿Sigue disponible?");
  // Lo escribió ella, así que el renglón lo dice: si no, parece que espera su
  // propia respuesta.
  await expect(fila(buyer, titulo)).toContainText("Tú:");

  await seller.page.goto("/chats");
  await expect(fila(seller.page, titulo)).toContainText("¿Sigue disponible?");
  await expect(fila(seller.page, titulo)).not.toContainText("Tú:");

  await seller.context.close();
  await ctx.close();
});

test("lo que escribe la otra persona queda sin leer, y abrirlo lo marca leído", async ({
  browser,
}) => {
  const titulo = `Buzo preguntado ${Date.now()}`;
  const { seller, ctx, chatId } = await conversar(
    browser,
    titulo,
    "¿Lo tienes en talla M?"
  );

  // Para el vendedor hay algo nuevo: no ha abierto nada.
  await seller.page.goto("/chats");
  await expect(fila(seller.page, titulo).getByLabel("Sin leer")).toBeVisible();
  await expect(seller.page.getByTestId("sin-leer")).toContainText("1 sin leer");

  // Abrirla es leerla.
  await seller.page.goto(`/chat/${chatId}`);
  await expect(seller.page.getByRole("main")).toContainText("¿Lo tienes en talla M?");

  await seller.page.goto("/chats");
  await expect(fila(seller.page, titulo).getByLabel("Sin leer")).toHaveCount(0);
  await expect(seller.page.getByTestId("sin-leer")).toHaveCount(0);

  await seller.context.close();
  await ctx.close();
});

test("lo que escribes tú no te aparece a ti como sin leer", async ({ browser }) => {
  // El defecto obvio de un contador de no leídos: contar los propios mensajes y
  // dejar al remitente con un punto que no se apaga con nada.
  const titulo = `Gorra escrita ${Date.now()}`;
  const { seller, ctx, buyer } = await conversar(browser, titulo, "Te escribo yo");

  await buyer.goto("/chats");
  await expect(fila(buyer, titulo)).toBeVisible();
  await expect(fila(buyer, titulo).getByLabel("Sin leer")).toHaveCount(0);
  await expect(buyer.getByTestId("sin-leer")).toHaveCount(0);

  await seller.context.close();
  await ctx.close();
});

test("nadie ve en su bandeja la conversación de otras dos personas", async ({
  browser,
}) => {
  const titulo = `Reloj ajeno ${Date.now()}`;
  const { seller, ctx } = await conversar(browser, titulo, "Esto es privado");

  const otroCtx = await browser.newContext();
  const otro = await otroCtx.newPage();
  await signUpVerified(otro, "ajeno", "Persona Ajena");
  await otro.goto("/chats");

  await expect(otro.getByRole("main")).not.toContainText(titulo);
  await expect(otro.getByRole("main")).not.toContainText("Esto es privado");
  await expect(otro.getByRole("main")).toContainText("Todavía no has hablado con nadie");

  await seller.context.close();
  await ctx.close();
  await otroCtx.close();
});

test("la conversación sigue en la bandeja cuando el artículo ya se vendió", async ({
  browser,
}) => {
  // La conversación es la única evidencia de lo que se acordó; hacerla desaparecer
  // justo cuando puede hacer falta para un reclamo sería lo contrario de lo que el
  // producto promete.
  const titulo = `Saco vendido ${Date.now()}`;
  const { seller, ctx, buyer } = await conversar(browser, titulo, "¿Me lo guardas?");

  await withDb((c) =>
    c.query(`update listings set status = 'vendida' where id = $1`, [seller.listingId])
  );

  await buyer.goto("/chats");
  await expect(fila(buyer, titulo)).toContainText("ya se vendió");

  await seller.context.close();
  await ctx.close();
});
