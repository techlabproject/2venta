import { test, expect, type Page } from "@playwright/test";
import { createHmac } from "node:crypto";
import { alertIn, signUpVerified, uniqueAccount, withDb } from "./helpers";

// La prueba de punta a punta de la rebanada S-02.
// Ver slices/02-modo-vendedor-verificacion.md


// Crea una cuenta con celular ya confirmado y deja la sesión abierta.
test("activar modo vendedor deja la verificación en curso y lo dice en pantalla", async ({
  page,
}) => {
  await signUpVerified(page, "vendedor", "Andrés Molina");
  await page.goto("/vender");
  await page.getByRole("button", { name: "Empezar verificación" }).click();

  // El proveedor de prueba ocupa el lugar del real mientras R-02 no tenga respuesta.
  await expect(page).toHaveURL(/\/dev\/kyc\//);
  await page.goto("/vender");
  await expect(page.getByRole("heading", { name: "Estamos revisando" })).toBeVisible();
});

test("cuando el proveedor aprueba, el perfil muestra el distintivo", async ({ page }) => {
  await signUpVerified(page, "vendedor", "Andrés Molina");
  await page.goto("/vender");
  await page.getByRole("button", { name: "Empezar verificación" }).click();
  await page.getByRole("button", { name: "Simular aprobación" }).click();

  await expect(
    page.getByRole("heading", { name: "Identidad verificada" })
  ).toBeVisible();
});

test("un rechazo muestra el motivo y deja reintentar", async ({ page }) => {
  await signUpVerified(page, "vendedor", "Andrés Molina");
  await page.goto("/vender");
  await page.getByRole("button", { name: "Empezar verificación" }).click();
  await page.getByRole("button", { name: "Simular rechazo" }).click();

  await expect(alertIn(page)).toContainText("borrosa");
  await expect(page.getByRole("button", { name: "Volver a intentar" })).toBeVisible();
});

test("el distintivo aparece en el catálogo solo del vendedor verificado", async ({
  page,
}) => {
  await page.goto("/");
  const cards = page.getByRole("main").getByRole("listitem");

  // Camila está verificada en los datos de prueba; el taller no.
  await expect(cards.filter({ hasText: "iPhone 13 128 GB" })).toContainText("Verificado");
  await expect(
    cards.filter({ hasText: "Chaqueta de jean talla M" })
  ).not.toContainText("Verificado");
});

test("el perfil público muestra alias y zona, y nada de datos personales", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("main")
    .getByRole("listitem")
    .filter({ hasText: "iPhone 13 128 GB" })
    .getByRole("link")
    .click();
  await page.getByRole("link", { name: "Camila R." }).click();

  await expect(page.getByRole("heading", { name: "Camila R." })).toBeVisible();
  await expect(page.getByRole("main")).toContainText("Identidad verificada");
  await expect(page.getByRole("main")).toContainText("Chapinero");

  // D-04: nada de esto puede aparecer nunca en una pantalla pública.
  const body = await page.getByRole("main").innerText();
  expect(body).not.toContain("Camila Rodríguez");
  expect(body).not.toContain("camila@ejemplo.co");
  expect(body).not.toContain("+57300");
});

test("un webhook con firma inválida no cambia nada", async ({ page, request }) => {
  await signUpVerified(page, "vendedor", "Andrés Molina");
  await page.goto("/vender");
  await page.getByRole("button", { name: "Empezar verificación" }).click();
  // Sin esperar a que la navegación termine, la URL todavía es /vender y la
  // referencia sale mal.
  await expect(page).toHaveURL(/\/dev\/kyc\//);
  const reference = new URL(page.url()).pathname.split("/").pop()!;

  const res = await request.post("/api/kyc/webhook", {
    headers: { "x-kyc-signature": "firma-inventada" },
    data: { reference, status: "aprobado" },
  });
  expect(res.status()).toBe(401);

  await page.goto("/vender");
  await expect(page.getByRole("heading", { name: "Estamos revisando" })).toBeVisible();
});

test("un webhook sin firma tampoco pasa", async ({ request }) => {
  const res = await request.post("/api/kyc/webhook", {
    data: { reference: "ref-cualquiera", status: "aprobado" },
  });
  expect(res.status()).toBe(401);
});

test("un webhook repetido no revierte ni duplica el estado", async ({ page, request }) => {
  await signUpVerified(page, "vendedor", "Andrés Molina");
  await page.goto("/vender");
  await page.getByRole("button", { name: "Empezar verificación" }).click();
  // Sin esperar a que la navegación termine, la URL todavía es /vender y la
  // referencia sale mal.
  await expect(page).toHaveURL(/\/dev\/kyc\//);
  const reference = new URL(page.url()).pathname.split("/").pop()!;

  const payload = JSON.stringify({ reference, status: "aprobado", reason: null });
  const signature = createHmac("sha256", process.env.KYC_WEBHOOK_SECRET!)
    .update(payload)
    .digest("hex");

  for (let i = 0; i < 3; i++) {
    const res = await request.post("/api/kyc/webhook", {
      headers: { "content-type": "application/json", "x-kyc-signature": signature },
      data: JSON.parse(payload),
    });
    expect(res.status()).toBe(200);
  }

  await page.goto("/vender");
  await expect(page.getByRole("heading", { name: "Identidad verificada" })).toBeVisible();
});

test("un webhook para una referencia desconocida no crea nada", async ({ request }) => {
  const payload = JSON.stringify({ reference: "ref-que-no-existe", status: "aprobado" });
  const signature = createHmac("sha256", process.env.KYC_WEBHOOK_SECRET!)
    .update(payload)
    .digest("hex");

  const res = await request.post("/api/kyc/webhook", {
    headers: { "content-type": "application/json", "x-kyc-signature": signature },
    data: JSON.parse(payload),
  });
  expect(res.status()).toBe(404);
});

test("sin sesión no se puede iniciar una verificación", async ({ page }) => {
  await page.goto("/vender");
  await expect(page).toHaveURL(/\/ingresar/);
});
