import { test, expect } from "@playwright/test";
import { sellerWithListing, signUpVerified, withDb } from "./helpers";

// Versión 3 de las correcciones de Catalina (D-129), lado de quien vende:
// 62 registro, 63 tipo de vendedor, 64-65 teléfono de contacto, 66 verificación
// simulada, 68 la comisión al publicar.

test("el registro ya no explica qué pasa sin celular confirmado (fila 62)", async ({ page }) => {
  await page.goto("/registro?rol=vendedor");
  await expect(page.getByLabel("Celular")).toBeVisible();
  await expect(page.getByText("Te mandamos un código para confirmarlo.", { exact: true })).toBeVisible();
  await expect(page.getByText("Sin celular confirmado no puedes comprar ni escribirle a nadie")).toHaveCount(0);
});

test("elegir cómo vender no dice «cambalache» (fila 63)", async ({ page }) => {
  await signUpVerified(page, "vendedor", "Persona Vendedora");
  await page.goto("/vender");
  await expect(page.getByRole("link", { name: /Como empresa/ })).toBeVisible();
  await expect(page.getByRole("main")).not.toContainText(/cambalache/i);
  await page.goto("/vender?tipo=juridica");
  await expect(page.getByLabel("Razón social")).not.toHaveAttribute("placeholder", /cambalache/i);
});

test("verificarse no pide otro teléfono: se usa el celular confirmado (filas 64 y 65)", async ({ page }) => {
  const { email } = await signUpVerified(page, "vendedor", "Persona Vendedora");
  await page.goto("/vender?tipo=natural");
  await expect(page.getByLabel("Dirección de notificaciones")).toBeVisible();
  await expect(page.getByLabel("Teléfono de contacto")).toHaveCount(0);
  await expect(page.getByRole("main")).not.toContainText("Tampoco se muestra");
  await page.getByLabel("Dirección de notificaciones").fill("Calle 72 # 10-34");
  await page.getByLabel(/Autorizo que el proveedor/).check();
  await page.getByRole("button", { name: "Empezar verificación" }).click();
  await expect(page).toHaveURL(/\/dev\/kyc\//);

  const [fila] = await withDb(async (c) =>
    (
      await c.query(
        `select v.telefono, u."phoneNumber" as celular from vendedores v join "user" u on u.id = v.user_id where u.email = $1`,
        [email],
      )
    ).rows,
  );
  expect(fila.telefono).toBe(fila.celular);
});

test("la verificación simulada no muestra la referencia y dice que es una simulación (fila 66)", async ({ page }) => {
  await signUpVerified(page, "vendedor", "Persona Vendedora");
  await page.goto("/vender?tipo=natural");
  await page.getByLabel("Dirección de notificaciones").fill("Calle 72 # 10-34");
  await page.getByLabel(/Autorizo que el proveedor/).check();
  await page.getByRole("button", { name: "Empezar verificación" }).click();
  await expect(page).toHaveURL(/\/dev\/kyc\//);
  await expect(page.getByRole("main")).not.toContainText("Referencia");
  await expect(page.getByRole("main")).not.toContainText(/ref_[0-9a-f]/);
  await expect(page.getByRole("main")).toContainText("Esta pantalla es una simulación");

  // Y el estado «Estamos revisando» tampoco la muestra.
  await page.goto("/vender");
  await expect(page.getByRole("heading", { name: "Estamos revisando" })).toBeVisible();
  await expect(page.getByRole("main")).not.toContainText("Referencia");
});

test("al poner el precio, el texto dice la regla de la comisión (fila 68)", async ({ browser }) => {
  const seller = await sellerWithListing(browser, `Comision ${Date.now()}`, 20_000, "ropa");
  const page = seller.page;
  await page.goto("/publicar");
  const precio = page.getByLabel("Precio");
  await precio.fill("20000");
  await expect(page.getByTestId("te-llegan")).toHaveText(
    "Comisión de 2venta: $ 2.500 (5 % del precio, mínimo $ 2.500). Te llegan $ 17.500. Quien compra paga $ 20.000 más el envío.",
  );
  await precio.fill("200000");
  await expect(page.getByTestId("te-llegan")).toHaveText(
    "Comisión de 2venta: $ 10.000 (5 % del precio, mínimo $ 2.500). Te llegan $ 190.000. Quien compra paga $ 200.000 más el envío.",
  );
  // En la ficha de quien vende, la misma regla.
  await page.goto(`/producto/${seller.listingId}`);
  await expect(page.getByRole("main")).toContainText("5 % del precio, mínimo $ 2.500");
  await seller.context.close();
});
