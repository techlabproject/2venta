import { test } from "node:test";
import assert from "node:assert/strict";
import { sendVerificationCode } from "./sms";

// Ninguna prueba habla con Twilio ni con Meta de verdad: las credenciales reales que
// pueda tener `.env.local` se quitan antes de empezar.
for (const k of [
  "TWILIO_ACCOUNT_SID",
  "TWILIO_AUTH_TOKEN",
  "TWILIO_FROM",
  "TWILIO_VERIFY_SERVICE_SID",
  "WHATSAPP_TOKEN",
  "WHATSAPP_PHONE_NUMBER_ID",
  "CODIGOS_REALES_SOLO_A",
  "INALAMBRIA_TOKEN",
]) {
  delete process.env[k];
}

// Sin WhatsApp configurado, en producción no se manda nada: un código en el
// registro del servidor es una filtración.
test("en producción se niega a operar sin proveedor", async () => {
  const before = process.env.APP_ENV;
  const token = process.env.WHATSAPP_TOKEN;
  const twilio = process.env.TWILIO_AUTH_TOKEN;
  delete process.env.WHATSAPP_TOKEN;
  delete process.env.TWILIO_AUTH_TOKEN;
  process.env.APP_ENV = "produccion";
  const lines: string[] = [];
  const original = console.info;
  console.info = (msg: string) => void lines.push(msg);
  try {
    await assert.rejects(
      () => sendVerificationCode("+573001234567", "123456"),
      /No hay proveedor de SMS configurado/
    );
    // Y el código no aparece en el registro.
    assert.equal(lines.some((l) => l.includes("123456")), false);
  } finally {
    console.info = original;
    if (token !== undefined) process.env.WHATSAPP_TOKEN = token;
    if (twilio !== undefined) process.env.TWILIO_AUTH_TOKEN = twilio;
    if (before === undefined) delete process.env.APP_ENV;
    else process.env.APP_ENV = before;
  }
});

test("en desarrollo lo escribe en el registro", async () => {
  const before = process.env.APP_ENV;
  const token = process.env.WHATSAPP_TOKEN;
  delete process.env.WHATSAPP_TOKEN;
  process.env.APP_ENV = "desarrollo";
  const lines: string[] = [];
  const original = console.info;
  console.info = (msg: string) => void lines.push(msg);
  try {
    await sendVerificationCode("+573001234567", "123456");
    assert.match(lines[0], /123456/);
  } finally {
    console.info = original;
    if (token !== undefined) process.env.WHATSAPP_TOKEN = token;
    if (before === undefined) delete process.env.APP_ENV;
    else process.env.APP_ENV = before;
  }
});

test("si WhatsApp falla, el código sale por SMS; en desarrollo un fallo no bloquea", async () => {
  const antes = { ...process.env };
  const fetchAntes = globalThis.fetch;
  const originalError = console.error;
  const originalInfo = console.info;
  console.error = () => {};
  console.info = () => {};
  Object.assign(process.env, {
    APP_ENV: "produccion",
    WHATSAPP_TOKEN: "t",
    WHATSAPP_PHONE_NUMBER_ID: "1",
    TWILIO_ACCOUNT_SID: "AC" + "1".repeat(32),
    TWILIO_AUTH_TOKEN: "x",
    TWILIO_FROM: "+17372508034",
    DATABASE_URL: "",
  });
  const destinos: string[] = [];
  try {
    globalThis.fetch = (async (url: string) => {
      destinos.push(url.includes("graph.facebook.com") ? "whatsapp" : "twilio");
      return url.includes("graph.facebook.com")
        ? new Response(JSON.stringify({ error: { code: 131026 } }), { status: 400 })
        : new Response(JSON.stringify({ code: 21608 }), { status: 400 });
    }) as typeof fetch;
    // En producción, si los dos fallan, no se calla.
    await assert.rejects(() => sendVerificationCode("+573001234567", "123456"));
    assert.deepEqual(destinos, ["whatsapp", "twilio"]);

    // En desarrollo no bloquea: el código está en el registro.
    process.env.APP_ENV = "desarrollo";
    await sendVerificationCode("+573001234567", "123456");
  } finally {
    globalThis.fetch = fetchAntes;
    console.error = originalError;
    console.info = originalInfo;
    for (const k of Object.keys(process.env)) if (!(k in antes)) delete process.env[k];
    Object.assign(process.env, antes);
  }
});

