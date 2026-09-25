import { test, expect, type Page } from "@playwright/test";
import { decryptCode } from "../src/features/auth/otp";
import { aceptarTerminos, cerrarSesion, uniqueAccount, withDb } from "./helpers";

// D-123 (pedido de Nicolás, 2026-09-25): la cuenta existe de verdad solo cuando se
// confirma el celular. Antes, registrarse dejaba adentro con la cuenta creada aunque
// el código nunca llegara, y un número mal escrito no tenía arreglo.

async function registrarSinConfirmar(page: Page, prefijo = "pendiente") {
  const cuenta = uniqueAccount(prefijo);
  await page.goto("/registro?rol=comprador");
  await page.getByLabel("Nombre").fill("Gabriela Pendiente");
  await page.getByLabel("Correo").fill(cuenta.email);
  await page.getByLabel("Celular").fill(cuenta.phoneDigits);
  await page.getByLabel("Contraseña").fill("unaClaveLarga1");
  await page.getByLabel("Fecha de nacimiento").fill("1995-05-20");
  await aceptarTerminos(page);
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page).toHaveURL(/\/verificar/);
  return cuenta;
}

async function codigoDe(phoneDigits: string): Promise<string> {
  return withDb(async (c) => {
    const { rows } = await c.query<{ code_enc: string }>(
      `select code_enc from phone_codes where phone = $1`,
      [`+57${phoneDigits}`],
    );
    return decryptCode(rows[0].code_enc)!;
  });
}

async function cuentaPorCorreo(email: string) {
  return withDb(async (c) => {
    const { rows } = await c.query<{
      phoneNumber: string;
      phoneNumberVerified: boolean;
      pendiente: boolean;
    }>(
      `select "phoneNumber", "phoneNumberVerified", registro_pendiente_desde is not null as pendiente
         from "user" where email = $1`,
      [email],
    );
    return rows;
  });
}

async function confirmar(page: Page, phoneDigits: string) {
  await page.getByLabel("Código de seis dígitos").fill(await codigoDe(phoneDigits));
  await page.getByRole("button", { name: "Confirmar celular" }).click();
  await expect(page.getByTestId("usuario")).toBeVisible();
}

test("sin confirmar el celular no se ha entrado, y con el código la cuenta queda creada", async ({
  page,
}) => {
  const cuenta = await registrarSinConfirmar(page);
  await expect(page.getByRole("main")).toContainText("Tu cuenta queda creada cuando confirmes el código");
  expect(await cuentaPorCorreo(cuenta.email)).toEqual([
    { phoneNumber: `+57${cuenta.phoneDigits}`, phoneNumberVerified: false, pendiente: true },
  ]);

  // Nada privado se abre: la cabecera dice «Entrar» y «Tu cuenta» devuelve a
  // confirmar el celular.
  await page.goto("/");
  await expect(page.getByTestId("usuario")).toHaveCount(0);
  await page.goto("/cuenta");
  await expect(page).toHaveURL(/\/verificar/);

  await confirmar(page, cuenta.phoneDigits);
  expect(await cuentaPorCorreo(cuenta.email)).toEqual([
    { phoneNumber: `+57${cuenta.phoneDigits}`, phoneNumberVerified: true, pendiente: false },
  ]);
  await page.goto("/cuenta");
  await expect(page).toHaveURL(/\/cuenta$/);
});

test("«¿No es tu número?» corrige el celular sin volver a llenar el registro", async ({ page }) => {
  const cuenta = await registrarSinConfirmar(page);
  const otro = uniqueAccount("otro").phoneDigits;

  await page.getByRole("button", { name: "¿No es tu número? Cámbialo" }).click();
  await page.getByLabel("Tu celular").fill(otro);
  await page.getByRole("button", { name: "Mandar código a este número" }).click();
  await expect(page.getByRole("status")).toContainText("te mandamos un código al número nuevo");
  await expect(page.getByRole("main")).toContainText(
    `+57 ${otro.slice(0, 3)} ${otro.slice(3, 6)} ${otro.slice(6)}`,
  );

  await confirmar(page, otro);
  expect(await cuentaPorCorreo(cuenta.email)).toEqual([
    { phoneNumber: `+57${otro}`, phoneNumberVerified: true, pendiente: false },
  ]);
});

