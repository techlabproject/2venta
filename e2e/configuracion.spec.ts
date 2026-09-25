import { test, expect, type Page } from "@playwright/test";
import { makeAdmin, sellerWithListing, signUpVerified, withDb } from "./helpers";

// Corrección 52 (D-128): el equipo cambia categorías, lugares de encuentro, tallas y
// edades y palabras prohibidas sin un desarrollador, desde /admin/configuracion, y
// cada cambio queda en el historial.
//
// La base la comparten las pruebas en paralelo: aquí no se toca lo que otras usan
// («Ropa», la zona Cota, la talla M); se crean valores propios y se borran al final.

async function comoEquipo(page: Page) {
  const { email } = await signUpVerified(page, "equipo", "Diana Equipo");
  await makeAdmin(email);
  await page.goto("/admin/configuracion");
  await expect(page.getByRole("heading", { name: "Configuración" })).toBeVisible();
}

test("solo la cuenta del equipo abre la configuración", async ({ page }) => {
  const anonima = await page.request.get("/admin/configuracion");
  expect(anonima.status()).toBe(404);
  await signUpVerified(page, "cliente", "Carlos Cliente");
  const res = await page.goto("/admin/configuracion");
  expect(res?.status()).toBe(404);
});

test("una categoría cambia de nombre en la portada y queda en el historial", async ({ page }) => {
  const slug = `prueba${Date.now()}`;
  await withDb((c) =>
    c.query(`insert into categories (slug, label, position, active) values ($1, 'Categoría de prueba', 900, true)`, [slug]),
  );
  try {
    await comoEquipo(page);
    const tarjeta = page.locator("#categorias li").filter({ has: page.locator(`input[value="${slug}"]`) });
    await tarjeta.getByLabel(/Nombre/).fill("Objetos de prueba");
    await tarjeta.getByRole("button", { name: "Guardar" }).click();
    await expect(page.getByRole("status")).toContainText("Guardado");
    // En palabras, no en JSON (Luna, fila 52).
    await expect(page.getByTestId("historial")).toContainText(`Categoría: ${slug}`);
    await expect(page.getByTestId("historial")).toContainText("nombre: Objetos de prueba");
    await expect(page.getByTestId("historial")).not.toContainText("{");

    await page.goto("/");
    await expect(page.getByRole("navigation", { name: "Atajos" })).toContainText("Objetos de prueba");

    // Inactiva: ya no aparece.
    await page.goto("/admin/configuracion");
    await page
      .locator("#categorias li")
      .filter({ has: page.locator(`input[value="${slug}"]`) })
      .getByLabel("Activa")
      .uncheck();
    await page
      .locator("#categorias li")
      .filter({ has: page.locator(`input[value="${slug}"]`) })
      .getByRole("button", { name: "Guardar" })
      .click();
    await expect(page.getByRole("status")).toContainText("Guardado");
    await page.goto("/");
    await expect(page.getByRole("navigation", { name: "Atajos" })).not.toContainText("Objetos de prueba");
  } finally {
    await withDb(async (c) => {
      await c.query(`delete from cambios_config where clave = $1`, [slug]);
      await c.query(`delete from categories where slug = $1`, [slug]);
    });
  }
});

test("un lugar nuevo se ofrece al comprar en persona", async ({ browser }) => {
  const nombre = `Biblioteca de prueba ${Date.now()}`;
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  try {
    await comoEquipo(page);
    await page.getByLabel("Zona", { exact: true }).selectOption("La Calera");
    await page.getByLabel("Nombre del lugar").fill(nombre);
    await page.getByLabel("Tipo", { exact: true }).selectOption("biblioteca");
    await page.getByRole("button", { name: "Agregar lugar" }).click();
    await expect(page.getByRole("status")).toContainText("Guardado");
    await expect(page.getByTestId("lugares")).toContainText(nombre);

    const seller = await sellerWithListing(browser, `Lugar ${Date.now()}`, 60_000);
    const buyerCtx = await browser.newContext();
    const buyer = await buyerCtx.newPage();
    await signUpVerified(buyer, "comprador", "Laura Compradora");
    await buyer.goto(`/comprar/${seller.listingId}`);
    await buyer.getByRole("radio", { name: /Nos vemos en persona/ }).check();
    await buyer.getByLabel("¿En qué zona se ven?").selectOption("La Calera");
    await expect(buyer.getByRole("radio", { name: nombre })).toBeChecked();
    await seller.context.close();
    await buyerCtx.close();
  } finally {
    await withDb(async (c) => {
      const { rows } = await c.query<{ id: string }>(`select id from lugares_encuentro where nombre = $1`, [nombre]);
      for (const r of rows) await c.query(`delete from cambios_config where clave = $1`, [r.id]);
      await c.query(`delete from lugares_encuentro where nombre = $1`, [nombre]);
    });
    await ctx.close();
  }
});