test("con la cuenta de prueba de Twilio, el SMS propio falla y el código sale por Verify", async () => {
  const antes = { ...process.env };
  const fetchAntes = globalThis.fetch;
  const originalError = console.error;
  const originalInfo = console.info;
  console.error = () => {};
  console.info = () => {};
  delete process.env.WHATSAPP_TOKEN;
  Object.assign(process.env, {
    APP_ENV: "produccion",
    TWILIO_ACCOUNT_SID: "AC" + "1".repeat(32),
    TWILIO_AUTH_TOKEN: "x",
    TWILIO_FROM: "+17372508034",
    TWILIO_VERIFY_SERVICE_SID: "VA" + "2".repeat(32),
    DATABASE_URL: "",
  });
  const destinos: string[] = [];
  try {
    globalThis.fetch = (async (url: string) => {
      if (url.includes("verify.twilio.com")) {
        destinos.push("verify");
        return new Response(JSON.stringify({ sid: "VE1", status: "pending" }), { status: 201 });
      }
      destinos.push("mensajes");
      return new Response(JSON.stringify({ code: 572006 }), { status: 400 });
    }) as typeof fetch;
    assert.equal(await sendVerificationCode("+573001234567", "123456"), "twilio_verify");
    assert.deepEqual(destinos, ["mensajes", "verify"]);
  } finally {
    globalThis.fetch = fetchAntes;
    console.error = originalError;
    console.info = originalInfo;
    for (const k of Object.keys(process.env)) if (!(k in antes)) delete process.env[k];
    Object.assign(process.env, antes);
  }
});

// Con la cuenta de prueba de Twilio cada verificación cuenta (39 al 2026-09-25) y las
// pruebas con números inventados agotaban el límite de solicitudes. En desarrollo,
// si hay lista, el código solo sale de verdad a esos números; al resto, solo al
// registro del servidor. En producción la lista no existe.
test("en desarrollo, con lista, solo salen de verdad los códigos de esos números", async () => {
  const antes = { ...process.env };
  const fetchAntes = globalThis.fetch;
  const originalError = console.error;
  const originalInfo = console.info;
  console.error = () => {};
  console.info = () => {};
  Object.assign(process.env, {
    APP_ENV: "desarrollo",
    TWILIO_ACCOUNT_SID: "AC" + "1".repeat(32),
    TWILIO_AUTH_TOKEN: "x",
    TWILIO_VERIFY_SERVICE_SID: "VA" + "2".repeat(32),
    CODIGOS_REALES_SOLO_A: "+573042098210, +573001112233",
    DATABASE_URL: "",
  });
  delete process.env.TWILIO_FROM;
  let llamadas = 0;
  try {
    globalThis.fetch = (async () => {
      llamadas++;
      return new Response(JSON.stringify({ sid: "VE1", status: "pending" }), { status: 201 });
    }) as typeof fetch;
    assert.equal(await sendVerificationCode("+573009998877", "123456"), "propio");
    assert.equal(llamadas, 0);
    assert.equal(await sendVerificationCode("+573001112233", "123456"), "twilio_verify");
    assert.equal(llamadas, 1);

    // En producción la lista no cuenta: le llega a cualquiera.
    process.env.APP_ENV = "produccion";
    assert.equal(await sendVerificationCode("+573009998877", "123456"), "twilio_verify");
    assert.equal(llamadas, 2);
  } finally {
    globalThis.fetch = fetchAntes;
    console.error = originalError;
    console.info = originalInfo;
    for (const k of Object.keys(process.env)) if (!(k in antes)) delete process.env[k];
    Object.assign(process.env, antes);
  }
});

// D-124: Inalambria va antes que Twilio; si falla (sin saldo, caído), sale por Twilio.
test("el código sale por Inalambria y, si falla, por Twilio", async () => {
  const antes = { ...process.env };
  const fetchAntes = globalThis.fetch;
  const originalError = console.error;
  console.error = () => {};
  Object.assign(process.env, {
    APP_ENV: "produccion",
    INALAMBRIA_TOKEN: "clave",
    TWILIO_ACCOUNT_SID: "AC" + "1".repeat(32),
    TWILIO_AUTH_TOKEN: "x",
    TWILIO_VERIFY_SERVICE_SID: "VA" + "2".repeat(32),
    DATABASE_URL: "",
  });
  delete process.env.TWILIO_FROM;
  const destinos: string[] = [];
  let inalambriaFalla = false;
  try {
    globalThis.fetch = (async (url: string) => {
      if (url.includes("inalambria")) {
        destinos.push("inalambria");
        return inalambriaFalla
          ? new Response(JSON.stringify({ ok: false, error: "Saldo insuficiente" }), { status: 402 })
          : new Response(JSON.stringify({ ok: true, consumptionId: "c1" }), { status: 200 });
      }
      destinos.push("verify");
      return new Response(JSON.stringify({ sid: "VE1", status: "pending" }), { status: 201 });
    }) as typeof fetch;
    assert.equal(await sendVerificationCode("+573001234567", "123456"), "propio");
    assert.deepEqual(destinos, ["inalambria"]);

    inalambriaFalla = true;
    assert.equal(await sendVerificationCode("+573001234567", "123456"), "twilio_verify");
    assert.deepEqual(destinos, ["inalambria", "inalambria", "verify"]);
  } finally {
    globalThis.fetch = fetchAntes;
    console.error = originalError;
    for (const k of Object.keys(process.env)) if (!(k in antes)) delete process.env[k];
    Object.assign(process.env, antes);
  }
});
