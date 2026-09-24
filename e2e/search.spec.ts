import { test, expect, type Page } from "@playwright/test";

// La prueba de punta a punta de la rebanada S-04.
// Ver slices/04-buscar-y-filtrar.md
//
// Los datos sembrados son tres:
//   iPhone 13 128 GB          $1.850.000  tecnologia  usado_bueno    Chapinero  verificado
//   Chaqueta de jean talla M     $95.000  ropa        usado_bueno    Usaquén    sin verificar
//   Coche Chicco reclinable    $260.000   ninos       usado_regular  Chapinero  verificado

const results = (page: Page) => page.getByRole("main").getByRole("listitem");
const card = (page: Page, text: string) => results(page).filter({ hasText: text });

// Las pruebas de publicar crean artículos propios en la misma base, así que aquí
// no se cuentan resultados totales: se comprueba qué aparece y qué no. Es además
// más parecido a un catálogo de verdad, que nunca tiene tres cosas exactas.

test("busca por una palabra del título", async ({ page }) => {
  await page.goto("/buscar?q=iphone");
  await expect(results(page)).toHaveCount(1);
  await expect(results(page)).toContainText("iPhone 13 128 GB");
});

test("busca por una palabra que solo está en la descripción", async ({ page }) => {
  // "cinturones" aparece únicamente en la descripción del coche.
  await page.goto("/buscar?q=cinturones");
  await expect(results(page)).toHaveCount(1);
  await expect(results(page)).toContainText("Coche Chicco");
});

test("la búsqueda ignora tildes y mayúsculas", async ({ page }) => {
  await page.goto("/buscar?q=CHAQUETA");
  await expect(card(page, "Chaqueta de jean")).toHaveCount(1);

  // "batería" lleva tilde en la descripción del iPhone.
  await page.goto("/buscar?q=bateria");
  await expect(card(page, "iPhone")).toHaveCount(1);
});

test("filtra por categoría", async ({ page }) => {
  await page.goto("/buscar?categoria=ninos");
  await expect(card(page, "Coche Chicco")).toHaveCount(1);
  await expect(page.getByRole("main")).not.toContainText("iPhone");
  await expect(page.getByRole("main")).not.toContainText("Chaqueta de jean");
});

test("filtra por rango de precio", async ({ page }) => {
  await page.goto("/buscar?min=100000&max=500000");
  await expect(card(page, "Coche Chicco")).toHaveCount(1);
  await expect(page.getByRole("main")).not.toContainText("iPhone");
  await expect(page.getByRole("main")).not.toContainText("Chaqueta de jean");
});

test("filtra por estado del artículo", async ({ page }) => {
  await page.goto("/buscar?estado=usado_regular");
  await expect(card(page, "Coche Chicco")).toHaveCount(1);
  await expect(page.getByRole("main")).not.toContainText("Chaqueta de jean");
});

test("filtra por vendedor con identidad verificada", async ({ page }) => {
  // Se acota a Chapinero para que solo entren los artículos sembrados: la
  // búsqueda corta en 60 resultados y las otras pruebas dejan artículos más
  // recientes que empujarían a estos fuera de la página.
  await page.goto("/buscar?verificados=1&zona=Chapinero");
  await expect(card(page, "iPhone")).toHaveCount(1);
  await expect(card(page, "Coche Chicco")).toHaveCount(1);
  // La chaqueta es del taller, que no está verificado.
  await expect(page.getByRole("main")).not.toContainText("Chaqueta de jean");
});

test("filtra por zona", async ({ page }) => {
  await page.goto("/buscar?zona=Usaqu%C3%A9n");
  await expect(card(page, "Chaqueta de jean")).toHaveCount(1);
  await expect(page.getByRole("main")).not.toContainText("iPhone");
});

