import { test, expect, type Browser, type Page } from "@playwright/test";
import { sellerWithListing, withDb } from "./helpers";

// Correcciones 43, 44, 45 y 51 (D-122, decisión de Nicolás): como Marketplace, cada
// artículo dice a cuántos km está, y se filtra por radio. Solo Bogotá y sus
// municipios vecinos. La ubicación de quien compra vive en una cookie de su
// navegador (nunca en la dirección ni en la base); la del vendedor, en su perfil,
// redondeada a ~1 km.
//
// Sembrados: Camila en Chapinero (4.65, -74.06) con el iPhone 13 y el Coche Chicco;
// el taller en Usaquén (4.71, -74.03) con la chaqueta. Chapinero → Usaquén ≈ 7,5 km.

const tarjeta = (page: Page, titulo: string) =>
  page.getByRole("main").getByRole("listitem").filter({ hasText: titulo });

async function elegirZona(page: Page, zona: string) {
  const barra = page.getByTestId("barra-ubicacion");
  if (await barra.getByText("Cambiar").isVisible()) await barra.getByText("Cambiar").click();
  await barra.getByLabel("O elige tu zona").selectOption(zona);
  await barra.getByRole("button", { name: "Listo" }).click();
  await expect(barra).toContainText(`Distancias desde ${zona}`);
}

async function vendedorEn(browser: Browser, titulo: string, lat: number, lng: number, zona: string) {
  const s = await sellerWithListing(browser, titulo, 70_000, "ropa");
  await withDb((c) =>
    c.query(
      `update "user" u set zone = $2, ubicacion_lat = $3, ubicacion_lng = $4
         from listings l where l.id = $1 and u.id = l.seller_id`,
      [s.listingId, zona, lat, lng],
    ),
  );
  return s;
}

test("sin JavaScript se elige la zona y cada tarjeta dice a cuántos km está", async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();

  await page.goto(`/buscar?q=${encodeURIComponent("iPhone 13")}`);
  await expect(page.getByTestId("barra-ubicacion")).toContainText("¿Dónde estás?");
  await expect(tarjeta(page, "iPhone 13 128 GB").getByTestId("lugar")).toHaveText("Chapinero");

  await elegirZona(page, "Chapinero");
  await expect(page).toHaveURL(/\/buscar\?q=iPhone\+13$/);
  await expect(page.getByTestId("barra-ubicacion")).toContainText("Distancias desde Chapinero");
  await expect(tarjeta(page, "iPhone 13 128 GB").getByTestId("lugar")).toHaveText(
    "Chapinero · a menos de 1 km",
  );
  await page.goto(`/buscar?q=${encodeURIComponent("Chaqueta de jean")}`);
  await expect(tarjeta(page, "Chaqueta de jean talla M").getByTestId("lugar")).toHaveText(
    "Usaquén · a unos 7 km",
  );

  // Solo en una cookie que el navegador no deja leer a los scripts, y redondeada.
  const [cookie] = (await ctx.cookies()).filter((c) => c.name === "ubicacion");
  expect(cookie.httpOnly).toBe(true);
  expect(decodeURIComponent(cookie.value)).toBe("4.65|-74.06|Chapinero");
  expect(page.url()).not.toMatch(/4\.65|74\.06/);

  // «Quitar» la borra.
  await page.getByTestId("barra-ubicacion").getByRole("button", { name: "Quitar" }).click();
  await expect(page.getByTestId("barra-ubicacion")).toContainText("¿Dónde estás?");
  expect((await ctx.cookies()).some((c) => c.name === "ubicacion")).toBe(false);
  await ctx.close();
});

