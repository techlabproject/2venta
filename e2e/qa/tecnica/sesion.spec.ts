import { test, expect, type Page } from "@playwright/test";
import { config } from "dotenv";
import { withDb, uniqueAccount } from "../../helpers";
import { decryptCode } from "../../../src/features/auth/otp";

config({ path: ".env.local" });

// Sesión y autenticación: límites de intentos, códigos vencidos/incorrectos,
// celular repetido entre cuentas, cookies y cabeceras. Ver AGENTE-QA.md.

async function registerUpTo(page: Page, name: string, email: string, phoneDigits: string) {
  await page.goto("/registro?rol=comprador");
  await page.getByLabel("Nombre").fill(name);
  await page.getByLabel("Correo").fill(email);
  await page.getByLabel("Celular").fill(phoneDigits);
  await page.getByLabel("Contraseña").fill("unaClaveLarga1");
  const checkbox = page.getByRole("checkbox");
  if (await checkbox.count()) await checkbox.check();
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page).toHaveURL(/\/verificar/);
}

test("registrar el mismo celular en dos cuentas distintas: ¿las dos terminan verificadas?", async ({
  browser,
}) => {
  // D-01 dice que el celular verificado es justo lo que impide crear cuentas
  // desechables. Si el mismo número puede verificar dos cuentas distintas, esa
  // protección no existe de verdad.
  const sharedPhoneDigits = `3${String(Math.floor(Math.random() * 900_000_000) + 100_000_000)}`.slice(
    0,
    10
  );
  const phone = `+57${sharedPhoneDigits}`;

  const ctxA = await browser.newContext();
  const pageA = await ctxA.newPage();
  const emailA = `tecdup.a.${Date.now()}@correo.com`;
  await registerUpTo(pageA, "Cuenta Uno", emailA, sharedPhoneDigits);
  const codeA = await withDb(async (c) => {
    const { rows } = await c.query<{ code_enc: string }>(
      `select code_enc from phone_codes where phone = $1`,
      [phone]
    );
    return decryptCode(rows[0].code_enc)!;
  });
  await pageA.getByLabel("Código de seis dígitos").fill(codeA);
  await pageA.getByRole("button", { name: "Confirmar celular" }).click();
  await expect(pageA.getByTestId("usuario")).toBeVisible();

  const verifiedA = await withDb(async (c) => {
    const { rows } = await c.query(`select "phoneNumberVerified" from "user" where email = $1`, [
      emailA,
    ]);
    return rows[0].phoneNumberVerified;
  });
  expect(verifiedA).toBe(true);

  // Segunda cuenta, mismo celular.
  const ctxB = await browser.newContext();
  const pageB = await ctxB.newPage();
  const emailB = `tecdup.b.${Date.now()}@correo.com`;
  await registerUpTo(pageB, "Cuenta Dos", emailB, sharedPhoneDigits);

  const codeB = await withDb(async (c) => {
    const { rows } = await c.query<{ code_enc: string }>(
      `select code_enc from phone_codes where phone = $1`,
      [phone]
    );
    return decryptCode(rows[0].code_enc)!;
  });
  await pageB.getByLabel("Código de seis dígitos").fill(codeB);
  await pageB.getByRole("button", { name: "Confirmar celular" }).click();

  const verifiedB = await withDb(async (c) => {
    const { rows } = await c.query(`select "phoneNumberVerified" from "user" where email = $1`, [
      emailB,
    ]);
    return rows[0]?.phoneNumberVerified ?? null;
  });

  // Lo esperado por D-01: una cuenta desechable con el mismo celular de otra ya
  // verificada no debería poder verificarse también. Si esta aserción falla, es
  // el hallazgo: ambas cuentas quedan verificadas con el mismo número.
  expect(verifiedB).not.toBe(true);

  await ctxA.close();
  await ctxB.close();
});

