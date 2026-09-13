import { test, expect, type Page } from "@playwright/test";
import { execFileSync } from "node:child_process";

// Prueba de humo contra un entorno desplegado (S-29). No corre en la suite
// normal: solo cuando NUBE_URL apunta a un entorno con APP_ENV=desarrollo, y
// necesita la CLI de AWS con el perfil del entorno para leer el código SMS de
// CloudWatch, que es donde sale en desarrollo.
//
//   NUBE_URL=https://xxxx.cloudfront.net AWS_PROFILE=2venta \
//     npx playwright test e2e/nube.spec.ts --config playwright.nube.config.ts
//
// Recorre el circuito completo del producto de punta a punta: registro,
// verificación de identidad, publicación con video subido directo al bucket, y
// una compra con el proveedor de pagos de prueba. Todo por la interfaz.

const URL = process.env.NUBE_URL!;
const LOG_GROUP = process.env.NUBE_LOG_GROUP ?? "/2venta-dev/web";

test.skip(!URL, "solo contra un entorno desplegado");

function unique(prefix: string) {
  const n = Math.floor(Math.random() * 900_000_000) + 100_000_000;
  return {
    phone: `3${String(n).padStart(9, "0")}`.slice(0, 10),
    email: `${prefix}.${Date.now()}.${n}@correo.com`,
  };
}

/** El código sale en el registro del servidor porque APP_ENV=desarrollo. */
function smsCodeFor(phone: string): string {
  const deadline = Date.now() + 90_000;
  while (Date.now() < deadline) {
    const out = execFileSync(
      "aws",
      ["logs", "tail", LOG_GROUP, "--since", "5m", "--filter-pattern", `"código para +57${phone}"`],
      { encoding: "utf8" }
    );
    const m = out.match(/código para \+57\d+: (\d{6})/);
    if (m) return m[1];
    execFileSync("sleep", ["3"]);
  }
  throw new Error(`no llegó el código para ${phone} al registro`);
}

async function signUp(page: Page, prefix: string, name: string, rol: string) {
  const { phone, email } = unique(prefix);
  await page.goto(`${URL}/registro?rol=${rol}`);
  await page.getByLabel("Nombre").fill(name);
  await page.getByLabel("Correo").fill(email);
  await page.getByLabel("Celular").fill(phone);
  await page.getByLabel("Contraseña").fill("unaClaveLarga1");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page).toHaveURL(/\/verificar/);

  await page.getByLabel("Código de seis dígitos").fill(smsCodeFor(phone));
  await page.getByRole("button", { name: "Confirmar celular" }).click();
  await expect(page.getByTestId("usuario")).toBeVisible();
  return email;
}

test("el circuito completo funciona contra la nube", async ({ browser }) => {
  test.setTimeout(480_000);

  // --- Vendedor: registro, identidad, publicación ---
  const sellerCtx = await browser.newContext();
  const seller = await sellerCtx.newPage();
  await signUp(seller, "vendedor", "Andrés Molina", "vendedor");

  await seller.goto(`${URL}/vender`);
  await seller.getByRole("button", { name: "Empezar verificación" }).click();
  await expect(seller).toHaveURL(/\/dev\/kyc\//);
  await seller.getByRole("button", { name: "Simular aprobación" }).click();
  await expect(seller.getByRole("heading", { name: "Identidad verificada" })).toBeVisible();

  await seller.goto(`${URL}/publicar`);
  await seller.getByRole("button", { name: "Abrir cámara" }).click();
  await seller.getByRole("button", { name: /^Grabar/ }).click();
  await expect(seller.getByText(/Grabando/)).toBeVisible();
  await seller.getByRole("button", { name: "Terminar" }).click();
  await expect(seller.getByRole("status")).toContainText("Video listo");

  const titulo = `Bicicleta en la nube ${Date.now()}`;
  await seller.getByLabel("Título").fill(titulo);
  await seller.getByLabel("Categoría").selectOption("ropa");
  await seller.getByLabel("Precio").fill("120000");
  await seller.getByLabel("Descripción").fill("Publicada desde la prueba de humo.");
  await seller.getByRole("button", { name: "Publicar" }).click();

  await expect(seller).toHaveURL(/\/producto\//, { timeout: 60_000 });
  const listingUrl = seller.url();
  await expect(seller.getByRole("heading", { name: titulo })).toBeVisible();

  // El video se sirve desde el bucket por CloudFront, no desde la aplicación.
  const src = await seller.getByTestId("video-articulo").getAttribute("src");
  expect(src).toMatch(/^https:\/\/.*\.cloudfront\.net\/\d{4}-\d{2}\//);
  const media = await seller.request.get(src!);
  expect(media.status()).toBe(200);
  expect(media.headers()["content-type"]).toContain("video/");

  // S-30: en pocos minutos MediaConvert deja el MP4 y la ficha pasa a servirlo.
  // Solo si el entorno tiene MediaConvert activo (video_transcodificar en Terraform).
  if (process.env.NUBE_TRANSCODIFICA) await expect
    .poll(
      async () => {
        await seller.reload();
        return seller.getByTestId("video-articulo").getAttribute("src");
      },
      { timeout: 240_000, intervals: [10_000] }
    )
    .toMatch(/\/transcodificado\/\d{4}-\d{2}\/.*\.mp4$/);
  if (process.env.NUBE_TRANSCODIFICA) {
    const mp4 = await seller.request.get(
      (await seller.getByTestId("video-articulo").getAttribute("src"))!
    );
    expect(mp4.status()).toBe(200);
    expect(mp4.headers()["content-type"]).toBe("video/mp4");
  }

  // --- Comprador: registro y compra con el proveedor de prueba ---
  const buyerCtx = await browser.newContext();
  const buyer = await buyerCtx.newPage();
  await signUp(buyer, "comprador", "Laura Compradora", "comprador");

  await buyer.goto(listingUrl);
  await buyer.getByRole("link", { name: "Comprar con pago protegido" }).click();
  await expect(buyer).toHaveURL(/\/comprar\//);
  await buyer.getByLabel("Quién recibe").fill("Laura Compradora");
  await buyer.getByLabel("Celular de quien recibe").fill("300 412 88 05");
  await buyer.getByLabel("Dirección").fill("Calle 45 # 13-20, apto 301");
  await buyer.getByLabel("Zona").selectOption("Chapinero");
  await buyer.getByRole("button", { name: "Ir a pagar" }).click();
  await expect(buyer).toHaveURL(/\/dev\/pago\//);
  await buyer.getByRole("button", { name: "Simular pago aprobado" }).click();
  await expect(buyer).toHaveURL(/\/pedido\//);
  await expect(buyer.getByTestId("estado")).toHaveText("Pago recibido y guardado");

  await sellerCtx.close();
  await buyerCtx.close();
});
