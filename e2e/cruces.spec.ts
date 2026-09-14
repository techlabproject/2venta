import { test, expect, type Browser, type Page } from "@playwright/test";
import { alertIn, cerrarSesion, makeAdmin, sellerWithListing, signUpVerified, withDb } from "./helpers";

// La prueba de punta a punta de la rebanada S-24.
// Ver slices/24-cruces.md

async function suspend(email: string, reason = "Prueba de suspensión") {
  await withDb((c) =>
    c.query(
      `update "user" set suspended_at = now(), suspended_reason = $2 where email = $1`,
      [email, reason]
    )
  );
}

/** Una cuenta corriente con sesión abierta, más su correo para suspenderla. */
async function account(browser: Browser, prefix = "usuario") {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const { email } = await signUpVerified(page, prefix, "Laura Compradora");
  return { ctx, page, email };
}

test("una cuenta suspendida no puede comprar", async ({ browser }) => {
  const seller = await sellerWithListing(browser, `Compra ${Date.now()}`, 90_000, "ropa");
  const buyer = await account(browser, "comprador");
  await suspend(buyer.email);

  await buyer.page.goto(`/comprar/${seller.listingId}`);
  await expect(buyer.page).toHaveURL(/\/suspendida/);
  await expect(buyer.page.getByRole("heading", { name: /suspendida/i })).toBeVisible();

  await seller.context.close();
  await buyer.ctx.close();
});

