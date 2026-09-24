import { test, expect, type Page } from "@playwright/test";
import { freshNit, sellerWithListing, signUpVerified, withDb } from "./helpers";

// Corrección 17 (2026-09-24): quien vende como persona natural compra con la misma
// cuenta (D-03); una cuenta de empresa vende, pero no compra. Lo impide el
// servidor en cada camino de compra, no solo la ficha que esconde los botones.

const AVISO =
  "Esta es una cuenta de empresa: en 2venta las empresas venden, pero no compran. Si quieres comprar algo, hazlo desde una cuenta personal, con otro celular.";
const PDF = Buffer.from("%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n", "latin1");

async function hacerEmpresa(email: string) {
  await withDb((c) =>
    c.query(
      `insert into vendedores (user_id, tipo, direccion_notificaciones, telefono)
       select id, 'juridica', 'Calle 72 # 10-34', '3004128805' from "user" where email = $1
       on conflict (user_id) do update set tipo = 'juridica'`,
      [email],
    ),
  );
}

async function nuevaCuenta(page: Page) {
  return signUpVerified(page, "empresa", "Camila Vendedora");
}

test("una empresa ve el aviso en la ficha, sin botones de compra ni carrito", async ({ browser }) => {
  const seller = await sellerWithListing(browser, `Lámpara ${Date.now()}`, 90_000, "ropa");
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await nuevaCuenta(page);

  // Por el camino real: elige «Como empresa» en /vender.
  await page.goto("/vender?tipo=juridica");
  await page.getByLabel("Razón social").fill("Compras Prohibidas S.A.S.");
  await page.getByLabel("NIT").fill(freshNit());
  await page.getByLabel("Nombre del representante legal").fill("Camila Vendedora");
  await page.getByLabel("Cédula del representante legal").fill("52123456");
  await page.getByLabel("RUT de la empresa (PDF)").setInputFiles({
    name: "rut.pdf",
    mimeType: "application/pdf",
    buffer: PDF,
  });
  await page.getByLabel("Dirección de notificaciones").fill("Calle 72 # 10-34");
  await page.getByLabel(/Autorizo que el proveedor/).check();
  await page.getByRole("button", { name: "Empezar verificación" }).click();
  await expect(page).toHaveURL(/\/dev\/kyc\//);

  await page.goto(`/producto/${seller.listingId}`);
  await expect(page.getByTestId("empresa-no-compra")).toHaveText(AVISO);
  await expect(page.getByRole("link", { name: "Comprar con pago protegido" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Agregar al carrito" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Escribirle al vendedor" })).toHaveCount(0);

  // El menú no tiene carrito y su actividad son ventas.
  // Por `href`: los del menú desplegable están dentro de un <details> cerrado.
  await expect(page.locator('header a[href="/carrito"]')).toHaveCount(0);
  await expect(page.locator('header a[href="/actividad"]').first()).toHaveText("Tus ventas");

  // Llegar al pago escribiendo la dirección tampoco sirve.
  await page.goto(`/comprar/${seller.listingId}`);
  await expect(page).toHaveURL(new RegExp(`/producto/${seller.listingId}$`));
  await page.goto(`/chat/abrir/${seller.listingId}`);
  await expect(page).toHaveURL(new RegExp(`/producto/${seller.listingId}$`));

  await seller.context.close();
  await ctx.close();
});

test("el servidor se niega a cobrarle, agregarle al carrito o abrirle un chat a una empresa", async ({
  browser,
}) => {
  // La pantalla se abrió cuando la cuenta todavía no era empresa: lo que la
  // detiene es la acción del servidor, no el botón que falta.
  const seller = await sellerWithListing(browser, `Radio ${Date.now()}`, 120_000, "ropa");
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const { email } = await nuevaCuenta(page);

  await page.goto(`/producto/${seller.listingId}`);
  await hacerEmpresa(email);
  await page.getByRole("button", { name: "Agregar al carrito" }).click();
  // La pestaña vieja no se queda con el aviso al lado de botones que ya no
  // aplican (Luna, fila 17): vuelve a la ficha, que ya no los tiene.
  await expect(page.getByTestId("empresa-no-compra")).toHaveText(AVISO);
  await expect(page.getByRole("button", { name: "Agregar al carrito" })).toHaveCount(0);

  await withDb((c) => c.query(`delete from vendedores where user_id = (select id from "user" where email = $1)`, [email]));
  await page.goto(`/producto/${seller.listingId}`);
  await hacerEmpresa(email);
  await page.getByRole("button", { name: "Escribirle al vendedor" }).click();
  await expect(page.getByTestId("empresa-no-compra")).toHaveText(AVISO);
  await expect(page.getByRole("button", { name: "Escribirle al vendedor" })).toHaveCount(0);
  const chats = await withDb(async (c) => {
    const { rows } = await c.query(
      `select 1 from conversations where buyer_id = (select id from "user" where email = $1)`,
      [email],
    );
    return rows.length;
  });
  expect(chats).toBe(0);

  await withDb((c) => c.query(`delete from vendedores where user_id = (select id from "user" where email = $1)`, [email]));
  await page.goto(`/comprar/${seller.listingId}`);
  await page.getByLabel("Quién recibe").fill("Laura Torres");
  await page.getByLabel("Celular de quien recibe").fill("300 412 88 05");
  await page.getByLabel("Dirección").fill("Calle 72 #10-34");
  await page.getByLabel("Zona").selectOption("Chapinero");
  await hacerEmpresa(email);
  await page.getByRole("button", { name: "Ir a pagar" }).click();
  await expect(page).toHaveURL(new RegExp(`/producto/${seller.listingId}$`));
  await expect(page.getByTestId("empresa-no-compra")).toHaveText(AVISO);
  const pedidos = await withDb(async (c) => {
    const { rows } = await c.query(
      `select 1 from orders where buyer_id = (select id from "user" where email = $1)`,
      [email],
    );
    return rows.length;
  });
  expect(pedidos).toBe(0);

  await seller.context.close();
  await ctx.close();
});

test("lo que quedó en el carrito de antes no se puede pagar", async ({ browser }) => {
  const seller = await sellerWithListing(browser, `Tetera ${Date.now()}`, 70_000, "ropa");
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const { email } = await nuevaCuenta(page);

  await page.goto(`/producto/${seller.listingId}`);
  await page.getByRole("button", { name: "Agregar al carrito" }).click();
  await expect(page.getByText("Está en tu carrito.")).toBeVisible();
  await hacerEmpresa(email);

  await page.goto("/carrito");
  await expect(page.getByTestId("empresa-no-compra")).toContainText(AVISO);
  await expect(page.getByTestId("carrito")).toHaveCount(0);
  await page.goto("/comprar/carrito");
  await expect(page).toHaveURL(/\/carrito$/);

  await seller.context.close();
  await ctx.close();
});

test("una persona natural que vende sigue comprando con la misma cuenta", async ({ browser }) => {
  const seller = await sellerWithListing(browser, `Bufanda ${Date.now()}`, 60_000, "ropa");
  const otro = await sellerWithListing(browser, `Gorro ${Date.now()}`, 50_000, "ropa");

  // `otro` ya vende (persona natural, identidad aprobada) y compra lo de `seller`.
  await otro.page.goto(`/producto/${seller.listingId}`);
  await expect(otro.page.getByRole("link", { name: "Comprar con pago protegido" })).toBeVisible();
  await expect(otro.page.getByTestId("empresa-no-compra")).toHaveCount(0);
  await otro.page.getByRole("link", { name: "Comprar con pago protegido" }).click();
  await expect(otro.page).toHaveURL(/\/comprar\//);

  // Y en su actividad, sin compras todavía, ve sus ventas y no una sección de
  // compras vacía (corrección 17).
  await otro.page.goto("/actividad");
  await expect(otro.page.getByRole("heading", { name: "Ventas" })).toBeVisible();
  await expect(otro.page.getByRole("heading", { name: "Compras" })).toHaveCount(0);
  await expect(otro.page.locator('header a[href="/carrito"]').first()).toBeAttached();
  await expect(otro.page.locator('header a[href="/actividad"]').first()).toHaveText("Compras y ventas");

  await seller.context.close();
  await otro.context.close();
});

test("la empresa conserva el chat que tenía, pero ya no oferta ni paga en él", async ({ browser }) => {
  const seller = await sellerWithListing(browser, `Mesa ${Date.now()}`, 200_000, "ropa");
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const { email } = await nuevaCuenta(page);

  await page.goto(`/producto/${seller.listingId}`);
  await page.getByRole("button", { name: "Escribirle al vendedor" }).click();
  await expect(page).toHaveURL(/\/chat\/[0-9a-f-]+$/);
  const chat = new URL(page.url()).pathname;
  await expect(page.getByRole("link", { name: "Hacer una oferta" })).toBeVisible();

  // Con el panel de oferta abierto de antes (pestaña vieja).
  await page.goto(`${chat}/oferta`);
  await hacerEmpresa(email);
  await page.getByLabel("Cuánto ofreces").fill("150000");
  await page.getByRole("button", { name: "Enviar la oferta" }).click();
  await expect(page).toHaveURL(new RegExp(`${chat}$`));
  await expect(page.getByTestId("empresa-no-compra")).toHaveText(AVISO);
  await expect(page.getByRole("link", { name: "Hacer una oferta" })).toHaveCount(0);
  const ofertas = await withDb(async (c) => {
    const { rows } = await c.query(
      `select 1 from offers where offered_by = (select id from "user" where email = $1)`,
      [email],
    );
    return rows.length;
  });
  expect(ofertas).toBe(0);

  // La conversación sigue: puede escribir.
  await page.getByLabel("Mensaje", { exact: true }).fill("Sigo por aquí");
  await page.getByRole("button", { name: "Enviar", exact: true }).click();
  await expect(page.getByText("Sigo por aquí")).toBeVisible();

  // Y el panel de oferta, pedido a mano, devuelve al chat.
  await page.goto(`${chat}/oferta`);
  await expect(page).toHaveURL(new RegExp(`${chat}$`));

  await seller.context.close();
  await ctx.close();
});