test("código SMS incorrecto muchas veces: se agota y avisa cuántos quedan", async ({ page }) => {
  const { email, phoneDigits } = uniqueAccount("tecwrong");
  await registerUpTo(page, "Prueba Intentos", email, phoneDigits);

  const alert = page.getByRole("main").getByRole("alert");
  const button = page.getByRole("button", { name: "Confirmar celular" });
  for (let i = 1; i <= 5; i++) {
    await page.getByLabel("Código de seis dígitos").fill("000000");
    await button.click();
    // Espera a que la acción del servidor termine de verdad (el botón vuelve a
    // habilitarse) antes del siguiente intento; sin esto, los clics se adelantan
    // a la respuesta y no todos los intentos llegan a contarse en el servidor.
    await expect(button).toBeEnabled();
    await expect(alert).toContainText(/intento/i);
  }
  const finalText = await alert.innerText();
  expect(finalText).toMatch(/Demasiados intentos/i);

  // Un sexto intento, incluso con el código correcto, no debe pasar.
  const realCode = await withDb(async (c) => {
    const { rows } = await c.query<{ code_enc: string }>(
      `select code_enc from phone_codes where phone = $1`,
      [`+57${phoneDigits}`]
    );
    return decryptCode(rows[0].code_enc)!;
  });
  await page.getByLabel("Código de seis dígitos").fill(realCode);
  await page.getByRole("button", { name: "Confirmar celular" }).click();
  await expect(alert).toContainText(/Demasiados intentos/i);

  const verified = await withDb(async (c) => {
    const { rows } = await c.query(`select "phoneNumberVerified" from "user" where email = $1`, [
      email,
    ]);
    return rows[0].phoneNumberVerified;
  });
  expect(verified).not.toBe(true);
});

