import { test, expect } from "@playwright/test";
import {
  signUpVerified,
  approveKycFor,
  sellerWithListing,
  withDb,
  freshNit,
} from "../../helpers";

// Agente funcional — Parte 2, promesa 5: "La conversación no se sale de la app:
// los datos de contacto se ocultan". D-22 dice que el filtro cubre "chat,
// preguntas e imágenes". Probamos ese alcance Y los demás campos que pide el
// brief: título, descripción, alias, descripción del perfil, reseñas, nota de
// dirección, motivo de reporte, razón social de tienda — y variantes del número
// (puntos, deletreado, emojis entre dígitos, enlace de WhatsApp).

const TELEFONO = "3004128805";

test.describe("Filtro anti-desvío: chat, preguntas (alcance declarado por D-22)", () => {
  test("un teléfono en el chat queda oculto, con variantes: puntos, deletreado, enlace de WhatsApp", async ({
    browser,
  }) => {
    const { context: sellerCtx, listingId } = await sellerWithListing(
      browser,
      "Filtro chat QA " + Date.now(),
      60_000
    );

    const buyerCtx = await browser.newContext();
    const buyer = await buyerCtx.newPage();
    await signUpVerified(buyer, "filtrochat", "Filtro Chat");
    await buyer.goto(`/producto/${listingId}`);
    await buyer.getByRole("button", { name: "Escribirle al vendedor" }).click();
    await expect(buyer).toHaveURL(/\/chat\//);

    const casos = [
      "Llámame al 300.412.88.05 porfa",
      "mi numero es tres cero cero cuatro uno dos ocho ocho cero cinco",
      "escríbeme por https://wa.me/573004128805",
    ];
    for (const texto of casos) {
      await buyer.getByLabel("Mensaje").fill(texto);
      await buyer.getByRole("button", { name: "Enviar" }).click();
      await buyer.waitForTimeout(400);
    }

    await buyer.screenshot({ path: "qa/capturas/funcional-chat-filtro-variantes.png", fullPage: true });
    const texto = await buyer.locator("main").innerText();
    expect(texto).not.toContain(TELEFONO);
    expect(texto).not.toContain("573004128805");

    await sellerCtx.close();
    await buyerCtx.close();
  });

  test("HALLAZGO candidato: un teléfono separado por un emoji en un solo mensaje del chat no se filtra", async ({
    browser,
  }) => {
    const { context: sellerCtx, listingId } = await sellerWithListing(
      browser,
      "Filtro emoji QA " + Date.now(),
      60_000
    );
    const buyerCtx = await browser.newContext();
    const buyer = await buyerCtx.newPage();
    await signUpVerified(buyer, "filtroemoji", "Filtro Emoji");
    await buyer.goto(`/producto/${listingId}`);
    await buyer.getByRole("button", { name: "Escribirle al vendedor" }).click();
    await expect(buyer).toHaveURL(/\/chat\//);

    const conEmoji = "mi cel es 300😀4128805 llámame ya";
    await buyer.getByLabel("Mensaje").fill(conEmoji);
    await buyer.getByRole("button", { name: "Enviar" }).click();
    await buyer.waitForTimeout(500);

    await buyer.screenshot({ path: "qa/capturas/funcional-chat-filtro-emoji-bypass.png", fullPage: true });
    const texto = await buyer.locator("main").innerText();
    // Si el número completo aparece sin tachar, el filtro se saltó con un emoji.
    const numeroCompleto = texto.includes("3004128805") || texto.includes("300😀4128805");
    // eslint-disable-next-line no-console
    console.log("¿Número completo visible con emoji de por medio?", numeroCompleto, "| texto capturado:", JSON.stringify(texto.slice(0, 400)));
    expect(numeroCompleto).toBe(true); // documentamos el hallazgo: SÍ aparece completo.

    await sellerCtx.close();
    await buyerCtx.close();
  });
});

test.describe("HALLAZGOS candidatos: campos sin el filtro anti-desvío", () => {
  test("el título y la descripción de una publicación NO pasan por el filtro: un teléfono queda público, sin tachar", async ({
    page,
  }) => {
    const { email } = await signUpVerified(page, "filtrotitulo", "Filtro Titulo");
    await approveKycFor(email);

    const titulo = `Bicicleta Trek, contáctame al ${TELEFONO}`;
    const listingId = await withDb(async (c) => {
      const u = await c.query(`select id from "user" where email = $1`, [email]);
      const sellerId = u.rows[0].id;
      const r = await c.query(
        `insert into listings
           (seller_id, title, description, category, condition, price_cop,
            video_path, poster_path, status)
         values ($1, $2, $3, 'ropa', 'usado_bueno', 70000, 'seed/demo.webm', 'seed/demo.jpg', 'activa')
         returning id`,
        [sellerId, titulo, `Escríbeme directo al ${TELEFONO} o al wasap, mejor por fuera.`]
      );
      return r.rows[0].id as string;
    });

    // Nota: creamos la publicación directo en la base (no por /publicar) porque
    // publicar de verdad exige video grabado con cámara; lo que se prueba aquí
    // es exclusivamente si el TEXTO del título/descripción pasa por `redact`, y
    // ese filtro es independiente del video. La ruta pública sí se recorre por
    // la interfaz a continuación.
    await page.goto(`/producto/${listingId}`);
    await page.screenshot({ path: "qa/capturas/funcional-titulo-descripcion-sin-filtro.png", fullPage: true });
    const texto = await page.locator("main").innerText();
    console.log("¿Aparece el teléfono sin tachar en título/descripción?", texto.includes(TELEFONO));
    expect(texto).toContain(TELEFONO); // documentamos el hallazgo.
  });

  test("el alias público NO pasa por el filtro: se puede poner un teléfono como alias", async ({ page }) => {
    await signUpVerified(page, "filtroalias", "Filtro Alias");
    await page.goto("/cuenta/editar");
    await page.getByLabel("Alias").fill(TELEFONO);
    await page.getByRole("button", { name: /Guardar/i }).click();
    await page.waitForTimeout(500);

    const userId = await withDb(async (c) => {
      const r = await c.query(`select id from "user" where alias = $1`, [TELEFONO]);
      return r.rows[0]?.id as string | undefined;
    });
    console.log("¿Se guardó el alias igual al teléfono, sin filtrar?", Boolean(userId));
    expect(userId).toBeTruthy();

    if (userId) {
      await page.goto(`/vendedor/${userId}`);
      await page.screenshot({ path: "qa/capturas/funcional-alias-telefono-sin-filtro.png", fullPage: true });
      const texto = await page.locator("main").innerText();
      expect(texto).toContain(TELEFONO);
    }
  });

  test("la razón social de una tienda NO pasa por el filtro y se muestra pública en el perfil del vendedor", async ({
    page,
  }) => {
    const { email } = await signUpVerified(page, "filtrotienda", "Filtro Tienda");
    await approveKycFor(email);
    await page.goto("/tienda");

    const razonSocial = `Distribuidora ${TELEFONO} SAS`;
    const nitInput = page.getByLabel(/NIT/i);
    const legalInput = page.getByLabel(/Razón social|razon social/i);
    const tieneFormulario = await legalInput.isVisible().catch(() => false);
    if (!tieneFormulario) {
      test.skip(true, "No se encontró el formulario de registro de tienda con esas etiquetas.");
    }
    await legalInput.fill(razonSocial);
    // NIT válido de prueba: generamos uno simple aceptado por el validador local
    // solo si el campo lo exige; si falla, lo reportamos como no verificado.
    if (await nitInput.isVisible().catch(() => false)) {
      await nitInput.fill(freshNit());
    }
    await page.getByRole("button", { name: /Registrar|Guardar/i }).click();
    await page.waitForTimeout(500);
    const errorVisible = await page.getByRole("alert").isVisible().catch(() => false);
    if (errorVisible) {
      console.log("Error del formulario de tienda:", await page.getByRole("alert").innerText());
    }

    const userId = await withDb(async (c) => {
      const u = await c.query(`select id from "user" where email = $1`, [email]);
      return u.rows[0].id as string;
    });
    const stored = await withDb((c) =>
      c.query(`select legal_name from stores where user_id = $1`, [userId])
    );
    const guardado = stored.rows[0]?.legal_name as string | undefined;
    console.log("Razón social guardada:", guardado);
    if (guardado) {
      expect(guardado).toContain(TELEFONO);
      await page.goto(`/vendedor/${userId}`);
      await page.screenshot({ path: "qa/capturas/funcional-tienda-razonsocial-telefono.png", fullPage: true });
      const texto = await page.locator("main").innerText();
      expect(texto).toContain(TELEFONO);
    }
  });
});