test("el radio deja solo lo cercano y «Más cerca» ordena por distancia", async ({ browser }) => {
  const marca = `Radio${Date.now()}`;
  const cerca = await vendedorEn(browser, `${marca} Usaquén`, 4.71, -74.03, "Usaquén");
  const lejos = await vendedorEn(browser, `${marca} Soacha`, 4.58, -74.22, "Soacha");

  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(`/buscar?q=${marca}`);
  await elegirZona(page, "Usaquén");

  await page.goto(`/buscar?q=${marca}&radio=5`);
  await expect(tarjeta(page, `${marca} Usaquén`)).toHaveCount(1);
  await expect(tarjeta(page, `${marca} Soacha`)).toHaveCount(0);
  await expect(page.getByTestId("conteo")).toHaveText("1 resultado");

  await page.goto(`/buscar?q=${marca}&orden=cerca`);
  await expect(page.getByRole("main").getByRole("listitem").filter({ hasText: marca }).first()).toContainText(
    "Usaquén",
  );
  await elegirZona(page, "Soacha");
  await page.goto(`/buscar?q=${marca}&orden=cerca`);
  await expect(page.getByRole("main").getByRole("listitem").filter({ hasText: marca }).first()).toContainText(
    "Soacha",
  );

  await ctx.close();
  await cerca.context.close();
  await lejos.context.close();
});

test("sin ubicación el radio no filtra y el campo dice por qué", async ({ page }) => {
  await page.goto(`/buscar?q=${encodeURIComponent("Chaqueta de jean")}&radio=2`);
  await expect(tarjeta(page, "Chaqueta de jean talla M")).toHaveCount(1);
  const distancia = page.locator("#lateral-radio");
  await expect(distancia).toBeDisabled();
  await expect(page.getByText("Dinos dónde estás").first()).toBeAttached();
});

test("una cookie manipulada se ignora", async ({ browser, baseURL }) => {
  const ctx = await browser.newContext();
  await ctx.addCookies([
    { name: "ubicacion", value: "6.24|-75.58|Chapinero", url: baseURL! },
  ]);
  const page = await ctx.newPage();
  await page.goto(`/buscar?q=${encodeURIComponent("iPhone 13")}`);
  await expect(page.getByTestId("barra-ubicacion")).toContainText("¿Dónde estás?");
  await expect(tarjeta(page, "iPhone 13 128 GB").getByTestId("lugar")).toHaveText("Chapinero");
  await ctx.close();
});

test("«Usar mi ubicación» toma el punto del celular, redondeado", async ({ browser }) => {
  const ctx = await browser.newContext({
    geolocation: { latitude: 4.65337, longitude: -74.08361 },
    permissions: ["geolocation"],
  });
  const page = await ctx.newPage();
  await page.goto(`/buscar?q=${encodeURIComponent("iPhone 13")}`);
  await page.getByRole("button", { name: "Usar mi ubicación" }).click();
  await expect(page.getByTestId("barra-ubicacion")).toContainText("Distancias desde tu ubicación");
  const [cookie] = (await ctx.cookies()).filter((c) => c.name === "ubicacion");
  expect(decodeURIComponent(cookie.value)).toBe("4.65|-74.08|dispositivo");
  await expect(tarjeta(page, "iPhone 13 128 GB").getByTestId("lugar")).toHaveText(
    "Chapinero · a unos 2 km",
  );
  await ctx.close();
});

test("fuera de Bogotá y sus vecinos se dice y no se guarda nada", async ({ browser }) => {
  const ctx = await browser.newContext({
    geolocation: { latitude: 6.2442, longitude: -75.5812 }, // Medellín
    permissions: ["geolocation"],
  });
  const page = await ctx.newPage();
  await page.goto("/buscar");
  await page.getByRole("button", { name: "Usar mi ubicación" }).click();
  await expect(page.getByTestId("barra-ubicacion").getByRole("alert")).toContainText(
    "Por ahora 2venta funciona en Bogotá y sus municipios vecinos",
  );
  expect((await ctx.cookies()).some((c) => c.name === "ubicacion")).toBe(false);
  await ctx.close();
});

