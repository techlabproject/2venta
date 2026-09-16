import { test, expect, type Browser, type BrowserContext, type Page } from "@playwright/test";
import { Client } from "pg";
import { config } from "dotenv";
import { resetDemo } from "./global-setup";

config({ path: ".env.local" });

// Pruebas visuales: una foto por pantalla, en móvil y escritorio, comparada con
// la referencia. Los datos son los de la demostración (db/demo.mts). Ver
// playwright.visual.config.ts.
//
// Las fechas cambian cada día; se tapan antes de comparar (`mask`). Todo lo
// demás debe ser idéntico corrida tras corrida.

const CLAVE = "Demo2venta.2026";
const CUENTAS = {
  camila: "camila@2venta.demo",
  andres: "andres@2venta.demo",
  laura: "laura@2venta.demo",
  admin: "admin@2venta.demo",
};

async function db<T>(fn: (c: Client) => Promise<T>): Promise<T> {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

async function listingId(title: string): Promise<string> {
  return db(async (c) => {
    const { rows } = await c.query<{ id: string }>(
      `select id from listings where title like $1 order by created_at limit 1`,
      [`${title}%`]
    );
    if (!rows[0]) throw new Error(`No existe la publicación "${title}". ¿Corrió la demo?`);
    return rows[0].id;
  });
}

async function sellerId(email: string): Promise<string> {
  return db(async (c) => {
    const { rows } = await c.query<{ id: string }>(`select id from "user" where email = $1`, [email]);
    return rows[0].id;
  });
}

async function login(browser: Browser, email: string): Promise<{ ctx: BrowserContext; page: Page }> {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto("/ingresar");
  await page.getByLabel("Correo").fill(email);
  await page.getByLabel("Contraseña").fill(CLAVE);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page.getByTestId("usuario")).toBeVisible();
  return { ctx, page };
}

/** Fotografía la página entera con las fechas tapadas. */
async function foto(page: Page, nombre: string) {
  // Las fuentes y TODAS las imágenes tienen que estar decodificadas antes de la
  // foto: una portada que termina de cargar tarde recorre la página hacia abajo
  // y hace que la comparación falle por reflujo, no por un cambio real.
  await page.waitForLoadState("networkidle");
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(
      [...document.images].map((img) =>
        img.complete && img.naturalWidth > 0 ? img.decode().catch(() => {}) : Promise.resolve()
      )
    );
  });
  await expect(page).toHaveScreenshot(`${nombre}.png`, {
    fullPage: true,
    mask: [
      // Fechas "13 sept 2026", "sept 2026" y horas "1:30 p. m." cambian cada día.
      page.getByText(/\b\d{1,2} (ene|feb|mar|abr|may|jun|jul|ago|sept?|oct|nov|dic)\.? \d{4}|\b(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre) de \d{4}|\b\d{1,2}:\d{2}\s?[ap]\./),
      // El número de pedido es un UUID: distinto en cada corrida.
      page.getByRole("heading", { name: /^Pedido / }),
    ],
  });
}

test.describe.configure({ mode: "serial" });

// Cada proyecto (móvil, escritorio) arranca con la misma base: lo que compra
// uno no puede cambiar lo que fotografía el otro.
test.beforeAll(async ({ baseURL }) => {
  resetDemo(String(baseURL));
});

test.describe("sin sesión", () => {
  test("inicio", async ({ page }) => {
    await page.goto("/");
    await foto(page, "inicio");
  });
  test("bienvenida", async ({ page }) => {
    await page.goto("/bienvenida");
    await foto(page, "bienvenida");
  });
  test("registro", async ({ page }) => {
    await page.goto("/registro?rol=comprador");
    await foto(page, "registro");
  });
  test("ingresar", async ({ page }) => {
    await page.goto("/ingresar");
    await foto(page, "ingresar");
  });
  test("recuperar contraseña", async ({ page }) => {
    await page.goto("/recuperar");
    await foto(page, "recuperar");
  });
  test("búsqueda con resultados", async ({ page }) => {
    await page.goto("/buscar?q=tenis");
    await foto(page, "busqueda-resultados");
  });
  test("búsqueda con filtros abiertos", async ({ page }) => {
    await page.goto("/buscar?categoria=ropa&max=100000");
    await page.getByText("Filtros").click();
    await foto(page, "busqueda-filtros");
  });
  test("búsqueda sin resultados", async ({ page }) => {
    await page.goto("/buscar?q=zzzz-nada");
    await foto(page, "busqueda-sin-resultados");
  });
  test("ficha con fotos y video", async ({ page }) => {
    await page.goto(`/producto/${await listingId("MacBook Air")}`);
    await foto(page, "ficha");
  });
  test("perfil público del vendedor", async ({ page }) => {
    await page.goto(`/vendedor/${await sellerId(CUENTAS.camila)}`);
    await foto(page, "perfil-vendedor");
  });
  test("no encontrado", async ({ page }) => {
    await page.goto("/esto-no-existe");
    await foto(page, "no-encontrado");
  });
});

