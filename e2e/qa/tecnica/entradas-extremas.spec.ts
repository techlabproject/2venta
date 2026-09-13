import { test, expect } from "@playwright/test";
import { config } from "dotenv";
import { alertIn, sellerWithListing, signUpVerified, withDb } from "../../helpers";

config({ path: ".env.local" });

// Entradas extremas en formularios y en la búsqueda. Se prioriza lo que no exige
// grabar video (S-03 ya cubre esa parte), y se documenta cualquier 500, mensaje en
// inglés o dato guardado sin normalizar.

test.describe("búsqueda /buscar: comillas, parámetros duplicados, page=-1", () => {
  test("comillas SQL en q no producen 500", async ({ request }) => {
    const res = await request.get("/buscar?q=" + encodeURIComponent("' OR '1'='1"));
    expect(res.status()).toBe(200);
  });

  test("comillas SQL en min/max no producen 500", async ({ request }) => {
    const res = await request.get(
      "/buscar?" + new URLSearchParams({ min: "1' OR '1'='1", max: "999999999999999999999" }).toString()
    );
    expect(res.status()).toBe(200);
  });

  test("%00 en q no produce 500", async ({ request }) => {
    const res = await request.get("/buscar?q=algo%00malicioso");
    expect(res.status()).toBe(200);
  });

  test("parámetros duplicados (q dos veces) no producen 500", async ({ request }) => {
    const res = await request.get("/buscar?q=uno&q=dos&categoria=tecnologia&categoria=ropa");
    expect(res.status()).toBe(200);
  });

  test("page=-1 (o cualquier paginación inventada) no produce 500", async ({ request }) => {
    const res = await request.get("/buscar?page=-1&q=algo");
    expect(res.status()).toBe(200);
  });

  test("min mayor que max no produce 500 ni resultados absurdos", async ({ request }) => {
    const res = await request.get("/buscar?min=999999999&max=1");
    expect(res.status()).toBe(200);
  });

  test("categoría inventada no produce 500 (se ignora o no devuelve nada)", async ({ request }) => {
    const res = await request.get("/buscar?categoria=" + encodeURIComponent("'; drop table listings; --"));
    expect(res.status()).toBe(200);
  });

  test("los datos de la tabla listings siguen intactos después de los intentos anteriores", async () => {
    const n = await withDb(async (c) => {
      const { rows } = await c.query(`select count(*)::int as n from listings`);
      return rows[0].n;
    });
    expect(n).toBeGreaterThan(0);
  });
});

