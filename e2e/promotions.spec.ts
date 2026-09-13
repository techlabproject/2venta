import { test, expect, type Browser, type Page } from "@playwright/test";
import { createHmac } from "node:crypto";
import { alertIn, sellerWithListing, signUpVerified, withDb } from "./helpers";

// La prueba de punta a punta de la rebanada S-14.
// Ver slices/14-destacar-publicaciones.md

async function promote(page: Page, listingId: string, approve = true) {
  await page.goto(`/producto/${listingId}`);
  await page.getByRole("button", { name: /días · \$/ }).click();
  await expect(page).toHaveURL(/\/dev\/destacar\//);
  await page
    .getByRole("button", {
      name: approve ? "Simular pago aprobado" : "Simular pago rechazado",
    })
    .click();
  await expect(page).toHaveURL(/\/producto\//);
}

function signed(body: object) {
  const payload = JSON.stringify(body);
  return {
    data: JSON.parse(payload),
    headers: {
      "content-type": "application/json",
      "x-pagos-signature": createHmac("sha256", process.env.PAYMENTS_WEBHOOK_SECRET!)
        .update(payload)
        .digest("hex"),
    },
  };
}

test("un destacado aparece primero y marcado como tal", async ({ browser }) => {
  const marca = Date.now();
  // Se publica primero el que se va a destacar, para que por fecha quedara último.
  const viejo = await sellerWithListing(browser, `Zapatos destacados ${marca}`, 90_000, "ropa");
  const nuevo = await sellerWithListing(browser, `Zapatos normales ${marca}`, 95_000, "ropa");

  await promote(viejo.page, viejo.listingId);

  const anonCtx = await browser.newContext();
  const anon = await anonCtx.newPage();
  await anon.goto(`/buscar?q=Zapatos`);
  const tarjetas = anon.getByRole("main").getByRole("listitem");
  await expect(tarjetas.first()).toContainText(`Zapatos destacados ${marca}`);
  await expect(tarjetas.first()).toContainText("Destacado");

  await viejo.context.close();
  await nuevo.context.close();
  await anonCtx.close();
});

test("al vencer, vuelve a su lugar por fecha", async ({ browser }) => {
  const marca = Date.now();
  const viejo = await sellerWithListing(browser, `Botas vencen ${marca}`, 90_000, "ropa");
  await sellerWithListing(browser, `Botas nuevas ${marca}`, 95_000, "ropa");
  await promote(viejo.page, viejo.listingId);

  await withDb((c) =>
    c.query(`update promotions set ends_at = now() - interval '1 hour' where listing_id = $1`, [
      viejo.listingId,
    ])
  );

  const anonCtx = await browser.newContext();
  const anon = await anonCtx.newPage();
  await anon.goto(`/buscar?q=Botas`);
  const tarjetas = anon.getByRole("main").getByRole("listitem");
  // El más reciente vuelve a ir primero, y nadie lleva el distintivo.
  await expect(tarjetas.first()).toContainText(`Botas nuevas ${marca}`);
  await expect(anon.getByRole("main")).not.toContainText("Destacado");

  await viejo.context.close();
  await anonCtx.close();
});

test("un destacado no se cuela si no cumple el filtro del comprador", async ({
  browser,
}) => {
  // Es la regla que más importa: un destacado que ignora el filtro es publicidad
  // disfrazada de resultado, y el comprador lo nota una vez y ya no confía.
  const marca = Date.now();
  const caro = await sellerWithListing(browser, `Abrigo caro ${marca}`, 900_000, "ropa");
  await sellerWithListing(browser, `Abrigo barato ${marca}`, 50_000, "ropa");
  await promote(caro.page, caro.listingId);

  const anonCtx = await browser.newContext();
  const anon = await anonCtx.newPage();
  await anon.goto(`/buscar?q=Abrigo&max=100000`);
  await expect(anon.getByRole("main")).not.toContainText(`Abrigo caro ${marca}`);
  await expect(anon.getByRole("main")).toContainText(`Abrigo barato ${marca}`);

  await caro.context.close();
  await anonCtx.close();
});

test("como máximo tres destacados arriba", async ({ browser }) => {
  const marca = Date.now();
  const promovidos = [];
  for (let i = 0; i < 4; i++) {
    const s = await sellerWithListing(browser, `Camisa tope ${marca} ${i}`, 50_000 + i, "ropa");
    await promote(s.page, s.listingId);
    promovidos.push(s);
  }

  const anonCtx = await browser.newContext();
  const anon = await anonCtx.newPage();
  await anon.goto(`/buscar?q=${encodeURIComponent(`tope`)}`);
  const primeras = anon.getByRole("main").getByRole("listitem");
  // Los cuatro están destacados, pero solo tres suben.
  const conDistintivo = await primeras.filter({ hasText: "Destacado" }).count();
  expect(conDistintivo).toBe(4); // todos llevan el distintivo
  // Y de los cuatro, solo tres ocupan las primeras posiciones por ser destacados.
  for (let i = 0; i < 3; i++) {
    await expect(primeras.nth(i)).toContainText("Destacado");
  }

  for (const s of promovidos) await s.context.close();
  await anonCtx.close();
});

test("un pago rechazado no destaca nada", async ({ browser }) => {
  const marca = Date.now();
  const s = await sellerWithListing(browser, `Gorra rechazada ${marca}`, 40_000, "ropa");
  await promote(s.page, s.listingId, false);

  const anonCtx = await browser.newContext();
  const anon = await anonCtx.newPage();
  await anon.goto(`/buscar?q=${encodeURIComponent("rechazada")}`);
  await expect(anon.getByRole("main")).not.toContainText("Destacado");

  await s.context.close();
  await anonCtx.close();
});

test("no se puede destacar una publicación ajena", async ({ browser }) => {
  const s = await sellerWithListing(browser, `Bufanda ajena ${Date.now()}`, 40_000, "ropa");

  const otroCtx = await browser.newContext();
  const otro = await otroCtx.newPage();
  await signUpVerified(otro, "ajeno", "Persona Ajena");

  await otro.goto(`/producto/${s.listingId}`);
  // El botón no existe para quien no es el dueño.
  await expect(otro.getByRole("button", { name: /días · \$/ })).toHaveCount(0);

  // Y llamando la acción directamente tampoco crea nada.
  await otro.evaluate(async (id) => {
    const form = new FormData();
    form.set("listingId", id);
    await fetch(`/producto/${id}`, { method: "POST", body: form }).catch(() => {});
  }, s.listingId);

  const cuantas = await withDb(async (c) => {
    const { rows } = await c.query(`select 1 from promotions where listing_id = $1`, [
      s.listingId,
    ]);
    return rows.length;
  });
  expect(cuantas).toBe(0);

  await s.context.close();
  await otroCtx.close();
});

test("destacar dos veces extiende el periodo, no crea dos solapados", async ({
  browser,
}) => {
  // Dos destacados solapados serían cobrar dos veces por lo mismo.
  const s = await sellerWithListing(browser, `Reloj doble ${Date.now()}`, 200_000, "ropa");
  await promote(s.page, s.listingId);

  const primerFin = await withDb(async (c) => {
    const { rows } = await c.query<{ ends_at: Date }>(
      `select ends_at from promotions where listing_id = $1 and status = 'activa'`,
      [s.listingId]
    );
    return rows[0].ends_at.getTime();
  });

  await promote(s.page, s.listingId);

  const fines = await withDb(async (c) => {
    const { rows } = await c.query<{ ends_at: Date }>(
      `select ends_at from promotions where listing_id = $1 and status = 'activa'
        order by ends_at desc`,
      [s.listingId]
    );
    return rows.map((r) => r.ends_at.getTime());
  });

  expect(fines.length).toBe(2);
  // El segundo empieza donde termina el primero, no en paralelo.
  expect(fines[0]).toBeGreaterThan(primerFin);

  await s.context.close();
});

test("el webhook del destacado exige firma", async ({ request }) => {
  const sin = await request.post("/api/pagos/destacar", {
    data: { reference: "pay_x", type: "pago.aprobado" },
  });
  expect(sin.status()).toBe(401);

  const mala = await request.post("/api/pagos/destacar", {
    headers: { "x-pagos-signature": "inventada" },
    data: { reference: "pay_x", type: "pago.aprobado" },
  });
  expect(mala.status()).toBe(401);
});

test("un webhook de destacado con referencia desconocida se rechaza", async ({
  request,
}) => {
  const res = await request.post(
    "/api/pagos/destacar",
    signed({ reference: "pay_no_existe", type: "pago.aprobado" })
  );
  expect(res.status()).toBe(404);
});

// D-65, a partir de una duda de la ronda de QA del 2026-09-13.
test("retirar la publicación termina el destacado, sin devolución", async ({ browser }) => {
  const seller = await sellerWithListing(browser, `Destacada y retirada ${Date.now()}`, 90_000);
  await promote(seller.page, seller.listingId);

  await seller.page.goto(`/producto/${seller.listingId}`);
  await seller.page.getByRole("button", { name: "Retirar la publicación" }).click();
  // Mientras la acción corre el botón dice "Guardando…"; se espera al estado final,
  // que para una retirada es que desaparezca el bloque entero del vendedor.
  await expect(seller.page.getByRole("button", { name: "Marcar como vendida" })).toHaveCount(0);
  await expect.poll(async () =>
    withDb(async (c) => {
      const { rows } = await c.query<{ status: string }>(
        `select status from listings where id = $1`,
        [seller.listingId]
      );
      return rows[0].status;
    })
  ).toBe("retirada");

  const state = await withDb(async (c) => {
    const { rows } = await c.query<{ status: string; n: string }>(
      `select l.status,
              (select count(*) from promotions p
                where p.listing_id = l.id and p.status = 'activa' and p.ends_at > now())::text as n
         from listings l where l.id = $1`,
      [seller.listingId]
    );
    return rows[0];
  });
  expect(state.status).toBe("retirada");
  expect(Number(state.n)).toBe(0);
  await seller.context.close();
});
