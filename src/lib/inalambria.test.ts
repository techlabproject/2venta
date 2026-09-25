import { test } from "node:test";
import assert from "node:assert/strict";
import { enviarSmsPorInalambria, inalambriaConfigurado } from "./inalambria";
import { textoDelCodigo } from "./twilio";

test("sin token no está configurado", () => {
  const antes = process.env.INALAMBRIA_TOKEN;
  delete process.env.INALAMBRIA_TOKEN;
  try {
    assert.equal(inalambriaConfigurado(), false);
    process.env.INALAMBRIA_TOKEN = "  ";
    assert.equal(inalambriaConfigurado(), false);
    process.env.INALAMBRIA_TOKEN = "clave";
    assert.equal(inalambriaConfigurado(), true);
  } finally {
    if (antes === undefined) delete process.env.INALAMBRIA_TOKEN;
    else process.env.INALAMBRIA_TOKEN = antes;
  }
});

test("manda el SMS con el token, espera la respuesta y devuelve el id; si falla, no filtra datos", async () => {
  const antes = { token: process.env.INALAMBRIA_TOKEN, fetch: globalThis.fetch };
  process.env.INALAMBRIA_TOKEN = "clave-de-prueba";
  const llamadas: { url: string; init: RequestInit }[] = [];
  try {
    globalThis.fetch = (async (url: string, init: RequestInit) => {
      llamadas.push({ url, init });
      return new Response(
        JSON.stringify({ ok: true, consumptionId: "c0ffee00-0000-4000-8000-000000000001", credits: 1, messages: 1 }),
        { status: 200 },
      );
    }) as typeof fetch;
    const texto = textoDelCodigo("482913", 10);
    assert.equal(
      await enviarSmsPorInalambria("+573004128805", texto),
      "c0ffee00-0000-4000-8000-000000000001",
    );
    assert.equal(llamadas[0].url, "https://api.inalambria.express/v1/messages/send");
    assert.equal(llamadas[0].init.method, "POST");
    const cabeceras = llamadas[0].init.headers as Record<string, string>;
    assert.equal(cabeceras.Authorization, "Bearer clave-de-prueba");
    // Sin espera asíncrona: se sabe al instante si lo aceptaron.
    assert.deepEqual(JSON.parse(String(llamadas[0].init.body)), {
      content: texto,
      recipients: ["+573004128805"],
      async: false,
    });

    for (const respuesta of [
      new Response(JSON.stringify({ ok: false, error: "Saldo insuficiente" }), { status: 402 }),
      new Response(JSON.stringify({ ok: false, error: "Número +573004128805 inválido" }), { status: 400 }),
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
      new Response("no es json", { status: 500 }),
    ]) {
      globalThis.fetch = (async () => respuesta) as typeof fetch;
      await assert.rejects(
        () => enviarSmsPorInalambria("+573004128805", texto),
        (err: Error) => /Inalambria/.test(err.message) && !/482913|3004128805/.test(err.message),
      );
    }
  } finally {
    globalThis.fetch = antes.fetch;
    if (antes.token === undefined) delete process.env.INALAMBRIA_TOKEN;
    else process.env.INALAMBRIA_TOKEN = antes.token;
  }
});