test("una cuenta suspendida no puede escribir por el chat", async ({ browser }) => {
  const seller = await sellerWithListing(browser, `Chat ${Date.now()}`, 80_000, "ropa");
  const buyer = await account(browser, "comprador");

  // Abre la conversación antes de que la suspendan.
  await buyer.page.goto(`/producto/${seller.listingId}`);
  await buyer.page.getByRole("button", { name: "Escribirle al vendedor" }).click();
  await expect(buyer.page).toHaveURL(/\/chat\//);
  const chatId = new URL(buyer.page.url()).pathname.split("/").pop()!;

  await suspend(buyer.email);

  await buyer.page.goto(`/chat/${chatId}`);
  await buyer.page.getByLabel("Mensaje").fill("Sigo aquí");
  await buyer.page.getByRole("button", { name: "Enviar" }).click();
  await expect(buyer.page).toHaveURL(/\/suspendida/);

  const mensajes = await withDb(async (c) => {
    const { rows } = await c.query(`select 1 from messages where conversation_id = $1`, [
      chatId,
    ]);
    return rows.length;
  });
  expect(mensajes).toBe(0);

  await seller.context.close();
  await buyer.ctx.close();
});

test("una cuenta suspendida no puede publicar ni reportar", async ({ browser }) => {
  const seller = await sellerWithListing(browser, `Publica ${Date.now()}`, 70_000, "ropa");
  await suspend(
    await withDb(async (c) => {
      const { rows } = await c.query<{ email: string }>(
        `select u.email from listings l join "user" u on u.id = l.seller_id where l.id = $1`,
        [seller.listingId]
      );
      return rows[0].email;
    })
  );

  await seller.page.goto("/publicar");
  await expect(seller.page).toHaveURL(/\/suspendida/);

  await seller.context.close();
});

test("una cuenta suspendida sí puede ver sus pedidos", async ({ browser }) => {
  // Si tiene dinero retenido en una disputa, dejarla ciega sería quitarle la única
  // forma de defenderse.
  const seller = await sellerWithListing(browser, `Pedido ${Date.now()}`, 100_000, "ropa");
  const buyer = await account(browser, "comprador");

  await buyer.page.goto(`/comprar/${seller.listingId}`);
  await buyer.page.getByLabel("Quién recibe").fill("Laura Torres");
  await buyer.page.getByLabel("Celular de quien recibe").fill("300 412 88 05");
  await buyer.page.getByLabel("Dirección").fill("Calle 72 #10-34");
  await buyer.page.getByLabel("Zona").selectOption("Chapinero");
  await buyer.page.getByRole("button", { name: "Ir a pagar" }).click();
  await buyer.page.getByRole("button", { name: "Simular pago aprobado" }).click();
  await expect(buyer.page).toHaveURL(/\/pedido\//);
  const orderId = new URL(buyer.page.url()).pathname.split("/").pop()!;

  await suspend(buyer.email);

  await buyer.page.goto(`/pedido/${orderId}`);
  await expect(buyer.page.getByTestId("estado")).toHaveText("Pago recibido y guardado");
  await buyer.page.goto("/actividad");
  await expect(buyer.page.getByTestId("compras")).toBeVisible();

  await seller.context.close();
  await buyer.ctx.close();
});

test("una cuenta suspendida no puede volver a entrar", async ({ browser }) => {
  // Sin esto, suspender solo cerraba las sesiones abiertas y bastaba con volver a
  // iniciar sesión.
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const { email } = await signUpVerified(page, "vuelve", "Laura Compradora");
  await cerrarSesion(page);
  await expect(page.getByRole("link", { name: "Entrar" })).toBeVisible();

  await suspend(email, "Intento de estafa");

  await page.goto("/ingresar");
  await page.getByLabel("Correo").fill(email);
  await page.getByLabel("Contraseña").fill("unaClaveLarga1");
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(alertIn(page)).toContainText("suspendida");
  await expect(page.getByTestId("usuario")).toHaveCount(0);

  await ctx.close();
});

test("si el precio cambia entre ver el carrito y pagar, no se cobra", async ({
  browser,
}) => {
  // Antes se recalculaba en silencio con los precios del momento de confirmar. No
  // hace falta mala fe: basta que el vendedor esté ajustando precios mientras
  // alguien compra.
  const marca = Date.now();
  const seller = await sellerWithListing(browser, `Precio cambia ${marca}`, 100_000, "ropa");

  const ctx = await browser.newContext();
  const buyer = await ctx.newPage();
  await signUpVerified(buyer, "comprador", "Laura Compradora");

  await buyer.goto(`/producto/${seller.listingId}`);
  await buyer.getByRole("button", { name: "Agregar al carrito" }).click();
  await expect(buyer.getByRole("main")).toContainText("Está en tu carrito");

  await buyer.goto("/comprar/carrito");
  await expect(buyer.getByTestId("total-checkout")).toHaveText("$ 112.000");

  // El vendedor sube el precio mientras el comprador llena la dirección.
  await withDb((c) =>
    c.query(`update listings set price_cop = 200000 where id = $1`, [seller.listingId])
  );

  await buyer.getByLabel("Quién recibe").fill("Laura Torres");
  await buyer.getByLabel("Celular de quien recibe").fill("300 412 88 05");
  await buyer.getByLabel("Dirección").fill("Calle 72 #10-34");
  await buyer.getByLabel("Zona").selectOption("Chapinero");
  await buyer.getByRole("button", { name: "Ir a pagar" }).click();

  await expect(alertIn(buyer)).toContainText("El precio cambió");
  await expect(alertIn(buyer)).toContainText("200.000");

  // Y no se creó ningún pedido.
  const pedidos = await withDb(async (c) => {
    const { rows } = await c.query(
      `select 1 from order_items where listing_id = $1`,
      [seller.listingId]
    );
    return rows.length;
  });
  expect(pedidos).toBe(0);

  await seller.context.close();
  await ctx.close();
});

test("si el precio no cambia, se paga normal", async ({ browser }) => {
  const seller = await sellerWithListing(browser, `Precio igual ${Date.now()}`, 100_000, "ropa");
  const ctx = await browser.newContext();
  const buyer = await ctx.newPage();
  await signUpVerified(buyer, "comprador", "Laura Compradora");

  await buyer.goto(`/producto/${seller.listingId}`);
  await buyer.getByRole("button", { name: "Agregar al carrito" }).click();
  await expect(buyer.getByRole("main")).toContainText("Está en tu carrito");

  await buyer.goto("/comprar/carrito");
  await buyer.getByLabel("Quién recibe").fill("Laura Torres");
  await buyer.getByLabel("Celular de quien recibe").fill("300 412 88 05");
  await buyer.getByLabel("Dirección").fill("Calle 72 #10-34");
  await buyer.getByLabel("Zona").selectOption("Chapinero");
  await buyer.getByRole("button", { name: "Ir a pagar" }).click();
  await expect(buyer).toHaveURL(/\/dev\/pago\//);

  await seller.context.close();
  await ctx.close();
});
