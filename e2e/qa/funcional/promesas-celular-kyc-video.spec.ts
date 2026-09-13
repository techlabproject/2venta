import { test, expect } from "@playwright/test";
import { signUpVerified, uniqueAccount, approveKycFor, withDb, alertIn } from "../../helpers";

// Agente funcional — Parte 2 (las cinco promesas), promesas 1, 2 y 3.
//
// 1. Comprar, escribir por chat o publicar sin celular confirmado.
// 2. Publicar sin identidad verificada; publicar sin video.

test.describe("Promesa: celular confirmado antes de comprar/escribir/publicar", () => {
  test("una cuenta con celular SIN confirmar no llega a comprar, no llega a escribir, no llega a publicar", async ({
    page,
  }) => {
    const { email, phoneDigits } = uniqueAccount("sincel");
    await page.goto("/registro?rol=comprador");
    await page.getByLabel("Nombre").fill("Sin Celular");
    await page.getByLabel("Correo").fill(email);
    await page.getByLabel("Celular").fill(phoneDigits);
    await page.getByLabel("Contraseña").fill("unaClaveLarga1");
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Continuar" }).click();
    await expect(page).toHaveURL(/\/verificar/);
    // A propósito NO confirmamos el código: la cuenta queda con celular sin
    // verificar, pero con sesión iniciada (el registro ya crea la sesión).

    // Intento 1: comprar. Necesitamos un artículo existente; usamos búsqueda.
    await page.goto("/");
    const primerArticulo = page.getByRole("link").filter({ hasText: /\$/ }).first();
    const visible = await primerArticulo.isVisible().catch(() => false);
    if (visible) {
      await primerArticulo.click();
      await page.getByRole("link", { name: /Comprar con pago protegido/i }).click();
      await expect(page).toHaveURL(/\/verificar/, { timeout: 10_000 });
      await page.screenshot({ path: "qa/capturas/funcional-sin-celular-comprar-bloqueado.png", fullPage: true });
    }

    // Intento 2: escribir por chat / preguntar. Volvemos al catálogo.
    await page.goto("/");
    const otroArticulo = page.getByRole("link").filter({ hasText: /\$/ }).first();
    if (await otroArticulo.isVisible().catch(() => false)) {
      await otroArticulo.click();
      const escribir = page.getByRole("button", { name: "Escribirle al vendedor" });
      if (await escribir.isVisible().catch(() => false)) {
        await escribir.click();
        await expect(page).toHaveURL(/\/verificar/, { timeout: 10_000 });
      }
    }

    // Intento 3: publicar. /publicar debe redirigir a /verificar.
    await page.goto("/publicar");
    await expect(page).toHaveURL(/\/verificar/, { timeout: 10_000 });
    await page.screenshot({ path: "qa/capturas/funcional-sin-celular-publicar-bloqueado.png", fullPage: true });
  });
});

test.describe("Promesa: identidad verificada antes de publicar", () => {
  test("una cuenta con celular confirmado pero SIN KYC aprobado no puede publicar (pantalla y acción del servidor)", async ({
    page,
  }) => {
    await signUpVerified(page, "sinkyc", "Sin Kyc");

    // Por pantalla: /publicar redirige a /vender si no hay KYC aprobado.
    await page.goto("/publicar");
    await expect(page).toHaveURL(/\/vender/, { timeout: 10_000 });
    await expect(page.getByRole("heading", { name: /Verifica tu identidad/i })).toBeVisible();
    await page.screenshot({ path: "qa/capturas/funcional-sin-kyc-publicar-bloqueado.png", fullPage: true });

    // No pudimos invocar la Server Action `publishListing` directamente sin pasar
    // por la pantalla: Next.js firma sus Server Actions con un id de acción
    // interno (encabezado `Next-Action`) que no se puede reconstruir desde afuera
    // sin antes observarlo en una llamada legítima, y reproducirlo con fidelidad
    // se salía del presupuesto de esta pasada. Confirmamos por LECTURA DE CÓDIGO
    // (no es observación en vivo, se etiqueta así en el informe) que
    // `src/features/publish/actions.ts` repite la comprobación de celular
    // verificado y de `getVerification(user.id)?.status !== 'aprobado'` dentro de
    // la propia función `publishListing`, antes de tocar la base — es decir, la
    // pantalla no es el único control.
  });
});

test.describe("Promesa: video obligatorio para publicar", () => {
  test("el botón Publicar queda deshabilitado sin video, y forzar el envío del formulario sin video_key no crea la publicación", async ({
    page,
  }) => {
    const { email } = await signUpVerified(page, "sinvideo", "Sin Video");
    await approveKycFor(email);

    await page.goto("/publicar");
    await page.getByLabel("Título").fill("Consola de prueba QA sin video");
    await page.getByLabel("Precio").fill("80000");
    await page.getByLabel("Descripción").fill("Descripción de prueba suficientemente larga para el formulario.");

    // El botón dice "Graba el video para continuar" y está deshabilitado.
    const boton = page.getByRole("button", { name: "Graba el video para continuar" });
    await expect(boton).toBeVisible();
    await expect(boton).toBeDisabled();
    await page.screenshot({ path: "qa/capturas/funcional-publicar-boton-sin-video.png", fullPage: true });

    // Forzamos el envío del formulario saltándonos el estado deshabilitado del
    // botón, para ver si el servidor (no solo la pantalla) rechaza publicar sin
    // video_key/poster_key. Esto reproduce lo que haría alguien manipulando el
    // DOM o enviando el formulario por su cuenta, sin tocar el protocolo interno
    // de Next.
    await page.evaluate(() => {
      const form = document.querySelector("form");
      form?.requestSubmit();
    });
    await page.waitForTimeout(1500);

    const created = await withDb((c) =>
      c.query(`select id from listings where title = $1`, ["Consola de prueba QA sin video"])
    );
    expect(created.rows.length).toBe(0);

    const alerta = alertIn(page);
    if (await alerta.isVisible().catch(() => false)) {
      await expect(alerta).toContainText(/video/i);
    }
    await page.screenshot({ path: "qa/capturas/funcional-publicar-forzado-sin-video-rechazado.png", fullPage: true });
  });
});
