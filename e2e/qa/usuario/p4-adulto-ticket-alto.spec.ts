import { test, expect, type Page } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { freshImei } from "../../helpers";
import { aceptarTerminos } from "../../helpers";

// Persona 4 — SPEC.md, "El adulto de 35 a 55": hoy no compra usado, ticket alto,
// le importa más la garantía que el descuento, entra por navegador de escritorio.
// Recorrido: inicio → bienvenida → ficha → perfil del vendedor → "cómo funciona
// el pago protegido" (si existe) → registro → compra de algo caro (> $1.000.000)
// con envío.

const MOBILE = { width: 375, height: 812 };
const DESKTOP = { width: 1280, height: 800 };
const LOG_GROUP = "/2venta-dev/web";
const CAP = (nombre: string, dispositivo: "movil" | "escritorio") =>
  `qa/capturas/usuario-premium-${nombre}-${dispositivo}.png`;

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

/** Un vendedor verificado con un portátil caro publicado (> $1.000.000). */
async function sellerPublishesLaptop(browser: import("@playwright/test").Browser) {
  const ctx = await browser.newContext({ viewport: DESKTOP, permissions: ["camera", "microphone"] });
  const page = await ctx.newPage();
  await registerAndVerify(page, "vendp4", "Ricardo Vendedor", "vendedor");

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
  await expect(page.getByText(/Grabando/)).toBeVisible();
  await page.getByRole("button", { name: "Terminar" }).click();
  await expect(page.getByRole("status")).toContainText("Video listo", { timeout: 15_000 });

  const titulo = `MacBook Pro 14" ${Date.now()}`;
  await page.getByLabel("Título").fill(titulo);
  await page.getByLabel("Categoría").selectOption("tecnologia");
  await page.getByLabel("IMEI del equipo").fill(freshImei());
  await page.getByLabel("Precio").fill("4500000");
  await page
    .getByLabel("Descripción")
    .fill("MacBook Pro 14 pulgadas, un año de uso, factura y caja originales.");
  await page.getByRole("button", { name: "Publicar" }).click();
  await expect(page).toHaveURL(/\/producto\//, { timeout: 30_000 });

  const listingId = new URL(page.url()).pathname.split("/").pop()!;
  const sellerUrl = (await page.getByRole("link").filter({ hasText: "Ricardo" }).getAttribute("href").catch(() => null))
    ?? null;
  await ctx.close();
  return { titulo, listingId, sellerUrl };
}

test.describe("Persona 4 — adulto 35-55, ticket alto, garantía, entra por escritorio", () => {
  test.setTimeout(600_000);

  test("recorrido completo en escritorio: inicio, bienvenida, ficha, perfil del vendedor, registro y compra con envío", async ({
    browser,
  }) => {
    const { titulo, listingId, sellerUrl } = await sellerPublishesLaptop(browser);

    const ctx = await browser.newContext({ viewport: DESKTOP });
    const page = await ctx.newPage();

    await test.step("Inicio", async () => {
      await page.goto("/");
      await page.screenshot({ path: CAP("inicio", "escritorio"), fullPage: true });
    });

    await test.step("Bienvenida", async () => {
      await page.getByRole("link", { name: "Entrar" }).click();
      await expect(page).toHaveURL(/\/bienvenida/, { timeout: 15_000 });
      await page.screenshot({ path: CAP("bienvenida", "escritorio"), fullPage: true });
    });

    await test.step("Ficha del artículo caro", async () => {
      await page.goto(`/producto/${listingId}`);
      await expect(page.getByRole("heading", { name: titulo })).toBeVisible({ timeout: 15_000 });
      await page.screenshot({ path: CAP("ficha", "escritorio"), fullPage: true });
    });

    await test.step("Perfil del vendedor", async () => {
      if (sellerUrl) {
        await page.goto(sellerUrl);
      } else {
        await page.getByRole("link", { name: "Ricardo" }).first().click();
      }
      await expect(page).toHaveURL(/\/vendedor\//, { timeout: 15_000 });
      await page.screenshot({ path: CAP("perfil-vendedor", "escritorio"), fullPage: true });
    });

    await test.step('"Cómo funciona el pago protegido" — ¿existe algo más que la caja en la ficha?', async () => {
      await page.goto(`/producto/${listingId}`);
      const link = page.getByRole("link", { name: /cómo funciona/i });
      const hayEnlace = await link.count();
      console.log("[persona4] ¿hay un enlace dedicado 'cómo funciona el pago protegido'?", hayEnlace > 0);
      if (hayEnlace > 0) {
        await link.first().click();
        await page.screenshot({ path: CAP("como-funciona-pago-protegido", "escritorio"), fullPage: true });
        await page.goto(`/producto/${listingId}`);
      } else {
        // No hay pantalla dedicada: lo único que explica el pago protegido es la
        // caja fija en la ficha. Se deja constancia con la captura de la ficha.
        console.log("[persona4] no hay enlace dedicado; solo la caja 'Pago protegido' en la ficha.");
      }
    });

    await test.step("Registrarse", async () => {
      await page.getByRole("link", { name: "Comprar con pago protegido" }).click();
      await expect(page).toHaveURL(/\/ingresar/, { timeout: 15_000 });
      await page.getByRole("link", { name: "Crear una" }).click();
      await expect(page).toHaveURL(/\/bienvenida/, { timeout: 15_000 });
      await page.screenshot({ path: CAP("bienvenida", "escritorio"), fullPage: true });
      await page.getByRole("link", { name: "Quiero comprar" }).click();
      await expect(page).toHaveURL(/\/registro/, { timeout: 15_000 });
      await page.screenshot({ path: CAP("registro", "escritorio"), fullPage: true });

      const { phone, email } = unique("premium");
      await page.getByLabel("Nombre").fill("Ricardo Peña");
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
    });

    let orderUrl = "";
    let totalTexto = "";
    let compraBloqueada = false;
    await test.step("Comprar con envío — total claro, sin comisión al comprador", async () => {
      await page.goto(`/producto/${listingId}`);
      // HALLAZGO: este portátil es de tecnología y quedó "en_revision" (D-32/R-03)
      // porque nadie lo aprobó desde /admin (esta cuenta de prueba no tiene forma
      // de convertirse en administrador en este entorno). El botón de comprar
      // igual está visible y activo; se documenta qué pasa al intentar pagar.
      await page.getByRole("link", { name: "Comprar con pago protegido" }).click();
      await expect(page).toHaveURL(/\/comprar\//, { timeout: 15_000 });

      await page.getByLabel("Quién recibe").fill("Ricardo Peña");
      await page.getByLabel("Celular de quien recibe").fill("310 555 12 34");
      await page.getByLabel("Dirección").fill("Calle 100 # 19-20, oficina 801");
      await page.getByLabel("Zona").selectOption("Chapinero");

      const total = page.getByTestId("total-checkout");
      await expect(total).toBeVisible({ timeout: 10_000 });
      totalTexto = (await total.innerText()).trim();
      console.log("[persona4] total mostrado en el checkout:", totalTexto);
      await page.screenshot({ path: CAP("checkout-total", "escritorio"), fullPage: true });

      await page.getByRole("button", { name: "Ir a pagar" }).click();

      await Promise.race([
        page.waitForURL(/\/dev\/pago\//, { timeout: 15_000 }).catch(() => {}),
        page.getByRole("main").getByRole("alert").waitFor({ timeout: 15_000 }).catch(() => {}),
      ]);

      if (/\/dev\/pago\//.test(page.url())) {
        await page.getByRole("button", { name: "Simular pago aprobado" }).click();
        await expect(page).toHaveURL(/\/pedido\//, { timeout: 15_000 });
        orderUrl = page.url();
        await page.screenshot({ path: CAP("pedido-estado", "escritorio"), fullPage: true });
      } else {
        compraBloqueada = true;
        const alerta = page.getByRole("main").getByRole("alert");
        const mensaje = await alerta.innerText().catch(() => "(sin alerta visible)");
        console.log(
          "[persona4][HALLAZGO] la compra de un portátil recién publicado (tecnología, en revisión, sin aprobar) no se pudo completar. URL:",
          page.url(), "Mensaje:", mensaje
        );
        await page.screenshot({ path: CAP("compra-bloqueada-en-revision", "escritorio"), fullPage: true });
      }
    });

    await test.step("¿Dónde dice qué pasa si el producto no es lo prometido? (reclamos, 48 horas)", async () => {
      if (!orderUrl) {
        console.log("[persona4] sin pedido completado: no se pudo comprobar la pantalla de reclamo por esta vía.");
        return;
      }
      const abrirReclamo = page.getByRole("button", { name: "Abrir reclamo" });
      const hay = await abrirReclamo.count();
      console.log("[persona4] ¿el pedido ofrece abrir un reclamo?", hay > 0);
      if (hay > 0) {
        await abrirReclamo.scrollIntoViewIfNeeded();
        await page.screenshot({ path: CAP("pedido-reclamo", "escritorio"), fullPage: true });
        const texto = await page.getByRole("main").innerText();
        console.log("[persona4] ¿menciona 48 horas?", /48 horas/i.test(texto));
      }
    });

    // --- Pase de móvil ---
    const state = await ctx.storageState();
    await ctx.close();
    const mobCtx = await browser.newContext({ viewport: MOBILE, storageState: state });
    const mob = await mobCtx.newPage();

    await mob.goto("/");
    await mob.screenshot({ path: CAP("inicio", "movil"), fullPage: true });

    await mob.goto(`/producto/${listingId}`);
    await mob.screenshot({ path: CAP("ficha", "movil"), fullPage: true });

    if (sellerUrl) {
      await mob.goto(sellerUrl);
      await mob.screenshot({ path: CAP("perfil-vendedor", "movil"), fullPage: true });
    }

    if (orderUrl) {
      await mob.goto(orderUrl);
      await mob.screenshot({ path: CAP("pedido-estado", "movil"), fullPage: true });
    }

    await mobCtx.close();

    console.log(
      "[persona4] total checkout capturado:", totalTexto,
      "compra bloqueada por moderación pendiente:", compraBloqueada
    );
  });

  test("caso de error: dirección incompleta al pagar", async ({ browser }) => {
    const { listingId } = await sellerPublishesLaptop(browser);
    const ctx = await browser.newContext({ viewport: DESKTOP });
    const page = await ctx.newPage();
    await registerAndVerify(page, "premerr", "Marcela Errores", "comprador");

    await page.goto(`/comprar/${listingId}`);
    await page.getByLabel("Quién recibe").fill("Marcela Errores");
    // Sin celular ni dirección: se deja incompleto a propósito.
    await page.getByRole("button", { name: "Ir a pagar" }).click();

    const alerta = page.getByRole("main").getByRole("alert");
    const visible = await alerta.isVisible().catch(() => false);
    console.log("[persona4] ¿hay alerta con dirección incompleta?", visible);
    if (visible) console.log("[persona4] mensaje:", await alerta.innerText());
    await page.screenshot({ path: CAP("error-direccion-incompleta", "escritorio"), fullPage: true });

    await ctx.close();
  });

  test("accesibilidad: el checkout solo con teclado, zoom 200% y modo oscuro", async ({ browser }) => {
    const { listingId } = await sellerPublishesLaptop(browser);
    const ctx = await browser.newContext({ viewport: DESKTOP });
    const page = await ctx.newPage();
    await registerAndVerify(page, "prema11y", "Marcela Accesible", "comprador");
    await page.goto(`/comprar/${listingId}`);

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
    console.log("[persona4][a11y] orden de foco en el checkout:\n" + foco.join("\n"));
    await page.screenshot({ path: CAP("a11y-foco-checkout", "escritorio"), fullPage: true });

    await page.evaluate(() => { document.body.style.zoom = "2"; });
    await page.screenshot({ path: CAP("a11y-zoom200", "escritorio"), fullPage: true });
    await page.evaluate(() => { document.body.style.zoom = "1"; });

    await ctx.close();

    const darkCtx = await browser.newContext({ viewport: DESKTOP, colorScheme: "dark" });
    const darkPage = await darkCtx.newPage();
    await darkPage.goto(`/producto/${listingId}`);
    await darkPage.screenshot({ path: CAP("a11y-modo-oscuro", "escritorio"), fullPage: true });
    await darkCtx.close();
  });
});
