import { test, expect, type Browser } from "@playwright/test";
import { alertIn, freshImei, sellerWithListing, signUpVerified, withDb } from "./helpers";

// La prueba de punta a punta de la rebanada S-19.
// Ver slices/19-editar-y-retirar.md

async function visibleInCatalog(browser: Browser, title: string) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto("/");
  const count = await page
    .getByRole("main")
    .getByRole("listitem")
    .filter({ hasText: title })
    .count();
  await ctx.close();
  return count > 0;
}

test("el vendedor edita título, precio y descripción", async ({ browser }) => {
  const marca = Date.now();
  const seller = await sellerWithListing(browser, `Original ${marca}`, 100_000, "ropa");

  await seller.page.goto(`/producto/${seller.listingId}`);
  await seller.page.getByRole("link", { name: "Editar" }).click();
  await expect(seller.page).toHaveURL(/\/editar/);

  await seller.page.getByLabel("Título").fill(`Corregido ${marca}`);
  await seller.page.getByLabel("Precio").fill("120000");
  await seller.page.getByLabel("Descripción").fill("Descripción corregida.");
  await seller.page.getByRole("button", { name: "Guardar cambios" }).click();

  await expect(seller.page).toHaveURL(new RegExp(seller.listingId));
  await expect(seller.page.getByRole("heading", { name: `Corregido ${marca}` })).toBeVisible();
  await expect(seller.page.getByRole("main")).toContainText("$ 120.000");
  await expect(seller.page.getByRole("main")).toContainText("Descripción corregida");

  await seller.context.close();
});

test("marcar como reservada la saca del catálogo, y volver a publicarla la devuelve", async ({
  browser,
}) => {
  const titulo = `Reservable ${Date.now()}`;
  const seller = await sellerWithListing(browser, titulo, 90_000, "ropa");
  expect(await visibleInCatalog(browser, titulo)).toBe(true);

  await seller.page.goto(`/producto/${seller.listingId}`);
  await seller.page.getByRole("button", { name: "Marcar como reservada" }).click();
  await expect(seller.page.getByRole("button", { name: "Volver a publicar" })).toBeVisible();
  await expect(async () => {
    expect(await visibleInCatalog(browser, titulo)).toBe(false);
  }).toPass({ timeout: 10_000 });

  await seller.page.getByRole("button", { name: "Volver a publicar" }).click();
  await expect(seller.page.getByRole("button", { name: "Marcar como reservada" })).toBeVisible();
  await expect(async () => {
    expect(await visibleInCatalog(browser, titulo)).toBe(true);
  }).toPass({ timeout: 10_000 });

  await seller.context.close();
});

// Corrección 29 (decisión de Nicolás): un artículo queda vendido solo completando la
// compra en 2venta. Ya no hay botón, y el servidor no acepta el estado.
test("ya no se puede marcar como vendida a mano", async ({ browser }) => {
  const titulo = `Vendible ${Date.now()}`;
  const seller = await sellerWithListing(browser, titulo, 80_000, "ropa");

  await seller.page.goto(`/producto/${seller.listingId}`);
  await expect(seller.page.getByRole("button", { name: "Marcar como vendida" })).toHaveCount(0);
  await seller.page.goto("/vender/metricas");
  await expect(seller.page.getByRole("button", { name: "Vendida" })).toHaveCount(0);

  // Esquivando la pantalla: se reutiliza el formulario de reservar con otro estado.
  // Después de que la página cargue del todo: si React termina de montarse después
  // del cambio, devuelve el campo a «reservada» y la prueba no prueba nada.
  await seller.page.goto(`/producto/${seller.listingId}`);
  await seller.page.waitForLoadState("networkidle");
  await seller.page.evaluate(() => {
    const campo = document.querySelector<HTMLInputElement>('input[name="status"][value="reservada"]')!;
    campo.value = "vendida";
  });
  await expect(seller.page.locator('input[name="status"][value="vendida"]')).toHaveCount(1);
  await seller.page.getByRole("button", { name: "Marcar como reservada" }).click();
  await expect(alertIn(seller.page)).toContainText("Ese estado no existe");
  const estado = await withDb(async (c) => {
    const { rows } = await c.query<{ status: string }>(`select status from listings where id = $1`, [
      seller.listingId,
    ]);
    return rows[0].status;
  });
  expect(estado).toBe("activa");

  await seller.context.close();
});

