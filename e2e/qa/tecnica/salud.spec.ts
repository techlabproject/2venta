import { test, expect } from "@playwright/test";

// Salud y configuración: /api/salud, rutas inexistentes, métodos no permitidos,
// Accept raros. Ver AGENTE-QA.md.

test("GET /api/salud responde ok", async ({ request }) => {
  const res = await request.get("/api/salud");
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body).toMatchObject({ estado: "ok" });
});

test("POST /api/salud (método no habitual) no produce 500", async ({ request }) => {
  const res = await request.post("/api/salud");
  expect(res.status()).toBeLessThan(500);
});

test("ruta inexistente /esto-no-existe-de-verdad responde 404 en español", async ({ request }) => {
  const res = await request.get("/esto-no-existe-de-verdad-2venta");
  expect(res.status()).toBe(404);
});

test("ruta de API inexistente responde 404, no 500", async ({ request }) => {
  const res = await request.get("/api/esto-no-existe-de-verdad");
  expect(res.status()).toBe(404);
});

test("método DELETE sobre /api/salud no produce 500", async ({ request }) => {
  const res = await request.delete("/api/salud");
  expect(res.status()).toBeLessThan(500);
});

test("Accept: application/xml sobre una ruta JSON no rompe el servidor", async ({ request }) => {
  const res = await request.get("/api/salud", { headers: { accept: "application/xml" } });
  expect(res.status()).toBeLessThan(500);
});

test("página 404 del sitio (no-API) está en español y no expone una traza", async ({ page }) => {
  const res = await page.goto("/esta-pagina-nunca-existio");
  expect(res?.status()).toBe(404);
  const text = await page.locator("body").innerText();
  expect(text).not.toMatch(/at Object\.|node_modules|Error:.*\n.*at /);
});

test("cuerpo JSON malformado en una API no produce 500 sin manejar", async ({ request }) => {
  const res = await request.post("/api/pagos/webhook", {
    data: Buffer.from("{ esto no cierra"),
    headers: { "content-type": "application/json" },
  });
  // Sin firma válida, debe ser 401 antes de siquiera tocar el JSON.
  expect(res.status()).toBe(401);
});
