import { test, expect, type Page } from "@playwright/test";
import { cerrarSesion, sellerWithListing, signUpVerified, uniqueAccount, withDb, aceptarTerminos } from "./helpers";
import { decryptCode } from "../src/features/auth/otp";

// Corrección 1 (Catalina, 2026-09-22): sin cuenta, «Escribirle al vendedor»
// mandaba a una pantalla de entrada sin forma de volver, y desde ahí nada
// devolvía al artículo. Resultado esperado: «Volver» en todas las pantallas.

const volver = (page: Page) =>
  page.getByRole("main").getByRole("link", { name: "Volver", exact: true });

async function codigoDe(phoneDigits: string): Promise<string> {
  return withDb(async (c) => {
    const { rows } = await c.query<{ code_enc: string }>(
      `select code_enc from phone_codes where phone = $1`,
      [`+57${phoneDigits}`],
    );
    return decryptCode(rows[0].code_enc)!;
  });
}

test.describe("escribirle al vendedor sin cuenta", () => {
  test("explica por qué pide la cuenta y deja volver al artículo", async ({ browser, page }) => {
    const titulo = `Lámpara de escritorio ${Date.now()}`;
    const { context, listingId } = await sellerWithListing(browser, titulo, 90_000, "ropa");
    await context.close();

    await page.goto(`/producto/${listingId}`);
    await page.getByRole("button", { name: "Escribirle al vendedor" }).click();

    await expect(page).toHaveURL(/\/ingresar\?/);
    await expect(page.getByText("Entra para escribirle al vendedor")).toBeVisible();

    await volver(page).click();
    await expect(page).toHaveURL(new RegExp(`/producto/${listingId}$`));
    await expect(page.getByRole("heading", { name: titulo })).toBeVisible();
  });

  test("al entrar sigue derecho a la conversación", async ({ browser, page }) => {
    const titulo = `Silla Eames ${Date.now()}`;
    const { context, listingId } = await sellerWithListing(browser, titulo, 320_000, "ropa");
    await context.close();

    // Una compradora que ya tiene cuenta, sin sesión en esta pestaña.
    const { email } = await signUpVerified(page, "compradora", "Laura Compradora");
    await cerrarSesion(page);

    await page.goto(`/producto/${listingId}`);
    await page.getByRole("button", { name: "Escribirle al vendedor" }).click();
    await expect(page).toHaveURL(/\/ingresar\?/);

    await page.getByLabel("Correo").fill(email);
    await page.getByLabel("Contraseña").fill("unaClaveLarga1");
    await page.getByRole("button", { name: "Iniciar sesión" }).click();

    await expect(page).toHaveURL(/\/chat\/[0-9a-f-]{36}$/);
    await expect(page.getByRole("main").getByText(titulo)).toBeVisible();

    // La pantalla de entrar no queda detrás: «Volver» salta el formulario usado.
    await volver(page).click();
    await expect(page).toHaveURL(new RegExp(`/producto/${listingId}$`));
  });

  test("crear la cuenta en el camino también termina en la conversación", async ({ browser, page }) => {
    const titulo = `Bicicleta de ruta ${Date.now()}`;
    const { context, listingId } = await sellerWithListing(browser, titulo, 1_200_000, "ropa");
    await context.close();

    await page.goto(`/producto/${listingId}`);
    await page.getByRole("button", { name: "Escribirle al vendedor" }).click();
    await page.getByRole("link", { name: "Crear una" }).click();
    await expect(page).toHaveURL(/\/bienvenida\?volver=/);
    await page.getByRole("link", { name: "Quiero comprar" }).click();
    await expect(page).toHaveURL(/\/registro\?.*volver=/);

    const { email, phoneDigits } = uniqueAccount("nueva");
    await page.getByLabel("Nombre").fill("Sofía Nueva");
    await page.getByLabel("Correo").fill(email);
    await page.getByLabel("Celular").fill(phoneDigits);
    await page.getByLabel("Contraseña").fill("unaClaveLarga1");
    await page.getByLabel("Fecha de nacimiento").fill("1995-05-20");
    await aceptarTerminos(page);
    await page.getByRole("button", { name: "Continuar" }).click();
    await expect(page).toHaveURL(/\/verificar\?.*volver=/);

    await page.getByLabel("Código de seis dígitos").fill(await codigoDe(phoneDigits));
    await page.getByRole("button", { name: "Confirmar celular" }).click();

    await expect(page).toHaveURL(/\/chat\/[0-9a-f-]{36}$/);
    await expect(page.getByRole("main").getByText(titulo)).toBeVisible();
  });

  test("un volver hacia otro sitio se ignora", async ({ page }) => {
    await page.goto("/ingresar?volver=//ejemplo.com");
    await expect(page.getByRole("link", { name: "Crear una" })).toHaveAttribute(
      "href",
      "/bienvenida",
    );
    await page.goto("/ingresar?volver=/%5Cejemplo.com");
    await expect(page.getByRole("link", { name: "Crear una" })).toHaveAttribute(
      "href",
      "/bienvenida",
    );
  });
});