test("los filtros se combinan entre sí", async ({ page }) => {
  await page.goto("/buscar?categoria=tecnologia&verificados=1&min=1000000");
  await expect(card(page, "iPhone")).toHaveCount(1);

  // La misma combinación con un precio máximo que lo excluye deja fuera el iPhone.
  await page.goto("/buscar?categoria=tecnologia&verificados=1&max=500000");
  await expect(card(page, "iPhone")).toHaveCount(0);
});

test("ordena por menor y por mayor precio", async ({ page }) => {
  // Se acota a Chapinero para que solo entren los artículos sembrados.
  await page.goto("/buscar?zona=Chapinero&orden=precio_asc");
  await expect(results(page).first()).toContainText("Coche Chicco");

  await page.goto("/buscar?zona=Chapinero&orden=precio_desc");
  await expect(results(page).first()).toContainText("iPhone");
});

test("una búsqueda sin resultados explica qué hacer", async ({ page }) => {
  await page.goto("/buscar?q=submarino");
  await expect(results(page)).toHaveCount(0);
  await expect(page.getByTestId("sin-resultados")).toContainText("no hay «submarino»");
  await expect(page.getByRole("link", { name: "Ver todo lo publicado" })).toBeVisible();
});

test("los atajos del feed llevan a una búsqueda filtrada", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("navigation", { name: "Atajos" }).getByRole("link", { name: "Niños" }).click();
  await expect(page).toHaveURL(/categoria=ninos/);
  await expect(card(page, "Coche Chicco")).toHaveCount(1);
});

test("la búsqueda funciona sin JavaScript del cliente", async ({ browser }) => {
  // D-25: si los resultados no vienen en el HTML del servidor, Google no los ve.
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/");
  await page.getByLabel("Buscar").fill("chaqueta");
  await page.getByRole("button", { name: "Buscar" }).click();
  await expect(page).toHaveURL(/q=chaqueta/);
  await expect(card(page, "Chaqueta de jean")).toHaveCount(1);
  await context.close();
});

test("un precio mínimo mayor que el máximo no rompe nada", async ({ page }) => {
  await page.goto("/buscar?min=500000&max=100000");
  // Se ordenan solos, así que devuelve lo que hay entre 100.000 y 500.000.
  await expect(card(page, "Coche Chicco")).toHaveCount(1);
  await expect(page.getByRole("main")).not.toContainText("iPhone");
});

test("parámetros con basura se ignoran en vez de tumbar la página", async ({ page }) => {
  const res = await page.goto(
    "/buscar?min=hola&max=--&estado=inventado&categoria=noexiste&orden=raro"
  );
  expect(res?.status()).toBe(200);
  // La categoría inventada no existe, así que no hay resultados, pero la página vive.
  await expect(page.getByTestId("conteo")).toBeVisible();
});

test("una comilla en la búsqueda no altera la consulta", async ({ page }) => {
  const res = await page.goto("/buscar?q=%27%3B%20drop%20table%20listings%3B%20--");
  expect(res?.status()).toBe(200);
  await expect(results(page)).toHaveCount(0);

  // La tabla sigue ahí.
  await page.goto("/");
  await expect(card(page, "iPhone")).toHaveCount(1);
  await expect(card(page, "Chaqueta de jean")).toHaveCount(1);
  await expect(card(page, "Coche Chicco")).toHaveCount(1);
});

// Hallazgos de la ronda de QA del 2026-09-13 (agente técnico).
test("un byte nulo en la búsqueda o en un filtro no tumba la petición", async ({ request }) => {
  for (const url of ["/buscar?q=algo%00malicioso", "/buscar?zona=algo%00x", "/buscar?categoria=ropa%00"]) {
    const res = await request.get(url);
    expect(res.status(), url).toBe(200);
  }
});

test("las respuestas llevan cabeceras de defensa en profundidad", async ({ request }) => {
  const res = await request.get("/");
  const h = res.headers();
  expect(h["x-content-type-options"]).toBe("nosniff");
  expect(h["x-frame-options"]).toBe("DENY");
  expect(h["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(h["x-powered-by"]).toBeUndefined();
});
