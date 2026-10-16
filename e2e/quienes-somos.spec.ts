import { expect, test } from "@playwright/test";
import { sellerWithListing, signUpVerified } from "./helpers";

// Filas 80 y 81 (revisión 5 de Catalina, D-133): «Quiénes somos» enlazado desde el
// encabezado y el pie de página, y un «¿Necesitas ayuda?» con el correo de 2venta.
// El número que propuso Catalina es de otra empresa (Consmoelec): no se muestra
// hasta que 2venta tenga uno propio.

const CORREO = "techlab.project.dev@gmail.com";

test("el pie de página lleva a Quiénes somos y a Ayuda, también sin cuenta", async ({ page }) => {
  await page.goto("/");
  const pie = page.getByRole("contentinfo");
  await expect(pie).toBeVisible();
  // Solo la marca, sin frase (Nicolás, 2026-10-16).
  await expect(pie.getByRole("paragraph")).toHaveText("2venta");

  await pie.getByRole("link", { name: "Quiénes somos" }).click();
  await expect(page).toHaveURL(/\/quienes-somos$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Quiénes somos");
  const main = page.getByRole("main");
  await expect(main).toContainText("2venta es una tienda en línea de artículos usados en Bogotá.");
  await expect(main).not.toContainText("grupo de jóvenes");
  await expect(main.getByRole("link", { name: CORREO })).toHaveAttribute("href", `mailto:${CORREO}`);

  await page.getByRole("contentinfo").getByRole("link", { name: "Ayuda" }).click();
  await expect(page).toHaveURL(/\/ayuda$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("¿Necesitas ayuda?");
  await expect(page.getByRole("main").getByRole("link", { name: CORREO })).toHaveAttribute(
    "href",
    `mailto:${CORREO}`,
  );
  // El fijo que se propuso es de otra empresa: no aparece como contacto de 2venta.
  await expect(page.locator("body")).not.toContainText("6015192387");
});

test("Quiénes somos también está en el encabezado", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  await page.getByRole("banner").getByRole("link", { name: "Quiénes somos" }).click();
  await expect(page).toHaveURL(/\/quienes-somos$/);

  // Con sesión, en el menú de la cuenta.
  await signUpVerified(page, "quienes", "Persona Curiosa");
  await page.goto("/");
  await page.getByTestId("usuario").click();
  await page.getByRole("banner").getByRole("link", { name: "Quiénes somos" }).click();
  await expect(page).toHaveURL(/\/quienes-somos$/);
});

test("al pagar y en el pedido hay un «¿Necesitas ayuda?» a la vista", async ({ browser }) => {
  const seller = await sellerWithListing(browser, `Lámpara de pie ${Date.now()}`, 90_000, "ninos");
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await signUpVerified(page, "ayuda", "Persona Compradora");

  await page.goto(`/comprar/${seller.listingId}`);
  const enCompra = page.getByRole("main").getByRole("link", { name: "¿Necesitas ayuda?" });
  await expect(enCompra).toBeVisible();
  await expect(enCompra).toHaveAttribute("href", "/ayuda");

  await ctx.close();
  await seller.context.close();
});

test("en el chat no hay pie de página: la conversación ocupa la pantalla", async ({ browser }) => {
  const seller = await sellerWithListing(browser, `Escritorio ${Date.now()}`, 120_000, "ninos");
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await signUpVerified(page, "piechat", "Persona Compradora");
  await page.goto(`/producto/${seller.listingId}`);
  await page.getByRole("button", { name: "Escribirle al vendedor" }).click();
  await expect(page).toHaveURL(/\/chat\//);
  await expect(page.getByRole("contentinfo")).toBeHidden();
  await ctx.close();
  await seller.context.close();
});
