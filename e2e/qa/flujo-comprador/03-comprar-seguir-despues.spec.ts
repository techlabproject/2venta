import { test, expect, type Page } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { aceptarTerminos } from "../../helpers";

// flujo-comprador · ronda de diseño 2026-09-13
// Pasos 3 a 8 del brief: evaluar, preguntar/negociar, comprar (envío + carrito),
// seguir el pedido, reclamar, y después (calificar/favoritos/avisos).
// Corre contra la nube y crea sus propias cuentas y publicaciones (no depende de
// datos de demostración que otros agentes puedan estar modificando a la vez).

const LOG_GROUP = "/2venta-dev/web";
const EVID = "qa/ronda-diseno/evidencia-flujo-comprador";
const PASSWORD = "unaClaveLarga1";

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
    try {
      const out = execFileSync(
        "aws",
        ["logs", "tail", LOG_GROUP, "--since", "5m", "--filter-pattern", `"código para +57${phone}"`],
        { encoding: "utf8", env: { ...process.env, AWS_PROFILE: "2venta" } }
      );
      const m = out.match(/código para \+57\d+: (\d{6})/);
      if (m) return m[1];
    } catch { /* reintenta */ }
    execFileSync("sleep", ["3"]);
  }
  throw new Error(`no llegó el código para ${phone}`);
}

