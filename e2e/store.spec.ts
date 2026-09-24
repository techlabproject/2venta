import { test, expect, type Page, type Browser } from "@playwright/test";
import {
  alertIn,
  approveKycFor,
  freshImei,
  freshNit,
  makeAdmin,
  sellerWithListing,
  signUpVerified,
  withDb,
} from "./helpers";

// La prueba de punta a punta de la rebanada S-13, rehecha en la corrección 15
// (2026-09-24): ya no hay «Registra tu tienda». La empresa se registra al empezar a
// vender, como persona jurídica, con NIT, representante y RUT; el equipo revisa el
// RUT y confirma el NIT, y solo entonces hay insignia de empresa y carga en lote.

const HEADER = "titulo,categoria,precio,estado,descripcion,imei";
const PDF = Buffer.from("%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n", "latin1");

/** Llena el formulario de persona jurídica en /vender y lo envía. */
async function registrarEmpresa(page: Page, nit: string, rut: Buffer = PDF) {
  await page.goto("/vender?tipo=juridica");
  await page.getByLabel("Razón social").fill("Tecnología Usaquén S.A.S.");
  await page.getByLabel("NIT").fill(nit);
  await page.getByLabel("Nombre del representante legal").fill("Camila Vendedora");
  await page.getByLabel("Cédula del representante legal").fill("52123456");
  await page.getByLabel("RUT de la empresa (PDF)").setInputFiles({
    name: "rut.pdf",
    mimeType: "application/pdf",
    buffer: rut,
  });
  await page.getByLabel("Dirección de notificaciones").fill("Calle 72 # 10-34");
  await page.getByLabel(/Autorizo que el proveedor/).check();
  await page.getByRole("button", { name: "Empezar verificación" }).click();
}

const idDe = (email: string) =>
  withDb(async (c) => {
    const { rows } = await c.query<{ id: string }>(`select id from "user" where email = $1`, [email]);
    return rows[0].id;
  });

