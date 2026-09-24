import { test, expect, type Page } from "@playwright/test";
import { execFileSync } from "node:child_process";

// Persona 2 — SPEC.md, "Estudiante": compra ropa y accesorios, es la más abierta
// a probar la app y su barrera es la fricción de coordinar la entrega. Recorrido:
// se registra, busca ropa, guarda una búsqueda, agrega dos artículos del mismo
// vendedor al carrito, elige entrega presencial, paga, y mira el código de
// entrega.

const MOBILE = { width: 375, height: 812 };
const DESKTOP = { width: 1280, height: 800 };
const LOG_GROUP = "/2venta-dev/web";
const CAP = (nombre: string, dispositivo: "movil" | "escritorio") =>
  `qa/capturas/usuario-estudiante-${nombre}-${dispositivo}.png`;

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
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page).toHaveURL(/\/verificar/, { timeout: 15_000 });
  const code = smsCodeFor(phone);
  await page.getByLabel("Código de seis dígitos").fill(code);
  await page.getByRole("button", { name: "Confirmar celular" }).click();
  await expect(page.getByTestId("usuario")).toBeVisible({ timeout: 15_000 });
  return { email, phone };
}

async function publishRopa(page: Page, titulo: string, precio: number) {
  await page.goto("/publicar");
  await page.getByRole("button", { name: "Abrir cámara" }).click();
  await page.getByRole("button", { name: /^Grabar/ }).click();
  await expect(page.getByText(/Grabando/)).toBeVisible();
  await page.getByRole("button", { name: "Terminar" }).click();
  await expect(page.getByRole("status")).toContainText("Video listo", { timeout: 15_000 });
  await page.getByLabel("Título").fill(titulo);
  await page.getByLabel("Categoría").selectOption("ropa");
  await page.getByLabel("Precio").fill(String(precio));
  await page.getByLabel("Descripción").fill("Prenda en buen estado, poco uso.");
  await page.getByRole("button", { name: "Publicar" }).click();
  await expect(page).toHaveURL(/\/producto\//, { timeout: 30_000 });
  return new URL(page.url()).pathname.split("/").pop()!;
}

/** Un vendedor con dos prendas publicadas, para armar el carrito. */
async function sellerWithTwoItems(browser: import("@playwright/test").Browser) {
  const ctx = await browser.newContext({ viewport: MOBILE, permissions: ["camera", "microphone"] });
  const page = await ctx.newPage();
  await registerAndVerify(page, "vendp2", "Mariana Vendedora", "vendedor");
  await page.goto("/vender");
  await page.getByRole("button", { name: "Empezar verificación" }).click();
  await expect(page).toHaveURL(/\/dev\/kyc\//, { timeout: 15_000 });
  await page.getByRole("button", { name: "Simular aprobación" }).click();
  await expect(page.getByRole("heading", { name: "Identidad verificada" })).toBeVisible({
    timeout: 15_000,
  });

  const marca = Date.now();
  const id1 = await publishRopa(page, `Chaqueta jean ${marca}`, 65_000);
  const id2 = await publishRopa(page, `Camiseta oversize ${marca}`, 35_000);
  await ctx.close();
  return { ids: [id1, id2] };
}

test.describe("Persona 2 — estudiante, ropa, poca fricción, entrega presencial", () => {
  test.setTimeout(600_000);

  test("recorrido completo: registro, buscar ropa, guardar búsqueda, carrito de dos, entrega presencial y código", async ({
    browser,
  }) => {
    const { ids } = await sellerWithTwoItems(browser);

    const ctx = await browser.newContext({ viewport: MOBILE });
    const page = await ctx.newPage();

    await test.step("Registro", async () => {
      await registerAndVerify(page, "estu", "Valentina Ríos", "comprador");
    });

    await test.step("Buscar ropa", async () => {
      await page.goto("/buscar?categoria=ropa");
      await page.screenshot({ path: CAP("busqueda-ropa", "movil"), fullPage: true });
    });

    await test.step('Guardar la búsqueda ("avísame")', async () => {
      const avisame = page.getByText(/^Avísame cuando aparezca/);
      await expect(avisame).toBeVisible({ timeout: 10_000 });
      await avisame.click();
      await page.getByLabel("Nombre de la búsqueda").fill("Ropa que me gusta");
      await page.getByRole("button", { name: "Guardar" }).click();
      await expect(page.getByRole("status")).toContainText("Guardada", { timeout: 10_000 });
      await page.screenshot({ path: CAP("busqueda-guardada", "movil"), fullPage: true });
    });

    await test.step("Agregar dos artículos del mismo vendedor al carrito", async () => {
      for (const id of ids) {
        await page.goto(`/producto/${id}`);
        await page.getByRole("button", { name: "Agregar al carrito" }).click();
        await expect(page.getByRole("main")).toContainText("Está en tu carrito", {
          timeout: 10_000,
        });
      }
      await page.goto("/carrito");
      await expect(page.getByTestId("carrito").getByRole("listitem")).toHaveCount(2, {
        timeout: 10_000,
      });
      await page.screenshot({ path: CAP("carrito", "movil"), fullPage: true });
    });

    let orderUrl = "";
    let codigo = "";
    await test.step("Pagar desde el carrito, entrega presencial", async () => {
      await page.getByRole("link", { name: "Ir a pagar" }).click();
      await expect(page).toHaveURL(/\/comprar\/carrito/, { timeout: 15_000 });

      const presencial = page.getByRole("radio", { name: /Nos vemos en persona/ });
      await presencial.check();
      await page.screenshot({ path: CAP("entrega-presencial", "movil"), fullPage: true });

      await page.getByLabel("¿En qué zona se ven?").selectOption("Chapinero");
      await page.getByRole("button", { name: "Ir a pagar" }).click();
      await expect(page).toHaveURL(/\/dev\/pago\//, { timeout: 15_000 });
      await page.getByRole("button", { name: "Simular pago aprobado" }).click();
      await expect(page).toHaveURL(/\/pedido\//, { timeout: 15_000 });
      orderUrl = page.url();

      const codigoEl = page.getByTestId("codigo");
      await expect(codigoEl).toBeVisible({ timeout: 10_000 });
      codigo = (await codigoEl.innerText()).trim();
      await page.screenshot({ path: CAP("pedido-codigo", "movil"), fullPage: true });
    });

    console.log("[persona2] pedido:", orderUrl, "código de entrega:", codigo);
    expect(codigo).toMatch(/^\d{6}$/);

    // --- Pase de escritorio ---
    const state = await ctx.storageState();
    await ctx.close();

    const deskCtx = await browser.newContext({ viewport: DESKTOP, storageState: state });
    const desk = await deskCtx.newPage();

    await desk.goto("/buscar?categoria=ropa");
    await desk.screenshot({ path: CAP("busqueda-ropa", "escritorio"), fullPage: true });

    await desk.goto("/carrito");
    await desk.screenshot({ path: CAP("carrito", "escritorio"), fullPage: true });

    await desk.goto(orderUrl);
    await desk.screenshot({ path: CAP("pedido-codigo", "escritorio"), fullPage: true });

    await deskCtx.close();
  });

  test("caso de error: contraseña de siete caracteres al registrarse", async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: MOBILE });
    const page = await ctx.newPage();
    const { phone, email } = unique("estucorta");

    await page.goto("/registro?rol=comprador");
    await page.getByLabel("Nombre").fill("Valentina Corta");
    await page.getByLabel("Correo").fill(email);
    await page.getByLabel("Celular").fill(phone);
    await page.getByLabel("Contraseña").fill("abc1234"); // siete caracteres
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Continuar" }).click();

    const alerta = page.getByRole("main").getByRole("alert");
    await expect(alerta).toBeVisible({ timeout: 10_000 });
    const texto = await alerta.innerText();
    console.log("[persona2] mensaje con contraseña de 7 caracteres:", texto);
    await page.screenshot({ path: CAP("error-contrasena-corta", "movil"), fullPage: true });

    await ctx.close();
  });

  test("accesibilidad: el carrito solo con teclado", async ({ browser }) => {
    const { ids } = await sellerWithTwoItems(browser);
    const ctx = await browser.newContext({ viewport: MOBILE });
    const page = await ctx.newPage();
    await registerAndVerify(page, "estua11y", "Sofía Accesible", "comprador");

    for (const id of ids) {
      await page.goto(`/producto/${id}`);
      await page.getByRole("button", { name: "Agregar al carrito" }).click();
      await expect(page.getByRole("main")).toContainText("Está en tu carrito", { timeout: 10_000 });
    }
    await page.goto("/carrito");

    const foco: string[] = [];
    for (let i = 0; i < 12; i++) {
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
    console.log("[persona2][a11y] orden de foco en el carrito:\n" + foco.join("\n"));
    await page.screenshot({ path: CAP("a11y-foco-carrito", "movil"), fullPage: true });

    await ctx.close();

    const darkCtx = await browser.newContext({ viewport: MOBILE, colorScheme: "dark" });
    const darkPage = await darkCtx.newPage();
    await darkPage.goto(`/producto/${ids[0]}`);
    await darkPage.screenshot({ path: CAP("a11y-modo-oscuro", "movil"), fullPage: true });
    await darkCtx.close();
  });
});
