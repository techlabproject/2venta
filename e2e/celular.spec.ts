import { test, expect } from "@playwright/test";
import { sellerWithListing, signUpVerified, uniqueAccount, aceptarTerminos } from "./helpers";

// Corrección 7 (Catalina, 2026-09-22): el celular admitía letras y no avisaba si
// faltaban dígitos. Ahora «+57» fijo, solo dígitos, máximo diez, agrupados solos,
// revisado al salir del campo; y el servidor tampoco acepta otra cosa.

test("solo entran dígitos, máximo diez, agrupados solos", async ({ page }) => {
  await page.goto("/registro");
  const celular = page.getByLabel("Celular");
  await expect(page.getByText("+57", { exact: true })).toBeVisible();

  await celular.pressSequentially("30a0b4c1288");
  await expect(celular).toHaveValue("300 412 88");
  await celular.pressSequentially("0599999");
  await expect(celular).toHaveValue("300 412 8805");
});

test("pegar con +57 o con signos deja el número limpio", async ({ page }) => {
  await page.goto("/registro");
  const celular = page.getByLabel("Celular");
  await celular.fill("+57 (300) 412-8805");
  await expect(celular).toHaveValue("300 412 8805");
});

test("al salir del campo dice qué falta, y se quita al corregir", async ({ page }) => {
  await page.goto("/registro");
  const celular = page.getByLabel("Celular");
  await celular.fill("30041288");
  await expect(celular).not.toHaveAttribute("aria-invalid", "true");
  await page.getByLabel("Contraseña").click();
  await expect(celular).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByText("Te faltan 2 dígitos: son 10 en total.")).toBeVisible();

  await celular.fill("2004128805");
  await expect(page.getByText("empiezan por 3")).toBeVisible();

  await celular.fill("3004128805");
  await expect(celular).not.toHaveAttribute("aria-invalid", "true");
});

test("un celular incompleto no deja registrarse", async ({ page }) => {
  const { email } = uniqueAccount("incompleto");
  await page.goto("/registro");
  await page.getByLabel("Nombre").fill("Celu Corto");
  await page.getByLabel("Correo").fill(email);
  await page.getByLabel("Celular").fill("300412");
  await page.getByLabel("Contraseña").fill("unaClaveLarga1");
  await page.getByLabel("Fecha de nacimiento").fill("1995-05-20");
  await aceptarTerminos(page);
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page).toHaveURL(/\/registro/);
  await expect(page.getByLabel("Celular")).toBeFocused();
});

test("el servidor no acepta un celular que no sea colombiano", async ({ request }) => {
  const { email } = uniqueAccount("gringo");
  for (const phoneNumber of ["+15551234567", "hola", "+57200123456"]) {
    const res = await request.post("/api/auth/sign-up/email", {
      headers: { Origin: "http://localhost:3100" },
      data: { email, password: "unaClaveLarga1", name: "X", alias: "X", phoneNumber },
    });
    expect(res.status(), phoneNumber).toBe(400);
    expect((await res.json()).code, phoneNumber).toBe("INVALID_PHONE");
  }
});

test("el celular de quien recibe usa el mismo campo y se guarda normalizado", async ({ browser, page }) => {
  const titulo = `Maleta de viaje ${Date.now()}`;
  const { context, listingId } = await sellerWithListing(browser, titulo, 120_000, "ropa");
  await context.close();

  await signUpVerified(page, "recibe", "Rita Recibe");
  await page.goto(`/comprar/${listingId}`);
  const celular = page.getByLabel("Celular de quien recibe");
  await celular.fill("300abc41");
  await expect(celular).toHaveValue("300 41");
  await page.getByLabel("Dirección").click();
  await expect(page.getByText("Te faltan 5 dígitos")).toBeVisible();
});

// Luna, fila 7.
test("borrar hacia atrás justo después de un espacio borra el dígito anterior", async ({ page }) => {
  await page.goto("/registro");
  const celular = page.getByLabel("Celular");
  // Escribir antes de que la página esté lista pierde lo escrito.
  await page.waitForLoadState("networkidle");
  await celular.pressSequentially("3004128805");
  await expect(celular).toHaveValue("300 412 8805");
  // Cursor justo después de «300 ».
  await celular.evaluate((el: HTMLInputElement) => el.setSelectionRange(4, 4));
  await celular.press("Backspace");
  await expect(celular).toHaveValue("304 128 805");
  // Y el cursor queda donde estaba el dígito borrado: seguir escribiendo lo repone.
  await celular.press("0");
  await expect(celular).toHaveValue("300 412 8805");
});

// Luna, filas 7 y 24: Supr justo antes de un espacio no hacía nada.
test("Supr justo antes de un espacio borra el dígito siguiente", async ({ page }) => {
  await page.goto("/registro");
  const celular = page.getByLabel("Celular");
  // Escribir antes de que la página esté lista pierde lo escrito.
  await page.waitForLoadState("networkidle");
  await celular.pressSequentially("3004128805");
  await expect(celular).toHaveValue("300 412 8805");
  // Cursor justo antes del primer espacio: «300| 412 8805».
  await celular.evaluate((el: HTMLInputElement) => el.setSelectionRange(3, 3));
  await celular.press("Delete");
  await expect(celular).toHaveValue("300 128 805");
});
