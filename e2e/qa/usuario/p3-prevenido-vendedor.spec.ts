import { test, expect, type Page } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { aceptarTerminos } from "../../helpers";

// Persona 3 — SPEC.md, "El prevenido": ingresos bajos, reacio a la comisión,
// pidió pago contra entrega (en 2venta es la entrega presencial con código). Aquí
// entra como VENDEDOR: registro, verificación de identidad, publica un artículo
// de niños con video y dos fotos, mira cuánto le queda después de la comisión
// (¿se lo dicen antes de publicar?), recibe una oferta baja y la rechaza, y marca
// el artículo como reservado.

const MOBILE = { width: 375, height: 812 };
const DESKTOP = { width: 1280, height: 800 };
const LOG_GROUP = "/2venta-dev/web";
const CAP = (nombre: string, dispositivo: "movil" | "escritorio") =>
  `qa/capturas/usuario-prevenido-${nombre}-${dispositivo}.png`;

/** Un JPEG mínimo válido, para no depender de archivos en disco. */
const JPEG = Buffer.from(
  "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q==",
  "base64"
);
function photoFiles(n: number) {
  return Array.from({ length: n }, (_, i) => ({
    name: `foto-${i}.jpg`,
    mimeType: "image/jpeg",
    buffer: JPEG,
  }));
}

function unique(prefix: string) {
  const n = Math.floor(Math.random() * 900_000_000) + 100_000_000;
  return {
    phone: `3${String(n).padStart(9, "0")}`.slice(0, 10),
    email: `${prefix}.${Date.now()}.${n}@correo.com`,
  };
}

function smsCodeFor(phone: string): string {
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    const out = execFileSync(
      "aws",
      [
        "logs", "tail", LOG_GROUP, "--since", "10m",
        "--filter-pattern", `"código para +57${phone}"`,
      ],
      {
        encoding: "utf8",
        env: {
          ...process.env,
          AWS_PROFILE: "2venta",
          AWS_ACCESS_KEY_ID: "",
          AWS_SECRET_ACCESS_KEY: "",
          AWS_SESSION_TOKEN: "",
        },
      }
    );
    const m = out.match(/código para \+57\d+: (\d{6})/);
    if (m) return m[1];
    execFileSync("sleep", ["3"]);
  }
  throw new Error(`no llegó el código SMS para +57${phone} en ${LOG_GROUP}`);
}

async function registerAndVerify(
  page: Page,
  prefix: string,
  name: string,
  rol: "comprador" | "vendedor" = "comprador"
) {
  const { phone, email } = unique(prefix);
  await page.goto(`/registro?rol=${rol}`);
  await page.getByLabel("Nombre").fill(name);
  await page.getByLabel("Correo").fill(email);
  await page.getByLabel("Celular").fill(phone);
  await page.getByLabel("Contraseña").fill("unaClaveLarga1");
  await page.getByLabel("Fecha de nacimiento").fill("1995-05-20");
  await aceptarTerminos(page);
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page).toHaveURL(/\/verificar/, { timeout: 15_000 });
  const code = smsCodeFor(phone);
  await page.getByLabel("Código de seis dígitos").fill(code);
  await page.getByRole("button", { name: "Confirmar celular" }).click();
  await expect(page.getByTestId("usuario")).toBeVisible({ timeout: 15_000 });
  return { email, phone };
}

