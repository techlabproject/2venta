import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import {
  enviarSmsPorTwilio,
  firmaDeTwilioValida,
  leerEstadoDeTwilio,
  textoDelCodigo,
} from "./twilio";

test("el código va al final del SMS (D-106)", () => {
  const texto = textoDelCodigo("482913", 10);
  assert.match(texto, /482913$/);
  assert.match(texto, /Vence en 10 minutos/);
  // El último bloque de seis dígitos es el código, no otra cosa del texto.
  assert.equal(texto.match(/\d{6}/g)?.at(-1), "482913");
});

test("el envío llama a Twilio con la cuenta y devuelve el id; si falla, no filtra datos", async () => {
  const antes = {
    sid: process.env.TWILIO_ACCOUNT_SID,
    token: process.env.TWILIO_AUTH_TOKEN,
    from: process.env.TWILIO_FROM,
    fetch: globalThis.fetch,
  };
  process.env.TWILIO_ACCOUNT_SID = "AC" + "1".repeat(32);
  process.env.TWILIO_AUTH_TOKEN = "token-de-prueba";
  process.env.TWILIO_FROM = "+17372508034";
  const llamadas: { url: string; init: RequestInit }[] = [];
  try {
    globalThis.fetch = (async (url: string, init: RequestInit) => {
      llamadas.push({ url, init });
      return new Response(JSON.stringify({ sid: "SM123" }), { status: 201 });
    }) as typeof fetch;
    assert.equal(
      await enviarSmsPorTwilio("+573004128805", textoDelCodigo("482913", 10), "https://x/api/twilio/estado"),
      "SM123",
    );
    assert.match(llamadas[0].url, /Accounts\/AC1{32}\/Messages\.json$/);
    const auth = (llamadas[0].init.headers as Record<string, string>).Authorization;
    assert.equal(auth, `Basic ${Buffer.from(`AC${"1".repeat(32)}:token-de-prueba`).toString("base64")}`);
    const cuerpo = new URLSearchParams(String(llamadas[0].init.body));
    assert.equal(cuerpo.get("To"), "+573004128805");
    assert.equal(cuerpo.get("From"), "+17372508034");
    assert.equal(cuerpo.get("StatusCallback"), "https://x/api/twilio/estado");

    globalThis.fetch = (async () =>
      new Response(JSON.stringify({ code: 21608, message: "unverified number +573004128805" }), {
        status: 400,
      })) as typeof fetch;
    await assert.rejects(
      () => enviarSmsPorTwilio("+573004128805", textoDelCodigo("482913", 10)),
      (err: Error) => /21608/.test(err.message) && !/482913|3004128805/.test(err.message),
    );
  } finally {
    globalThis.fetch = antes.fetch;
    for (const [k, v] of [
      ["TWILIO_ACCOUNT_SID", antes.sid],
      ["TWILIO_AUTH_TOKEN", antes.token],
      ["TWILIO_FROM", antes.from],
    ] as const) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }
});

test("la firma de Twilio se acepta solo con la dirección, los datos y la clave exactos", () => {
  // El ejemplo de la documentación de Twilio, calculado con su algoritmo.
  const url = "https://2venta.co/api/twilio/estado";
  const params = { MessageSid: "SM123", MessageStatus: "delivered", AccountSid: "AC1" };
  const token = "clave";
  const base = url + "AccountSidAC1" + "MessageSidSM123" + "MessageStatusdelivered";
  const firma = createHmac("sha1", token).update(base).digest("base64");
  assert.equal(firmaDeTwilioValida(url, params, firma, token), true);
  assert.equal(firmaDeTwilioValida(url + "x", params, firma, token), false);
  assert.equal(firmaDeTwilioValida(url, { ...params, MessageStatus: "failed" }, firma, token), false);
  assert.equal(firmaDeTwilioValida(url, params, firma, "otra"), false);
  assert.equal(firmaDeTwilioValida(url, params, null, token), false);
  assert.equal(firmaDeTwilioValida(url, params, firma, ""), false);
});

test("lee el estado del aviso y descarta los que no son de entrega", () => {
  assert.deepEqual(leerEstadoDeTwilio({ MessageSid: "SM1", MessageStatus: "delivered" }), {
    sid: "SM1",
    estado: "delivered",
    error: null,
  });
  assert.deepEqual(leerEstadoDeTwilio({ MessageSid: "SM1", MessageStatus: "undelivered", ErrorCode: "30003" }), {
    sid: "SM1",
    estado: "failed",
    error: "Twilio 30003",
  });
  assert.equal(leerEstadoDeTwilio({ MessageSid: "SM1", MessageStatus: "queued" }), null);
  assert.equal(leerEstadoDeTwilio({ MessageStatus: "sent" }), null);
});

test("Twilio Verify: envía, aprueba el código correcto y rechaza el vencido", async () => {
  const antes = {
    sid: process.env.TWILIO_ACCOUNT_SID,
    token: process.env.TWILIO_AUTH_TOKEN,
    va: process.env.TWILIO_VERIFY_SERVICE_SID,
    fetch: globalThis.fetch,
  };
  process.env.TWILIO_ACCOUNT_SID = "AC" + "1".repeat(32);
  process.env.TWILIO_AUTH_TOKEN = "token-de-prueba";
  process.env.TWILIO_VERIFY_SERVICE_SID = "VA" + "2".repeat(32);
  const { enviarConTwilioVerify, comprobarConTwilioVerify } = await import("./twilio");
  const llamadas: { url: string; body: URLSearchParams }[] = [];
  let respuesta: Response = new Response("{}");
  try {
    globalThis.fetch = (async (url: string, init: RequestInit) => {
      llamadas.push({ url, body: new URLSearchParams(String(init.body)) });
      return respuesta;
    }) as typeof fetch;

    respuesta = new Response(JSON.stringify({ sid: "VE1", status: "pending" }), { status: 201 });
    assert.equal(await enviarConTwilioVerify("+573004128805"), "VE1");
    assert.match(llamadas[0].url, /Services\/VA2{32}\/Verifications$/);
    assert.equal(llamadas[0].body.get("Channel"), "sms");
    assert.equal(llamadas[0].body.get("Locale"), "es");

    respuesta = new Response(JSON.stringify({ status: "approved" }), { status: 200 });
    assert.equal(await comprobarConTwilioVerify("+573004128805", "482913"), true);
    assert.match(llamadas[1].url, /VerificationCheck$/);
    assert.equal(llamadas[1].body.get("Code"), "482913");

    respuesta = new Response(JSON.stringify({ status: "pending" }), { status: 200 });
    assert.equal(await comprobarConTwilioVerify("+573004128805", "000000"), false);

    respuesta = new Response(JSON.stringify({ code: 20404 }), { status: 404 });
    assert.equal(await comprobarConTwilioVerify("+573004128805", "482913"), false);

    respuesta = new Response(JSON.stringify({ code: 20003 }), { status: 401 });
    await assert.rejects(() => comprobarConTwilioVerify("+573004128805", "482913"));
  } finally {
    globalThis.fetch = antes.fetch;
    for (const [k, v] of [
      ["TWILIO_ACCOUNT_SID", antes.sid],
      ["TWILIO_AUTH_TOKEN", antes.token],
      ["TWILIO_VERIFY_SERVICE_SID", antes.va],
    ] as const) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }
});
