import { test, expect } from "@playwright/test";

const PASSWORD = "Demo2venta.2026";

async function login(page: import("@playwright/test").Page, email: string) {
  await page.goto("/ingresar");
  await page.getByLabel(/correo/i).fill(email);
  await page.getByLabel(/contraseña/i).fill(PASSWORD);
  await page.getByRole("button", { name: /entrar/i }).click();
  await page.waitForLoadState("networkidle");
}

test("anonimo: portada, cabecera, 404, rutas a mano", async ({ page }) => {
  await page.goto("/");
  console.log("TITLE /:", await page.title());
  const headerLinks = await page.locator("header a").allTextContents();
  console.log("Enlaces cabecera (sin sesion):", headerLinks);

  // 404
  await page.goto("/no-existe-esta-ruta");
  console.log("TITLE 404:", await page.title());
  console.log("BODY 404 incluye salida:", (await page.locator("main").innerText()).slice(0, 200));

  // rutas protegidas a mano
  for (const ruta of ["/admin", "/publicar", "/vender/metricas", "/cuenta"]) {
    await page.goto(ruta);
    console.log(`Anonimo -> ${ruta}: url final = ${page.url()}, titulo = ${await page.title()}`);
  }
});

test("compradora laura: perfil vendedor, chat, volver, cabecera", async ({ page }) => {
  await login(page, "laura@2venta.demo");
  await page.goto("/");
  console.log("TITLE / logueada:", await page.title());
  const headerLinks = await page.locator("header a").allTextContents();
  console.log("Enlaces cabecera (compradora):", headerLinks);

  // ir a un producto desde el feed
  const primerProducto = page.locator("main ul li a").first();
  await primerProducto.click();
  await page.waitForLoadState("networkidle");
  console.log("URL producto desde feed:", page.url());
  console.log("TITLE producto:", await page.title());

  // ir al perfil del vendedor
  const linkVendedor = page.locator('a[href^="/vendedor/"]').first();
  await linkVendedor.click();
  await page.waitForLoadState("networkidle");
  console.log("URL perfil vendedor:", page.url());
  const perfilLinks = await page.locator("main a").allTextContents();
  console.log("Enlaces en perfil de vendedor:", perfilLinks);
  const tieneChat = perfilLinks.some((t) => /chat|escrib|mensaj|contact/i.test(t));
  console.log("Tiene enlace a chat desde perfil vendedor:", tieneChat);

  // volver
  const volver = page.locator("text=Volver").first();
  if (await volver.count()) {
    await volver.click();
    await page.waitForLoadState("networkidle");
    console.log("URL tras Volver desde perfil vendedor:", page.url());
  }

  // Buscar -> producto -> volver
  await page.goto("/buscar?q=a");
  await page.waitForLoadState("networkidle");
  const productoBusqueda = page.locator('a[href^="/producto/"]').first();
  if (await productoBusqueda.count()) {
    const hrefBuscado = await productoBusqueda.getAttribute("href");
    await productoBusqueda.click();
    await page.waitForLoadState("networkidle");
    console.log("Desde busqueda entre a:", page.url(), "esperado contenia", hrefBuscado);
    const volverBusqueda = page.locator("text=Volver").first();
    if (await volverBusqueda.count()) {
      await volverBusqueda.click();
      await page.waitForLoadState("networkidle");
      console.log("URL tras Volver desde ficha llegada por busqueda:", page.url());
    }
  }

  // Favoritos -> producto -> volver
  await page.goto("/favoritos");
  await page.waitForLoadState("networkidle");
  const productoFav = page.locator('a[href^="/producto/"]').first();
  if (await productoFav.count()) {
    await productoFav.click();
    await page.waitForLoadState("networkidle");
    console.log("Desde favoritos entre a:", page.url());
    const volverFav = page.locator("text=Volver").first();
    if (await volverFav.count()) {
      await volverFav.click();
      await page.waitForLoadState("networkidle");
      console.log("URL tras Volver desde ficha llegada por favoritos:", page.url());
    }
  } else {
    console.log("Sin favoritos guardados para laura; no se pudo probar ese origen.");
  }

  // rutas a mano que no le corresponden
  for (const ruta of ["/admin", "/vender/metricas", "/tienda"]) {
    await page.goto(ruta);
    console.log(`Compradora -> ${ruta}: url final = ${page.url()}, titulo = ${await page.title()}`);
  }
});

test("vendedor andres: encontrar mis publicaciones y vender desde la cabecera", async ({ page }) => {
  await login(page, "andres@2venta.demo");
  await page.goto("/");
  const headerLinks = await page.locator("header a").allTextContents();
  const headerHrefs = await page.locator("header a").evaluateAll((els) =>
    els.map((e) => (e as HTMLAnchorElement).getAttribute("href"))
  );
  console.log("Enlaces cabecera (vendedor verificado):", headerLinks, headerHrefs);

  // Intento de click-only: desde la portada, cuantos clics hacen falta para
  // llegar a /vender/metricas siguiendo solo enlaces visibles
  const encontroEnCabecera = headerHrefs.some((h) => h && /vender|publicar|tienda/.test(h));
  console.log("La cabecera ofrece un enlace para vender/publicar/mis productos:", encontroEnCabecera);

  // probar /cuenta tambien
  await page.goto("/cuenta");
  const cuentaLinks = await page.locator("main a").evaluateAll((els) =>
    els.map((e) => (e as HTMLAnchorElement).getAttribute("href"))
  );
  console.log("Enlaces dentro de /cuenta:", cuentaLinks);

  // acceso directo (para confirmar que la pantalla SI funciona, solo que no se llega por clic)
  await page.goto("/vender/metricas");
  console.log("TITLE /vender/metricas:", await page.title());
  console.log("URL final /vender/metricas:", page.url());
});

test("tienda camila: cabecera y acceso a tienda", async ({ page }) => {
  await login(page, "camila@2venta.demo");
  await page.goto("/");
  const headerHrefs = await page.locator("header a").evaluateAll((els) =>
    els.map((e) => (e as HTMLAnchorElement).getAttribute("href"))
  );
  console.log("Enlaces cabecera (tienda):", headerHrefs);
  await page.goto("/tienda");
  console.log("TITLE /tienda:", await page.title());
});

test("admin: cabecera y navegacion del panel", async ({ page }) => {
  await login(page, "admin@2venta.demo");
  await page.goto("/");
  const headerHrefs = await page.locator("header a").evaluateAll((els) =>
    els.map((e) => (e as HTMLAnchorElement).getAttribute("href"))
  );
  console.log("Enlaces cabecera (admin):", headerHrefs);
  const tieneAdminEnCabecera = headerHrefs.some((h) => h && h.includes("/admin"));
  console.log("La cabecera del admin enlaza a /admin:", tieneAdminEnCabecera);

  await page.goto("/admin");
  console.log("TITLE /admin:", await page.title());
  const adminLinks = await page.locator("main a").evaluateAll((els) =>
    els.map((e) => (e as HTMLAnchorElement).getAttribute("href"))
  );
  console.log("Enlaces dentro de /admin:", adminLinks);
});
