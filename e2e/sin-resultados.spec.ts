import { test, expect } from "@playwright/test";
import { signUpVerified, uniqueAccount } from "./helpers";

// Corrección 5 (Catalina, 2026-09-22): «No encontramos nada con eso.» sonaba seco
// justo cuando alguien decide si se va. Ahora nombra lo buscado, consuela y da
// salidas como botones, incluido el aviso de cuando aparezca.

const vacio = (page: import("@playwright/test").Page) => page.getByTestId("sin-resultados");

test("sin resultados nombra lo buscado y da salidas", async ({ page }) => {
  await page.goto("/buscar?q=submarino");
  await expect(vacio(page)).toContainText("¡Uy! Por ahora no hay «submarino»");
  await expect(vacio(page)).toContainText("lo que hoy no está puede aparecer mañana");
  // Sin filtros no hay nada que quitar.
  await expect(vacio(page).getByRole("link", { name: "Quitar filtros" })).toHaveCount(0);

  await vacio(page).getByRole("link", { name: "Ver todo lo publicado" }).click();
  await expect(page).toHaveURL(/\/buscar$/);
});

test("con palabra y filtros, «Quitar filtros» conserva la palabra", async ({ page }) => {
  await page.goto("/buscar?q=submarino&categoria=ninos");
  await expect(vacio(page)).toContainText("«submarino» con esos filtros");
  await expect(vacio(page).getByRole("link", { name: "Quitar filtros" })).toHaveAttribute(
    "href",
    "/buscar?q=submarino",
  );
});

test("en la portada, una combinación vacía también lo explica", async ({ page }) => {
  await page.goto("/?categoria=tecnologia&max=999");
  await expect(vacio(page)).toContainText("¡Uy! Esta combinación no dio con nada");
  await expect(vacio(page).getByRole("link", { name: "Ver todo lo publicado" })).toHaveAttribute("href", "/");
});

test("sin cuenta, invita a entrar y vuelve a la búsqueda para avisar", async ({ page, browser }) => {
  // Una cuenta ya creada, sin sesión en esta pestaña.
  const ctx = await browser.newContext();
  const { email } = await signUpVerified(await ctx.newPage(), "aviso", "Ana Aviso");
  await ctx.close();

  await page.goto("/buscar?q=submarino");
  await vacio(page).getByRole("link", { name: "Entra y te avisamos cuando aparezca" }).click();
  await expect(page).toHaveURL(/\/ingresar\?/);
  await expect(page.getByText("te avisamos apenas aparezca lo que buscas")).toBeVisible();

  await page.getByLabel("Correo").fill(email);
  await page.getByLabel("Contraseña").fill("unaClaveLarga1");
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page).toHaveURL(/\/buscar\?q=submarino$/);
  await expect(vacio(page).getByText("Avísame cuando aparezca")).toBeVisible();
});

test("con cuenta, el aviso se guarda desde el mensaje vacío con el nombre sugerido", async ({ page }) => {
  await signUpVerified(page, "avisada", "Ana Avisada");
  const palabra = `submarino${uniqueAccount("x").phoneDigits}`;
  await page.goto(`/buscar?q=${palabra}`);

  await vacio(page).getByText("Avísame cuando aparezca").click();
  await expect(vacio(page).getByLabel("Nombre de la búsqueda")).toHaveValue(palabra);
  await vacio(page).getByRole("button", { name: "Guardar" }).click();
  await expect(vacio(page).getByRole("status")).toContainText("Guardada");

  await page.goto("/avisos");
  await expect(page.getByRole("main")).toContainText(palabra);
});

// Luna, fila 5.
test("desde el panel se puede aplicar una combinación sin resultados", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("navigation", { name: "Atajos" }).getByRole("link", { name: /^Filtros/ }).click();
  const panel = page.getByRole("dialog", { name: "Filtros" });
  await panel.getByLabel("Tecnología").check();
  await panel.getByLabel("Precio máximo").fill("1");
  await panel.getByRole("button", { name: "Aplicar igual (0 resultados)" }).click();
  await expect(page).toHaveURL(/max=1/);
  await expect(vacio(page)).toContainText("¡Uy! Esta combinación no dio con nada");
});

test("una palabra larguísima no desborda la página", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/buscar?q=${"x".repeat(120)}`);
  await expect(vacio(page)).toBeVisible();
  const ancho = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(ancho).toBeLessThanOrEqual(390);
});

test("sin palabra, el nombre del aviso sale de los filtros", async ({ page }) => {
  await signUpVerified(page, "sugerida", "Sara Sugerida");
  await page.goto("/?categoria=tecnologia&categoria=ninos&max=999");
  await vacio(page).getByText("Avísame cuando aparezca").click();
  await expect(vacio(page).getByLabel("Nombre de la búsqueda")).toHaveValue(
    "Tecnología y Artículos para niños hasta $999",
  );
});

test("el nombre sugerido incluye el estado y se corta sin romper palabras", async ({ page }) => {
  await signUpVerified(page, "estado", "Estela Estado");
  await page.goto("/buscar?categoria=tecnologia&estado=nuevo&max=1");
  await vacio(page).getByText("Avísame cuando aparezca").click();
  await expect(vacio(page).getByLabel("Nombre de la búsqueda")).toHaveValue(
    "Tecnología (nuevo) hasta $1",
  );

  // Los tres estados no se nombran: no filtran nada.
  await page.goto("/buscar?q=submarino&estado=nuevo&estado=usado_bueno&estado=usado_regular");
  await vacio(page).getByText("Avísame cuando aparezca").click();
  await expect(vacio(page).getByLabel("Nombre de la búsqueda")).toHaveValue("submarino");

  await page.goto(
    "/buscar?q=submarino&categoria=tecnologia&categoria=ropa&categoria=ninos&min=50000&max=999999&zona=Chapinero&verificados=1&estado=usado_bueno",
  );
  await vacio(page).getByText("Avísame cuando aparezca").click();
  const nombre = await vacio(page).getByLabel("Nombre de la búsqueda").inputValue();
  expect(nombre.length).toBeLessThanOrEqual(80);
  expect(nombre).toMatch(/\S…$/);
  expect(nombre).not.toMatch(/vendedo…$/);
});
