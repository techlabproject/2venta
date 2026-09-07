import { test, expect, type Browser } from "@playwright/test";
import { alertIn, makeAdmin, sellerWithListing, signUpVerified, withDb } from "./helpers";

// La prueba de punta a punta de la rebanada S-21.
// Ver slices/21-perfil-reportes-suspension.md

async function adminPage(browser: Browser) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const { email } = await signUpVerified(page, "admin", "Equipo 2venta");
  await makeAdmin(email);
  return { ctx, page };
}

test("se edita el alias, la zona y la descripción, y se ve en el perfil público", async ({
  browser,
}) => {
  const marca = Date.now();
  const seller = await sellerWithListing(browser, `Camisa perfil ${marca}`, 60_000, "ropa");
  const sellerId = await withDb(async (c) => {
    const { rows } = await c.query<{ seller_id: string }>(
      `select seller_id from listings where id = $1`,
      [seller.listingId]
    );
    return rows[0].seller_id;
  });

  await seller.page.goto("/cuenta/editar");
  await seller.page.getByLabel("Alias público").fill(`Camila ${marca}`);
  await seller.page.getByLabel("Zona").fill("Teusaquillo");
  await seller.page.getByLabel("Sobre ti").fill("Vendo lo que ya no uso, respondo rápido.");
  await seller.page.getByRole("button", { name: "Guardar" }).click();
  await expect(seller.page.getByRole("status")).toContainText("Guardado");

  const anonCtx = await browser.newContext();
  const anon = await anonCtx.newPage();
  await anon.goto(`/vendedor/${sellerId}`);
  await expect(anon.getByRole("heading", { name: `Camila ${marca}` })).toBeVisible();
  await expect(anon.getByRole("main")).toContainText("Teusaquillo");
  await expect(anon.getByRole("main")).toContainText("respondo rápido");

  await seller.context.close();
  await anonCtx.close();
});

test("el alias anterior queda registrado", async ({ browser }) => {
  // Un vendedor con malas reseñas no puede limpiar su rastro cambiándose el nombre,
  // que es lo primero que intentaría.
  const marca = Date.now();
  const seller = await sellerWithListing(browser, `Buzo alias ${marca}`, 50_000, "ropa");
  const sellerId = await withDb(async (c) => {
    const { rows } = await c.query<{ seller_id: string }>(
      `select seller_id from listings where id = $1`,
      [seller.listingId]
    );
    return rows[0].seller_id;
  });

  await seller.page.goto("/cuenta/editar");
  await seller.page.getByLabel("Alias público").fill(`Nombre Nuevo ${marca}`);
  await seller.page.getByRole("button", { name: "Guardar" }).click();
  await expect(seller.page.getByRole("status")).toContainText("Guardado");

  const historial = await withDb(async (c) => {
    const { rows } = await c.query<{ alias: string }>(
      `select alias from alias_history where user_id = $1`,
      [sellerId]
    );
    return rows.map((r) => r.alias);
  });
  expect(historial.length).toBeGreaterThanOrEqual(1);

  await seller.context.close();
});

test("un alias vacío o larguísimo se rechaza", async ({ browser }) => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await signUpVerified(page, "perfil", "Laura Compradora");

  await page.goto("/cuenta/editar");
  await page.getByLabel("Alias público").fill("a");
  await page.getByRole("button", { name: "Guardar" }).click();
  await expect(alertIn(page)).toContainText("2 y 40");

  await page.getByLabel("Alias público").fill("x".repeat(50));
  await page.getByRole("button", { name: "Guardar" }).click();
  await expect(alertIn(page)).toContainText("2 y 40");

  await ctx.close();
});

test("la descripción pasa por el filtro anti-desvío", async ({ browser }) => {
  const seller = await sellerWithListing(browser, `Gorra bio ${Date.now()}`, 40_000, "ropa");
  const sellerId = await withDb(async (c) => {
    const { rows } = await c.query<{ seller_id: string }>(
      `select seller_id from listings where id = $1`,
      [seller.listingId]
    );
    return rows[0].seller_id;
  });

  await seller.page.goto("/cuenta/editar");
  await seller.page.getByLabel("Sobre ti").fill("Escríbeme al 3001234567");
  await seller.page.getByRole("button", { name: "Guardar" }).click();
  await expect(seller.page.getByRole("status")).toContainText("Guardado");

  const anonCtx = await browser.newContext();
  const anon = await anonCtx.newPage();
  await anon.goto(`/vendedor/${sellerId}`);
  await expect(anon.getByRole("main")).not.toContainText("3001234567");

  await seller.context.close();
  await anonCtx.close();
});

test("se reporta a un usuario y el reporte llega a la cola", async ({ browser }) => {
  const marca = Date.now();
  const seller = await sellerWithListing(browser, `Reloj reporte ${marca}`, 100_000, "ropa");
  const sellerId = await withDb(async (c) => {
    const { rows } = await c.query<{ seller_id: string }>(
      `select seller_id from listings where id = $1`,
      [seller.listingId]
    );
    return rows[0].seller_id;
  });

  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await signUpVerified(page, "denunciante", "Persona Atenta");
  await page.goto(`/vendedor/${sellerId}`);
  await page.getByText("Reportar a esta persona").click();
  await page.getByLabel("Motivo del reporte").selectOption("fuera_app");
  await page.getByRole("button", { name: "Reportar" }).click();
  await expect(page.getByRole("status")).toContainText("Gracias");

  const admin = await adminPage(browser);
  await admin.page.goto("/admin/usuarios");
  await expect(admin.page.getByRole("listitem").filter({ hasText: "reporte" }).first()).toBeVisible();

  await seller.context.close();
  await ctx.close();
  await admin.ctx.close();
});