/** Una empresa con la identidad aprobada y el NIT confirmado, lista para cargar. */
async function storeAccount(browser: Browser, nit = freshNit()) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const { email } = await signUpVerified(page, "tienda", "Camila Vendedora");
  await registrarEmpresa(page, nit);
  await expect(page).toHaveURL(/\/dev\/kyc\//);
  await approveKycFor(email);
  const userId = await idDe(email);
  await withDb((c) => c.query(`update stores set nit_confirmado_at = now() where user_id = $1`, [userId]));

  await page.goto("/tienda");
  await expect(page.getByRole("heading", { name: "Tecnología Usaquén S.A.S." })).toBeVisible();
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

test("una empresa se registra al empezar a vender y el equipo confirma su NIT", async ({ browser }) => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const { email } = await signUpVerified(page, "empresa", "Camila Vendedora");
  await page.goto("/vender");
  await expect(page.getByRole("link", { name: /Como empresa/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Como persona/ })).toBeVisible();

  const nit = freshNit();
  await registrarEmpresa(page, nit);
  await expect(page).toHaveURL(/\/dev\/kyc\//);
  await approveKycFor(email);
  const userId = await idDe(email);

  // Sin el NIT confirmado: vende, pero sin carga en lote ni insignia.
  await page.goto("/vender");
  await expect(page.getByRole("main")).toContainText("Estamos revisando el RUT de Tecnología Usaquén S.A.S.");
  await page.goto("/tienda");
  await expect(page).toHaveURL(/\/vender/);

  // El equipo abre el RUT y confirma.
  const adminCtx = await browser.newContext();
  const admin = await adminCtx.newPage();
  const { email: adminEmail } = await signUpVerified(admin, "admin", "Ada Admin");
  await makeAdmin(adminEmail);
  const rut = await admin.request.get(`/admin/rut/${userId}`);
  expect(rut.headers()["content-type"]).toContain("application/pdf");
  await admin.goto("/admin");
  const fila = admin.getByTestId("empresas-por-confirmar").getByRole("listitem").filter({ hasText: nit });
  await fila.getByRole("button", { name: "Confirmar NIT" }).click();
  await expect(fila).toHaveCount(0);

  await page.goto("/tienda");
  await expect(page.getByRole("heading", { name: "Tecnología Usaquén S.A.S." })).toBeVisible();
  await adminCtx.close();
  await ctx.close();
});

test("el RUT solo lo ve el equipo", async ({ browser, request }) => {
  const store = await storeAccount(browser);
  expect((await request.get(`/admin/rut/${store.userId}`)).status()).toBe(404);
  expect((await store.page.request.get(`/admin/rut/${store.userId}`)).status()).toBe(404);
  await store.ctx.close();
});

test("el NIT se guarda normalizado, con su dígito de verificación", async ({ browser }) => {
  // Sin normalizar, el mismo NIT escrito de tres formas ocuparía tres filas y la
  // restricción de unicidad no serviría de nada.
  const nit = freshNit();
  const [base, dv] = nit.split("-");
  const conPuntos = base.replace(/(\d{3})(\d{3})(\d{3})/, "$1.$2.$3");
  const store = await storeAccount(browser, conPuntos);
  await expect(store.page.getByRole("main")).toContainText(`${base}-${dv}`);
  await store.ctx.close();
});

test("un NIT inválido, un RUT que no es PDF o sin dirección se rechazan", async ({ browser }) => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await signUpVerified(page, "tienda", "Camila Vendedora");
  // Dígito de verificación deliberadamente equivocado: el correcto más uno.
  const [base, dv] = freshNit().split("-");
  await registrarEmpresa(page, `${base}-${(Number(dv) + 1) % 10}`);
  await expect(alertIn(page)).toContainText("NIT no es válido");

  await registrarEmpresa(page, freshNit(), Buffer.from("no soy un pdf"));
  await expect(alertIn(page)).toContainText("El RUT tiene que ser un PDF");

  await page.goto("/vender?tipo=natural");
  await page.getByLabel("Dirección de notificaciones").fill("casa");
  await page.getByLabel(/Autorizo que el proveedor/).check();
  await page.getByRole("button", { name: "Empezar verificación" }).click();
  await expect(alertIn(page)).toContainText("dirección completa");
  await ctx.close();
});

test("un NIT ya registrado en otra cuenta se rechaza", async ({ browser }) => {
  const nit = freshNit();
  const primera = await storeAccount(browser, nit);
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await signUpVerified(page, "tienda2", "Otra Tienda");
  await registrarEmpresa(page, nit);
  await expect(alertIn(page)).toContainText("ya está registrado");
  await ctx.close();
  await primera.ctx.close();
});

test("la persona natural vende sin carga en lote, y las tiendas de antes quedan como personas", async ({ browser }) => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const { email } = await signUpVerified(page, "natural", "Nati Natural");
  await page.goto("/vender?tipo=natural");
  await page.getByLabel("Dirección de notificaciones").fill("Carrera 7 # 45-10");
  await page.getByLabel(/Autorizo que el proveedor/).check();
  await page.getByRole("button", { name: "Empezar verificación" }).click();
  await expect(page).toHaveURL(/\/dev\/kyc\//);
  await approveKycFor(email);
  await page.goto("/tienda");
  await expect(page).toHaveURL(/\/vender/);

  // Una tienda «de antes» (sin RUT ni confirmación) no lleva insignia de empresa.
  const userId = await idDe(email);
  await withDb((c) =>
    c.query(
      `insert into stores (user_id, legal_name, nit, archivada_at) values ($1, 'Tienda Vieja', $2, now())`,
      [userId, freshNit()],
    ),
  );
  const anon = await (await browser.newContext()).newPage();
  await anon.goto(`/vendedor/${userId}`);
  await expect(anon.getByRole("main")).not.toContainText("Tienda Vieja");
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
  // Sin empresa confirmada no hay carga en lote: /tienda devuelve a /vender.
  await expect(page).toHaveURL(/\/vender/);
  await expect(page.getByLabel("Archivo de artículos")).toHaveCount(0);

  await ctx.close();
});