test("una talla nueva aparece al editar y una desactivada deja de ofrecerse", async ({ browser }) => {
  const talla = `T${Date.now() % 100000}`;
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const seller = await sellerWithListing(browser, `Talla ${Date.now()}`, 60_000, "ropa");
  try {
    await comoEquipo(page);
    await page.getByLabel("Lista").selectOption("talla");
    await page.getByLabel("Valor (como se verá)").fill(talla);
    await page.getByRole("button", { name: "Agregar", exact: true }).first().click();
    await expect(page.getByTestId("atributos-talla")).toContainText(talla);

    await seller.page.goto(`/producto/${seller.listingId}/editar`);
    await expect(seller.page.getByLabel("Talla").locator("option", { hasText: talla })).toHaveCount(1);

    await page.goto("/admin/configuracion");
    await page.getByRole("button", { name: `Desactivar ${talla}` }).click();
    await expect(page.getByRole("button", { name: `Activar ${talla}` })).toBeVisible();
    await seller.page.goto(`/producto/${seller.listingId}/editar`);
    await expect(seller.page.getByLabel("Talla").locator("option", { hasText: talla })).toHaveCount(0);
  } finally {
    await withDb(async (c) => {
      await c.query(`delete from cambios_config where clave = $1`, [talla]);
      await c.query(`delete from atributos where valor = $1`, [talla]);
    });
    await seller.context.close();
    await ctx.close();
  }
});

test("una palabra prohibida del equipo frena la publicación con su motivo", async ({ browser }) => {
  const frase = `trampazo${Date.now() % 100000}`;
  const motivo = "No se pueden publicar trampas de prueba.";
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const seller = await sellerWithListing(browser, `Palabra ${Date.now()}`, 60_000, "ropa");
  try {
    await comoEquipo(page);
    await page.getByLabel("Frase").fill(frase);
    await page.getByLabel("Motivo (lo ve quien publica)").fill(motivo);
    await page.locator("#palabras").getByRole("button", { name: "Agregar" }).click();
    await expect(page.getByTestId("palabras")).toContainText(frase);

    // Editar no es la puerta trasera: la frase en el título se rechaza con el motivo.
    await seller.page.goto(`/producto/${seller.listingId}/editar`);
    await seller.page.getByLabel("Título").fill(`Chaqueta ${frase.toUpperCase()}`);
    await seller.page.getByRole("button", { name: /Guardar/ }).first().click();
    await expect(seller.page.getByRole("main").getByRole("alert")).toContainText(motivo);

    // Desactivada, ya no frena.
    await page.goto("/admin/configuracion");
    await page.getByTestId("palabras").getByRole("listitem").filter({ hasText: frase }).getByRole("button", { name: "Desactivar" }).click();
    await expect(page.getByRole("status")).toContainText("Guardado");
    await seller.page.goto(`/producto/${seller.listingId}/editar`);
    await seller.page.getByLabel("Título").fill(`Chaqueta ${frase}`);
    await seller.page.getByRole("button", { name: /Guardar/ }).first().click();
    await expect(seller.page.getByRole("main").getByRole("alert")).toHaveCount(0);
  } finally {
    await withDb(async (c) => {
      await c.query(`delete from cambios_config where clave = $1`, [frase]);
      await c.query(`delete from palabras_prohibidas where frase = $1`, [frase]);
    });
    await seller.context.close();
    await ctx.close();
  }
});

// Luna (fila 52): con la talla desactivada, el editor mostraba otra (XS) y al guardar
// sin tocar nada la publicación cambiaba de talla. Ahora conserva la suya, dice que ya
// no se ofrece, y se puede guardar sin cambiarla.
test("una publicación conserva su talla aunque el equipo la desactive", async ({ browser }) => {
  const talla = `K${Date.now() % 100000}`;
  await withDb((c) =>
    c.query(`insert into atributos (tipo, valor, grupo, orden) values ('talla', $1, 'letra', 999)`, [talla]),
  );
  const seller = await sellerWithListing(browser, `Conserva ${Date.now()}`, 60_000, "ropa");
  try {
    await withDb((c) => c.query(`update listings set talla = $2 where id = $1`, [seller.listingId, talla]));
    await withDb((c) => c.query(`update atributos set activo = false where tipo = 'talla' and valor = $1`, [talla]));

    await seller.page.goto(`/producto/${seller.listingId}/editar`);
    await expect(seller.page.getByLabel("Talla")).toHaveValue(talla);
    await expect(seller.page.getByRole("main")).toContainText("ya no se ofrece");
    await seller.page.getByRole("button", { name: /Guardar/ }).first().click();
    await expect(seller.page.getByRole("main").getByRole("alert")).toHaveCount(0);
    const [fila] = await withDb(async (c) =>
      (await c.query(`select talla from listings where id = $1`, [seller.listingId])).rows,
    );
    expect(fila.talla).toBe(talla);
  } finally {
    await withDb((c) => c.query(`delete from atributos where valor = $1`, [talla]));
    await seller.context.close();
  }
});

// Luna (fila 52): un nombre de 500 letras se recortaba a 40 sin avisar.
test("un valor demasiado largo se rechaza en vez de recortarse", async ({ page }) => {
  const slug = `largo${Date.now()}`;
  await withDb((c) =>
    c.query(`insert into categories (slug, label, position, active) values ($1, 'Largo de prueba', 901, true)`, [slug]),
  );
  try {
    await comoEquipo(page);
    const tarjeta = page.locator("#categorias li").filter({ has: page.locator(`input[value="${slug}"]`) });
    await tarjeta.getByLabel(/Nombre/).evaluate((el) => el.removeAttribute("maxlength"));
    await tarjeta.getByLabel(/Nombre/).fill("X".repeat(500));
    await tarjeta.getByRole("button", { name: "Guardar" }).click();
    await expect(page.getByRole("main").getByRole("alert")).toContainText("Es demasiado largo");
    const [fila] = await withDb(async (c) => (await c.query(`select label from categories where slug = $1`, [slug])).rows);
    expect(fila.label).toBe("Largo de prueba");
  } finally {
    await withDb((c) => c.query(`delete from categories where slug = $1`, [slug]));
  }
});
