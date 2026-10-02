import { expect, test, type Page } from "@playwright/test";
import { sellerWithListing, signUpVerified } from "./helpers";

// La prueba de punta a punta de la D-77: la barra inferior del mockup (1d).
//
// Lo que importa no es que la barra exista, sino que sea la navegación de verdad
// en un teléfono: que lleve a los cinco destinos, que diga en cuál estás, y que
// no aparezca donde no hace falta.

const MOVIL = { width: 390, height: 844 };

const barra = (page: Page) => page.getByRole("navigation", { name: "Navegación principal" });

test("en un teléfono la barra lleva a los cinco destinos y marca dónde estás", async ({
  browser,
}) => {
  const { context, page } = await sellerWithListing(browser, "Lámpara de pie", 90_000);
  await page.setViewportSize(MOVIL);
  await page.goto("/");

  // Inicio está marcado por ser donde estamos. `aria-current` es lo que un lector
  // de pantalla anuncia; el color solo sirve para quien ve.
  await expect(barra(page).getByRole("link", { name: "Inicio" })).toHaveAttribute(
    "aria-current",
    "page"
  );

  await barra(page).getByRole("link", { name: "Buscar" }).click();
  await expect(page).toHaveURL(/\/buscar/);
  await expect(barra(page).getByRole("link", { name: "Buscar" })).toHaveAttribute(
    "aria-current",
    "page"
  );

  // «Chats» lleva a la bandeja de conversaciones, no a la pantalla de pedidos
  // (S-35). Antes el rótulo decía una cosa y el destino era otra.
  await barra(page).getByRole("link", { name: "Chats" }).click();
  await expect(page).toHaveURL(/\/chats/);
  await expect(barra(page).getByRole("link", { name: "Chats" })).toHaveAttribute(
    "aria-current",
    "page"
  );

  await barra(page).getByRole("link", { name: "Perfil" }).click();
  await expect(page).toHaveURL(/\/cuenta/);

  // El botón del centro es publicar, y para una vendedora verificada va directo.
  await barra(page).getByRole("link", { name: "Publicar un artículo" }).click();
  await expect(page).toHaveURL(/\/publicar/);

  await context.close();
});

test("quien todavía no verificó su identidad acaba donde se le explica", async ({
  page,
}) => {
  await signUpVerified(page, "compradora", "Laura Torres");
  await page.setViewportSize(MOVIL);
  await page.goto("/");

  // El mismo botón para todo el mundo: publicar manda a verificar cuando falta,
  // en vez de esconderse y dejar a la persona sin saber qué le falta (D-02).
  await barra(page).getByRole("link", { name: "Publicar un artículo" }).click();
  await expect(page).toHaveURL(/\/vender/);
});

test("la barra no estorba donde no hace falta", async ({ browser }) => {
  const { context, page } = await sellerWithListing(browser, "Silla de escritorio", 150_000);

  // En escritorio la navegación ya está en la cabecera; dos barras serían dos
  // sitios distintos para lo mismo.
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  await expect(barra(page)).toBeHidden();
  await expect(page.getByRole("banner").getByRole("link", { name: "Explorar" })).toBeVisible();

  await context.close();
});

test("sin sesión no hay barra", async ({ page }) => {
  await page.setViewportSize(MOVIL);
  await page.goto("/");
  await expect(barra(page)).toHaveCount(0);
});

test("la barra no tapa el final de la página", async ({ browser }) => {
  const { context, page } = await sellerWithListing(browser, "Mesa plegable", 120_000);
  await page.setViewportSize(MOVIL);
  await page.goto("/");

  // El hueco reservado en el flujo es lo que evita que el último artículo del
  // catálogo quede debajo de la barra y no se pueda tocar.
  // Se mide cuando la página ya no se mueve: antes medía mientras cargaban las
  // imágenes, el final se corría y la prueba fallaba una vez sí y otra no.
  await page.waitForLoadState("networkidle");
  await page.evaluate(async () => {
    await Promise.all([...document.images].map((i) => (i.complete ? null : i.decode().catch(() => null))));
    window.scrollTo(0, document.documentElement.scrollHeight);
  });
  const ultimo = page.getByRole("main").getByRole("listitem").last();
  await expect(ultimo).toBeVisible();
  await page.waitForTimeout(200);
  const tapado = await ultimo.evaluate((el) => {
    const nav = document
      .querySelector('nav[aria-label="Navegación principal"]')!
      .getBoundingClientRect();
    const caja = el.getBoundingClientRect();
    return caja.bottom > nav.top && caja.top < nav.bottom;
  });
  expect(tapado).toBe(false);

  await context.close();
});

// Revisión de diseño (D-130, decisión 2 de Nicolás): en las pantallas de una tarea
// —comprar, pagar, publicar, editar, chat, pedido— la barra tapaba campos y botones.
// Ahí no aparece; en las de explorar sigue.
test("la barra se esconde en las tareas y sigue en las pantallas de explorar", async ({ browser }) => {
  const seller = await sellerWithListing(browser, `Tarea ${Date.now()}`, 70_000, "ropa");
  const ctx = await browser.newContext({ viewport: MOVIL });
  const page = await ctx.newPage();
  await signUpVerified(page, "comprador", "Comprador Atento");

  for (const ruta of ["/", "/buscar", "/chats", "/cuenta", "/favoritos", `/producto/${seller.listingId}`]) {
    await page.goto(ruta);
    await expect(barra(page), ruta).toBeVisible();
  }
  await page.goto(`/comprar/${seller.listingId}`);
  await expect(page.getByLabel("Quién recibe")).toBeVisible();
  await expect(barra(page)).toHaveCount(0);

  await page.getByLabel("Quién recibe").fill("Nombre Apellido");
  await page.getByLabel("Celular de quien recibe").fill("300 412 88 05");
  await page.getByLabel("Dirección").fill("Calle 72 #10-34");
  await page.getByLabel("Zona").selectOption("Chapinero");
  await page.getByRole("button", { name: "Ir a pagar" }).click();
  await expect(page).toHaveURL(/\/dev\/pago\//);
  await expect(barra(page)).toHaveCount(0);
  // Sin barra, la pantalla de pago necesita su propia salida (Luna, tanda 2).
  await expect(page.getByRole("link", { name: "Volver" })).toBeVisible();
  await page.getByRole("button", { name: "Simular pago aprobado" }).click();
  await expect(page).toHaveURL(/\/pedido\//);
  await expect(barra(page)).toHaveCount(0);

  await seller.page.setViewportSize(MOVIL);
  for (const ruta of ["/publicar", `/producto/${seller.listingId}/editar`]) {
    await seller.page.goto(ruta);
    await expect(seller.page.getByRole("main")).toBeVisible();
    await expect(barra(seller.page), ruta).toHaveCount(0);
  }

  await seller.context.close();
  await ctx.close();
});