test("retirar no borra: el pedido asociado sigue funcionando", async ({ browser }) => {
  // Borrar dejaría a un comprador con un pedido que apunta a nada, y a una disputa
  // sin el video contra el cual compararse.
  const titulo = `Retirable ${Date.now()}`;
  const seller = await sellerWithListing(browser, titulo, 150_000, "ropa");

  const ctx = await browser.newContext();
  const buyer = await ctx.newPage();
  await signUpVerified(buyer, "comprador", "Laura Compradora");
  await buyer.goto(`/comprar/${seller.listingId}`);
  await buyer.getByLabel("Quién recibe").fill("Laura Torres");
  await buyer.getByLabel("Celular de quien recibe").fill("300 412 88 05");
  await buyer.getByLabel("Dirección").fill("Calle 72 #10-34");
  await buyer.getByLabel("Zona").selectOption("Chapinero");
  await buyer.getByRole("button", { name: "Ir a pagar" }).click();
  await buyer.getByRole("button", { name: "Simular pago aprobado" }).click();
  await expect(buyer).toHaveURL(/\/pedido\//);
  const orderId = new URL(buyer.url()).pathname.split("/").pop()!;

  // El artículo quedó vendido al pagar; se fuerza a retirada para el caso.
  await withDb((c) =>
    c.query(`update listings set status = 'retirada' where id = $1`, [seller.listingId])
  );

  await buyer.goto(`/pedido/${orderId}`);
  await expect(buyer.getByTestId("estado")).toHaveText("Pago recibido y guardado");
  await expect(buyer.getByRole("main")).toContainText(titulo);

  // Y con un pedido en curso no vuelve al catálogo: se vendería dos veces
  // (corrección 31).
  await seller.page.goto(`/producto/${seller.listingId}`);
  await seller.page.getByRole("button", { name: "Volver a publicar" }).click();
  await expect(alertIn(seller.page)).toContainText("Tiene un pedido en curso");
  expect(await visibleInCatalog(browser, titulo)).toBe(false);

  await seller.context.close();
  await ctx.close();
});

test("no se puede editar una publicación ajena", async ({ browser }) => {
  const seller = await sellerWithListing(browser, `Ajena ${Date.now()}`, 70_000, "ropa");

  const otroCtx = await browser.newContext();
  const otro = await otroCtx.newPage();
  await signUpVerified(otro, "ajeno", "Persona Ajena");

  // A quien no es el dueño se le dice que no es suya, no que no existe: la ficha es
  // pública y le bastaba un clic para comprobar que «esto ya no está» era mentira
  // (D-80). Lo que no puede es ver ni tocar el formulario.
  await otro.goto(`/producto/${seller.listingId}/editar`);
  await expect(
    otro.getByRole("heading", { name: "Esta publicación no es tuya" })
  ).toBeVisible();
  await expect(otro.getByLabel("Título")).toHaveCount(0);

  // Y llamando la acción directamente tampoco cambia nada.
  await otro.goto(`/producto/${seller.listingId}`);
  await otro.evaluate(async (id) => {
    const form = new FormData();
    form.set("listingId", id);
    form.set("title", "Secuestrado");
    form.set("price", "1");
    form.set("description", "Cambiado por otro");
    form.set("condition", "nuevo");
    await fetch(`/producto/${id}`, { method: "POST", body: form }).catch(() => {});
  }, seller.listingId);

  const titulo = await withDb(async (c) => {
    const { rows } = await c.query<{ title: string }>(
      `select title from listings where id = $1`,
      [seller.listingId]
    );
    return rows[0].title;
  });
  expect(titulo).not.toBe("Secuestrado");

  await seller.context.close();
  await otroCtx.close();
});

test("editar no es la puerta trasera de la moderación", async ({ browser }) => {
  // Sin volver a filtrar bastaría publicar algo inocente y cambiarlo después.
  const seller = await sellerWithListing(browser, `Inocente ${Date.now()}`, 60_000, "ropa");

  await seller.page.goto(`/producto/${seller.listingId}/editar`);
  await seller.page.getByLabel("Título").fill(`Pistola 9mm ${Date.now()}`);
  await seller.page.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(alertIn(seller.page)).toContainText("armas de fuego");

  await seller.context.close();
});

test("un precio inválido al editar se rechaza", async ({ browser }) => {
  const seller = await sellerWithListing(browser, `Precio ${Date.now()}`, 60_000, "ropa");

  await seller.page.goto(`/producto/${seller.listingId}/editar`);
  // El campo solo deja dígitos y detiene el envío por debajo del mínimo
  // (corrección 24).
  await seller.page.getByLabel("Precio").fill("-5000");
  await expect(seller.page.getByLabel("Precio")).toHaveValue("5.000");
  await seller.page.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(seller.page.getByText("El mínimo es $10.000.")).toBeVisible();
  await expect(seller.page).toHaveURL(/\/editar/);

  // Y el servidor no le cree al campo: con el campo esquivado, el precio que llega
  // igual se rechaza.
  await seller.page.getByLabel("Precio").fill("60000");
  await seller.page.evaluate(() => {
    const campo = document.getElementById("price") as HTMLInputElement;
    campo.removeAttribute("name");
    const falso = document.createElement("input");
    falso.type = "hidden";
    falso.name = "price";
    falso.value = "500";
    campo.form!.appendChild(falso);
  });
  await seller.page.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(alertIn(seller.page)).toContainText("precio mínimo");

  await seller.context.close();
});

test("no se puede editar una publicación vendida", async ({ browser }) => {
  const seller = await sellerWithListing(browser, `Ya vendida ${Date.now()}`, 60_000, "ropa");
  await withDb((c) =>
    c.query(`update listings set status = 'vendida' where id = $1`, [seller.listingId])
  );

  await seller.page.goto(`/producto/${seller.listingId}`);
  await expect(seller.page.getByRole("link", { name: "Editar" })).toHaveCount(0);

  await seller.context.close();
});

// Hallazgos de la ronda de QA del 2026-09-13 (agente funcional).
test("un título o una descripción con teléfono se rechazan al editar", async ({ browser }) => {
  const marca = Date.now();
  const seller = await sellerWithListing(browser, `Limpio ${marca}`, 100_000, "ropa");
  await seller.page.goto(`/producto/${seller.listingId}/editar`);

  await seller.page.getByLabel("Título").fill(`Camisa ${marca} llama al 3004128805`);
  await seller.page.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(alertIn(seller.page)).toContainText("números de teléfono");

  await seller.page.getByLabel("Título").fill(`Camisa ${marca}`);
  await seller.page.getByLabel("Descripción").fill("Escríbeme por whatsapp y cuadramos");
  await seller.page.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(alertIn(seller.page)).toContainText("números de teléfono");

  await seller.context.close();
});

test("una publicación retirada o en borrador no tiene ficha pública; vendida sí", async ({
  browser,
}) => {
  const seller = await sellerWithListing(browser, `Escondida ${Date.now()}`, 80_000, "ropa");
  const anonCtx = await browser.newContext();
  const anon = await anonCtx.newPage();

  for (const status of ["retirada", "borrador", "en_revision", "rechazada"]) {
    await withDb((c) =>
      c.query(`update listings set status = $2 where id = $1`, [seller.listingId, status])
    );
    const res = await anon.goto(`/producto/${seller.listingId}`);
    expect(res?.status(), status).toBe(404);
    // El dueño sí la ve.
    const own = await seller.page.goto(`/producto/${seller.listingId}`);
    expect(own?.status(), `dueño, ${status}`).toBe(200);
  }

  await withDb((c) =>
    c.query(`update listings set status = 'vendida' where id = $1`, [seller.listingId])
  );
  const sold = await anon.goto(`/producto/${seller.listingId}`);
  expect(sold?.status()).toBe(200);
  await expect(anon.getByRole("link", { name: "Comprar con pago protegido" })).toHaveCount(0);

  await anonCtx.close();
  await seller.context.close();
});

test("la pantalla de editar de una publicación vendida no muestra el formulario", async ({
  browser,
}) => {
  const seller = await sellerWithListing(browser, `Cerrada ${Date.now()}`, 60_000, "ropa");
  await withDb((c) =>
    c.query(`update listings set status = 'vendida' where id = $1`, [seller.listingId])
  );
  await seller.page.goto(`/producto/${seller.listingId}/editar`);
  await expect(seller.page.getByRole("status")).toContainText("ya no se puede editar");
  await expect(seller.page.getByLabel("Título")).toHaveCount(0);
  await seller.context.close();
});

// Corrección 24 (Catalina): el precio aceptaba cualquier carácter.
test("el precio solo acepta dígitos, separa los miles y dice que es en pesos", async ({ browser }) => {
  const seller = await sellerWithListing(browser, `Miles ${Date.now()}`, 60_000, "ropa");
  await seller.page.goto(`/producto/${seller.listingId}/editar`);

  const precio = seller.page.getByLabel("Precio");
  await expect(precio).toHaveValue("60.000");
  await expect(seller.page.getByRole("main")).toContainText("COP");

  await precio.fill("");
  await precio.pressSequentially("8a5b0.00c0");
  await expect(precio).toHaveValue("850.000");

  // Pegado con signo, puntos y centavos, queda el número entero.
  await precio.fill("$ 1.250.000,00");
  await expect(precio).toHaveValue("1.250.000");

  await seller.page.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(seller.page).toHaveURL(new RegExp(`/producto/${seller.listingId}$`));
  await expect(seller.page.getByRole("main")).toContainText("$ 1.250.000");

  await seller.context.close();
});

// Corrección 25 (Catalina): el aviso del IMEI salía en publicaciones que no son de
// tecnología, y había que comprobar que el IMEI de verdad no se edita.
test("el aviso nombra el IMEI solo si el artículo lo tiene, y el IMEI no se puede cambiar", async ({ browser }) => {
  const ropa = await sellerWithListing(browser, `Chaqueta ${Date.now()}`, 60_000, "ropa");
  await ropa.page.goto(`/producto/${ropa.listingId}/editar`);
  await expect(ropa.page.getByRole("main")).toContainText("La categoría (Ropa) no se cambia");
  await expect(ropa.page.getByRole("main")).not.toContainText("IMEI");
  await ropa.context.close();

  const tec = await sellerWithListing(browser, `Celular ${Date.now()}`, 600_000, "tecnologia");
  const imei = freshImei();
  await withDb((c) => c.query(`update listings set imei = $2 where id = $1`, [tec.listingId, imei]));
  await tec.page.goto(`/producto/${tec.listingId}/editar`);
  await expect(tec.page.getByRole("main")).toContainText("y el IMEI no se cambian");
  await expect(tec.page.getByLabel(/IMEI/)).toHaveCount(0);

  // Aunque se manden a la fuerza, el servidor no los toca.
  await tec.page.evaluate(() => {
    const form = document.getElementById("price")!.closest("form")!;
    for (const [name, value] of [["imei", "490154203237518"], ["category", "ropa"]]) {
      const falso = document.createElement("input");
      falso.type = "hidden";
      falso.name = name;
      falso.value = value;
      form.appendChild(falso);
    }
  });
  await tec.page.getByLabel("Título").fill(`Celular editado ${Date.now()}`);
  await tec.page.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(tec.page).toHaveURL(new RegExp(`/producto/${tec.listingId}$`));
  const fila = await withDb(async (c) => {
    const { rows } = await c.query<{ imei: string; category: string }>(
      `select imei, category from listings where id = $1`,
      [tec.listingId],
    );
    return rows[0];
  });
  expect(fila).toEqual({ imei, category: "tecnologia" });
  await tec.context.close();
});

// Luna, filas 24–25 (y fila 7 con el celular): Supr delante de un separador que
// puso el campo no hacía nada, mientras Retroceso sí borraba.
test("Supr delante del punto de miles borra el dígito siguiente, como Retroceso detrás", async ({ browser }) => {
  const seller = await sellerWithListing(browser, `Supr ${Date.now()}`, 60_000, "ropa");
  await seller.page.goto(`/producto/${seller.listingId}/editar`);
  const precio = seller.page.getByLabel("Precio");

  await precio.fill("260000");
  await expect(precio).toHaveValue("260.000");
  // Cursor justo antes del punto: «260|.000».
  await precio.evaluate((i: HTMLInputElement) => i.setSelectionRange(3, 3));
  await precio.press("Delete");
  await expect(precio).toHaveValue("26.000");
  // Y el cursor sigue después de los mismos tres dígitos: «26.0|00».
  expect(await precio.evaluate((i: HTMLInputElement) => i.selectionStart)).toBe(4);

  await seller.context.close();
});
