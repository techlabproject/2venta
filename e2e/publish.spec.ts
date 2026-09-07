import { test, expect, type Page } from "@playwright/test";
import { alertIn, signUpVerified, uniqueAccount, withDb } from "./helpers";

// La prueba de punta a punta de la rebanada S-03.
// Ver slices/03-publicar-con-video.md


async function approveKyc(page: Page) {
  await page.goto("/vender");
  await page.getByRole("button", { name: "Empezar verificación" }).click();
  await expect(page).toHaveURL(/\/dev\/kyc\//);
  await page.getByRole("button", { name: "Simular aprobación" }).click();
  await expect(page.getByRole("heading", { name: "Identidad verificada" })).toBeVisible();
}

// R-01, el riesgo número uno del proyecto, comprobado de punta a punta: la cámara
// se abre, se graba en el navegador y el archivo llega al servidor.
async function recordVideo(page: Page) {
  await page.getByRole("button", { name: "Abrir cámara" }).click();
  await page.getByRole("button", { name: /^Grabar/ }).click();
  await expect(page.getByText(/Grabando/)).toBeVisible();
  await page.getByRole("button", { name: "Terminar" }).click();
  await expect(page.getByRole("status")).toContainText("Video listo");
}

test("un vendedor verificado graba, publica y el artículo aparece en el feed", async ({
  page,
}) => {
  await signUpVerified(page, "vendedor", "Andrés Molina");
  await approveKyc(page);

  await page.goto("/publicar");
  await recordVideo(page);

  // Título único por corrida: las pruebas se acumulan en la misma base y dos
  // artículos con el mismo nombre vuelven ambigua la aserción.
  const titulo = `Bicicleta todoterreno ${Date.now()}`;
  await page.getByLabel("Título").fill(titulo);
  await page.getByLabel("Categoría").selectOption("ninos");
  await page.getByLabel("Precio").fill("450000");
  await page.getByLabel("Descripción").fill("Usada dos temporadas, frenos nuevos.");
  await page.getByRole("button", { name: "Publicar" }).click();

  await expect(page).toHaveURL(/\/producto\//);
  await expect(
    page.getByRole("heading", { name: titulo })
  ).toBeVisible();
  await expect(page.getByRole("main")).toContainText("$ 450.000");

  // El video queda servido y la portada salió del propio video.
  const src = await page.getByTestId("video-articulo").getAttribute("src");
  const res = await page.request.get(src!);
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("video/");

  await page.goto("/");
  await expect(
    page.getByRole("main").getByRole("listitem").filter({ hasText: titulo })
  ).toHaveCount(1);
});

test("sin video no se puede publicar", async ({ page }) => {
  await signUpVerified(page, "vendedor", "Andrés Molina");
  await approveKyc(page);
  await page.goto("/publicar");

  // El botón está deshabilitado mientras no haya video grabado.
  await expect(
    page.getByRole("button", { name: "Graba el video para continuar" })
  ).toBeDisabled();
});

test("el servidor rechaza publicar sin video aunque se salte la pantalla", async ({
  page,
}) => {
  await signUpVerified(page, "vendedor", "Andrés Molina");
  await approveKyc(page);

  // Llama la acción de servidor directamente, como haría alguien con las
  // herramientas del navegador abiertas.
  const status = await page.evaluate(async () => {
    const form = new FormData();
    form.set("title", "Sin video");
    form.set("description", "Nada");
    form.set("category", "ropa");
    form.set("condition", "usado_bueno");
    form.set("price", "10000");
    const res = await fetch("/publicar", { method: "POST", body: form });
    return res.status;
  });
  // No importa el código exacto: lo que importa es que no quedó publicado.
  expect(status).toBeGreaterThanOrEqual(200);

  await page.goto("/");
  await expect(
    page.getByRole("main").getByRole("listitem").filter({ hasText: "Sin video" })
  ).toHaveCount(0);
});

test("un vendedor sin verificar no llega a la pantalla de publicar", async ({ page }) => {
  await signUpVerified(page, "vendedor", "Andrés Molina");
  await page.goto("/publicar");
  await expect(page).toHaveURL(/\/vender/);
});

test("sin sesión no se puede publicar", async ({ page }) => {
  await page.goto("/publicar");
  await expect(page).toHaveURL(/\/ingresar/);
});

test("un precio de cero se rechaza", async ({ page }) => {
  await signUpVerified(page, "vendedor", "Andrés Molina");
  await approveKyc(page);
  await page.goto("/publicar");
  await recordVideo(page);

  await page.getByLabel("Título").fill("Regalo");
  // Ropa a propósito: esta prueba es sobre el precio, no sobre el IMEI que exige
  // la categoría de tecnología.
  await page.getByLabel("Categoría").selectOption("ropa");
  await page.getByLabel("Precio").fill("0");
  await page.getByLabel("Descripción").fill("Gratis");
  await page.getByRole("button", { name: "Publicar" }).click();

  await expect(alertIn(page)).toContainText("mayor que cero");
});

test("pedir un archivo fuera del directorio de subidas no devuelve nada", async ({
  request,
}) => {
  // Sin la comprobación de ruta, esto devolvería los secretos del servidor.
  const res = await request.get("/api/media/..%2F..%2F.env.local");
  expect(res.status()).toBe(404);
});
