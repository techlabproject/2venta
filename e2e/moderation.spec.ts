import { test, expect, type Page } from "@playwright/test";
import {
  alertIn,
  approveKycFor,
  freshImei,
  makeAdmin,
  sellerWithListing,
  signUpVerified,
  withDb,
} from "./helpers";

// La prueba de punta a punta de la rebanada S-10.
// Ver slices/10-imei-y-moderacion.md

/** Un vendedor verificado, listo para publicar por la interfaz. */
async function verifiedSeller(page: Page) {
  const { email } = await signUpVerified(page, "vendedor", "Camila Vendedora");
  await approveKycFor(email);
  return email;
}

async function fillPublishForm(
  page: Page,
  opts: { title: string; price: number; category: string; imei?: string; description?: string }
) {
  await page.goto("/publicar");
  await page.getByRole("button", { name: "Abrir cámara" }).click();
  await page.getByRole("button", { name: /^Grabar/ }).click();
  await page.getByRole("button", { name: "Terminar" }).click();
  await expect(page.getByRole("status")).toContainText("Video listo");

  await page.getByLabel("Título").fill(opts.title);
  await page.getByLabel("Categoría").selectOption(opts.category);
  if (opts.imei !== undefined) await page.getByLabel("IMEI del equipo").fill(opts.imei);
  await page.getByLabel("Precio").fill(String(opts.price));
  await page.getByLabel("Descripción").fill(opts.description ?? "En buen estado.");
  await page.getByRole("button", { name: "Publicar" }).click();
}

test("publicar electrónica exige el IMEI", async ({ browser }) => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await verifiedSeller(page);

  await page.goto("/publicar");
  await page.getByLabel("Categoría").selectOption("tecnologia");
  await expect(page.getByLabel("IMEI del equipo")).toBeVisible();

  // En ropa no se pide.
  await page.getByLabel("Categoría").selectOption("ropa");
  await expect(page.getByLabel("IMEI del equipo")).toHaveCount(0);

  await ctx.close();
});

test("un IMEI inventado se rechaza", async ({ browser }) => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await verifiedSeller(page);

  // Quince dígitos, pero con el dígito verificador equivocado.
  await fillPublishForm(page, {
    title: `Celular ${Date.now()}`,
    price: 900_000,
    category: "tecnologia",
    imei: "490154203237519",
  });
  await expect(alertIn(page)).toContainText("IMEI no es válido");

  await ctx.close();
});

test("la electrónica queda en revisión y no sale al catálogo", async ({ browser }) => {
  // R-03: sin contraste automático de IMEI, la electrónica la mira una persona.
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await verifiedSeller(page);

  const titulo = `Celular en revisión ${Date.now()}`;
  await fillPublishForm(page, {
    title: titulo,
    price: 900_000,
    category: "tecnologia",
    imei: freshImei(),
  });
  await expect(page).toHaveURL(/\/producto\//);

  const anonCtx = await browser.newContext();
  const anon = await anonCtx.newPage();
  await anon.goto("/");
  await expect(
    anon.getByRole("main").getByRole("listitem").filter({ hasText: titulo })
  ).toHaveCount(0);
  await anon.goto(`/buscar?q=${encodeURIComponent(titulo.split(" ")[0])}`);
  await expect(
    anon.getByRole("main").getByRole("listitem").filter({ hasText: titulo })
  ).toHaveCount(0);

  await ctx.close();
  await anonCtx.close();
});

test("ropa y niños salen directo al catálogo", async ({ browser }) => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await verifiedSeller(page);

  const titulo = `Buzo directo ${Date.now()}`;
  await fillPublishForm(page, { title: titulo, price: 60_000, category: "ropa" });
  await expect(page).toHaveURL(/\/producto\//);

  const anonCtx = await browser.newContext();
  const anon = await anonCtx.newPage();
  await anon.goto("/");
  await expect(
    anon.getByRole("main").getByRole("listitem").filter({ hasText: titulo })
  ).toHaveCount(1);

  await ctx.close();
  await anonCtx.close();
});

test("el mismo IMEI no se puede publicar dos veces", async ({ browser }) => {
  // Dos publicaciones con el mismo IMEI no son coincidencia.
  const imei = freshImei();

  const primero = await browser.newContext();
  const p1 = await primero.newPage();
  await verifiedSeller(p1);
  await fillPublishForm(p1, {
    title: `Equipo uno ${Date.now()}`, price: 800_000, category: "tecnologia", imei,
  });
  await expect(p1).toHaveURL(/\/producto\//);

  const segundo = await browser.newContext();
  const p2 = await segundo.newPage();
  await verifiedSeller(p2);
  await fillPublishForm(p2, {
    title: `Equipo dos ${Date.now()}`, price: 850_000, category: "tecnologia", imei,
  });
  await expect(alertIn(p2)).toContainText("ya está publicado");

  await primero.close();
  await segundo.close();
});

test("la moderación automática rechaza lo evidentemente prohibido", async ({
  browser,
}) => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await verifiedSeller(page);

  await fillPublishForm(page, {
    title: `Pistola 9mm ${Date.now()}`, price: 500_000, category: "ropa",
  });
  await expect(alertIn(page)).toContainText("armas de fuego");

  await ctx.close();
});

test("la moderación también mira la descripción, no solo el título", async ({
  browser,
}) => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await verifiedSeller(page);

  await fillPublishForm(page, {
    title: `Celular barato ${Date.now()}`,
    price: 400_000,
    category: "ropa",
    description: "Está robado pero funciona perfecto.",
  });
  await expect(alertIn(page)).toContainText("procedencia legítima");

  await ctx.close();
});

