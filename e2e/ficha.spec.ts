import { expect, test } from "@playwright/test";
import { freshImei, sellerWithListing, withDb } from "./helpers";

// La prueba de punta a punta de la S-32.
// Ver slices/32-ficha-que-convence.md
//
// La ficha es donde se decide la compra. Lo que se comprueba aquí es que muestre
// las señales que hacen que alguien le pague a un desconocido, y que no invente
// ninguna.

test("un artículo con IMEI lo anuncia; uno sin IMEI, no", async ({ browser }) => {
  const conImei = await sellerWithListing(browser, "Celular con IMEI", 900_000, "tecnologia");
  // El IMEI es único en la base: cada corrida necesita uno propio.
  const imei = freshImei();
  await withDb((c) =>
    c.query(`update listings set imei = $2 where id = $1`, [conImei.listingId, imei])
  );

  await conImei.page.goto(`/producto/${conImei.listingId}`);
  await expect(conImei.page.getByText("IMEI validado")).toBeVisible();
  // El número nunca: identifica el equipo y con él se rastrea a su dueño.
  await expect(conImei.page.getByRole("main")).not.toContainText(imei);

  const sinImei = await sellerWithListing(browser, "Chaqueta sin IMEI", 90_000, "ropa");
  await sinImei.page.goto(`/producto/${sinImei.listingId}`);
  await expect(sinImei.page.getByText("IMEI validado")).toHaveCount(0);

  await conImei.context.close();
  await sinImei.context.close();
});

test("el estado del artículo se ve como distintivo, no como ficha técnica", async ({
  browser,
}) => {
  const seller = await sellerWithListing(browser, "Mesa de comedor", 300_000, "ninos");
  await seller.page.goto(`/producto/${seller.listingId}`);

  await expect(seller.page.getByRole("main")).toContainText("Usado, buen estado");

  await seller.context.close();
});

test("un vendedor sin ventas no muestra ceros (D-17)", async ({ browser }) => {
  const seller = await sellerWithListing(browser, "Lo primero que vendo", 150_000);
  await seller.page.goto(`/producto/${seller.listingId}`);

  // «0 ventas · 0% disputas» se lee como mal desempeño cuando solo significa que
  // es nuevo, y al arrancar la plataforma lo son todos.
  await expect(seller.page.getByTestId("vendedor-nuevo")).toContainText(
    "Primera venta en 2venta"
  );
  await expect(seller.page.getByTestId("vendedor-nuevo")).toContainText(
    "identidad verificada"
  );
  await expect(seller.page.getByTestId("reputacion-ficha")).toHaveCount(0);

  await seller.context.close();
});

test("un vendedor con ventas muestra su calificación junto al artículo", async ({
  browser,
}) => {
  const seller = await sellerWithListing(browser, "De alguien con historial", 200_000);

  // Se siembra el historial en vez de recorrer cuatro compras completas: lo que
  // esta rebanada cambia es la pantalla, no el circuito de la venta, que ya tiene
  // sus propias pruebas.
  await withDb(async (c) => {
    const { rows: vendedor } = await c.query<{ seller_id: string }>(
      `select seller_id from listings where id = $1`,
      [seller.listingId]
    );
    const { rows: comprador } = await c.query<{ id: string }>(
      `select id from "user" where id <> $1 limit 1`,
      [vendedor[0].seller_id]
    );

    for (let i = 0; i < 4; i++) {
      const { rows: pedido } = await c.query<{ id: string }>(
        `insert into orders (buyer_id, seller_id, status, subtotal_cop, commission_cop,
                             seller_payout_cop, provider, idempotency_key)
         values ($1, $2, 'liberado', 200000, 10000, 190000, 'prueba', $3)
         returning id`,
        [comprador[0].id, vendedor[0].seller_id, `ficha-${Date.now()}-${i}`]
      );
      await c.query(
        `insert into ratings (order_id, rater_id, ratee_id, stars, review)
         values ($1, $2, $3, 5, null)`,
        [pedido[0].id, comprador[0].id, vendedor[0].seller_id]
      );
    }
  });

  await seller.page.goto(`/producto/${seller.listingId}`);
  const reputacion = seller.page.getByTestId("reputacion-ficha");
  await expect(reputacion).toContainText("★");
  await expect(reputacion).toContainText("ventas");
  await expect(reputacion).toContainText("% disputas");

  // Y sigue habiendo camino al perfil completo, que es donde están las reseñas.
  await seller.page.getByRole("link", { name: "Ver perfil" }).click();
  await expect(seller.page).toHaveURL(/\/vendedor\//);

  await seller.context.close();
});