test.describe("Persona 3 — el prevenido, vendedor, reacio a la comisión", () => {
  test.setTimeout(600_000);

  test("recorrido completo: registro vendedor, identidad, publicar niños con video y fotos, oferta baja rechazada, reservar", async ({
    browser,
  }) => {
    const ctx = await browser.newContext({ viewport: MOBILE, permissions: ["camera", "microphone"] });
    const page = await ctx.newPage();

    await test.step("Registro como vendedor", async () => {
      await registerAndVerify(page, "prev", "Don Alfonso", "vendedor");
    });

    await test.step("Verificación de identidad — tres estados", async () => {
      await page.goto("/vender");
      await page.screenshot({ path: CAP("verificar-identidad-sin-empezar", "movil"), fullPage: true });

      await page.goto("/vender?tipo=natural");

      await page.getByLabel("Dirección de notificaciones").fill("Calle 72 # 10-34");

      await page.getByLabel(/Autorizo que el proveedor/).check();
      await page.getByRole("button", { name: "Empezar verificación" }).click();
      await expect(page).toHaveURL(/\/dev\/kyc\//, { timeout: 15_000 });
      await page.screenshot({ path: CAP("verificar-identidad-pendiente", "movil"), fullPage: true });

      await page.getByRole("button", { name: "Simular aprobación" }).click();
      await expect(page.getByRole("heading", { name: "Identidad verificada" })).toBeVisible({
        timeout: 15_000,
      });
      await page.screenshot({ path: CAP("verificar-identidad-aprobada", "movil"), fullPage: true });
    });

    let listingId = "";
    let precioPublicado = 90_000;
    await test.step("Publicar un artículo de niños con video y dos fotos — ¿se ve la comisión antes de publicar?", async () => {
      await page.goto("/publicar");
      await page.getByRole("button", { name: "Abrir cámara" }).click();
      await page.getByRole("button", { name: /^Grabar/ }).click();
      await expect(page.getByText(/Grabando/)).toBeVisible();
      await page.getByRole("button", { name: "Terminar" }).click();
      await expect(page.getByRole("status")).toContainText("Video listo", { timeout: 15_000 });

      await page.getByLabel("Fotos").setInputFiles(photoFiles(2));

      const titulo = `Coche de bebé ${Date.now()}`;
      await page.getByLabel("Título").fill(titulo);
      await page.getByLabel("Categoría").selectOption("ninos");
      await page.getByLabel("Para qué edad").selectOption("3 a 4 años");
      await page.getByLabel("Precio").fill(String(precioPublicado));
      await page
        .getByLabel("Descripción")
        .fill("Coche de bebé plegable, poco uso, con protector de lluvia.");

      // Antes de publicar: ¿el formulario menciona en algún punto la comisión o
      // lo que le va a quedar al vendedor? Se deja constancia en el informe.
      const textoFormulario = await page.getByRole("main").innerText();
      const mencionaComision = /comisi[oó]n|te quedan|recibir[aá]s|neto/i.test(textoFormulario);
      console.log("[persona3] ¿la pantalla de publicar menciona la comisión?", mencionaComision);
      await page.screenshot({ path: CAP("publicar-antes-de-enviar", "movil"), fullPage: true });

      await page.getByRole("button", { name: "Publicar" }).click();
      await expect(page).toHaveURL(/\/producto\//, { timeout: 30_000 });
      listingId = new URL(page.url()).pathname.split("/").pop()!;

      const textoFicha = await page.getByRole("main").innerText();
      const mencionaComisionFicha = /comisi[oó]n|te quedan|recibir[aá]s|neto/i.test(textoFicha);
      console.log("[persona3] ¿la ficha ya publicada menciona la comisión?", mencionaComisionFicha);
      await page.screenshot({ path: CAP("ficha-propia-tras-publicar", "movil"), fullPage: true });
    });

    await test.step("Métricas / mis ventas — ¿ahí se explica cuándo y cómo llega la plata?", async () => {
      await page.goto("/vender/metricas");
      const texto = await page.getByRole("main").innerText().catch(() => "");
      console.log("[persona3] texto de /vender/metricas:", texto.slice(0, 800));
      await page.screenshot({ path: CAP("metricas-vendedor", "movil"), fullPage: true });
    });

    await test.step("Recibe una oferta baja de un comprador", async () => {
      const buyerCtx = await browser.newContext({ viewport: MOBILE });
      const buyerPage = await buyerCtx.newPage();
      await registerAndVerify(buyerPage, "compprev", "Comprador Curioso", "comprador");

      await buyerPage.goto(`/producto/${listingId}`);
      await buyerPage.getByRole("button", { name: "Escribirle al vendedor" }).click();
      await expect(buyerPage).toHaveURL(/\/chat\//, { timeout: 15_000 });
      const ofertaBaja = Math.round(precioPublicado * 0.2);
      await buyerPage.getByLabel("Cuánto ofreces").fill(String(ofertaBaja));
      await buyerPage.getByRole("button", { name: "Ofertar" }).click();
      await expect(buyerPage.getByTestId("oferta")).toBeVisible({ timeout: 10_000 });
      const chatId = new URL(buyerPage.url()).pathname.split("/").pop()!;
      await buyerCtx.close();

      await page.goto(`/chat/${chatId}`);
      await expect(page.getByTestId("oferta")).toBeVisible({ timeout: 10_000 });
      await page.screenshot({ path: CAP("oferta-recibida", "movil"), fullPage: true });

      await page.getByRole("button", { name: "Rechazar" }).click();
      await expect(page.getByRole("button", { name: "Rechazar" })).toHaveCount(0, {
        timeout: 10_000,
      });
      await page.screenshot({ path: CAP("oferta-rechazada", "movil"), fullPage: true });
    });

    await test.step("Marcar el artículo como reservado", async () => {
      await page.goto(`/producto/${listingId}`);
      await page.getByRole("button", { name: "Marcar como reservada" }).click();
      await expect(page.getByRole("button", { name: "Volver a publicar" })).toBeVisible({
        timeout: 10_000,
      });
      await page.screenshot({ path: CAP("marcado-reservado", "movil"), fullPage: true });
    });

    // --- Pase de escritorio ---
    const state = await ctx.storageState();
    await ctx.close();
    const deskCtx = await browser.newContext({ viewport: DESKTOP, storageState: state });
    const desk = await deskCtx.newPage();

    await desk.goto("/vender");
    await desk.screenshot({ path: CAP("verificar-identidad-aprobada", "escritorio"), fullPage: true });

    await desk.goto("/publicar");
    await desk.screenshot({ path: CAP("publicar-antes-de-enviar", "escritorio"), fullPage: true });

    await desk.goto(`/producto/${listingId}`);
    await desk.screenshot({ path: CAP("marcado-reservado", "escritorio"), fullPage: true });

    await deskCtx.close();
  });

  test("caso de error: precio con puntos de miles al publicar", async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: MOBILE, permissions: ["camera", "microphone"] });
    const page = await ctx.newPage();
    await registerAndVerify(page, "prevpuntos", "Don Alfonso Puntos", "vendedor");
    await page.goto("/vender");
    await page.goto("/vender?tipo=natural");
    await page.getByLabel("Dirección de notificaciones").fill("Calle 72 # 10-34");
    await page.getByLabel(/Autorizo que el proveedor/).check();
    await page.getByRole("button", { name: "Empezar verificación" }).click();
    await expect(page).toHaveURL(/\/dev\/kyc\//, { timeout: 15_000 });
    await page.getByRole("button", { name: "Simular aprobación" }).click();
    await expect(page.getByRole("heading", { name: "Identidad verificada" })).toBeVisible({
      timeout: 15_000,
    });

    await page.goto("/publicar");
    await page.getByRole("button", { name: "Abrir cámara" }).click();
    await page.getByRole("button", { name: /^Grabar/ }).click();
    await page.getByRole("button", { name: "Terminar" }).click();
    await expect(page.getByRole("status")).toContainText("Video listo", { timeout: 15_000 });

    await page.getByLabel("Título").fill("Ropa de bebé con precio en puntos");
    await page.getByLabel("Categoría").selectOption("ninos");
    await page.getByLabel("Para qué edad").selectOption("3 a 4 años");
    await page.getByLabel("Precio").fill("150.000");
    await page.getByLabel("Descripción").fill("Precio escrito con puntos de miles, como lo haría alguien real.");
    await page.getByRole("button", { name: "Publicar" }).click();

    // Puede rechazarlo (quedarse en /publicar con error) o interpretar "150" y
    // descartar el resto: cualquiera de los dos se documenta con captura.
    await page.waitForTimeout(3000);
    const url = page.url();
    console.log("[persona3] URL tras publicar con precio '150.000':", url);
    if (/\/producto\//.test(url)) {
      const texto = await page.getByRole("main").innerText();
      console.log("[persona3] contenido de la ficha tras precio con puntos:", texto.slice(0, 300));
    } else {
      const alerta = page.getByRole("main").getByRole("alert");
      console.log("[persona3] alerta visible:", await alerta.isVisible());
    }
    await page.screenshot({ path: CAP("error-precio-con-puntos", "movil"), fullPage: true });

    await ctx.close();
  });

  test("accesibilidad: la pantalla de publicar solo con teclado", async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: MOBILE, permissions: ["camera", "microphone"] });
    const page = await ctx.newPage();
    await registerAndVerify(page, "preva11y", "Don Alfonso Accesible", "vendedor");
    await page.goto("/vender");
    await page.goto("/vender?tipo=natural");
    await page.getByLabel("Dirección de notificaciones").fill("Calle 72 # 10-34");
    await page.getByLabel(/Autorizo que el proveedor/).check();
    await page.getByRole("button", { name: "Empezar verificación" }).click();
    await expect(page).toHaveURL(/\/dev\/kyc\//, { timeout: 15_000 });
    await page.getByRole("button", { name: "Simular aprobación" }).click();
    await expect(page.getByRole("heading", { name: "Identidad verificada" })).toBeVisible({
      timeout: 15_000,
    });
    await page.goto("/publicar");

    const foco: string[] = [];
    for (let i = 0; i < 14; i++) {
      await page.keyboard.press("Tab");
      const info = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        if (!el || el === document.body) return "sin foco";
        const label = el.getAttribute("aria-label") || el.textContent?.trim().slice(0, 40) || el.tagName;
        const visible = getComputedStyle(el).outlineStyle !== "none" || getComputedStyle(el).boxShadow !== "none";
        return `${el.tagName}:${label} outline-visible=${visible}`;
      });
      foco.push(info);
    }
    console.log("[persona3][a11y] orden de foco en publicar:\n" + foco.join("\n"));
    await page.screenshot({ path: CAP("a11y-foco-publicar", "movil"), fullPage: true });

    await page.evaluate(() => { document.body.style.zoom = "2"; });
    await page.screenshot({ path: CAP("a11y-zoom200", "movil"), fullPage: true });

    await ctx.close();

    const darkCtx = await browser.newContext({ viewport: MOBILE, colorScheme: "dark" });
    const darkPage = await darkCtx.newPage();
    await darkPage.goto("/vender");
    await darkPage.screenshot({ path: CAP("a11y-modo-oscuro", "movil"), fullPage: true });
    await darkCtx.close();
  });
});
