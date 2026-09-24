import { test, expect, type Page } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { freshImei } from "../../helpers";
import { aceptarTerminos } from "../../helpers";

// Persona 1 — SPEC.md, "Segmento medio": compra sobre todo tecnología, es
// desconfiado y lo que más pide es pago protegido. Recorrido: llega sin cuenta,
// busca, filtra por precio, abre una ficha, intenta comprar (¿lo mandan a
// registrarse con claridad?), se registra, confirma celular, pregunta algo
// público, hace una oferta por chat, compra con pago protegido y envío, y mira
// el estado de su pedido.
//
// Corre contra el entorno real (QA_BASE_URL). No usa la base de datos: todo se
// prepara y se juzga por la interfaz.

const MOBILE = { width: 375, height: 812 };
const DESKTOP = { width: 1280, height: 800 };
const LOG_GROUP = "/2venta-dev/web";
const CAP = (nombre: string, dispositivo: "movil" | "escritorio") =>
  `qa/capturas/usuario-tecnologia-${nombre}-${dispositivo}.png`;

function unique(prefix: string) {
  const n = Math.floor(Math.random() * 900_000_000) + 100_000_000;
  return {
    phone: `3${String(n).padStart(9, "0")}`.slice(0, 10),
    email: `${prefix}.${Date.now()}.${n}@correo.com`,
  };
}

/** El código sale en CloudWatch porque el entorno tiene APP_ENV=desarrollo. */
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

