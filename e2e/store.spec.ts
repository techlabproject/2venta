import { test, expect, type Page, type Browser } from "@playwright/test";
import {
  alertIn,
  approveKycFor,
  freshImei,
  freshNit,
  signUpVerified,
  withDb,
} from "./helpers";

// La prueba de punta a punta de la rebanada S-13.
// Ver slices/13-cuenta-de-tienda.md

const HEADER = "titulo,categoria,precio,estado,descripcion,imei";

/** Un vendedor verificado con cuenta de tienda registrada. */
async function storeAccount(browser: Browser, nit = freshNit()) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const { email } = await signUpVerified(page, "tienda", "Camila Vendedora");
  await approveKycFor(email);

  await page.goto("/tienda");
  await page.getByLabel("Razón social").fill("Tecnología Usaquén S.A.S.");
  await page.getByLabel("NIT").fill(nit);
  await page.getByRole("button", { name: "Registrar la tienda" }).click();
  await expect(page.getByRole("heading", { name: "Tecnología Usaquén S.A.S." })).toBeVisible();

  const userId = await withDb(async (c) => {
    const { rows } = await c.query<{ id: string }>(`select id from "user" where email = $1`, [
      email,
    ]);
    return rows[0].id;
  });
  return { ctx, page, userId, email };
}

async function uploadCsv(page: Page, body: string) {
  await page.getByLabel("Archivo de artículos").setInputFiles({
    name: "articulos.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(`${HEADER}\n${body}`, "utf8"),
  });
  await page.getByRole("button", { name: "Cargar artículos" }).click();
}

test("un vendedor verificado registra su tienda con NIT", async ({ browser }) => {
  const nit = freshNit();
  const store = await storeAccount(browser, nit);
  await expect(store.page.getByRole("main")).toContainText(nit);
  await store.ctx.close();
});

test("el NIT se guarda normalizado, con su dígito de verificación", async ({
  browser,
}) => {
  // Sin normalizar, el mismo NIT escrito de tres formas ocuparía tres filas y la
  // restricción de unicidad no serviría de nada.
  const nit = freshNit();
  const [base, dv] = nit.split("-");
  const conPuntos = base.replace(/(\d{3})(\d{3})(\d{3})/, "$1.$2.$3");
  const store = await storeAccount(browser, conPuntos);
  await expect(store.page.getByRole("main")).toContainText(`${base}-${dv}`);
  await store.ctx.close();
});

test("un NIT inválido se rechaza", async ({ browser }) => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const { email } = await signUpVerified(page, "tienda", "Camila Vendedora");
  await approveKycFor(email);

  await page.goto("/tienda");
  await page.getByLabel("Razón social").fill("Tienda Falsa S.A.S.");
  const [base] = freshNit().split("-");
  // Dígito de verificación deliberadamente equivocado.
  await page.getByLabel("NIT").fill(`${base}-${(Number(freshNit().split("-")[1]) + 5) % 10}`);
  await page.getByRole("button", { name: "Registrar la tienda" }).click();
  await expect(alertIn(page)).toContainText("NIT no es válido");

  await ctx.close();
});

test("un NIT ya registrado en otra cuenta se rechaza", async ({ browser }) => {
  const nit = freshNit();
  const primera = await storeAccount(browser, nit);

  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const { email } = await signUpVerified(page, "tienda2", "Otra Vendedora");
  await approveKycFor(email);
  await page.goto("/tienda");
  await page.getByLabel("Razón social").fill("Otra Tienda S.A.S.");
  await page.getByLabel("NIT").fill(nit);
  await page.getByRole("button", { name: "Registrar la tienda" }).click();
  await expect(alertIn(page)).toContainText("ya está registrado");

  await primera.ctx.close();
  await ctx.close();
});

test("sin identidad verificada no se llega a registrar tienda", async ({ browser }) => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await signUpVerified(page, "sinkyc", "Sin Verificar");
  await page.goto("/tienda");
  await expect(page).toHaveURL(/\/vender/);
  await ctx.close();
});

test("la carga en lote crea borradores, no publicaciones", async ({ browser }) => {
  // Es la tensión con la D-14: el video no se puede subir de un archivo, así que
  // el lote ahorra escribir y no la garantía.
  const store = await storeAccount(browser);
  const marca = Date.now();

  await uploadCsv(
    store.page,
    [
      `Camisa lote ${marca},ropa,60000,nuevo,Sin uso,`,
      `Coche lote ${marca},ninos,150000,usado bueno,Buen estado,`,
      `Celular lote ${marca},tecnologia,900000,usado bueno,Funciona bien,${freshImei()}`,
    ].join("\n")
  );

  await expect(store.page.getByTestId("lote-creados")).toContainText("3 borradores");
  await expect(store.page.getByTestId("borradores")).toContainText(`Camisa lote ${marca}`);

  // Ninguno está en el catálogo: les falta el video.
  const anonCtx = await browser.newContext();
  const anon = await anonCtx.newPage();
  await anon.goto(`/buscar?q=lote`);
  await expect(
    anon.getByRole("main").getByRole("listitem").filter({ hasText: `Camisa lote ${marca}` })
  ).toHaveCount(0);

  await store.ctx.close();
  await anonCtx.close();
});

