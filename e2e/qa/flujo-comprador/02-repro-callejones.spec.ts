import { test, expect } from "@playwright/test";

// Reproducción enfocada de dos posibles callejones sin salida vistos en
// 01-descubrir-y-cuenta.spec.ts: el botón "Comprar con pago protegido" y
// "Escribirle al vendedor" como anónimo. Timeouts cortos a propósito para no
// esperar 2 minutos por cada uno, y con diagnóstico de red y consola.

const EVID = "qa/ronda-diseno/evidencia-flujo-comprador";
const LISTING = "https://d13g2bd9j8wj8k.cloudfront.net/producto/9cb64ffc-ecdb-452f-8ace-873b9fa7b72a";

test.describe.configure({ timeout: 40_000 });

test("repro A: anonimo clic en Comprar con pago protegido", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text()); });
  page.on("pageerror", (e) => consoleErrors.push("pageerror: " + e.message));
  const requests: string[] = [];
  page.on("requestfinished", (r) => requests.push(`${r.method()} ${r.url()} -> ${r.response()?.then}`));

  await page.goto(LISTING);
  const before = page.url();
  const comprar = page.getByRole("link", { name: /comprar con pago protegido/i });
  await expect(comprar).toBeVisible();
  const href = await comprar.getAttribute("href");
  console.log("href del botón Comprar:", href);

  await comprar.click();
  await page.waitForTimeout(5000);
  console.log("URL antes:", before, "| URL 5s después del clic:", page.url());
  await page.screenshot({ path: `${EVID}/08-repro-comprar-anonimo.png`, fullPage: true });
  console.log("Errores de consola/página:", consoleErrors);
});

test("repro B: anonimo clic en Escribirle al vendedor", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text()); });
  page.on("pageerror", (e) => consoleErrors.push("pageerror: " + e.message));
  const failedReqs: string[] = [];
  page.on("requestfailed", (r) => failedReqs.push(`${r.method()} ${r.url()} -> ${r.failure()?.errorText}`));
  const respStatuses: string[] = [];
  page.on("response", (r) => { if (r.request().method() === "POST") respStatuses.push(`${r.status()} ${r.url()}`); });

  await page.goto(LISTING);
  const before = page.url();
  const escribir = page.getByRole("button", { name: /escribirle al vendedor/i });
  await expect(escribir).toBeVisible();
  await escribir.click();

  console.log("Texto del botón justo tras el clic:", await escribir.innerText().catch(() => "(desapareció)"));
  await page.waitForTimeout(8000);
  console.log("URL antes:", before, "| URL 8s después del clic:", page.url());
  const textoBoton = await page.locator("form button[type=submit]").first().innerText().catch(() => "(no encontrado)");
  console.log("Texto del botón 8s después:", textoBoton);
  console.log("POST vistos:", respStatuses);
  console.log("Requests fallidos:", failedReqs);
  console.log("Errores de consola/página:", consoleErrors);
  await page.screenshot({ path: `${EVID}/09-repro-chat-anonimo.png`, fullPage: true });
});
