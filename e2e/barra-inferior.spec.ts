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

  await barra(page).getByRole("link", { name: "Chats" }).click();
  await expect(page).toHaveURL(/\/actividad/);

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
  await page.keyboard.press("End");
  const ultimo = page.getByRole("main").getByRole("listitem").last();
  await expect(ultimo).toBeVisible();
  await ultimo.scrollIntoViewIfNeeded();
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
