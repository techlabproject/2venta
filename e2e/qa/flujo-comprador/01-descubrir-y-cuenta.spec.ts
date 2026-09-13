import { test, expect } from "@playwright/test";

// flujo-comprador · ronda de diseño 2026-09-13
// Paso 1 del brief: descubrir sin cuenta, y qué pasa cuando la app pide cuenta.
// Corre contra la nube (QA_BASE_URL). No toca la base local.

const EVID = "qa/ronda-diseno/evidencia-flujo-comprador";

test("anonimo: portada, buscar, filtrar, abrir ficha", async ({ page }) => {
  await page.goto("/");
  await page.screenshot({ path: `${EVID}/01-portada-anonimo.png`, fullPage: true });

  const heading = await page.locator("main").first().innerText();
  console.log("PORTADA (primeros 300 car.):", heading.slice(0, 300));

  // Buscar
  const buscador = page.getByPlaceholder(/busca/i);
  await buscador.fill("bicicleta");
  await page.getByRole("button", { name: /buscar/i }).click();
  await page.waitForLoadState("networkidle");
  console.log("URL tras buscar 'bicicleta':", page.url());
  await page.screenshot({ path: `${EVID}/02-resultados-busqueda.png`, fullPage: true });

  // Filtrar por categoria desde la portada
  await page.goto("/");
  const chip = page.getByRole("link", { name: "Tecnología" }).or(page.getByRole("button", { name: "Tecnología" }));
  if (await chip.count()) {
    await chip.first().click();
    await page.waitForLoadState("networkidle");
    console.log("URL tras filtrar Tecnología:", page.url());
  } else {
    console.log("No encontré un chip/enlace 'Tecnología' clicable para filtrar.");
  }
});

test("anonimo: abre una ficha y ve lo que necesita para decidir", async ({ page }) => {
  await page.goto("/");
  const primerProducto = page.locator('a[href^="/producto/"]').first();
  await primerProducto.waitFor();
  const href = await primerProducto.getAttribute("href");
  await primerProducto.click();
  await page.waitForLoadState("networkidle");
  console.log("Ficha abierta:", page.url(), "href original:", href);

  const tieneVideo = await page.locator('video, [data-testid="video-articulo"]').count();
  const tienePrecio = await page.locator("text=/\\$\\s?[\\d.]+/").count();
  const tieneVendedorLink = await page.locator('a[href^="/vendedor/"]').count();
  console.log("¿Tiene <video>?:", tieneVideo > 0, "| ¿muestra precio?:", tienePrecio > 0, "| ¿enlaza al vendedor?:", tieneVendedorLink > 0);

  await page.screenshot({ path: `${EVID}/03-ficha-anonimo.png`, fullPage: true });

  // Preguntas publicas: hay formulario para preguntar sin cuenta?
  const formPregunta = page.getByPlaceholder("Pregunta algo del producto");
  console.log("¿Hay formulario de pregunta pública visible sin sesión?:", await formPregunta.count() > 0);
  const seccionPreguntas = page.getByRole("heading", { name: "Preguntas" });
  if (await seccionPreguntas.count()) {
    const textoSeccion = await seccionPreguntas.locator("xpath=..").innerText();
    console.log("Texto de la sección Preguntas para anónimo:", textoSeccion.slice(0, 300));
  }

  // Ir al perfil del vendedor
  const linkVendedor = page.locator('a[href^="/vendedor/"]').first();
  if (await linkVendedor.count()) {
    await linkVendedor.click();
    await page.waitForLoadState("networkidle");
    console.log("Perfil de vendedor (anónimo):", page.url());
    await page.screenshot({ path: `${EVID}/04-perfil-vendedor-anonimo.png`, fullPage: true });
    const textoPerfil = await page.locator("main").innerText();
    console.log("Texto perfil vendedor (anónimo), primeros 500:", textoPerfil.slice(0, 500));
    console.log("¿Menciona el perfil dónde escribirle?:", /escrib|chat|conversaci/i.test(textoPerfil));
  }
});

test("anonimo: clic en Comprar te manda a iniciar sesión, ¿te explica por qué y te devuelve?", async ({ page }) => {
  await page.goto("/");
  const primerProducto = page.locator('a[href^="/producto/"]').first();
  await primerProducto.click();
  await page.waitForLoadState("networkidle");
  const urlFicha = page.url();
  console.log("Ficha de partida:", urlFicha);

  const comprar = page.getByRole("link", { name: /comprar con pago protegido/i });
  if (await comprar.count()) {
    await comprar.click();
    await page.waitForLoadState("networkidle");
    console.log("URL tras clic en 'Comprar con pago protegido' siendo anónimo:", page.url());
    const textoIngresar = await page.locator("body").innerText();
    console.log("Texto completo de la pantalla a la que caí:", textoIngresar.slice(0, 400));
    await page.screenshot({ path: `${EVID}/05-anonimo-comprar-redirige.png`, fullPage: true });
  } else {
    console.log("No encontré el botón 'Comprar con pago protegido' en esta ficha.");
  }
});

test("anonimo: clic en Escribirle al vendedor te manda a iniciar sesión, ¿te explica por qué y te devuelve?", async ({ page }) => {
  await page.goto("/");
  const primerProducto = page.locator('a[href^="/producto/"]').first();
  await primerProducto.click();
  await page.waitForLoadState("networkidle");
  const urlFicha = page.url();

  const escribir = page.getByRole("button", { name: /escribirle al vendedor/i });
  if (await escribir.count()) {
    await escribir.click();
    await page.waitForLoadState("networkidle");
    console.log("Ficha de partida:", urlFicha, "-> URL tras 'Escribirle al vendedor' anónimo:", page.url());
    const texto = await page.locator("body").innerText();
    console.log("Texto de la pantalla a la que caí:", texto.slice(0, 400));
    await page.screenshot({ path: `${EVID}/06-anonimo-chat-redirige.png`, fullPage: true });

    // ¿Después de iniciar sesión, vuelve a la ficha o va a la portada?
    await page.getByLabel("Correo").fill("laura@2venta.demo");
    await page.getByLabel("Contraseña").fill("Demo2venta.2026");
    await page.getByRole("button", { name: "Iniciar sesión" }).click();
    await page.waitForLoadState("networkidle");
    console.log("URL después de iniciar sesión (¿volvió a la ficha", urlFicha, "?):", page.url());
    await page.screenshot({ path: `${EVID}/07-tras-login-a-donde-cae.png`, fullPage: true });
  } else {
    console.log("No encontré el botón 'Escribirle al vendedor' en esta ficha.");
  }
});
