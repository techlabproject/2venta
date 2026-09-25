import { test } from "node:test";
import assert from "node:assert/strict";
import { codigoCorrecto } from "./comprobar";
import { encryptCode } from "./otp";

test("el código propio se compara con el guardado; el de Verify lo comprueba Twilio", async () => {
  const guardado = { code_enc: encryptCode("482913"), verificado_por: null };
  assert.equal(await codigoCorrecto("+573004128805", "482913", guardado), true);
  assert.equal(await codigoCorrecto("+573004128805", "111111", guardado), false);

  const antes = { fetch: globalThis.fetch, env: { ...process.env } };
  Object.assign(process.env, {
    TWILIO_ACCOUNT_SID: "AC" + "1".repeat(32),
    TWILIO_AUTH_TOKEN: "x",
    TWILIO_VERIFY_SERVICE_SID: "VA" + "2".repeat(32),
  });
  const pedidos: string[] = [];
  try {
    globalThis.fetch = (async (url: string, init: RequestInit) => {
      pedidos.push(new URLSearchParams(String(init.body)).get("Code") ?? "");
      return new Response(JSON.stringify({ status: pedidos.at(-1) === "654321" ? "approved" : "pending" }), {
        status: 200,
      });
    }) as typeof fetch;
    // El cifrado guardado no cuenta: el código lo tiene Twilio.
    const deVerify = { code_enc: encryptCode("482913"), verificado_por: "twilio_verify" };
    assert.equal(await codigoCorrecto("+573004128805", "482913", deVerify), false);
    assert.equal(await codigoCorrecto("+573004128805", "654321", deVerify), true);
    assert.deepEqual(pedidos, ["482913", "654321"]);
  } finally {
    globalThis.fetch = antes.fetch;
    for (const k of Object.keys(process.env)) if (!(k in antes.env)) delete process.env[k];
    Object.assign(process.env, antes.env);
  }
});