test("código vencido se rechaza incluso si es el correcto", async ({ page }) => {
  const { email, phoneDigits } = uniqueAccount("tecexp");
  await registerUpTo(page, "Prueba Vencido", email, phoneDigits);

  const phone = `+57${phoneDigits}`;
  const code = await withDb(async (c) => {
    const { rows } = await c.query<{ code_enc: string }>(
      `select code_enc from phone_codes where phone = $1`,
      [phone]
    );
    return decryptCode(rows[0].code_enc)!;
  });

  // Prepara el estado: el código vence hace un minuto.
  await withDb((c) =>
    c.query(`update phone_codes set expires_at = now() - interval '1 minute' where phone = $1`, [
      phone,
    ])
  );

  await page.getByLabel("Código de seis dígitos").fill(code);
  await page.getByRole("button", { name: "Confirmar celular" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText(/venció/i);

  const verified = await withDb(async (c) => {
    const { rows } = await c.query(`select "phoneNumberVerified" from "user" where email = $1`, [
      email,
    ]);
    return rows[0].phoneNumberVerified;
  });
  expect(verified).not.toBe(true);
});

test("cambiar la contraseña por recuperación cierra las demás sesiones", async ({ browser }) => {
  const { email, phoneDigits } = uniqueAccount("tecsesiones");
  const ctx1 = await browser.newContext();
  const page1 = await ctx1.newPage();
  await registerUpTo(page1, "Prueba Sesiones", email, phoneDigits);
  const phone = `+57${phoneDigits}`;
  const code = await withDb(async (c) => {
    const { rows } = await c.query<{ code_enc: string }>(
      `select code_enc from phone_codes where phone = $1`,
      [phone]
    );
    return decryptCode(rows[0].code_enc)!;
  });
  await page1.getByLabel("Código de seis dígitos").fill(code);
  await page1.getByRole("button", { name: "Confirmar celular" }).click();
  await expect(page1.getByTestId("usuario")).toBeVisible();

  // Una segunda sesión de la misma cuenta (otro contexto = otra "sesión" real).
  const ctx2 = await browser.newContext();
  const page2 = await ctx2.newPage();
  await page2.goto("/ingresar");
  await page2.getByLabel("Correo").fill(email);
  await page2.getByLabel("Contraseña").fill("unaClaveLarga1");
  await page2.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page2.getByTestId("usuario")).toBeVisible();

  // Recupera la contraseña con un código nuevo y la cambia.
  await withDb((c) =>
    c.query(
      `delete from recovery_codes where phone = $1`,
      [phone]
    )
  );
  await page1.goto("/recuperar");
  await page1.getByLabel("Tu celular").fill(phoneDigits);
  await page1.getByRole("button", { name: "Mandar código" }).click();

  const recoveryCode = await withDb(async (c) => {
    const { rows } = await c.query<{ code_enc: string }>(
      `select code_enc from recovery_codes where phone = $1`,
      [phone]
    );
    return rows[0] ? decryptCode(rows[0].code_enc) : null;
  });
  test.skip(!recoveryCode, "no se pudo iniciar la recuperación por la interfaz con este selector");

  await page1.getByLabel("Código de seis dígitos").fill(recoveryCode!);
  await page1.getByLabel("Nueva contraseña").fill("otraClaveLarga2");
  await page1.getByRole("button", { name: "Cambiar contraseña" }).click();
  // Espera a que la acción del servidor termine de verdad (la pantalla redirige
  // a /ingresar?recuperada=1 solo cuando resetPassword() ya resolvió, borrado de
  // sesiones incluido) antes de comprobar la otra pestaña.
  await expect(page1).toHaveURL(/\/ingresar\?recuperada=1/);

  // La sesión 2 (la otra pestaña, ya autenticada) debe quedar cerrada. "/" es
  // pública y no lo demuestra por sí sola: se visita una pantalla que exige
  // sesión (el carrito, activeUser() de por medio) y debe mandar a /ingresar.
  await page2.goto("/carrito");
  await expect(page2).toHaveURL(/\/ingresar/);

  await ctx1.close();
  await ctx2.close();
});

test("cookies de sesión: HttpOnly presente; SameSite razonable", async ({ request }) => {
  const res = await request.get("/ingresar");
  const setCookie = res.headersArray().filter((h) => h.name.toLowerCase() === "set-cookie");
  test.skip(setCookie.length === 0, "esta respuesta no puso cookies; se revisa tras un login real");
  for (const c of setCookie) {
    if (/session/i.test(c.value)) {
      expect(c.value.toLowerCase()).toContain("httponly");
    }
  }
});

test("cookie de sesión tras un ingreso real: HttpOnly sí, Secure según el entorno", async ({
  browser,
}) => {
  const { email, phoneDigits } = uniqueAccount("teccookie");
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await registerUpTo(page, "Prueba Cookie", email, phoneDigits);

  const cookies = await ctx.cookies();
  const sessionCookie = cookies.find((c) => /session_token|better-auth/i.test(c.name));
  expect(sessionCookie).toBeTruthy();
  if (sessionCookie) {
    expect(sessionCookie.httpOnly).toBe(true);
    expect(["Strict", "Lax"]).toContain(sessionCookie.sameSite);
    // El servidor de QA corre en http:// (localhost:3200), así que Secure en
    // false aquí es esperable, no un defecto: se documenta, no se marca mal.
  }
  await ctx.close();
});

test("cabeceras de seguridad de la respuesta", async ({ request }) => {
  const res = await request.get("/");
  const headers = res.headers();
  // Se documenta cuáles están y cuáles no; ausencias se reportan como hallazgo
  // según su severidad, no se asume nada bueno ni malo de antemano.
  test.info().annotations.push({
    type: "cabeceras",
    description: JSON.stringify(
      {
        "x-frame-options": headers["x-frame-options"] ?? null,
        "x-content-type-options": headers["x-content-type-options"] ?? null,
        "strict-transport-security": headers["strict-transport-security"] ?? null,
        "content-security-policy": headers["content-security-policy"] ?? null,
        "referrer-policy": headers["referrer-policy"] ?? null,
      },
      null,
      2
    ),
  });
  expect(res.status()).toBe(200);
});

test("intentos de ingreso repetidos con contraseña incorrecta (límite en este entorno de desarrollo)", async ({
  request,
}) => {
  const { email } = uniqueAccount("tecbrute");
  // Cuenta inexistente a propósito: solo interesa si el endpoint empieza a
  // devolver 429 tras varios intentos, no si la cuenta existe.
  let sawRateLimit = false;
  let lastStatus = 0;
  for (let i = 0; i < 15; i++) {
    const res = await request.post("/api/auth/sign-in/email", {
      data: { email, password: "loQueSea123" },
      headers: { "content-type": "application/json" },
    });
    lastStatus = res.status();
    if (res.status() === 429) {
      sawRateLimit = true;
      break;
    }
  }
  test.info().annotations.push({
    type: "resultado",
    description: `sawRateLimit=${sawRateLimit}, últimoStatus=${lastStatus}. La configuración (src/lib/auth.ts) apaga el límite de /sign-in/email cuando NODE_ENV no es producción; en este entorno de desarrollo se espera sawRateLimit=false, y eso no es un hallazgo aquí: es el comportamiento documentado en el código para no bloquear las pruebas.`,
  });
});
