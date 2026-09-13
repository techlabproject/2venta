import { test, expect } from "@playwright/test";

// Reproducción cronometrada de "Escribirle al vendedor" como anónimo: ¿es lento
// o de verdad se queda pegado? Sondea cada 2s hasta 45s y registra el tiempo de
// cada paso, para distinguir contención de red de un defecto real.

const EVID = "qa/ronda-diseno/evidencia-flujo-comprador";
const LISTING = "https://d13g2bd9j8wj8k.cloudfront.net/producto/9cb64ffc-ecdb-452f-8ace-873b9fa7b72a";

test.setTimeout(90_000);

test("repro C: cronometrar Escribirle al vendedor anónimo", async ({ page }) => {
  const t0 = Date.now();
  const mark = (label: string) => console.log(`[t+${((Date.now() - t0) / 1000).toFixed(1)}s] ${label}`);

  await page.goto(LISTING);
  mark("página cargada");

  const escribir = page.getByRole("button", { name: /escribirle al vendedor/i });
  await expect(escribir).toBeVisible();
  await escribir.click();
  mark("clic hecho");

  let arrived = false;
  for (let i = 0; i < 22; i++) {
    await page.waitForTimeout(2000);
    const url = page.url();
    mark(`sondeo: url = ${url}`);
    if (url.includes("/ingresar") || url.includes("/chat/")) {
      arrived = true;
      break;
    }
  }
  mark(`fin del sondeo, ¿llegó a algún lado? ${arrived}`);
  await page.screenshot({ path: `${EVID}/09b-repro-chat-timing-final.png`, fullPage: true });
});
