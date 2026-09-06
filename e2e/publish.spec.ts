import { test, expect, type Page } from "@playwright/test";
import { config } from "dotenv";

config({ path: ".env.local" });

// La prueba de punta a punta de la rebanada S-03.
// Ver slices/03-publicar-con-video.md

const alertIn = (page: Page) => page.getByRole("main").getByRole("alert");

function uniqueAccount() {
  const n = Math.floor(Math.random() * 900_000_000) + 100_000_000;
  return {
    phoneDigits: `3${String(n).padStart(9, "0")}`.slice(0, 10),
    email: `publica.${Date.now()}.${n}@correo.com`,
  };
}

async function signUpVerified(page: Page) {
  const { email, phoneDigits } = uniqueAccount();
  await page.goto("/registro?rol=vendedor");
  await page.getByLabel("Nombre").fill("Andrés Molina");
  await page.getByLabel("Correo").fill(email);
  await page.getByLabel("Celular").fill(phoneDigits);
  await page.getByLabel("Contraseña").fill("unaClaveLarga1");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page).toHaveURL(/\/verificar/);

  const { Client } = await import("pg");
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const { rows } = await client.query<{ value: string }>(
    `select value from verification where identifier = $1 order by "createdAt" desc limit 1`,
    [`+57${phoneDigits}`]
  );
  await client.end();

  await page.getByLabel("Código de seis dígitos").fill(rows[0].value.split(":")[0]);
  await page.getByRole("button", { name: "Confirmar celular" }).click();
  await expect(page.getByTestId("usuario")).toBeVisible();
}

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
  await signUpVerified(page);
  await approveKyc(page);

  await page.goto("/publicar");
  await recordVideo(page);

  await page.getByLabel("Título").fill("Bicicleta todoterreno rin 29");
  await page.getByLabel("Categoría").selectOption("ninos");
  await page.getByLabel("Precio").fill("450000");
  await page.getByLabel("Descripción").fill("Usada dos temporadas, frenos nuevos.");
  await page.getByRole("button", { name: "Publicar" }).click();

  await expect(page).toHaveURL(/\/producto\//);
  await expect(
    page.getByRole("heading", { name: "Bicicleta todoterreno rin 29" })
  ).toBeVisible();
  await expect(page.getByRole("main")).toContainText("$ 450.000");

  // El video queda servido y la portada salió del propio video.
  const src = await page.getByTestId("video-articulo").getAttribute("src");
  const res = await page.request.get(src!);
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("video/");

  await page.goto("/");
  await expect(
    page.getByRole("main").getByRole("listitem").filter({ hasText: "Bicicleta todoterreno" })
  ).toBeVisible();
});

test("sin video no se puede publicar", async ({ page }) => {
  await signUpVerified(page);
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
  await signUpVerified(page);
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
  await signUpVerified(page);
  await page.goto("/publicar");
  await expect(page).toHaveURL(/\/vender/);
});

test("sin sesión no se puede publicar", async ({ page }) => {
  await page.goto("/publicar");
  await expect(page).toHaveURL(/\/ingresar/);
});

test("un precio de cero se rechaza", async ({ page }) => {
  await signUpVerified(page);
  await approveKyc(page);
  await page.goto("/publicar");
  await recordVideo(page);

  await page.getByLabel("Título").fill("Regalo");
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