test("el número se cambia hasta tres veces y no a uno que ya tiene cuenta", async ({ page }) => {
  await registrarSinConfirmar(page);
  const cambiar = async (digitos: string) => {
    if (await page.getByRole("button", { name: "¿No es tu número? Cámbialo" }).isVisible()) {
      await page.getByRole("button", { name: "¿No es tu número? Cámbialo" }).click();
    }
    await page.getByLabel("Tu celular").fill(digitos);
    await page.getByRole("button", { name: "Mandar código a este número" }).click();
  };

  // Uno ya confirmado en otra cuenta (el de la cuenta sembrada) no se acepta.
  await cambiar("3001000001");
  await expect(page.getByRole("main").getByRole("alert")).toContainText("ya tiene una cuenta");

  for (let i = 0; i < 3; i++) {
    const nuevo = uniqueAccount("otro").phoneDigits;
    await cambiar(nuevo);
    // El número exacto y no el aviso, que ya estaba de la vuelta anterior.
    await expect(page.getByRole("main")).toContainText(
      `+57 ${nuevo.slice(0, 3)} ${nuevo.slice(3, 6)} ${nuevo.slice(6)}`,
    );
  }
  await cambiar(uniqueAccount("otro").phoneDigits);
  await expect(page.getByRole("main").getByRole("alert")).toContainText("varias veces");
});

test("registrarse otra vez con el mismo correo reemplaza el registro pendiente", async ({
  browser,
}) => {
  const primero = await browser.newContext();
  const a = await primero.newPage();
  const cuenta = await registrarSinConfirmar(a);

  const segundo = await browser.newContext();
  const b = await segundo.newPage();
  const otro = uniqueAccount("otro").phoneDigits;
  await b.goto("/registro?rol=comprador");
  await b.getByLabel("Nombre").fill("Gabriela Pendiente");
  await b.getByLabel("Correo").fill(cuenta.email);
  await b.getByLabel("Celular").fill(otro);
  await b.getByLabel("Contraseña").fill("otraClaveLarga2");
  await b.getByLabel("Fecha de nacimiento").fill("1995-05-20");
  await aceptarTerminos(b);
  await b.getByRole("button", { name: "Continuar" }).click();
  await expect(b).toHaveURL(/\/verificar/);

  expect(await cuentaPorCorreo(cuenta.email)).toEqual([
    { phoneNumber: `+57${otro}`, phoneNumberVerified: false, pendiente: true },
  ]);
  await confirmar(b, otro);

  // Una cuenta ya confirmada no se reemplaza: el correo queda tomado.
  const tercero = await browser.newContext();
  const c = await tercero.newPage();
  await c.goto("/registro?rol=comprador");
  await c.getByLabel("Nombre").fill("Otra Persona");
  await c.getByLabel("Correo").fill(cuenta.email);
  await c.getByLabel("Celular").fill(uniqueAccount("otro").phoneDigits);
  await c.getByLabel("Contraseña").fill("otraClaveLarga3");
  await c.getByLabel("Fecha de nacimiento").fill("1995-05-20");
  await aceptarTerminos(c);
  await c.getByRole("button", { name: "Continuar" }).click();
  await expect(c.getByRole("alert")).toBeVisible();
  expect(await cuentaPorCorreo(cuenta.email)).toEqual([
    { phoneNumber: `+57${otro}`, phoneNumberVerified: true, pendiente: false },
  ]);

  await primero.close();
  await segundo.close();
  await tercero.close();
});

test("un registro sin confirmar en 24 horas se borra y libera el correo", async ({ browser }) => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const cuenta = await registrarSinConfirmar(page);
  await withDb((c) =>
    c.query(
      `update "user" set registro_pendiente_desde = now() - interval '25 hours' where email = $1`,
      [cuenta.email],
    ),
  );

  // El barrido corre cada hora y también con cada registro nuevo.
  const otroCtx = await browser.newContext();
  await registrarSinConfirmar(await otroCtx.newPage(), "barrido");
  expect(await cuentaPorCorreo(cuenta.email)).toEqual([]);

  await ctx.close();
  await otroCtx.close();
});

test("quien inicia sesión con un registro sin confirmar va a confirmarlo", async ({ page }) => {
  const cuenta = await registrarSinConfirmar(page);
  // «¿Te equivocaste de cuenta? Salir»
  await page.getByRole("button", { name: "Salir" }).click();
  await expect(page).toHaveURL(/\/$/);

  await page.goto("/ingresar");
  await page.getByLabel("Correo").fill(cuenta.email);
  await page.getByLabel("Contraseña").fill("unaClaveLarga1");
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page).toHaveURL(/\/verificar/);
  await confirmar(page, cuenta.phoneDigits);
});

