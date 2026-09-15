import { test, expect, type Browser } from "@playwright/test";
import { sellerWithListing, signUpVerified, withDb } from "./helpers";

// La prueba de punta a punta de la rebanada S-18.
// Ver slices/18-mi-actividad.md

async function purchase(browser: Browser, title: string, price = 150_000) {
  const seller = await sellerWithListing(browser, title, price, "ropa");
  const ctx = await browser.newContext();
  const buyer = await ctx.newPage();
  await signUpVerified(buyer, "comprador", "Laura Compradora");

  await buyer.goto(`/comprar/${seller.listingId}`);
  await buyer.getByLabel("Quién recibe").fill("Laura Torres");
  await buyer.getByLabel("Celular de quien recibe").fill("300 412 88 05");
  await buyer.getByLabel("Dirección").fill("Calle 72 #10-34");
  await buyer.getByLabel("Zona").selectOption("Chapinero");
  await buyer.getByRole("button", { name: "Ir a pagar" }).click();
  await expect(buyer).toHaveURL(/\/dev\/pago\//);
  await buyer.getByRole("button", { name: "Simular pago aprobado" }).click();
  await expect(buyer).toHaveURL(/\/pedido\//);

  return { seller, ctx, buyer, orderId: new URL(buyer.url()).pathname.split("/").pop()! };
}

test("el comprador encuentra su compra y llega al pedido desde ahí", async ({
  browser,
}) => {
  // Es el defecto que esta rebanada arregla: antes se pagaba, se cerraba la
  // pestaña, y no había forma de volver.
  const titulo = `Chaqueta comprada ${Date.now()}`;
  const { seller, ctx, buyer, orderId } = await purchase(browser, titulo);

  await buyer.goto("/actividad");
  await expect(buyer.getByTestId("compras")).toContainText(titulo);
  await buyer.getByTestId("compras").getByRole("link").first().click();
  await expect(buyer).toHaveURL(new RegExp(orderId));

  await seller.context.close();
  await ctx.close();
});

test("el vendedor encuentra su venta", async ({ browser }) => {
  const titulo = `Botas vendidas ${Date.now()}`;
  const { seller, ctx } = await purchase(browser, titulo);

  await seller.page.goto("/actividad");
  await expect(seller.page.getByTestId("ventas")).toContainText(titulo);
  // Y no aparece como compra suya.
  await expect(seller.page.getByRole("main")).toContainText("Aquí van tus compras");

  await seller.context.close();
  await ctx.close();
});

test("las dos partes encuentran la conversación", async ({ browser }) => {
  const titulo = `Abrigo hablado ${Date.now()}`;
  const seller = await sellerWithListing(browser, titulo, 200_000, "ropa");
  const ctx = await browser.newContext();
  const buyer = await ctx.newPage();
  await signUpVerified(buyer, "comprador", "Laura Compradora");

  await buyer.goto(`/producto/${seller.listingId}`);
  await buyer.getByRole("button", { name: "Escribirle al vendedor" }).click();
  await expect(buyer).toHaveURL(/\/chat\//);
  await buyer.getByLabel("Mensaje").fill("¿Sigue disponible?");
  await buyer.getByRole("button", { name: "Enviar" }).click();
  await expect(buyer.getByRole("main")).toContainText("¿Sigue disponible?");

  await buyer.goto("/actividad");
  await expect(buyer.getByTestId("chats")).toContainText(titulo);
  await expect(buyer.getByTestId("chats")).toContainText("¿Sigue disponible?");

  await seller.page.goto("/actividad");
  await expect(seller.page.getByTestId("chats")).toContainText(titulo);

  await seller.context.close();
  await ctx.close();
});

test("la conversación sigue estando cuando el artículo se vende", async ({
  browser,
}) => {
  // La conversación es la única evidencia de lo que se acordó; hacerla desaparecer
  // justo cuando puede hacer falta para un reclamo sería lo contrario de lo que el
  // producto promete.
  const titulo = `Saco vendido ${Date.now()}`;
  const seller = await sellerWithListing(browser, titulo, 180_000, "ropa");
  const ctx = await browser.newContext();
  const buyer = await ctx.newPage();
  await signUpVerified(buyer, "comprador", "Laura Compradora");

  await buyer.goto(`/producto/${seller.listingId}`);
  await buyer.getByRole("button", { name: "Escribirle al vendedor" }).click();
  await expect(buyer).toHaveURL(/\/chat\//);

  await withDb((c) =>
    c.query(`update listings set status = 'vendida' where id = $1`, [seller.listingId])
  );

  await buyer.goto("/actividad");
  await expect(buyer.getByTestId("chats")).toContainText(titulo);
  await expect(buyer.getByTestId("chats")).toContainText("ya se vendió");

  await seller.context.close();
  await ctx.close();
});

test("no se ven pedidos ni conversaciones de otras personas", async ({ browser }) => {
  const titulo = `Reloj ajeno ${Date.now()}`;
  const { seller, ctx } = await purchase(browser, titulo);

  const otroCtx = await browser.newContext();
  const otro = await otroCtx.newPage();
  await signUpVerified(otro, "ajeno", "Persona Ajena");
  await otro.goto("/actividad");
  await expect(otro.getByRole("main")).not.toContainText(titulo);
  await expect(otro.getByRole("main")).toContainText("Aquí van tus compras");

  await seller.context.close();
  await ctx.close();
  await otroCtx.close();
});

test("sin sesión manda a ingresar", async ({ browser }) => {
  const anonCtx = await browser.newContext();
  const anon = await anonCtx.newPage();
  const res = await anon.goto("/actividad");
  expect(res?.url()).toMatch(/\/ingresar/);
  await anonCtx.close();
});
