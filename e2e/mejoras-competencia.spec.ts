import { expect, test } from "@playwright/test";
import { sellerWithListing, signUpVerified, withDb } from "./helpers";

// Mejoras que salieron de comparar con la competencia (D-131): GoTrendier y Mercado
// Libre avisan cuando algo guardado baja de precio, y en Colombia los artículos se
// pasan por WhatsApp, así que la ficha se comparte con un toque.

test("si baja el precio de algo guardado, a quien lo guardó le llega una notificación", async ({ browser }) => {
  const titulo = `Gorro de lana tejido ${Date.now()}`;
  const seller = await sellerWithListing(browser, titulo, 120_000, "ropa");

  const ctx = await browser.newContext();
  const buyer = await ctx.newPage();
  await signUpVerified(buyer, "bajaprecio", "Persona Compradora");
  await buyer.goto(`/producto/${seller.listingId}`);
  await buyer.getByTestId("favorito").click();
  await expect(buyer.getByTestId("favorito")).toHaveAttribute("aria-pressed", "true");

  // Subir el precio no avisa; bajarlo, sí.
  async function cambiarPrecio(precio: string) {
    await seller.page.goto(`/producto/${seller.listingId}/editar`);
    await seller.page.getByLabel("Precio").fill(precio);
    await seller.page.getByRole("button", { name: "Guardar cambios" }).click();
    await expect(seller.page).toHaveURL(/recien=editado/);
  }
  await cambiarPrecio("130000");
  await buyer.goto("/notificaciones");
  await expect(buyer.getByRole("main")).not.toContainText("Bajó de precio");

  await cambiarPrecio("95000");
  await buyer.goto("/notificaciones");
  const aviso = buyer.getByTestId("avisos").getByRole("link", { name: new RegExp(`Bajó de precio: ${titulo}`) });
  await expect(aviso).toContainText("95.000");
  await aviso.click();
  await expect(buyer).toHaveURL(new RegExp(`/producto/${seller.listingId}`));

  // Guardar el mismo precio otra vez no repite el aviso, y al vendedor no le llega.
  await cambiarPrecio("95000");
  const cuantos = await withDb(async (c) => {
    const { rows } = await c.query<{ n: number }>(
      `select count(*)::int as n from notifications where kind = 'bajo_precio' and href = $1`,
      [`/producto/${seller.listingId}`],
    );
    return rows[0].n;
  });
  expect(cuantos).toBe(1);

  await ctx.close();
  await seller.context.close();
});

test("la ficha se puede compartir por WhatsApp, también sin cuenta", async ({ browser }) => {
  const titulo = `Caminador para bebé ${Date.now()}`;
  const seller = await sellerWithListing(browser, titulo, 300_000, "ninos");
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(`/producto/${seller.listingId}`);

  const whatsapp = page.getByRole("link", { name: "Compartir por WhatsApp" });
  await expect(whatsapp).toBeVisible();
  const href = await whatsapp.getAttribute("href");
  expect(href).toMatch(/^https:\/\/wa\.me\/\?text=/);
  const texto = decodeURIComponent(href!.split("text=")[1]);
  expect(texto).toContain(titulo);
  expect(texto).toContain(`/producto/${seller.listingId}`);
  // No se filtra nada de la sesión ni de quién vende en el enlace.
  expect(texto).not.toMatch(/@|token|session/i);

  await ctx.close();
  await seller.context.close();
});

// D-132: lo que bajó de precio muestra el precio de antes tachado, en el catálogo y
// en la ficha, sin etiqueta de texto (Nicolás: «solo la oferta, sin texto»). Subirlo
// lo quita.
test("lo que bajó de precio lo dice en la tarjeta y en la ficha", async ({ browser, page }) => {
  const titulo = `Mecedora de madera ${Date.now()}`;
  const seller = await sellerWithListing(browser, titulo, 180_000, "ninos");
  async function cambiarPrecio(precio: string) {
    await seller.page.goto(`/producto/${seller.listingId}/editar`);
    await seller.page.getByLabel("Precio").fill(precio);
    await seller.page.getByRole("button", { name: "Guardar cambios" }).click();
    await expect(seller.page).toHaveURL(/recien=editado/);
  }
  const tarjeta = () =>
    page.getByRole("main").getByRole("listitem").filter({ hasText: titulo });

  await page.goto(`/buscar?q=${encodeURIComponent(titulo)}`);
  await expect(tarjeta().getByTestId("precio-antes")).toHaveCount(0);

  await cambiarPrecio("150000");
  await page.goto(`/buscar?q=${encodeURIComponent(titulo)}`);
  await expect(tarjeta().getByTestId("precio-antes")).toContainText("180.000");
  await page.goto(`/producto/${seller.listingId}`);
  await expect(page.getByTestId("precio-antes")).toContainText("180.000");
  await expect(page.getByRole("main")).not.toContainText("Bajó");

  await cambiarPrecio("200000");
  await page.goto(`/buscar?q=${encodeURIComponent(titulo)}`);
  await expect(tarjeta().getByTestId("precio-antes")).toHaveCount(0);

  await seller.context.close();
});

// D-132: en el celular, la barra de compra está mientras el botón principal no se
// ve y se esconde cuando aparece; nunca dos «Comprar» a la vista.
test("la barra de compra del celular se esconde cuando se ve el botón principal", async ({ browser }) => {
  const seller = await sellerWithListing(browser, `Silla alta ${Date.now()}`, 140_000, "ninos");
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.goto(`/producto/${seller.listingId}`);
  const barra = page.getByTestId("barra-compra");
  await expect(barra).toBeVisible();
  await expect(barra).not.toHaveAttribute("aria-hidden", "true");

  await page.locator("#comprar-principal").scrollIntoViewIfNeeded();
  await expect(barra).toHaveAttribute("aria-hidden", "true");

  // En el escritorio no existe: el botón de comprar está a la vista en la columna.
  await page.setViewportSize({ width: 1280, height: 800 });
  await expect(barra).toBeHidden();

  await ctx.close();
  await seller.context.close();
});