test("un administrador aprueba y la publicación sale al catálogo", async ({
  browser,
}) => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await verifiedSeller(page);

  const titulo = `Tablet ${Date.now()}`;
  await fillPublishForm(page, {
    title: titulo, price: 700_000, category: "tecnologia", imei: freshImei(),
  });
  await expect(page).toHaveURL(/\/producto\//);
  const listingId = new URL(page.url()).pathname.split("/").pop()!;

  const adminCtx = await browser.newContext();
  const admin = await adminCtx.newPage();
  const { email } = await signUpVerified(admin, "admin", "Equipo 2venta");
  await makeAdmin(email);

  await admin.goto("/admin");
  const fila = admin.getByRole("listitem").filter({ hasText: titulo });
  await expect(fila).toHaveCount(1);
  await fila.getByRole("button", { name: "Aprobar" }).click();

  const anonCtx = await browser.newContext();
  const anon = await anonCtx.newPage();
  await anon.goto(`/producto/${listingId}`);
  await expect(anon.getByRole("heading", { name: titulo })).toBeVisible();
  await anon.goto("/");
  await expect(
    anon.getByRole("main").getByRole("listitem").filter({ hasText: titulo })
  ).toHaveCount(1);

  await ctx.close();
  await adminCtx.close();
  await anonCtx.close();
});

test("quien no es administrador no ve el panel ni sabe que existe", async ({
  browser,
}) => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await signUpVerified(page, "normal", "Persona Normal");

  const res = await page.goto("/admin");
  expect(res?.status()).toBe(404);

  await ctx.close();
});

test("quien no es administrador no puede aprobar llamando la acción directamente", async ({
  browser,
}) => {
  const seller = await browser.newContext();
  const sp = await seller.newPage();
  await verifiedSeller(sp);
  const titulo = `Consola ${Date.now()}`;
  await fillPublishForm(sp, {
    title: titulo, price: 600_000, category: "tecnologia", imei: freshImei(),
  });
  await expect(sp).toHaveURL(/\/producto\//);
  const listingId = new URL(sp.url()).pathname.split("/").pop()!;

  // El propio vendedor intenta aprobarse.
  await sp.evaluate(async (id) => {
    const form = new FormData();
    form.set("listingId", id);
    form.set("decision", "aprobar");
    await fetch("/admin", { method: "POST", body: form }).catch(() => {});
  }, listingId);

  const estado = await withDb(async (c) => {
    const { rows } = await c.query<{ status: string }>(
      `select status from listings where id = $1`,
      [listingId]
    );
    return rows[0].status;
  });
  expect(estado).toBe("en_revision");

  await seller.close();
});

test("cualquiera con cuenta puede reportar, y el reporte llega a la cola", async ({
  browser,
}) => {
  const seller = await sellerWithListing(browser, `Reloj ${Date.now()}`, 300_000, "ropa");

  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await signUpVerified(page, "denunciante", "Persona Atenta");

  await page.goto(`/producto/${seller.listingId}`);
  await page.getByRole("group").filter({ hasText: "Reportar esta publicación" }).click();
  await page.getByLabel("Motivo").selectOption("robado");
  await page.getByRole("button", { name: "Reportar" }).click();
  await expect(page.getByRole("status")).toContainText("Gracias");

  const adminCtx = await browser.newContext();
  const admin = await adminCtx.newPage();
  const { email } = await signUpVerified(admin, "admin", "Equipo 2venta");
  await makeAdmin(email);

  await admin.goto("/admin");
  const fila = admin.getByRole("listitem").filter({ hasText: `Reloj` });
  await expect(fila.first()).toContainText("reporte");

  await seller.context.close();
  await ctx.close();
  await adminCtx.close();
});

test("el vendedor no puede reportar su propia publicación", async ({ browser }) => {
  const seller = await sellerWithListing(browser, `Gorra ${Date.now()}`, 40_000, "ropa");
  await seller.page.goto(`/producto/${seller.listingId}`);
  await expect(
    seller.page.getByText("Reportar esta publicación")
  ).toHaveCount(0);
  await seller.context.close();
});

test("sin sesión no se puede reportar", async ({ browser }) => {
  const seller = await sellerWithListing(browser, `Bufanda ${Date.now()}`, 30_000, "ropa");
  const anonCtx = await browser.newContext();
  const anon = await anonCtx.newPage();
  await anon.goto(`/producto/${seller.listingId}`);
  await expect(anon.getByText("Reportar esta publicación")).toHaveCount(0);
  await seller.context.close();
  await anonCtx.close();
});

test("un precio negativo se rechaza en vez de volverse positivo", async ({ browser }) => {
  // Hallazgo de Luna, la verificadora: el servidor quitaba todo lo que no fuera
  // dígito antes de validar, así que "-10000" se publicaba como "10000". Corregir
  // en silencio lo que alguien escribió publica un precio que nunca puso.
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await verifiedSeller(page);

  const titulo = `Precio negativo ${Date.now()}`;
  await fillPublishForm(page, { title: titulo, price: -10_000, category: "ropa" });
  await expect(alertIn(page)).toContainText("mayor que cero");

  const filas = await withDb(async (c) => {
    const { rows } = await c.query(`select 1 from listings where title = $1`, [titulo]);
    return rows.length;
  });
  expect(filas).toBe(0);

  await ctx.close();
});