test("grabado el video, el borrador se publica como cualquier otro", async ({
  browser,
}) => {
  const store = await storeAccount(browser);
  const titulo = `Buzo lote ${Date.now()}`;
  await uploadCsv(store.page, `${titulo},ropa,70000,nuevo,Sin uso,`);
  await expect(store.page.getByTestId("lote-creados")).toContainText("1 borrador");

  await store.page.getByRole("link", { name: "Grabar video" }).first().click();
  await expect(store.page.getByRole("heading", { name: titulo })).toBeVisible();

  await store.page.getByRole("button", { name: "Abrir cámara" }).click();
  await store.page.getByRole("button", { name: /^Grabar/ }).click();
  await store.page.getByRole("button", { name: "Terminar" }).click();
  await expect(store.page.getByRole("status")).toContainText("Video listo");
  await store.page.getByRole("button", { name: "Publicar" }).click();
  await expect(store.page).toHaveURL(/\/producto\//);

  const anonCtx = await browser.newContext();
  const anon = await anonCtx.newPage();
  await anon.goto("/");
  await expect(
    anon.getByRole("main").getByRole("listitem").filter({ hasText: titulo })
  ).toHaveCount(1);

  await store.ctx.close();
  await anonCtx.close();
});

test("un borrador de electrónica pasa igual por revisión al publicarse", async ({
  browser,
}) => {
  // Cargar en lote no es una puerta trasera para saltarse la moderación.
  const store = await storeAccount(browser);
  const titulo = `Tablet lote ${Date.now()}`;
  await uploadCsv(
    store.page,
    `${titulo},tecnologia,800000,usado bueno,Buen estado,${freshImei()}`
  );
  await expect(store.page.getByTestId("lote-creados")).toContainText("1 borrador");

  await store.page.getByRole("link", { name: "Grabar video" }).first().click();
  await store.page.getByRole("button", { name: "Abrir cámara" }).click();
  await store.page.getByRole("button", { name: /^Grabar/ }).click();
  await store.page.getByRole("button", { name: "Terminar" }).click();
  await expect(store.page.getByRole("status")).toContainText("Video listo");
  await store.page.getByRole("button", { name: "Publicar" }).click();
  await expect(store.page).toHaveURL(/\/producto\//);

  const anonCtx = await browser.newContext();
  const anon = await anonCtx.newPage();
  await anon.goto("/");
  await expect(
    anon.getByRole("main").getByRole("listitem").filter({ hasText: titulo })
  ).toHaveCount(0);

  await store.ctx.close();
  await anonCtx.close();
});

test("el distintivo de tienda aparece en el catálogo y en el perfil", async ({
  browser,
}) => {
  const store = await storeAccount(browser);
  const titulo = `Saco tienda ${Date.now()}`;
  await uploadCsv(store.page, `${titulo},ropa,80000,nuevo,Sin uso,`);
  await store.page.getByRole("link", { name: "Grabar video" }).first().click();
  await store.page.getByRole("button", { name: "Abrir cámara" }).click();
  await store.page.getByRole("button", { name: /^Grabar/ }).click();
  await store.page.getByRole("button", { name: "Terminar" }).click();
  await expect(store.page.getByRole("status")).toContainText("Video listo");
  await store.page.getByRole("button", { name: "Publicar" }).click();
  await expect(store.page).toHaveURL(/\/producto\//);

  const anonCtx = await browser.newContext();
  const anon = await anonCtx.newPage();
  await anon.goto("/");
  const tarjeta = anon.getByRole("main").getByRole("listitem").filter({ hasText: titulo });
  await expect(tarjeta).toContainText("Tienda");

  await anon.goto(`/vendedor/${store.userId}`);
  await expect(anon.getByRole("heading", { name: "Tecnología Usaquén S.A.S." })).toBeVisible();
  await expect(anon.getByRole("main")).toContainText("Tienda registrada");

  await store.ctx.close();
  await anonCtx.close();
});

test("un archivo con columnas equivocadas dice cuáles faltan", async ({ browser }) => {
  const store = await storeAccount(browser);
  await store.page.getByLabel("Archivo de artículos").setInputFiles({
    name: "malo.csv",
    mimeType: "text/csv",
    buffer: Buffer.from("titulo,precio\nAlgo,50000", "utf8"),
  });
  await store.page.getByRole("button", { name: "Cargar artículos" }).click();
  await expect(alertIn(store.page)).toContainText("categoria");
  await expect(alertIn(store.page)).toContainText("estado");
  await store.ctx.close();
});

test("una fila mala no tumba las buenas, y dice en qué línea está", async ({
  browser,
}) => {
  const store = await storeAccount(browser);
  const marca = Date.now();
  await uploadCsv(
    store.page,
    [
      `Buena uno ${marca},ropa,50000,nuevo,Descripción,`,
      `Mala ${marca},ropa,-500,nuevo,Descripción,`,
      `Buena dos ${marca},ropa,60000,nuevo,Descripción,`,
    ].join("\n")
  );

  await expect(store.page.getByTestId("lote-creados")).toContainText("2 borradores");
  await expect(store.page.getByTestId("lote-errores")).toContainText("Línea 3");

  await store.ctx.close();
});

test("un archivo con más de cien filas se rechaza", async ({ browser }) => {
  const store = await storeAccount(browser);
  const filas = Array.from({ length: 101 }, (_, i) => `Cosa ${i},ropa,50000,nuevo,D,`);
  await uploadCsv(store.page, filas.join("\n"));
  await expect(alertIn(store.page)).toContainText("101");
  await store.ctx.close();
});

test("quien no es tienda no puede usar la carga en lote", async ({ browser }) => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const { email } = await signUpVerified(page, "normal", "Vendedor Normal");
  await approveKycFor(email);

  await page.goto("/tienda");
  // Sin tienda registrada, el formulario de carga no existe.
  await expect(page.getByLabel("Archivo de artículos")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Registra tu tienda" })).toBeVisible();

  await ctx.close();
});