// Hallazgo de la ronda de QA del 2026-09-13 (agente funcional).
test("una razón social con teléfono o enlace se rechaza", async ({ browser }) => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await signUpVerified(page, "tienda", "Camila Vendedora");

  await page.goto("/vender?tipo=juridica");
  await page.getByLabel("Razón social").fill("Tienda 3004128805 S.A.S.");
  await page.getByLabel("NIT").fill(freshNit());
  await page.getByLabel("Nombre del representante legal").fill("Camila Vendedora");
  await page.getByLabel("Cédula del representante legal").fill("52123456");
  await page.getByLabel("RUT de la empresa (PDF)").setInputFiles({ name: "rut.pdf", mimeType: "application/pdf", buffer: PDF });
  await page.getByLabel("Dirección de notificaciones").fill("Calle 72 # 10-34");
  await page.getByLabel(/Autorizo que el proveedor/).check();
  await page.getByRole("button", { name: "Empezar verificación" }).click();
  await expect(alertIn(page)).toContainText("números de teléfono");
  await ctx.close();
});

test("quien ya vendía antes completa su dirección y teléfono (art. 53)", async ({ browser }) => {
  const { context, page } = await sellerWithListing(browser, `Radio viejo ${Date.now()}`, 90_000, "ropa");
  await page.goto("/vender");
  await expect(page.getByRole("heading", { name: "Completa tus datos de vendedor" })).toBeVisible();
  await page.getByLabel("Dirección de notificaciones").fill("Calle 100 # 15-20");
  await page.getByRole("button", { name: "Guardar mis datos" }).click();
  // Guardado, la sección ya no hace falta y desaparece.
  await expect(page.getByRole("heading", { name: "Completa tus datos de vendedor" })).toHaveCount(0);
  const guardado = await withDb(async (c) => {
    const { rows } = await c.query<{ direccion_notificaciones: string }>(
      `select v.direccion_notificaciones from vendedores v
         join listings l on l.seller_id = v.user_id
        where l.title like 'Radio viejo %' order by l.created_at desc limit 1`,
    );
    return rows[0]?.direccion_notificaciones;
  });
  expect(guardado).toBe("Calle 100 # 15-20");
  await context.close();
});

// Luna, fila 15.
test("un NIT repetido no deja al vendedor atascado: puede corregirlo", async ({ browser }) => {
  const nit = freshNit();
  const primera = await storeAccount(browser, nit);
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await signUpVerified(page, "atascada", "Ata Scada");
  await registrarEmpresa(page, nit);
  await expect(alertIn(page)).toContainText("ya está registrado");

  // Volver a /vender deja elegir de nuevo, y un NIT válido sí sigue.
  await page.goto("/vender");
  await expect(page.getByRole("link", { name: /Como empresa/ })).toBeVisible();
  await registrarEmpresa(page, freshNit());
  await expect(page).toHaveURL(/\/dev\/kyc\//);
  await ctx.close();
  await primera.ctx.close();
});

test("sin la autorización de biométricos, 2venta lo dice con su propio mensaje", async ({ page }) => {
  await signUpVerified(page, "sinautorizar", "Sin Autorizar");
  await page.goto("/vender?tipo=natural");
  await page.getByLabel("Dirección de notificaciones").fill("Calle 72 # 10-34");
  await page.getByRole("button", { name: "Empezar verificación" }).click();
  await expect(alertIn(page)).toContainText("autorización para la foto del rostro");
});

test("un error no borra lo que ya se escribió en el formulario de empresa", async ({ page }) => {
  await signUpVerified(page, "noborra", "No Borra");
  const [base, dv] = freshNit().split("-");
  await registrarEmpresa(page, `${base}-${(Number(dv) + 1) % 10}`);
  await expect(alertIn(page)).toContainText("NIT no es válido");
  await expect(page.getByLabel("Razón social")).toHaveValue("Tecnología Usaquén S.A.S.");
  await expect(page.getByLabel("Dirección de notificaciones")).toHaveValue("Calle 72 # 10-34");
  await expect(page.getByLabel(/Autorizo que el proveedor/)).toBeChecked();
});
