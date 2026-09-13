import { test, expect } from "@playwright/test";
import { signUpVerified, withDb } from "../../helpers";

// Agente funcional — Parte 2, promesa 2: la lectura de `getListing`
// (src/features/catalog/queries.ts) no filtra por `status`, y ni
// /producto/[id] ni /comprar/[id] comprueban el estado antes de mostrarse. Esto
// se descubrió leyendo el código mientras se investigaban otros cruces; aquí se
// comprueba en vivo si eso deja ver (y "comprar") un BORRADOR de carga en lote
// -una publicación sin video, que nunca pasó por D-14- con solo tener su enlace.

test.describe("HALLAZGO candidato: un borrador sin video es visible por enlace directo", () => {
  test("la ficha de un borrador (sin video, status='borrador') se ve completa y con botón de Comprar, aunque no aparece en la búsqueda", async ({
    page,
  }) => {
    const { email } = await signUpVerified(page, "borradorqa", "Borrador QA");

    // Creamos el borrador tal como lo hace la carga en lote de tienda
    // (src/features/store/actions.ts uploadBulk): sin video_path ni poster_path,
    // status='borrador'.
    const draftId = await withDb(async (c) => {
      const u = await c.query(`select id from "user" where email = $1`, [email]);
      const r = await c.query(
        `insert into listings (seller_id, title, description, category, condition, price_cop, status)
         values ($1, 'Borrador QA sin video', 'Descripción de un borrador nunca publicado.', 'ropa', 'usado_bueno', 45000, 'borrador')
         returning id`,
        [u.rows[0].id]
      );
      return r.rows[0].id as string;
    });

    // Un comprador cualquiera, ajeno al vendedor, visita el enlace directo.
    const buyerCtx = await page.context().browser()!.newContext();
    const buyer = await buyerCtx.newPage();
    await signUpVerified(buyer, "borradorbuyer", "Borrador Comprador");
    await buyer.goto(`/producto/${draftId}`);

    const encontrado404 = await buyer.getByText(/no encontr|404/i).isVisible().catch(() => false);
    const botonComprar = buyer.getByRole("link", { name: /Comprar con pago protegido/i });
    const botonVisible = await botonComprar.isVisible().catch(() => false);
    console.log("¿La ficha del borrador da 404?", encontrado404, "| ¿Se ve el botón Comprar?", botonVisible);
    await buyer.screenshot({ path: "qa/capturas/funcional-borrador-visible-por-enlace.png", fullPage: true });

    expect(encontrado404).toBe(false);
    expect(botonVisible).toBe(true);

    // No aparece en la búsqueda (search.ts sí filtra status='activa'). Ojo: el
    // encabezado de la página repite el texto buscado ("Resultados para
    // '...'"), así que comprobamos el ENLACE al borrador, no el texto suelto.
    await buyer.goto("/buscar?q=" + encodeURIComponent("Borrador QA sin video"));
    const enlaceAlBorrador = buyer.locator(`a[href="/producto/${draftId}"]`);
    const apareceEnBusqueda = await enlaceAlBorrador.count();
    const sinResultados = await buyer.getByText("No encontramos nada con eso").isVisible().catch(() => false);
    console.log("¿Aparece el enlace al borrador en la búsqueda?", apareceEnBusqueda, "| ¿Dice 'sin resultados'?", sinResultados);
    await buyer.screenshot({ path: "qa/capturas/funcional-borrador-en-busqueda.png", fullPage: true });
    expect(apareceEnBusqueda).toBe(0);

    // Intentamos seguir el flujo de compra: la pantalla de pago también se
    // muestra (sin filtrar por estado), pero el pago real debe bloquearse.
    // (Volvemos a la ficha: la comprobación de búsqueda navegó a otra página.)
    await buyer.goto(`/producto/${draftId}`);
    await buyer.getByRole("link", { name: /Comprar con pago protegido/i }).click();
    await buyer.waitForTimeout(500);
    console.log("URL tras pulsar Comprar:", buyer.url());
    const pantallaPago = await buyer.getByLabel("Quién recibe").isVisible().catch(() => false);
    console.log("¿La pantalla de checkout se muestra para un borrador sin video?", pantallaPago);
    await buyer.screenshot({ path: "qa/capturas/funcional-borrador-pantalla-checkout.png", fullPage: true });

    if (pantallaPago) {
      await buyer.getByLabel("Quién recibe").fill("X");
      await buyer.getByLabel("Celular de quien recibe").fill("3001112222");
      await buyer.getByLabel("Dirección").fill("Calle X");
      await buyer.getByLabel("Zona").selectOption({ index: 1 });
      await buyer.getByRole("button", { name: "Ir a pagar" }).click();
      await buyer.waitForTimeout(600);
      const seCobro = await withDb((c) =>
        c.query(`select count(*)::int as n from order_items where listing_id = $1`, [draftId])
      );
      console.log("¿Se llegó a crear un pedido para el borrador?", seCobro.rows[0].n);
      expect(seCobro.rows[0].n).toBe(0); // el bloqueo real sigue estando en buyListing.
    }

    await buyerCtx.close();
  });
});
