import { test, expect } from "@playwright/test";

// ¿A dónde cae el comprador después de iniciar sesión cuando el motivo fue
// "quería escribirle a este vendedor"? Usa la cuenta demo laura@2venta.demo.

const EVID = "qa/ronda-diseno/evidencia-flujo-comprador";
const LISTING = "https://d13g2bd9j8wj8k.cloudfront.net/producto/9cb64ffc-ecdb-452f-8ace-873b9fa7b72a";

test.setTimeout(60_000);

test("repro D: tras iniciar sesión desde el chat, ¿vuelve a la ficha o cae en la portada?", async ({ page }) => {
  await page.goto(LISTING);
  await page.getByRole("button", { name: /escribirle al vendedor/i }).click();
  await expect(page).toHaveURL(/\/ingresar/, { timeout: 15_000 });

  await page.getByLabel("Correo").fill("laura@2venta.demo");
  await page.getByLabel("Contraseña").fill("Demo2venta.2026");
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await page.waitForURL((u) => !u.pathname.includes("/ingresar"), { timeout: 15_000 });
  console.log("URL de partida (ficha):", LISTING);
  console.log("URL final tras iniciar sesión:", page.url());
  console.log("¿Volvió a la ficha original?:", page.url() === LISTING);
  await page.screenshot({ path: `${EVID}/07b-tras-login-destino-final.png`, fullPage: true });
});