test("no se puede reportar a uno mismo", async ({ browser }) => {
  const seller = await sellerWithListing(browser, `Solo ${Date.now()}`, 40_000, "ropa");
  const sellerId = await withDb(async (c) => {
    const { rows } = await c.query<{ seller_id: string }>(
      `select seller_id from listings where id = $1`,
      [seller.listingId]
    );
    return rows[0].seller_id;
  });

  await seller.page.goto(`/vendedor/${sellerId}`);
  await expect(seller.page.getByText("Reportar a esta persona")).toHaveCount(0);

  await seller.context.close();
});

test("un administrador suspende una cuenta y sus publicaciones dejan de verse", async ({
  browser,
}) => {
  const titulo = `Suspendida ${Date.now()}`;
  const seller = await sellerWithListing(browser, titulo, 120_000, "ropa");
  const sellerId = await withDb(async (c) => {
    const { rows } = await c.query<{ seller_id: string }>(
      `select seller_id from listings where id = $1`,
      [seller.listingId]
    );
    return rows[0].seller_id;
  });

  // Alguien lo reporta para que llegue a la cola.
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await signUpVerified(page, "denunciante", "Persona Atenta");
  await page.goto(`/vendedor/${sellerId}`);
  await page.getByText("Reportar a esta persona").click();
  await page.getByLabel("Motivo del reporte").selectOption("estafa");
  await page.getByRole("button", { name: "Reportar" }).click();
  await expect(page.getByRole("status")).toContainText("Gracias");

  const admin = await adminPage(browser);
  await admin.page.goto("/admin/usuarios");
  const fila = admin.page.getByRole("listitem").filter({ hasText: "Camila" }).first();
  await fila.getByLabel("Motivo de la suspensión").fill("Intento de estafa comprobado");
  await fila.getByRole("button", { name: "Suspender la cuenta" }).click();

  const anonCtx = await browser.newContext();
  const anon = await anonCtx.newPage();
  await anon.goto("/");
  await expect(
    anon.getByRole("main").getByRole("listitem").filter({ hasText: titulo })
  ).toHaveCount(0);

  await seller.context.close();
  await ctx.close();
  await admin.ctx.close();
  await anonCtx.close();
});

test("suspender no borra: los pedidos siguen existiendo para la otra parte", async ({
  browser,
}) => {
  // Si suspender borrara, suspender a un estafador dejaría a sus víctimas sin
  // evidencia justo cuando más la necesitan.
  const titulo = `Con pedido ${Date.now()}`;
  const seller = await sellerWithListing(browser, titulo, 150_000, "ropa");

  const ctx = await browser.newContext();
  const buyer = await ctx.newPage();
  await signUpVerified(buyer, "comprador", "Laura Compradora");
  await buyer.goto(`/comprar/${seller.listingId}`);
  await buyer.getByLabel("Quién recibe").fill("Laura Torres");
  await buyer.getByLabel("Celular de quien recibe").fill("300 412 88 05");
  await buyer.getByLabel("Dirección").fill("Calle 72 #10-34");
  await buyer.getByLabel("Zona").selectOption("Chapinero");
  await buyer.getByRole("button", { name: "Ir a pagar" }).click();
  await buyer.getByRole("button", { name: "Simular pago aprobado" }).click();
  await expect(buyer).toHaveURL(/\/pedido\//);
  const orderId = new URL(buyer.url()).pathname.split("/").pop()!;

  const sellerId = await withDb(async (c) => {
    const { rows } = await c.query<{ seller_id: string }>(
      `select seller_id from orders where id = $1`,
      [orderId]
    );
    return rows[0].seller_id;
  });
  await withDb((c) =>
    c.query(`update "user" set suspended_at = now() where id = $1`, [sellerId])
  );

  // El comprador sigue viendo su pedido con todo lo que necesita.
  await buyer.goto(`/pedido/${orderId}`);
  await expect(buyer.getByTestId("estado")).toHaveText("Pago recibido y guardado");
  await expect(buyer.getByRole("main")).toContainText(titulo);

  await seller.context.close();
  await ctx.close();
});

test("quien no es administrador no puede suspender", async ({ browser }) => {
  const seller = await sellerWithListing(browser, `Intento ${Date.now()}`, 60_000, "ropa");
  const sellerId = await withDb(async (c) => {
    const { rows } = await c.query<{ seller_id: string }>(
      `select seller_id from listings where id = $1`,
      [seller.listingId]
    );
    return rows[0].seller_id;
  });

  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await signUpVerified(page, "normal", "Persona Normal");

  const res = await page.goto("/admin/usuarios");
  expect(res?.status()).toBe(404);

  await page.goto("/");
  await page.evaluate(async (id) => {
    const form = new FormData();
    form.set("userId", id);
    form.set("reason", "porque quiero");
    await fetch("/admin/usuarios", { method: "POST", body: form }).catch(() => {});
  }, sellerId);

  const suspendido = await withDb(async (c) => {
    const { rows } = await c.query<{ suspended_at: Date | null }>(
      `select suspended_at from "user" where id = $1`,
      [sellerId]
    );
    return rows[0].suspended_at;
  });
  expect(suspendido).toBeNull();

  await seller.context.close();
  await ctx.close();
});