test("una cuenta confirmada nunca queda marcada como pendiente", async ({ page }) => {
  const cuenta = await registrarSinConfirmar(page);
  await confirmar(page, cuenta.phoneDigits);
  await cerrarSesion(page);
  // Aunque alguien intente marcarla de nuevo, el disparador la deja limpia.
  await withDb((c) =>
    c.query(`update "user" set registro_pendiente_desde = now() - interval '25 hours' where email = $1`, [
      cuenta.email,
    ]),
  );
  expect((await cuentaPorCorreo(cuenta.email))[0].pendiente).toBe(false);
});

// Pedido de Nicolás: otro código cada 30 segundos, como en otros sitios. La pantalla
// cuenta hacia atrás y el servidor lo exige aunque alguien se salte el botón.
test("otro código solo cada 30 segundos, en la pantalla y en el servidor", async ({ page }) => {
  await page.clock.install();
  const cuenta = await registrarSinConfirmar(page);
  const reenviar = page.getByRole("button", { name: /mandar otro/i });
  await expect(reenviar).toBeDisabled();
  await expect(reenviar).toContainText(/Mandar otro en \d+ s/);

  // El reloj de la pantalla avanza, pero el servidor mide el suyo: todavía no.
  await page.clock.fastForward(31_000);
  await expect(reenviar).toHaveText("No me llegó, mandar otro");
  await reenviar.click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText(/Espera \d+ segundos?/);
  await expect(reenviar).toBeDisabled();

  // Pasados los 30 segundos de verdad (se envejece el último envío), sí sale.
  await withDb((c) =>
    c.query(`update otp_sends set sent_at = sent_at - interval '31 seconds' where phone = $1`, [
      `+57${cuenta.phoneDigits}`,
    ]),
  );
  await page.clock.fastForward(31_000);
  await reenviar.click();
  await expect(page.getByRole("status")).toContainText("Te mandamos otro código");
  await expect(page.getByRole("main").getByRole("alert")).toHaveCount(0);
  await expect(reenviar).toBeDisabled();
});

test("el mismo número vuelve a mandar el código y lo dice", async ({ page }) => {
  const cuenta = await registrarSinConfirmar(page);
  await withDb((c) =>
    c.query(`update otp_sends set sent_at = sent_at - interval '31 seconds' where phone = $1`, [
      `+57${cuenta.phoneDigits}`,
    ]),
  );
  await page.getByRole("button", { name: "¿No es tu número? Cámbialo" }).click();
  await page.getByLabel("Tu celular").fill(cuenta.phoneDigits);
  await page.getByRole("button", { name: "Mandar código a este número" }).click();
  await expect(page.getByRole("status")).toHaveText("Es el mismo número: te mandamos otro código.");
});

// Luna (D-123): con la sesión sin confirmar, la API de la biblioteca cambiaba el
// nombre. Y el celular no se cambia por ahí: ni en un registro pendiente (tiene su
// tope en «¿No es tu número?») ni en una cuenta confirmada (quedaba confirmado un
// número que nadie confirmó).
test("sin confirmar, la API no cambia datos; y el celular nunca se cambia por ella", async ({
  page,
}) => {
  const cuenta = await registrarSinConfirmar(page);
  const nombre = await page.request.post("/api/auth/update-user", {
    headers: { origin: "http://localhost:3100" },
    data: { name: "Nombre Intruso" },
  });
  expect(nombre.status()).toBe(403);
  expect((await nombre.json()).code).toBe("PHONE_UNCONFIRMED");
  const celular = await page.request.post("/api/auth/update-user", {
    headers: { origin: "http://localhost:3100" },
    data: { phoneNumber: `+57${uniqueAccount("otro").phoneDigits}` },
  });
  expect(celular.status()).toBe(403);
  const [antes] = await withDb(async (c) =>
    (await c.query(`select name, "phoneNumber" from "user" where email = $1`, [cuenta.email])).rows,
  );
  expect(antes).toEqual({ name: "Gabriela Pendiente", phoneNumber: `+57${cuenta.phoneDigits}` });

  await confirmar(page, cuenta.phoneDigits);
  const otroCelular = await page.request.post("/api/auth/update-user", {
    headers: { origin: "http://localhost:3100" },
    data: { phoneNumber: `+57${uniqueAccount("otro").phoneDigits}` },
  });
  expect(otroCelular.status()).toBe(400);
  expect((await otroCelular.json()).code).toBe("PHONE_READONLY");
  expect((await cuentaPorCorreo(cuenta.email))[0].phoneNumber).toBe(`+57${cuenta.phoneDigits}`);
});
