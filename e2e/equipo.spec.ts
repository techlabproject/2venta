import { test, expect } from "@playwright/test";
import { makeAdmin, sellerWithListing, signUpVerified, withDb } from "./helpers";

// Corrección 48 (D-127, decisión de Nicolás): la cuenta del equipo solo administra.
// No compra ni vende, para no moderar publicaciones, reclamos o disputas en las que
// tenga interés. No basta esconder los botones: el servidor lo impide.

test("la cuenta del equipo ve Administración y no Vender, carrito ni Publicar", async ({ page }) => {
  const { email } = await signUpVerified(page, "equipo", "Diana Equipo");
  await makeAdmin(email);
  await page.goto("/");

  const principal = page.getByRole("navigation", { name: "Principal" });
  await expect(principal.getByRole("link", { name: "Administración" })).toBeVisible();
  await expect(principal.getByRole("link", { name: "Carrito" })).toHaveCount(0);
  await expect(page.getByRole("banner").getByRole("link", { name: "Vender" })).toHaveCount(0);

  await page.setViewportSize({ width: 390, height: 844 });
  const barra = page.getByRole("navigation", { name: "Navegación principal" });
  await expect(barra.getByRole("link", { name: /Administración/ })).toBeVisible();
  await expect(barra.getByRole("link", { name: /Publicar/ })).toHaveCount(0);
});

test("vender, publicar y la tienda llevan a administración", async ({ page }) => {
  const { email } = await signUpVerified(page, "equipo", "Diana Equipo");
  await makeAdmin(email);
  for (const ruta of ["/vender", "/publicar", "/tienda", "/vender/metricas"]) {
    await page.goto(ruta);
    await expect(page, ruta).toHaveURL(/\/admin$/);
  }
});

test("en una ficha no compra, no escribe ni guarda, y la compra directa no pasa", async ({
  browser,
}) => {
  const seller = await sellerWithListing(browser, `Equipo ${Date.now()}`, 80_000);
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const { email } = await signUpVerified(page, "equipo", "Diana Equipo");
  await makeAdmin(email);

  await page.goto(`/producto/${seller.listingId}`);
  await expect(page.getByTestId("equipo-no-compra")).toContainText(
    "Estás en la cuenta del equipo de 2venta",
  );
  await expect(page.getByRole("button", { name: /Comprar/ })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /carrito/i })).toHaveCount(0);
  await expect(page.getByRole("link", { name: /Escribir|Escríbele/ })).toHaveCount(0);
  await expect(page.getByTestId("favorito")).toHaveCount(0);

  // Por la dirección tampoco: la compra y el chat devuelven a la ficha.
  await page.goto(`/comprar/${seller.listingId}`);
  await expect(page).toHaveURL(new RegExp(`/producto/${seller.listingId}$`));
  await page.goto(`/chat/abrir/${seller.listingId}`);
  await expect(page).toHaveURL(new RegExp(`/producto/${seller.listingId}$`));

  // Y no quedó nada a su nombre.
  const [rastro] = await withDb(async (c) =>
    (
      await c.query(
        `select (select count(*) from orders o join "user" u on u.id = o.buyer_id where u.email = $1)::int as pedidos,
                (select count(*) from conversations v join "user" u on u.id = v.buyer_id where u.email = $1)::int as chats`,
        [email],
      )
    ).rows,
  );
  expect(rastro).toEqual({ pedidos: 0, chats: 0 });

  await seller.context.close();
  await ctx.close();
});

// Luna (fila 48): el aviso de búsqueda y «Preguntar» seguían a la vista del equipo.
test("tampoco pide avisos ni pregunta como compradora", async ({ browser }) => {
  const seller = await sellerWithListing(browser, `Pregunta ${Date.now()}`, 80_000);
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const { email } = await signUpVerified(page, "equipo", "Diana Equipo");
  await makeAdmin(email);

  await page.goto(`/buscar?q=${encodeURIComponent("Pregunta")}`);
  await expect(page.getByText(/Avísame cuando aparezca/)).toHaveCount(0);
  await page.goto(`/buscar?q=zzzqqq${Date.now()}`);
  await expect(page.getByText(/Avísame cuando aparezca/)).toHaveCount(0);
  await page.goto(`/producto/${seller.listingId}`);
  await expect(page.getByPlaceholder("Pregunta algo del producto")).toHaveCount(0);

  await seller.context.close();
  await ctx.close();
});