test.describe("compradora (Laura)", () => {
  let ctx: BrowserContext;
  let page: Page;
  test.beforeAll(async ({ browser }) => {
    ({ ctx, page } = await login(browser, CUENTAS.laura));
  });
  test.afterAll(async () => ctx.close());

  test("ficha con sesión", async () => {
    await page.goto(`/producto/${await listingId("iPhone 12")}`);
    await foto(page, "ficha-con-sesion");
  });
  test("carrito vacío", async () => {
    await page.goto("/carrito");
    await foto(page, "carrito-vacio");
  });
  test("carrito con dos cosas del mismo vendedor", async () => {
    for (const t of ["iPhone 12", "Tornamesa"]) {
      await page.goto(`/producto/${await listingId(t)}`);
      await page.getByRole("button", { name: "Agregar al carrito" }).click();
      // "Agregando…" también hace desaparecer el botón; se espera al estado final.
      await expect(page.getByText("Está en tu carrito.")).toBeVisible();
    }
    // Y a que los dos estén escritos, que es lo que la foto tiene que mostrar.
    await expect
      .poll(() =>
        db(async (c) => {
          const { rows } = await c.query<{ n: string }>(
            `select count(*)::text as n from cart_items ci join "user" u on u.id = ci.user_id where u.email = $1`,
            [CUENTAS.laura]
          );
          return Number(rows[0].n);
        })
      )
      .toBe(2);
    await page.goto("/carrito");
    await foto(page, "carrito-con-cosas");
  });
  test("dirección de entrega", async () => {
    await page.goto("/comprar/carrito");
    await foto(page, "comprar-direccion");
  });
  test("pago de prueba y pedido como compradora", async () => {
    await page.getByLabel("Quién recibe").fill("Laura Torres");
    await page.getByLabel("Celular de quien recibe").fill("300 412 88 05");
    await page.getByLabel("Dirección").fill("Calle 45 # 13-20, apto 301");
    await page.getByLabel("Zona").selectOption("Chapinero");
    await page.getByRole("button", { name: "Ir a pagar" }).click();
    await expect(page).toHaveURL(/\/dev\/pago\//);
    await foto(page, "pago-de-prueba");
    await page.getByRole("button", { name: "Simular pago aprobado" }).click();
    await expect(page).toHaveURL(/\/pedido\//);
    await foto(page, "pedido-compradora");
  });
  test("pedido presencial con código", async () => {
    await page.goto(`/comprar/${await listingId("Guante de béisbol")}`);
    await page.getByRole("radio", { name: /Nos vemos en persona/ }).check();
    await page.getByLabel("¿En qué zona se ven?").selectOption("Chapinero");
    await page.getByRole("button", { name: "Ir a pagar" }).click();
    await page.getByRole("button", { name: "Simular pago aprobado" }).click();
    await expect(page).toHaveURL(/\/pedido\//);
    await foto(page, "pedido-presencial");
  });
  test("chat con mensaje filtrado", async () => {
    await page.goto(`/producto/${await listingId("MacBook Air")}`);
    await page.getByRole("button", { name: "Escribirle al vendedor" }).click();
    await expect(page).toHaveURL(/\/chat\//);
    await page.getByLabel("Mensaje").fill("Hola, ¿sigue disponible? Mi cel es 3004128805");
    await page.getByRole("button", { name: "Enviar" }).click();
    await expect(page.getByRole("main")).toContainText("Ocultamos ese dato");
    await foto(page, "chat-filtrado");
  });
  test("favoritos", async () => {
    await page.goto(`/producto/${await listingId("Tacones")}`);
    await page.getByTestId("favorito").click();
    await expect(page.getByTestId("favorito")).toHaveText("Guardado");
    await page.goto("/favoritos");
    await foto(page, "favoritos");
  });
  test("actividad", async () => {
    await page.goto("/actividad");
    await foto(page, "actividad");
  });
  test("bandeja de conversaciones", async () => {
    // Va después de "chat filtrado", que es quien deja una conversación abierta.
    await page.goto("/chats");
    await foto(page, "chats");
  });
  test("avisos", async () => {
    await page.goto("/avisos");
    await foto(page, "avisos");
  });
  test("cuenta y editar perfil", async () => {
    await page.goto("/cuenta");
    await foto(page, "cuenta");
    await page.goto("/cuenta/editar");
    await foto(page, "cuenta-editar");
  });
});

test.describe("vendedores (Camila y Andrés)", () => {
  test("vender, publicar, editar, métricas y tienda", async ({ browser }) => {
    const { ctx, page } = await login(browser, CUENTAS.camila);
    await page.goto("/vender");
    await foto(page, "vender");
    await page.goto("/publicar");
    await foto(page, "publicar");
    await page.goto(`/producto/${await listingId("Triciclo")}/editar`);
    await foto(page, "editar-publicacion");
    await page.goto(`/producto/${await listingId("Triciclo")}`);
    await foto(page, "ficha-como-vendedora");
    await page.goto("/vender/metricas");
    await foto(page, "metricas");
    await page.goto("/tienda");
    await foto(page, "tienda");
    await ctx.close();
  });
  test("pedido como vendedor", async ({ browser }) => {
    const { ctx, page } = await login(browser, CUENTAS.andres);
    await page.goto("/actividad");
    await page.getByRole("link", { name: /iPhone 12/ }).first().click();
    await expect(page).toHaveURL(/\/pedido\//);
    await foto(page, "pedido-vendedor");
    await ctx.close();
  });
});

test.describe("administración", () => {
  test("cola, disputas, usuarios y reportes", async ({ browser }) => {
    const { ctx, page } = await login(browser, CUENTAS.admin);
    await page.goto("/admin");
    await foto(page, "admin");
    await page.goto("/admin/disputas");
    await foto(page, "admin-disputas");
    await page.goto("/admin/usuarios");
    await foto(page, "admin-usuarios");
    await page.goto("/admin/reportes");
    await foto(page, "admin-reportes");
    await ctx.close();
  });
});
