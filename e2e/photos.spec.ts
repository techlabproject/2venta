import { test, expect, type Page } from "@playwright/test";
import { alertIn, approveKycFor, signUpVerified, withDb } from "./helpers";

// La prueba de punta a punta de la rebanada S-23.
// Ver slices/23-fotos.md

/** Un JPEG mínimo válido, para no depender de archivos en disco. */
const JPEG = Buffer.from(
  "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q==",
  "base64"
);

function photoFiles(n: number) {
  return Array.from({ length: n }, (_, i) => ({
    name: `foto-${i}.jpg`,
    mimeType: "image/jpeg",
    buffer: JPEG,
  }));
}

async function verifiedSeller(page: Page) {
  const { email } = await signUpVerified(page, "fotos", "Camila Vendedora");
  await approveKycFor(email);
}

async function publish(page: Page, title: string, photos: number) {
  await page.goto("/publicar");
  await page.getByRole("button", { name: "Abrir cámara" }).click();
  await page.getByRole("button", { name: /^Grabar/ }).click();
  await page.getByRole("button", { name: "Terminar" }).click();
  await expect(page.getByRole("status")).toContainText("Video listo");

  if (photos > 0) {
    await page.getByLabel("Fotos").setInputFiles(photoFiles(photos));
  }
  await page.getByLabel("Título").fill(title);
  await page.getByLabel("Categoría").selectOption("ropa");
  await page.getByLabel("Precio").fill("70000");
  await page.getByLabel("Descripción").fill("Prenda de prueba.");
  await page.getByRole("button", { name: "Publicar" }).click();
}

test("se publica con fotos y la ficha las muestra", async ({ browser }) => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await verifiedSeller(page);

  const titulo = `Chaqueta con fotos ${Date.now()}`;
  await publish(page, titulo, 3);
  await expect(page).toHaveURL(/\/producto\//);

  await expect(page.getByTestId("fotos").getByRole("listitem")).toHaveCount(3);
  // El video sigue estando: es la prueba, y va primero en importancia.
  await expect(page.getByTestId("video-articulo")).toBeVisible();

  await ctx.close();
});

test("la primera foto pasa a ser la portada en el catálogo", async ({ browser }) => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await verifiedSeller(page);

  const titulo = `Buzo portada ${Date.now()}`;
  await publish(page, titulo, 2);
  await expect(page).toHaveURL(/\/producto\//);
  const listingId = new URL(page.url()).pathname.split("/").pop()!;

  const portada = await withDb(async (c) => {
    const { rows } = await c.query<{ path: string }>(
      `select path from listing_photos where listing_id = $1 order by position limit 1`,
      [listingId]
    );
    return rows[0].path;
  });

  const anonCtx = await browser.newContext();
  const anon = await anonCtx.newPage();
  await anon.goto("/");
  const tarjeta = anon.getByRole("main").getByRole("listitem").filter({ hasText: titulo });
  // La imagen lleva alt vacío a propósito: el título de la tarjeta ya la describe,
  // así que para un lector de pantalla es decorativa y no tiene rol de imagen.
  await expect(tarjeta.locator("img")).toHaveAttribute("src", `/api/media/${portada}`);

  await ctx.close();
  await anonCtx.close();
});

test("sin fotos, la portada sigue siendo el cuadro del video", async ({ browser }) => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await verifiedSeller(page);

  const titulo = `Camisa sin fotos ${Date.now()}`;
  await publish(page, titulo, 0);
  await expect(page).toHaveURL(/\/producto\//);

  await expect(page.getByTestId("fotos")).toHaveCount(0);
  await expect(page.getByTestId("video-articulo")).toBeVisible();

  await ctx.close();
});

test("más de seis fotos se rechazan", async ({ browser }) => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await verifiedSeller(page);

  await publish(page, `Muchas fotos ${Date.now()}`, 7);
  await expect(alertIn(page)).toContainText("Máximo 6");

  await ctx.close();
});

test("un archivo que no es imagen se rechaza", async ({ browser }) => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await verifiedSeller(page);

  await page.goto("/publicar");
  await page.getByRole("button", { name: "Abrir cámara" }).click();
  await page.getByRole("button", { name: /^Grabar/ }).click();
  await page.getByRole("button", { name: "Terminar" }).click();
  await expect(page.getByRole("status")).toContainText("Video listo");

  await page.getByLabel("Fotos").setInputFiles({
    name: "no-es-imagen.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("hola", "utf8"),
  });
  await page.getByLabel("Título").fill(`Archivo malo ${Date.now()}`);
  await page.getByLabel("Categoría").selectOption("ropa");
  await page.getByLabel("Precio").fill("50000");
  await page.getByLabel("Descripción").fill("Prueba.");
  await page.getByRole("button", { name: "Publicar" }).click();

  await expect(alertIn(page)).toContainText("no es una imagen");

  await ctx.close();
});
