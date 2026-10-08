import { expect, test, type Browser, type Page } from "@playwright/test";
import { sellerWithListing, signUpVerified } from "./helpers";

// Fila 73 (revisión 4 de Catalina): «no se actualiza justo con el mensaje nuevo, hay
// que recargar» y «debe ser más accesible entrar a chats desde el pc (header)».
// Filas 78 y 79: «Avisos» pasa a llamarse «Notificaciones» y explica las búsquedas
// guardadas; Guardados pierde la frase sobre «Ya no están». Ver D-131.

async function conversacion(browser: Browser, titulo: string) {
  const seller = await sellerWithListing(browser, titulo, 150_000, "ropa");
  const ctx = await browser.newContext();
  const buyer = await ctx.newPage();
  await signUpVerified(buyer, "notif", "Persona Compradora");
  await buyer.goto(`/producto/${seller.listingId}`);
  await buyer.getByRole("button", { name: "Escribirle al vendedor" }).click();
  await expect(buyer).toHaveURL(/\/chat\/[0-9a-f-]{36}$/);
  const chat = new URL(buyer.url()).pathname;
  return { seller, ctx, buyer, chat };
}

async function escribir(page: Page, texto: string) {
  await page.getByLabel("Mensaje", { exact: true }).fill(texto);
  await page.getByRole("button", { name: "Enviar", exact: true }).click();
  await expect(page.getByTestId("mensajes")).toContainText(texto);
}

test("en el escritorio, Chats y Notificaciones están en el encabezado y se ponen al día solos", async ({ browser }) => {
  const titulo = `Bufanda de lana ${Date.now()}`;
  const { seller, ctx, buyer } = await conversacion(browser, titulo);

  // El vendedor está en la portada, sin nada pendiente.
  await seller.page.goto("/");
  const nav = seller.page.getByRole("navigation", { name: "Principal" });
  await expect(nav.getByRole("link", { name: /^Chats/ })).toBeVisible();
  await expect(nav.getByRole("link", { name: /^Notificaciones/ })).toBeVisible();
  await expect(seller.page.getByTestId("mensajes-sin-leer")).toHaveCount(0);
  // Que la escucha esté abierta antes de que escriban.
  await expect(seller.page.getByTestId("avisos-en-vivo")).toHaveAttribute("data-conectado", "si");

  await escribir(buyer, "Hola, ¿todavía la tienes?");

  // Sin recargar: el contador del encabezado y un aviso en la pantalla.
  await expect(seller.page.getByTestId("mensajes-sin-leer")).toHaveText("1", { timeout: 8_000 });
  await expect(seller.page.getByTestId("notificaciones-sin-leer")).toHaveText("1");
  const aviso = seller.page.getByTestId("aviso-en-vivo");
  await expect(aviso).toContainText(`Mensaje nuevo sobre ${titulo}`);

  // El aviso lleva a la conversación.
  await aviso.getByRole("link", { name: "Ver" }).click();
  await expect(seller.page).toHaveURL(/\/chat\/[0-9a-f-]{36}$/);
  await expect(seller.page.getByTestId("mensajes")).toContainText("¿todavía la tienes?");

  await ctx.close();
  await seller.context.close();
});

test("la lista de conversaciones se pone al día sin recargar", async ({ browser }) => {
  const { seller, ctx, buyer } = await conversacion(browser, `Lámpara de mesa ${Date.now()}`);
  await seller.page.goto("/chats");
  await expect(seller.page.getByTestId("avisos-en-vivo")).toHaveAttribute("data-conectado", "si");

  await escribir(buyer, "Primer mensaje");
  await expect(seller.page.getByTestId("chats")).toContainText("Primer mensaje", { timeout: 8_000 });

  // Un segundo mensaje en el mismo minuto no crea otra notificación, pero la lista
  // igual tiene que mostrarlo.
  await escribir(buyer, "Segundo mensaje");
  await expect(seller.page.getByTestId("chats")).toContainText("Segundo mensaje", { timeout: 8_000 });

  await ctx.close();
  await seller.context.close();
});

test("en el celular, el contador de Chats de la barra se pone al día solo", async ({ browser }) => {
  const seller = await sellerWithListing(browser, `Cuna ${Date.now()}`, 200_000, "ninos");
  await seller.page.setViewportSize({ width: 390, height: 844 });
  await seller.page.goto("/");
  await expect(seller.page.getByTestId("avisos-en-vivo")).toHaveAttribute("data-conectado", "si");
  const barra = seller.page.getByRole("navigation", { name: "Navegación principal" });
  await expect(barra.getByRole("link", { name: /Chats/ })).not.toContainText("sin leer");

  const ctx = await browser.newContext();
  const buyer = await ctx.newPage();
  await signUpVerified(buyer, "notifmovil", "Persona Compradora");
  await buyer.goto(`/producto/${seller.listingId}`);
  await buyer.getByRole("button", { name: "Escribirle al vendedor" }).click();
  await escribir(buyer, "¿La cuna tiene colchón?");

  await expect(barra.getByRole("link", { name: /Chats/ })).toContainText("1 conversación sin leer", {
    timeout: 8_000,
  });
  await expect(seller.page.getByTestId("aviso-en-vivo")).toBeVisible();

  await ctx.close();
  await seller.context.close();
});

test("el flujo de avisos es solo de quien tiene sesión", async ({ browser }) => {
  const anon = await browser.newContext();
  expect((await anon.request.get("/api/avisos/eventos")).status()).toBe(401);
  expect((await anon.request.get("/api/avisos/ultimo")).status()).toBe(401);
  await anon.close();
});

test("«Avisos» ahora se llama «Notificaciones» y explica las búsquedas guardadas", async ({ page }) => {
  await signUpVerified(page, "notifnombre", "Persona Nombre");

  // Los enlaces viejos siguen sirviendo.
  await page.goto("/avisos");
  await expect(page).toHaveURL(/\/notificaciones$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Notificaciones");
  await expect(page.getByRole("main")).toContainText("Avísame cuando aparezca");
  await expect(page.getByRole("main")).not.toContainText("Avisos");

  // Guardados ya no repite la frase de «Ya no están» y enlaza a Notificaciones.
  await page.goto("/favoritos");
  await page.getByRole("main").getByRole("link", { name: "Notificaciones" }).click();
  await expect(page).toHaveURL(/\/notificaciones$/);
});