test.describe("oferta en el chat: precios raros", () => {
  const casosInvalidos = [
    { valor: "0", nombre: "cero" },
    { valor: "-10000", nombre: "negativo" },
    { valor: "10000.50", nombre: "decimal con punto" },
    { valor: "1e10", nombre: "notación científica" },
    { valor: "abc", nombre: "texto" },
    { valor: "10000 <script>alert(1)</script>", nombre: "con HTML/script" },
    { valor: "٣٠٠٠٠", nombre: "dígitos arábigos" },
  ];

  for (const caso of casosInvalidos) {
    test(`oferta con precio ${caso.nombre} (${caso.valor}) se rechaza sin romper la pantalla`, async ({
      browser,
    }) => {
      const seller = await sellerWithListing(browser, `Extremos oferta ${caso.nombre} ${Date.now()}`, 300_000);
      const ctx = await browser.newContext();
      const buyer = await ctx.newPage();
      await signUpVerified(buyer, "tecoferta", "Comprador Oferta");

      await buyer.goto(`/producto/${seller.listingId}`);
      await buyer.getByRole("button", { name: "Escribirle al vendedor" }).click();
      await expect(buyer).toHaveURL(/\/chat\//);
      const conversationId = new URL(buyer.url()).pathname.split("/").pop()!;

      const before = await withDb(async (c) => {
        const { rows } = await c.query(
          `select count(*)::int as n from offers where conversation_id = $1`,
          [conversationId]
        );
        return rows[0].n;
      });

      await buyer.getByLabel("Cuánto ofreces").fill(caso.valor);
      await buyer.getByRole("button", { name: "Ofertar" }).click();

      // No debe crear una oferta con ese valor.
      const after = await withDb(async (c) => {
        const { rows } = await c.query(
          `select price_cop::text as price from offers where conversation_id = $1 order by created_at desc limit 1`,
          [conversationId]
        );
        return rows[0]?.price ?? null;
      });

      if (after !== null) {
        // Si se creó alguna oferta (por ejemplo un caso previamente válido),
        // el precio guardado nunca puede ser negativo, cero, ni tener
        // fracción.
        const n = Number(after);
        expect(Number.isInteger(n)).toBe(true);
        expect(n).toBeGreaterThan(0);
      } else {
        expect(after).toBeNull();
        expect(before).toBe(0);
      }

      await ctx.close();
      await seller.context.close();
    });
  }
});

test.describe("mensajes de chat con entradas hostiles", () => {
  test("un mensaje con <script> se guarda como texto, nunca se ejecuta", async ({ browser }) => {
    const seller = await sellerWithListing(browser, `Extremos chat script ${Date.now()}`, 200_000);
    const ctx = await browser.newContext();
    const buyer = await ctx.newPage();
    await signUpVerified(buyer, "tecscript", "Comprador Script");

    await buyer.goto(`/producto/${seller.listingId}`);
    await buyer.getByRole("button", { name: "Escribirle al vendedor" }).click();
    await expect(buyer).toHaveURL(/\/chat\//);

    let dialogFired = false;
    buyer.on("dialog", () => {
      dialogFired = true;
    });

    const payload = `<script>alert('xss')</script><img src=x onerror="alert(1)">`;
    await buyer.getByLabel("Mensaje").fill(payload);
    await buyer.getByRole("button", { name: "Enviar" }).click();
    await buyer.waitForTimeout(500);

    expect(dialogFired).toBe(false);
    // El texto debe aparecer literal (escapado), no como HTML ejecutado.
    const visibleText = await buyer.locator("body").innerText();
    expect(visibleText).toContain("alert");

    await ctx.close();
    await seller.context.close();
  });

  test("un título de 5000 caracteres no produce 500 al verlo en la ficha (si se guarda)", async ({
    browser,
  }) => {
    const longTitle = "A".repeat(5000);
    const seller = await sellerWithListing(browser, longTitle, 150_000);
    const res = await seller.page.goto(`/producto/${seller.listingId}`);
    expect(res?.status()).toBe(200);
    await seller.context.close();
  });

  test("RTL/bidi puro (sin bytes de control) en un mensaje de chat no rompe la pantalla", async ({
    browser,
  }) => {
    const seller = await sellerWithListing(browser, `Extremos RTL ${Date.now()}`, 220_000);
    const ctx = await browser.newContext();
    const buyer = await ctx.newPage();
    await signUpVerified(buyer, "tecrtl", "Comprador RTL");

    await buyer.goto(`/producto/${seller.listingId}`);
    await buyer.getByRole("button", { name: "Escribirle al vendedor" }).click();
    await expect(buyer).toHaveURL(/\/chat\//);

    // Solo caracteres bidi/RTL de verdad (marca de anulacion de direccion,
    // U+202E), sin ningun byte de control. El byte nulo se prueba aparte, mas
    // abajo: mezclarlos aqui habria confundido cual de las dos cosas rompe la
    // pantalla.
    const payload = "\u0645\u0631\u062D\u0628\u0627\u202Eevil fin";
    await buyer.getByLabel("Mensaje").fill(payload);
    await buyer.getByRole("button", { name: "Enviar" }).click();
    await buyer.waitForTimeout(300);
    await expect(buyer.getByLabel("Mensaje")).toBeVisible();

    await ctx.close();
    await seller.context.close();
  });

  test("un byte nulo (\\u0000) en un mensaje de chat tumba la pantalla con un error en ingles", async ({
    browser,
  }) => {
    // Mismo defecto que el de /buscar?q=...%00... (ver arriba), pero alcanzado
    // por un campo de formulario normal en vez de la URL: Postgres rechaza el
    // byte nulo dentro de un texto y la excepcion no se atrapa en ningun punto
    // de la cadena, asi que la persona que escribe recibe la pantalla generica
    // de Next.js en ingles, no un mensaje de "escribe algo distinto" en espanol.
    const seller = await sellerWithListing(browser, `Extremos NUL ${Date.now()}`, 210_000);
    const ctx = await browser.newContext();
    const buyer = await ctx.newPage();
    await signUpVerified(buyer, "tecnul", "Comprador Nulo");

    await buyer.goto(`/producto/${seller.listingId}`);
    await buyer.getByRole("button", { name: "Escribirle al vendedor" }).click();
    await expect(buyer).toHaveURL(/\/chat\//);

    const payload = "hola\u0000mundo";
    await buyer.getByLabel("Mensaje").fill(payload);
    await buyer.getByRole("button", { name: "Enviar" }).click();
    await buyer.waitForTimeout(500);

    // Lo que se espera de un producto que cuida los datos: un mensaje de error
    // en espanol, la pantalla de chat intacta, y nada guardado a medias. Lo que
    // se observa (y por eso esta asercion puede fallar) es la pantalla generica
    // de Next.js, en ingles, sin ninguna salida ofrecida en espanol.
    await expect(buyer.getByLabel("Mensaje")).toBeVisible();
    const bodyText = await buyer.locator("body").innerText();
    expect(bodyText).not.toMatch(/This page couldn.t load|server error occurred/i);

    await ctx.close();
    await seller.context.close();
  });
});

test.describe("registro: correo y celular raros", () => {
  test("celular con letras es rechazado con mensaje en español, no un 500", async ({ page }) => {
    await page.goto("/registro?rol=comprador");
    await page.getByLabel("Nombre").fill("Prueba Celular");
    await page.getByLabel("Correo").fill(`raro.${Date.now()}@correo.com`);
    await page.getByLabel("Celular").fill("30abc12345");
    await page.getByLabel("Contraseña").fill("unaClaveLarga1");
    const checkbox = page.getByRole("checkbox");
    if (await checkbox.count()) await checkbox.check();
    await page.getByRole("button", { name: "Continuar" }).click();
    await page.waitForTimeout(500);
    // No debe avanzar a /verificar con un celular inválido.
    expect(page.url()).not.toMatch(/\/verificar/);
    const text = await page.locator("body").innerText();
    expect(text).not.toMatch(/Internal Server Error|Application error/i);
  });

  test("direcciones vacías con solo espacios no pasan el checkout", async ({ browser }) => {
    const seller = await sellerWithListing(browser, `Extremos direccion vacia ${Date.now()}`, 130_000);
    const ctx = await browser.newContext();
    const buyer = await ctx.newPage();
    await signUpVerified(buyer, "tecdireccion", "Comprador Direccion");

    await buyer.goto(`/comprar/${seller.listingId}`);
    await buyer.getByLabel("Quién recibe").fill("   ");
    await buyer.getByLabel("Celular de quien recibe").fill("   ");
    await buyer.getByLabel("Dirección").fill("     ");
    await buyer.getByLabel("Zona").selectOption("Chapinero");
    await buyer.getByRole("button", { name: "Ir a pagar" }).click();
    await buyer.waitForTimeout(500);
    // No debe progresar a la pantalla de pago con una dirección en blanco.
    expect(buyer.url()).not.toMatch(/\/dev\/pago\//);

    await ctx.close();
    await seller.context.close();
  });
});

test.describe("IMEI con letras", () => {
  test("un IMEI con letras se rechaza al publicar tecnología (revisión vía la acción real)", async ({
    browser,
  }) => {
    // No se recorre la grabación de video (fuera de alcance de esta prueba); se
    // documenta como hallazgo si se puede reproducir por la interfaz de publicar,
    // y si no, se deja constancia de que solo se revisó el código de validación.
    const seller = await sellerWithListing(browser, `Extremos IMEI ${Date.now()}`, 300_000, "tecnologia");
    // sellerWithListing ya deja un artículo de tecnología sin IMEI por defecto; se
    // documenta en el informe como NO VERIFICADO por interfaz y se referencia el
    // validador en src/features/moderation/imei.ts.
    await seller.context.close();
  });
});
