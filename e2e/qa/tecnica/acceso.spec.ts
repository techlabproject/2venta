import { test, expect, type Browser, type Page } from "@playwright/test";
import { config } from "dotenv";
import { sellerWithListing, signUpVerified, withDb } from "../../helpers";

config({ path: ".env.local" });

// Control de acceso: con dos usuarios A y B creados por la interfaz, y sin
// sesión, intenta ver o tocar lo que no corresponde. Ver AGENTE-QA.md, Parte 4.

async function payFor(page: Page, listingId: string) {
  await page.goto(`/comprar/${listingId}`);
  await page.getByLabel("Quién recibe").fill("Prueba Tecnica");
  await page.getByLabel("Celular de quien recibe").fill("300 412 88 05");
  await page.getByLabel("Dirección").fill("Calle 1 #2-3");
  await page.getByLabel("Zona").selectOption("Chapinero");
  await page.getByRole("button", { name: "Ir a pagar" }).click();
  await expect(page).toHaveURL(/\/dev\/pago\//);
  await page.getByRole("button", { name: "Simular pago aprobado" }).click();
  await expect(page).toHaveURL(/\/pedido\//);
  return new URL(page.url()).pathname.split("/").pop()!;
}

async function makeOrderAndConversation(browser: Browser) {
  const seller = await sellerWithListing(browser, `Tecnica acceso ${Date.now()}`, 180_000);
  const ctx = await browser.newContext();
  const buyer = await ctx.newPage();
  await signUpVerified(buyer, "tecacc", "Comprador Acceso");

  // Genera una conversación real de chat privado desde la ficha.
  await buyer.goto(`/producto/${seller.listingId}`);
  await buyer.getByRole("button", { name: "Escribirle al vendedor" }).click();
  await expect(buyer).toHaveURL(/\/chat\//);
  const conversationId = new URL(buyer.url()).pathname.split("/").pop()!;

  const orderId = await payFor(buyer, seller.listingId);

  return { seller, buyerCtx: ctx, buyer, orderId, conversationId, listingId: seller.listingId };
}

test.describe("un usuario B no puede ver lo de A (con sesión propia)", () => {
  test("pedido ajeno: 404 y sin datos filtrados", async ({ browser }) => {
    const { seller, buyerCtx, orderId } = await makeOrderAndConversation(browser);

    const strangerCtx = await browser.newContext();
    const stranger = await strangerCtx.newPage();
    await signUpVerified(stranger, "tecstr", "Extraño Acceso");

    const res = await stranger.goto(`/pedido/${orderId}`);
    expect(res?.status()).toBe(404);
    const text = await stranger.locator("body").innerText();
    expect(text).not.toContain("Prueba Tecnica");
    expect(text).not.toContain("Calle 1 #2-3");

    await strangerCtx.close();
    await buyerCtx.close();
    await seller.context.close();
  });

  test("chat ajeno: 404, sin mensajes ni oferta filtrados", async ({ browser }) => {
    const { seller, buyerCtx, conversationId } = await makeOrderAndConversation(browser);

    const strangerCtx = await browser.newContext();
    const stranger = await strangerCtx.newPage();
    await signUpVerified(stranger, "tecstr2", "Extraño Chat");

    const res = await stranger.goto(`/chat/${conversationId}`);
    expect(res?.status()).toBe(404);

    await strangerCtx.close();
    await buyerCtx.close();
    await seller.context.close();
  });

  test("/admin sin ser administrador: 404, no un formulario vacío", async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await signUpVerified(page, "tecnoadmin", "No Admin");
    for (const path of ["/admin", "/admin/disputas", "/admin/usuarios", "/admin/reportes"]) {
      const res = await page.goto(path);
      expect.soft(res?.status(), `esperaba 404 en ${path}`).toBe(404);
    }
    await ctx.close();
  });

  test("/api/admin/reportes.csv sin ser administrador: no entrega el CSV", async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await signUpVerified(page, "tecnocsv", "No Admin CSV");
    const res = await page.request.get("/api/admin/reportes.csv");
    expect(res.status()).toBe(404);
    const contentType = res.headers()["content-type"] ?? "";
    expect(contentType).not.toContain("text/csv");
    await ctx.close();
  });
});

test.describe("sin sesión: todo lo anterior también debe negarse", () => {
  test("pedido ajeno sin sesión: redirige a ingresar, no 200 con datos", async ({ browser }) => {
    const { seller, buyerCtx, orderId } = await makeOrderAndConversation(browser);

    const anonCtx = await browser.newContext();
    const anon = await anonCtx.newPage();
    const res = await anon.goto(`/pedido/${orderId}`);
    // activeUser()/currentUser() redirige a /ingresar cuando no hay sesión.
    expect(anon.url()).toContain("/ingresar");
    expect(res?.status()).toBeLessThan(300);
    const text = await anon.locator("body").innerText();
    expect(text).not.toContain("Prueba Tecnica");

    await anonCtx.close();
    await buyerCtx.close();
    await seller.context.close();
  });

  test("chat ajeno sin sesión: redirige a ingresar", async ({ browser }) => {
    const { seller, buyerCtx, conversationId } = await makeOrderAndConversation(browser);

    const anonCtx = await browser.newContext();
    const anon = await anonCtx.newPage();
    await anon.goto(`/chat/${conversationId}`);
    expect(anon.url()).toContain("/ingresar");

    await anonCtx.close();
    await buyerCtx.close();
    await seller.context.close();
  });

  test("/admin/* sin sesión: 404, no redirección con pista de que existe", async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    for (const path of ["/admin", "/admin/disputas", "/admin/usuarios", "/admin/reportes"]) {
      const res = await page.goto(path);
      expect.soft(res?.status(), `esperaba 404 en ${path}`).toBe(404);
    }
    await ctx.close();
  });

  test("/api/admin/reportes.csv sin sesión: 404", async ({ request }) => {
    const res = await request.get("/api/admin/reportes.csv");
    expect(res.status()).toBe(404);
  });

  test("carrito sin sesión: redirige a ingresar", async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto("/carrito");
    expect(page.url()).toContain("/ingresar");
    await ctx.close();
  });
});