/** Publica un vendedor verificado, para tener un artículo real que comprar. */
async function sellerPublishesPhone(browser: import("@playwright/test").Browser) {
  const ctx = await browser.newContext({ viewport: MOBILE, permissions: ["camera", "microphone"] });
  const page = await ctx.newPage();
  await registerAndVerify(page, "vendp1", "Andrés Vendedor", "vendedor");

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

  const titulo = `Samsung Galaxy A54 ${Date.now()}`;
  await page.getByLabel("Título").fill(titulo);
  await page.getByLabel("Categoría").selectOption("tecnologia");
  await page.getByLabel("IMEI del equipo").fill(freshImei());
  await page.getByLabel("Precio").fill("850000");
  await page
    .getByLabel("Descripción")
    .fill("Celular Samsung Galaxy A54, buen estado, con cargador original.");
  await page.getByRole("button", { name: "Publicar" }).click();
  await expect(page).toHaveURL(/\/producto\//, { timeout: 30_000 });

  const listingId = new URL(page.url()).pathname.split("/").pop()!;
  await ctx.close();
  return { titulo, listingId };
}

test.describe("Persona 1 — segmento medio, tecnología, desconfiado", () => {
  test.setTimeout(600_000);

  test("recorrido completo: buscar, dudar de comprar sin cuenta, registrarse, preguntar, ofertar y pagar con envío", async ({
    browser,
  }) => {
    const { titulo, listingId } = await sellerPublishesPhone(browser);

    const ctx = await browser.newContext({ viewport: MOBILE });
    const page = await ctx.newPage();

    await test.step("Inicio, sin cuenta", async () => {
      await page.goto("/");
      await page.screenshot({ path: CAP("inicio", "movil"), fullPage: true });
    });

    await test.step("Buscar y filtrar por precio", async () => {
      await page.getByRole("searchbox", { name: "Buscar" }).fill("Samsung");
      await page.getByRole("button", { name: "Buscar" }).click();
      await expect(page).toHaveURL(/\/buscar/, { timeout: 15_000 });
      // El panel "Filtros" es un <details> cerrado por omisión: hay que abrirlo.
      await page.getByText("Filtros", { exact: true }).click();
      await page.getByLabel("Precio mínimo").fill("500000");
      await page.getByLabel("Precio máximo").fill("1000000");
      await page.getByRole("button", { name: "Aplicar" }).click();
      await page.screenshot({ path: CAP("busqueda-filtros", "movil"), fullPage: true });
    });

    await test.step("Abrir la ficha", async () => {
      await page.goto(`/producto/${listingId}`);
      await expect(page.getByRole("heading", { name: titulo })).toBeVisible({ timeout: 15_000 });
      await page.screenshot({ path: CAP("ficha", "movil"), fullPage: true });
    });

    await test.step("Intentar comprar sin cuenta: ¿queda claro que hay que registrarse?", async () => {
      await page.getByRole("link", { name: "Comprar con pago protegido" }).click();
      await expect(page).toHaveURL(/\/ingresar/, { timeout: 15_000 });
      await page.screenshot({ path: CAP("comprar-sin-cuenta", "movil"), fullPage: true });
      // Anotado como hallazgo en el informe si esta pantalla no explica el porqué.
    });

    let email = "";
    await test.step("Registrarse", async () => {
      // "Crear una" no lleva directo al formulario: pasa primero por /bienvenida
      // a elegir "Quiero comprar" o "Quiero vender". Un paso extra que no se
      // anticipó al hacer clic en "Comprar con pago protegido".
      await page.getByRole("link", { name: "Crear una" }).click();
      await expect(page).toHaveURL(/\/bienvenida/, { timeout: 15_000 });
      await page.screenshot({ path: CAP("bienvenida", "movil"), fullPage: true });
      await page.getByRole("link", { name: "Quiero comprar" }).click();
      await expect(page).toHaveURL(/\/registro/, { timeout: 15_000 });
      await page.screenshot({ path: CAP("registro", "movil"), fullPage: true });

      const { phone, email: correo } = unique("compp1");
      email = correo;
      await page.getByLabel("Nombre").fill("Julián Torres");
      await page.getByLabel("Correo").fill(correo);
      await page.getByLabel("Celular").fill(phone);
      await page.getByLabel("Contraseña").fill("unaClaveLarga1");
      await page.getByLabel("Fecha de nacimiento").fill("1995-05-20");
      await aceptarTerminos(page);
      await page.getByRole("button", { name: "Continuar" }).click();
      await expect(page).toHaveURL(/\/verificar/, { timeout: 15_000 });
      await page.screenshot({ path: CAP("verificar-celular", "movil"), fullPage: true });

      // Caso de error real: código equivocado antes del correcto.
      await page.getByLabel("Código de seis dígitos").fill("000000");
      await page.getByRole("button", { name: "Confirmar celular" }).click();
      const alerta = page.getByRole("main").getByRole("alert");
      await expect(alerta).toBeVisible({ timeout: 10_000 });
      await page.screenshot({ path: CAP("codigo-equivocado", "movil"), fullPage: true });
      console.log("[persona1] mensaje al meter código equivocado:", await alerta.innerText());

      const code = smsCodeFor(phone);
      await page.getByLabel("Código de seis dígitos").fill(code);
      await page.getByRole("button", { name: "Confirmar celular" }).click();
      await expect(page.getByTestId("usuario")).toBeVisible({ timeout: 15_000 });
    });

    await test.step("Volver a la ficha ya con celular confirmado", async () => {
      await page.goto(`/producto/${listingId}`);
      await expect(page.getByRole("heading", { name: titulo })).toBeVisible({ timeout: 15_000 });
    });

    await test.step("Preguntar algo público", async () => {
      const pregunta = page.getByLabel("Tu pregunta");
      await expect(pregunta).toBeVisible({ timeout: 10_000 });
      await pregunta.fill("¿El cargador es el original de Samsung?");
      await page.getByRole("button", { name: "Preguntar" }).click();
      await expect(page.getByRole("main")).toContainText("¿El cargador es el original", {
        timeout: 10_000,
      });
      await page.screenshot({ path: CAP("pregunta-publica", "movil"), fullPage: true });
    });

    await test.step("Hacer una oferta por chat", async () => {
      await page.getByRole("button", { name: "Escribirle al vendedor" }).click();
      await expect(page).toHaveURL(/\/chat\//, { timeout: 15_000 });
      await page.getByLabel("Cuánto ofreces").fill("750000");
      await page.getByRole("button", { name: "Ofertar" }).click();
      await expect(page.getByTestId("oferta")).toContainText("$ 750.000", { timeout: 10_000 });
      await page.screenshot({ path: CAP("oferta-chat", "movil"), fullPage: true });
    });

    let orderUrl = "";
    let compraBloqueada = false;
    await test.step("Comprar con pago protegido y envío", async () => {
      await page.goto(`/producto/${listingId}`);
      // HALLAZGO: este artículo es de tecnología, así que quedó "en_revision"
      // (D-32/R-03, revisión humana antes de estar visible). Pese a eso, el botón
      // "Comprar con pago protegido" está visible y activo para cualquiera — ver
      // el hallazgo dedicado en el informe. Se documenta qué pasa al intentarlo.
      await page.getByRole("link", { name: "Comprar con pago protegido" }).click();
      await expect(page).toHaveURL(/\/comprar\//, { timeout: 15_000 });
      await page.getByLabel("Quién recibe").fill("Julián Torres");
      await page.getByLabel("Celular de quien recibe").fill("300 412 88 05");
      await page.getByLabel("Dirección").fill("Carrera 15 # 85-30, apto 502");
      await page.getByLabel("Zona").selectOption("Chapinero");
      await page.screenshot({ path: CAP("checkout-direccion", "movil"), fullPage: true });
      await page.getByRole("button", { name: "Ir a pagar" }).click();

      // No se sabe de antemano si el pago va a poder seguir (ver hallazgo sobre
      // artículos en revisión), así que se comprueban las dos salidas posibles.
      await Promise.race([
        page.waitForURL(/\/dev\/pago\//, { timeout: 15_000 }).catch(() => {}),
        page.getByRole("main").getByRole("alert").waitFor({ timeout: 15_000 }).catch(() => {}),
      ]);

      if (/\/dev\/pago\//.test(page.url())) {
        await page.screenshot({ path: CAP("pago-proveedor", "movil"), fullPage: true });
        await page.getByRole("button", { name: "Simular pago aprobado" }).click();
        await expect(page).toHaveURL(/\/pedido\//, { timeout: 15_000 });
        orderUrl = page.url();
        await page.screenshot({ path: CAP("pedido-estado", "movil"), fullPage: true });
      } else {
        compraBloqueada = true;
        const alerta = page.getByRole("main").getByRole("alert");
        const mensaje = await alerta.innerText().catch(() => "(sin alerta visible)");
        console.log(
          "[persona1][HALLAZGO] la compra de un artículo de tecnología recién publicado (en revisión, sin aprobar por un moderador) no se pudo completar. URL:",
          page.url(),
          "Mensaje mostrado:",
          mensaje
        );
        await page.screenshot({ path: CAP("compra-bloqueada-en-revision", "movil"), fullPage: true });
      }
    });

    console.log(
      "[persona1] correo comprador:", email,
      "pedido:", orderUrl || "(no se completó)",
      "compra bloqueada por moderación pendiente:", compraBloqueada
    );

    // --- Pase de escritorio: reusa la sesión para las pantallas clave ---
    const state = await ctx.storageState();
    await ctx.close();

    const deskCtx = await browser.newContext({ viewport: DESKTOP, storageState: state });
    const desk = await deskCtx.newPage();

    await desk.goto("/");
    await desk.screenshot({ path: CAP("inicio", "escritorio"), fullPage: true });

    await desk.goto("/buscar?categoria=tecnologia");
    await desk.getByLabel("Precio mínimo").fill("500000");
    await desk.getByLabel("Precio máximo").fill("1000000");
    await desk.getByRole("button", { name: "Aplicar" }).click();
    await desk.screenshot({ path: CAP("busqueda-filtros", "escritorio"), fullPage: true });

    await desk.goto(`/producto/${listingId}`);
    await expect(desk.getByRole("heading", { name: titulo })).toBeVisible({ timeout: 15_000 });
    await desk.screenshot({ path: CAP("ficha", "escritorio"), fullPage: true });

    if (orderUrl) {
      await desk.goto(orderUrl);
      await desk.screenshot({ path: CAP("pedido-estado", "escritorio"), fullPage: true });
    } else {
      console.log("[persona1] sin pedido completado: no hay captura de pedido-estado en escritorio.");
    }

    await deskCtx.close();
  });

  test("accesibilidad: la ficha del producto solo con teclado", async ({ browser }) => {
    const { listingId } = await sellerPublishesPhone(browser);
    const ctx = await browser.newContext({ viewport: MOBILE });
    const page = await ctx.newPage();
    await page.goto(`/producto/${listingId}`);

    const foco: string[] = [];
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press("Tab");
      const info = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        if (!el || el === document.body) return "sin foco";
        const label =
          el.getAttribute("aria-label") ||
          el.textContent?.trim().slice(0, 40) ||
          el.tagName;
        const visible = getComputedStyle(el).outlineStyle !== "none" ||
          getComputedStyle(el).boxShadow !== "none";
        return `${el.tagName}:${label} outline-visible=${visible}`;
      });
      foco.push(info);
    }
    console.log("[persona1][a11y] orden de foco en la ficha:\n" + foco.join("\n"));
    await page.screenshot({ path: CAP("a11y-foco-ficha", "movil"), fullPage: true });

    // Zoom 200%.
    await page.evaluate(() => {
      document.body.style.zoom = "2";
    });
    await page.screenshot({ path: CAP("a11y-zoom200", "movil"), fullPage: true });
    await page.evaluate(() => {
      document.body.style.zoom = "1";
    });

    await ctx.close();

    // Modo oscuro del sistema.
    const darkCtx = await browser.newContext({ viewport: MOBILE, colorScheme: "dark" });
    const darkPage = await darkCtx.newPage();
    await darkPage.goto(`/producto/${listingId}`);
    await darkPage.screenshot({ path: CAP("a11y-modo-oscuro", "movil"), fullPage: true });
    await darkCtx.close();
  });
});