async function signUp(page: Page, prefix: string, name: string, rol: "comprador" | "vendedor") {
  const { phone, email } = unique(prefix);
  await page.goto(`/registro?rol=${rol}`);
  await page.getByLabel("Nombre").fill(name);
  await page.getByLabel("Correo").fill(email);
  await page.getByLabel("Celular").fill(phone);
  await page.getByLabel("Contraseña").fill(PASSWORD);
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

async function publishListing(page: Page, title: string, price: string) {
  await page.goto("/publicar");
  await page.getByRole("button", { name: "Abrir cámara" }).click();
  await page.getByRole("button", { name: /^Grabar/ }).click();
  await expect(page.getByText(/Grabando/)).toBeVisible();
  await page.waitForTimeout(1200);
  await page.getByRole("button", { name: "Terminar" }).click();
  await expect(page.getByRole("status")).toContainText("Video listo", { timeout: 20_000 });

  await page.getByLabel("Título").fill(title);
  await page.getByLabel("Categoría").selectOption("ropa");
  await page.getByLabel("Precio").fill(price);
  await page.getByLabel("Descripción").fill("Publicado por la QA de flujo-comprador.");
  await page.getByRole("button", { name: "Publicar" }).click();
  await expect(page).toHaveURL(/\/producto\//, { timeout: 60_000 });
  return page.url();
}

test.setTimeout(360_000);

test("circuito del comprador: evaluar, negociar, comprar en carrito, seguir, reclamar, calificar", async ({ browser }) => {
  const sellerCtx = await browser.newContext();
  const seller = await sellerCtx.newPage();
  await test.step("vendedor: registro + KYC", async () => {
    await signUp(seller, "vendedor-fc", "Andrés Vendedor FC", "vendedor");
    await seller.goto("/vender");
    const empezar = seller.getByRole("button", { name: "Empezar verificación" });
    if (await empezar.count()) {
      await empezar.click();
      await expect(seller).toHaveURL(/\/dev\/kyc\//, { timeout: 15_000 });
      await seller.getByRole("button", { name: "Simular aprobación" }).click();
      await expect(seller).toHaveURL(/\/vender/, { timeout: 15_000 });
    }
    console.log("Panel /vender del vendedor tras KYC:", await seller.locator("main").innerText());
  });

  let listingA = "", listingB = "", listingC = "";
  await test.step("vendedor: publica 3 artículos de ropa", async () => {
    const suf = Date.now();
    listingA = await publishListing(seller, `QA Camiseta carrito ${suf}`, "45000");
    listingB = await publishListing(seller, `QA Chaqueta carrito ${suf}`, "60000");
    listingC = await publishListing(seller, `QA Artículo para chat y reclamo ${suf}`, "150000");
    console.log("Publicados:", { listingA, listingB, listingC });
  });

  const buyerCtx = await browser.newContext();
  const buyer = await buyerCtx.newPage();
  await test.step("comprador: registro", async () => {
    await signUp(buyer, "comprador-fc", "Laura Compradora FC", "comprador");
  });

  await test.step("evaluar producto: video, fotos, precio, estado, vendedor", async () => {
    await buyer.goto(listingC);
    const texto = await buyer.locator("main").innerText();
    console.log("FICHA (evaluar), texto completo:\n", texto);
    const video = await buyer.locator('[data-testid="video-articulo"]').count();
    console.log("¿Tiene video la ficha?:", video > 0);
    await buyer.screenshot({ path: `${EVID}/10-ficha-evaluar-logueado.png`, fullPage: true });
  });

  await test.step("preguntar público con teléfono: ¿se filtra y se explica?", async () => {
    await buyer.goto(listingC);
    const pregunta = buyer.getByPlaceholder("Pregunta algo del producto");
    await pregunta.fill("Hola, llámame al 3004128805 para verlo hoy");
    await buyer.getByRole("button", { name: "Preguntar" }).click();
    await buyer.waitForTimeout(1500);
    const seccion = await buyer.getByRole("heading", { name: "Preguntas" }).locator("xpath=..").innerText();
    console.log("Sección Preguntas tras publicar una con teléfono:\n", seccion);
    await buyer.screenshot({ path: `${EVID}/11-pregunta-publica-con-telefono.png`, fullPage: true });
  });

  await test.step("chat: mensaje con teléfono (debe filtrarse y avisar), y negociación de precio (NO debe tacharse)", async () => {
    await buyer.goto(listingC);
    await buyer.getByRole("button", { name: /escribirle al vendedor/i }).click();
    await expect(buyer).toHaveURL(/\/chat\//, { timeout: 15_000 });

    const msg = buyer.getByLabel("Mensaje");
    await msg.fill("Mi celular es 3004128805, hablamos por ahí mejor");
    await buyer.getByRole("button", { name: "Enviar" }).click();
    await buyer.waitForTimeout(1200);

    await msg.fill("¿Me lo dejas en 130.000?");
    await buyer.getByRole("button", { name: "Enviar" }).click();
    await buyer.waitForTimeout(1200);

    const cuerpoChat = await buyer.locator("main").innerText();
    console.log("CHAT tras los dos mensajes:\n", cuerpoChat);
    const avisoFiltro = await buyer.locator('[data-testid="aviso-filtro"]').count();
    console.log("¿Aparece el aviso de filtro para el mensaje con teléfono?:", avisoFiltro > 0);
    console.log("¿El mensaje de negociación '130.000' sigue visible sin tachar?:", cuerpoChat.includes("130.000"));
    await buyer.screenshot({ path: `${EVID}/12-chat-filtro-y-negociacion.png`, fullPage: true });

    // Oferta formal
    await buyer.getByLabel("Cuánto ofreces").fill("130000");
    await buyer.getByRole("button", { name: "Ofertar" }).click();
    await buyer.waitForTimeout(1000);
    console.log("¿Aparece la oferta en el chat?:", (await buyer.locator('[data-testid="oferta"]').count()) > 0);
    await buyer.screenshot({ path: `${EVID}/13-chat-oferta.png`, fullPage: true });
  });

  await test.step("carrito: dos artículos del mismo vendedor, ¿el total se entiende?", async () => {
    await buyer.goto(listingA);
    await buyer.getByRole("button", { name: "Agregar al carrito" }).click();
    await buyer.waitForTimeout(800);
    await buyer.goto(listingB);
    await buyer.getByRole("button", { name: "Agregar al carrito" }).click();
    await buyer.waitForTimeout(800);

    await buyer.goto("/carrito");
    const textoCarrito = await buyer.locator("main").innerText();
    console.log("CARRITO con dos artículos:\n", textoCarrito);
    await buyer.screenshot({ path: `${EVID}/14-carrito-dos-articulos.png`, fullPage: true });
  });

  let pedidoEnvioUrl = "";
  await test.step("comprar con envío: dirección, guía, total antes de pagar", async () => {
    await buyer.getByRole("link", { name: "Ir a pagar" }).click();
    await expect(buyer).toHaveURL(/\/comprar\/carrito/, { timeout: 15_000 });
    await buyer.getByLabel("Quién recibe").fill("Laura Compradora FC");
    await buyer.getByLabel("Celular de quien recibe").fill("300 412 88 05");
    await buyer.getByLabel("Dirección").fill("Calle 45 # 13-20, apto 301");
    await buyer.getByLabel("Zona").selectOption("Chapinero");
    const totalAntes = await buyer.getByTestId("total-checkout").innerText();
    console.log("Total mostrado ANTES de pagar (carrito, envío):", totalAntes);
    await buyer.screenshot({ path: `${EVID}/15-checkout-envio-total.png`, fullPage: true });

    await buyer.getByRole("button", { name: "Ir a pagar" }).click();
    await expect(buyer).toHaveURL(/\/dev\/pago\//, { timeout: 15_000 });
    await buyer.getByRole("button", { name: "Simular pago aprobado" }).click();
    await expect(buyer).toHaveURL(/\/pedido\//, { timeout: 15_000 });
    pedidoEnvioUrl = buyer.url();
    const textoPedido = await buyer.locator("main").innerText();
    console.log("PEDIDO recién pagado (envío):\n", textoPedido);
    await buyer.screenshot({ path: `${EVID}/16-pedido-recien-pagado.png`, fullPage: true });
  });

  await test.step("comprador confirma recepción y libera el pago", async () => {
    await buyer.getByRole("button", { name: /ya lo recib.*liberar pago/i }).click();
    await buyer.waitForTimeout(1500);
    const estado = await buyer.getByTestId("estado").innerText();
    console.log("Estado del pedido tras confirmar recepción:", estado);
    await buyer.screenshot({ path: `${EVID}/17-pedido-liberado.png`, fullPage: true });
  });

  await test.step("calificar al vendedor tras la compra", async () => {
    await buyer.goto(pedidoEnvioUrl);
    const yaCalificado = await buyer.getByTestId("ya-calificado").count();
    if (!yaCalificado) {
      await buyer.locator('input[name="stars"][value="5"]').check();
      await buyer.getByLabel("Tu reseña").fill("Todo perfecto, tal cual el video.");
      await buyer.getByRole("button", { name: "Calificar" }).click();
      await buyer.waitForTimeout(1000);
    }
    console.log("¿Se ve confirmación de calificación?:", (await buyer.getByTestId("ya-calificado").count()) > 0);
    await buyer.screenshot({ path: `${EVID}/18-pedido-calificado.png`, fullPage: true });
  });

  await test.step("ver la calificación desde el perfil del vendedor", async () => {
    await buyer.goto(listingC);
    await buyer.locator('a[href^="/vendedor/"]').first().click();
    await buyer.waitForLoadState("networkidle");
    console.log("Perfil del vendedor tras la venta:\n", await buyer.locator("main").innerText());
    await buyer.screenshot({ path: `${EVID}/19-perfil-vendedor-tras-venta.png`, fullPage: true });
  });

  let pedidoDisputaUrl = "";
  await test.step("comprar el tercer artículo y abrir un reclamo (sin confirmar recepción)", async () => {
    await buyer.goto(listingC);
    await buyer.getByRole("link", { name: /comprar con pago protegido/i }).click();
    await expect(buyer).toHaveURL(/\/comprar\//, { timeout: 15_000 });
    await buyer.getByLabel("Quién recibe").fill("Laura Compradora FC");
    await buyer.getByLabel("Celular de quien recibe").fill("300 412 88 05");
    await buyer.getByLabel("Dirección").fill("Calle 45 # 13-20, apto 301");
    await buyer.getByLabel("Zona").selectOption("Chapinero");
    await buyer.getByRole("button", { name: "Ir a pagar" }).click();
    await expect(buyer).toHaveURL(/\/dev\/pago\//, { timeout: 15_000 });
    await buyer.getByRole("button", { name: "Simular pago aprobado" }).click();
    await expect(buyer).toHaveURL(/\/pedido\//, { timeout: 15_000 });
    pedidoDisputaUrl = buyer.url();

    const abrirReclamo = buyer.getByText("Tengo un problema con el pedido");
    await abrirReclamo.click();
    await buyer.locator('input[name="kind"][value="no_coincide"]').check();
    await buyer.getByLabel("Qué pasó").fill("Llegó de otro color, no el que mostraba el video.");
    // ¿Hay algún campo para adjuntar una foto?
    const inputArchivo = buyer.locator('input[type="file"]');
    console.log("¿Hay un campo para subir evidencia (foto) en el reclamo?:", (await inputArchivo.count()) > 0);
    await buyer.getByRole("button", { name: "Abrir reclamo" }).click();
    await buyer.waitForTimeout(1500);

    const textoReclamo = await buyer.locator("main").innerText();
    console.log("PEDIDO con reclamo abierto:\n", textoReclamo);
    console.log("¿Menciona el plazo de 48 horas en algún lado visible?:", textoReclamo.includes("48"));
    await buyer.screenshot({ path: `${EVID}/20-pedido-reclamo-abierto.png`, fullPage: true });
  });

  await test.step("después: favoritos y búsqueda guardada", async () => {
    await buyer.goto(listingA);
    const fav = buyer.getByTestId("favorito");
    if (await fav.count()) {
      await fav.click();
      await buyer.waitForTimeout(800);
    }
    await buyer.goto("/favoritos");
    console.log("FAVORITOS:\n", await buyer.locator("main").innerText());
    await buyer.screenshot({ path: `${EVID}/21-favoritos.png`, fullPage: true });

    await buyer.goto("/buscar?q=ropa");
    const avisame = buyer.getByText(/^Avísame cuando aparezca/);
    if (await avisame.count()) {
      await avisame.click();
      await buyer.getByLabel("Nombre de la búsqueda").fill("Ropa QA flujo-comprador");
      await buyer.getByRole("button", { name: "Guardar" }).click();
      await buyer.waitForTimeout(800);
    }
    await buyer.goto("/avisos");
    console.log("AVISOS (búsquedas guardadas):\n", await buyer.locator("main").innerText());
    await buyer.screenshot({ path: `${EVID}/22-avisos-busqueda-guardada.png`, fullPage: true });
  });

  await test.step("después: ver mis compras", async () => {
    await buyer.goto("/actividad");
    console.log("ACTIVIDAD / mis compras:\n", await buyer.locator("main").innerText());
    await buyer.screenshot({ path: `${EVID}/23-actividad-mis-compras.png`, fullPage: true });
  });

  await sellerCtx.close();
  await buyerCtx.close();
});