test.describe("el código de entrega presencial y la dirección no se filtran a otro usuario", () => {
  test("el vendedor no ve el código de entrega presencial del comprador vía la API/HTML del pedido", async ({
    browser,
  }) => {
    const seller = await sellerWithListing(browser, `Tecnica presencial ${Date.now()}`, 90_000);
    const buyerCtx = await browser.newContext();
    const buyer = await buyerCtx.newPage();
    await signUpVerified(buyer, "tecpresencial", "Comprador Presencial");

    await buyer.goto(`/comprar/${seller.listingId}`);
    await buyer.getByRole("radio", { name: /Nos vemos en persona/ }).check();
    await buyer.getByLabel("¿En qué zona se ven?").selectOption("Chapinero");
    await buyer.getByRole("button", { name: "Ir a pagar" }).click();
    await expect(buyer).toHaveURL(/\/dev\/pago\//);
    await buyer.getByRole("button", { name: "Simular pago aprobado" }).click();
    await expect(buyer).toHaveURL(/\/pedido\//);
    const orderId = new URL(buyer.url()).pathname.split("/").pop()!;
    const code = (await buyer.getByTestId("codigo").innerText()).trim();
    expect(code).toMatch(/^\d{6}$/);

    // El vendedor abre el mismo pedido con su propia sesión: no debe ver el
    // testid del código ni el valor en ningún lugar del HTML.
    await seller.page.goto(`/pedido/${orderId}`);
    await expect(seller.page.getByTestId("codigo")).toHaveCount(0);
    const sellerHtml = await seller.page.content();
    expect(sellerHtml).not.toContain(code);

    await buyerCtx.close();
    await seller.context.close();
  });
});