test.describe("a dónde lleva Volver", () => {
  test("a la pantalla de la que se vino, con sus filtros", async ({ browser, page }) => {
    const titulo = `Termo acero ${Date.now()}`;
    const { context, listingId } = await sellerWithListing(browser, titulo, 45_000, "ropa");
    await context.close();

    await page.goto(`/buscar?q=${encodeURIComponent(titulo)}`);
    await page.getByRole("link", { name: new RegExp(titulo) }).first().click();
    await expect(page).toHaveURL(new RegExp(`/producto/${listingId}$`));

    await volver(page).click();
    await expect(page).toHaveURL(/\/buscar\?q=/);
    await expect(page.getByRole("link", { name: new RegExp(titulo) }).first()).toBeVisible();
  });

  test("sin recorrido, a la pantalla padre", async ({ page }) => {
    await signUpVerified(page, "padre", "Pedro Padre");
    // Pestaña nueva: nada anotado todavía, como quien llega por un enlace.
    const nueva = await page.context().newPage();
    await nueva.goto("/favoritos");
    await volver(nueva).click();
    await expect(nueva).toHaveURL(/\/$/);
  });
});

test.describe("Volver en todas las pantallas menos la portada", () => {
  test("sin cuenta", async ({ page }) => {
    await page.goto("/");
    await expect(volver(page)).toHaveCount(0);
    for (const ruta of ["/ingresar", "/bienvenida", "/registro", "/recuperar", "/buscar"]) {
      await page.goto(ruta);
      await expect(volver(page), ruta).toBeVisible();
    }
  });

  test("con cuenta", async ({ browser, page }) => {
    const titulo = `Radio antiguo ${Date.now()}`;
    const { context, listingId } = await sellerWithListing(browser, titulo, 150_000, "ropa");
    await context.close();

    await signUpVerified(page, "recorre", "Rocío Recorre");
    await page.goto(`/producto/${listingId}`);
    await page.getByRole("button", { name: "Escribirle al vendedor" }).click();
    await expect(page).toHaveURL(/\/chat\/[0-9a-f-]{36}$/);
    const chat = new URL(page.url()).pathname;

    for (const ruta of [
      chat,
      "/chats",
      "/cuenta",
      "/favoritos",
      "/avisos",
      "/actividad",
      "/carrito",
      "/vender",
      "/tienda",
      `/producto/${listingId}`,
    ]) {
      await page.goto(ruta);
      await expect(volver(page), ruta).toBeVisible();
    }
  });
});