test("el vendedor guarda su punto del celular, redondeado, y lo conserva al guardar", async ({
  browser,
}) => {
  const seller = await sellerWithListing(browser, `Punto ${Date.now()}`, 60_000, "ropa");
  await seller.context.grantPermissions(["geolocation"]);
  await seller.context.setGeolocation({ latitude: 4.65337, longitude: -74.08361 });
  const page = seller.page;
  const punto = async () =>
    withDb(async (c) => {
      const { rows } = await c.query(
        `select u.zone, u.ubicacion_lat, u.ubicacion_lng from "user" u
           join listings l on l.seller_id = u.id where l.id = $1`,
        [seller.listingId],
      );
      return rows[0];
    });

  await page.goto("/cuenta/editar");
  await page.getByRole("button", { name: "Usar mi ubicación" }).click();
  await expect(page.getByRole("status").first()).toContainText("cerca de Teusaquillo");
  await expect(page.getByLabel("Zona")).toHaveValue("Teusaquillo");
  await page.getByRole("button", { name: "Guardar" }).click();
  await expect(page.getByText("Guardado.")).toBeVisible();
  // El punto del celular (4.65, -74.08), no el centro de Teusaquillo (4.64, -74.09).
  expect(await punto()).toEqual({ zone: "Teusaquillo", ubicacion_lat: 4.65, ubicacion_lng: -74.08 });

  // Guardar otra vez sin tocar la zona conserva el punto.
  await page.goto("/cuenta/editar");
  await expect(page.getByText("Tienes guardado un punto de tu celular")).toBeVisible();
  await page.getByRole("button", { name: "Guardar" }).click();
  await expect(page.getByText("Guardado.")).toBeVisible();
  expect(await punto()).toEqual({ zone: "Teusaquillo", ubicacion_lat: 4.65, ubicacion_lng: -74.08 });

  // Otra zona a mano: el centro de esa zona.
  await page.goto("/cuenta/editar");
  await page.getByLabel("Zona").selectOption("Chapinero");
  await page.getByRole("button", { name: "Guardar" }).click();
  await expect(page.getByText("Guardado.")).toBeVisible();
  expect(await punto()).toEqual({ zone: "Chapinero", ubicacion_lat: 4.65, ubicacion_lng: -74.06 });

  await seller.context.close();
});

test("la API de la biblioteca no escribe la zona", async ({ browser }) => {
  const seller = await sellerWithListing(browser, `Api ${Date.now()}`, 60_000, "ropa");
  const res = await seller.page.request.post("/api/auth/update-user", {
    headers: { origin: "http://localhost:3100" },
    data: { zone: "Inventada" },
  });
  expect(res.status()).toBeGreaterThanOrEqual(400);
  await seller.context.close();
});

// Luna (D-122): el punto oculto del perfil se podía cambiar a mano y mostrar
// «Chapinero · a unos 7 km» con un punto de Usaquén.
test("un punto que no queda en la zona elegida se rechaza", async ({ browser }) => {
  const seller = await sellerWithListing(browser, `Falso ${Date.now()}`, 60_000, "ropa");
  const page = seller.page;
  await page.goto("/cuenta/editar");
  await page.getByLabel("Zona").selectOption("Chapinero");
  await page.getByLabel("Zona").evaluate((el) => {
    for (const [name, value] of [["lat", "4.71"], ["lng", "-74.03"]]) {
      const i = document.createElement("input");
      i.type = "hidden";
      i.name = name;
      i.value = value;
      el.closest("form")!.appendChild(i);
    }
  });
  await page.getByRole("button", { name: "Guardar" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("no queda en Chapinero");
  await seller.context.close();
});

// Luna (fila 18 y D-122): la columna de filtros mandaba los campos vacíos y la
// dirección quedaba llena de `min=&max=&zona=`.
test("los filtros vacíos no se quedan en la dirección", async ({ page }) => {
  await page.goto("/buscar?min=&max=&zona=&orden=recientes&q=chaqueta");
  await expect(page).toHaveURL(/\/buscar\?q=chaqueta$/);
  await page.goto("/?min=&max=&categoria=ropa&orden=recientes");
  await expect(page).toHaveURL(/\/\?categoria=ropa$/);
});