// Hallazgos de Luna sobre la fila 1 (2026-09-22).
test.describe("conversaciones sobre artículos que ya no se venden", () => {
  test("no se abre una conversación nueva sobre un artículo retirado", async ({ browser, page }) => {
    const titulo = `Coche de bebé ${Date.now()}`;
    const { context, listingId } = await sellerWithListing(browser, titulo, 260_000, "ninos");
    await context.close();
    await withDb((c) => c.query(`update listings set status = 'retirada' where id = $1`, [listingId]));

    await signUpVerified(page, "retirado", "Rita Retirado");
    await page.goto(`/chat/abrir/${listingId}`);
    await expect(page).not.toHaveURL(/\/chat\//);
    const abiertas = await withDb(async (c) => {
      const { rows } = await c.query(`select 1 from conversations where listing_id = $1`, [listingId]);
      return rows.length;
    });
    expect(abiertas).toBe(0);
  });

  test("la que ya existía se sigue abriendo, pero sin ofertar", async ({ browser, page }) => {
    const titulo = `Cuna de madera ${Date.now()}`;
    const { context, listingId } = await sellerWithListing(browser, titulo, 400_000, "ninos");
    await context.close();

    await signUpVerified(page, "previa", "Paula Previa");
    await page.goto(`/producto/${listingId}`);
    await page.getByRole("button", { name: "Escribirle al vendedor" }).click();
    await expect(page).toHaveURL(/\/chat\/[0-9a-f-]{36}$/);
    const chat = page.url();
    await expect(page.getByRole("link", { name: "Hacer una oferta" })).toBeVisible();

    await withDb((c) => c.query(`update listings set status = 'vendida' where id = $1`, [listingId]));
    await page.goto(`/chat/abrir/${listingId}`);
    await expect(page).toHaveURL(chat);
    await expect(page.getByRole("main").getByText(titulo)).toBeVisible();
    await expect(page.getByRole("link", { name: "Hacer una oferta" })).toHaveCount(0);
  });
});

test.describe("Volver también en las pantallas de error", () => {
  test("no encontrado", async ({ page }) => {
    await page.goto("/producto/00000000-0000-0000-0000-000000000000");
    await expect(page.getByRole("heading", { name: "No pudimos abrir esto" })).toBeVisible();
    await expect(volver(page)).toBeVisible();
  });

  test("editar una publicación ajena", async ({ browser, page }) => {
    const titulo = `Chaqueta de cuero ${Date.now()}`;
    const { context, listingId } = await sellerWithListing(browser, titulo, 180_000, "ropa");
    await context.close();

    await signUpVerified(page, "ajena", "Ana Ajena");
    await page.goto(`/producto/${listingId}/editar`);
    await expect(page.getByRole("heading", { name: "Esta publicación no es tuya" })).toBeVisible();
    await expect(volver(page)).toBeVisible();
  });
});

test("en el chat de un artículo retirado, la tarjeta no lleva a una ficha que ya no existe", async ({ browser, page }) => {
  const titulo = `Morral escolar ${Date.now()}`;
  const { context, listingId } = await sellerWithListing(browser, titulo, 70_000, "ninos");
  await context.close();

  await signUpVerified(page, "morral", "Mario Morral");
  await page.goto(`/producto/${listingId}`);
  await page.getByRole("button", { name: "Escribirle al vendedor" }).click();
  await expect(page).toHaveURL(/\/chat\/[0-9a-f-]{36}$/);
  await expect(page.getByRole("main").getByRole("link", { name: new RegExp(titulo) })).toBeVisible();

  await withDb((c) => c.query(`update listings set status = 'retirada' where id = $1`, [listingId]));
  await page.reload();
  await expect(page.getByRole("main").getByText(titulo)).toBeVisible();
  await expect(page.getByText("Ya no está publicado")).toBeVisible();
  await expect(page.getByRole("main").getByRole("link", { name: new RegExp(titulo) })).toHaveCount(0);
});

test("el vendedor sí llega a la ficha de su artículo retirado desde el chat", async ({ browser, page }) => {
  const titulo = `Patineta ${Date.now()}`;
  const vendedor = await sellerWithListing(browser, titulo, 110_000, "ninos");

  await signUpVerified(page, "patina", "Paco Patina");
  await page.goto(`/producto/${vendedor.listingId}`);
  await page.getByRole("button", { name: "Escribirle al vendedor" }).click();
  await expect(page).toHaveURL(/\/chat\/[0-9a-f-]{36}$/);
  const chat = new URL(page.url()).pathname;

  await withDb((c) =>
    c.query(`update listings set status = 'retirada' where id = $1`, [vendedor.listingId]),
  );
  await vendedor.page.goto(chat);
  const tarjeta = vendedor.page.getByRole("main").getByRole("link", { name: new RegExp(titulo) });
  await expect(tarjeta).toHaveAttribute("href", `/producto/${vendedor.listingId}`);
  await expect(vendedor.page.getByText("Ya no está publicado")).toHaveCount(0);
  await vendedor.context.close();
});

// Corrección 18 (Catalina): «desde Ventas y Conversaciones, como vendedor, al darle
// clic a un producto cancelado y devolverte, te manda a Home». Lo arregló el
// recorrido de la corrección 1 (D-99); esto fija el camino exacto que ella siguió.
test("desde un pedido cancelado, Volver regresa a la actividad y no a la portada", async ({ browser, page }) => {
  const titulo = `Lámpara de pie ${Date.now()}`;
  const vendedor = await sellerWithListing(browser, titulo, 95_000, "ropa");

  await signUpVerified(page, "cancela", "Carla Cancela");
  await page.goto(`/comprar/${vendedor.listingId}`);
  await page.getByLabel("Quién recibe").fill("Carla Torres");
  await page.getByLabel("Celular de quien recibe").fill("300 412 88 05");
  await page.getByLabel("Dirección").fill("Calle 72 #10-34");
  await page.getByLabel("Zona").selectOption("Chapinero");
  await page.getByRole("button", { name: "Ir a pagar" }).click();
  await expect(page).toHaveURL(/\/dev\/pago\//);
  const pedido = new URL(page.url()).pathname.split("/").pop()!;
  await withDb((c) => c.query(`update orders set status = 'cancelado' where id = $1`, [pedido]));

  // Quien vende: Ventas → el pedido cancelado → Volver.
  await vendedor.page.goto("/");
  await vendedor.page.goto("/actividad");
  await vendedor.page.getByRole("link", { name: new RegExp(titulo) }).click();
  await expect(vendedor.page).toHaveURL(new RegExp(`/pedido/${pedido}$`));
  await expect(vendedor.page.getByRole("main")).toContainText("Cancelado");
  await volver(vendedor.page).click();
  await expect(vendedor.page).toHaveURL(/\/actividad$/);
  // «Volver» retrocede, no suma una entrada: el atrás del navegador sigue hacia
  // la portada en vez de reabrir el pedido (Luna, fila 18).
  await vendedor.page.goBack();
  await expect(vendedor.page).toHaveURL(/:\d+\/$/);

  // Quien compra: Compras → el pedido cancelado → Volver.
  await page.goto("/actividad");
  await page.getByRole("link", { name: new RegExp(titulo) }).click();
  await expect(page).toHaveURL(new RegExp(`/pedido/${pedido}$`));
  await volver(page).click();
  await expect(page).toHaveURL(/\/actividad$/);

  // Y por Conversaciones: la lista → el chat → la ficha → Volver dos veces.
  await page.goto(`/producto/${vendedor.listingId}`);
  await page.getByRole("button", { name: "Escribirle al vendedor" }).click();
  await expect(page).toHaveURL(/\/chat\/[0-9a-f-]{36}$/);
  const chat = new URL(page.url()).pathname;
  await vendedor.page.goto("/chats");
  await vendedor.page.getByRole("link", { name: new RegExp(titulo) }).first().click();
  await expect(vendedor.page).toHaveURL(new RegExp(`${chat}$`));
  await vendedor.page.getByRole("main").getByRole("link", { name: new RegExp(titulo) }).first().click();
  await expect(vendedor.page).toHaveURL(new RegExp(`/producto/${vendedor.listingId}$`));
  await volver(vendedor.page).click();
  await expect(vendedor.page).toHaveURL(new RegExp(`${chat}$`));
  await volver(vendedor.page).click();
  await expect(vendedor.page).toHaveURL(/\/chats$/);

  await vendedor.context.close();
});

test("después de cambiar filtros, Volver y el atrás del navegador no se enredan", async ({ browser, page }) => {
  const titulo = `Florero azul ${Date.now()}`;
  const { context, listingId } = await sellerWithListing(browser, titulo, 52_000, "ropa");
  await context.close();

  // Dos búsquedas seguidas: el historial guarda dos entradas; el recorrido, una.
  await page.goto("/");
  await page.goto(`/buscar?q=${encodeURIComponent("Florero")}`);
  await page.goto(`/buscar?q=${encodeURIComponent(titulo)}`);
  await page.getByRole("link", { name: new RegExp(titulo) }).first().click();
  await expect(page).toHaveURL(new RegExp(`/producto/${listingId}$`));

  await volver(page).click();
  await expect(page).toHaveURL(/\/buscar\?q=Florero(\+|%20)azul(\+|%20)\d+$/);
  // Desde la búsqueda, Volver va a la portada aunque en el historial quede la
  // búsqueda anterior en medio.
  await volver(page).click();
  await expect(page).toHaveURL(/:\d+\/$/);
});
