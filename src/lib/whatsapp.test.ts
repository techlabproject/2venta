import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { aDestinoMeta, firmaValida, leerEstados, mensajeDeCodigo } from "./whatsapp";

test("el celular va en E.164 sin el «+»", () => {
  assert.equal(aDestinoMeta("+573004128805"), "573004128805");
});

test("el código va en el texto y en el botón «Copiar código»", () => {
  const m = mensajeDeCodigo("+573004128805", "482913");
  assert.equal(m.to, "573004128805");
  assert.equal(m.type, "template");
  assert.deepEqual(m.template.components[0].parameters, [{ type: "text", text: "482913" }]);
  assert.equal(m.template.components[1].sub_type, "url");
  assert.deepEqual(m.template.components[1].parameters, [{ type: "text", text: "482913" }]);
});

test("la firma se acepta solo si es del secreto y del cuerpo exactos", () => {
  const secreto = "secreto-de-prueba";
  const cuerpo = '{"entry":[]}';
  const buena = "sha256=" + createHmac("sha256", secreto).update(cuerpo).digest("hex");
  assert.equal(firmaValida(cuerpo, buena, secreto), true);
  assert.equal(firmaValida(cuerpo + " ", buena, secreto), false);
  assert.equal(firmaValida(cuerpo, buena, "otro"), false);
  assert.equal(firmaValida(cuerpo, null, secreto), false);
  assert.equal(firmaValida(cuerpo, "sha256=abc", secreto), false);
  assert.equal(firmaValida(cuerpo, buena.replace("sha256=", "sha1="), secreto), false);
  assert.equal(firmaValida(cuerpo, buena, ""), false);
});

test("lee los estados de entrega y descarta lo que no es un estado", () => {
  const aviso = {
    object: "whatsapp_business_account",
    entry: [
      {
        changes: [
          {
            value: {
              statuses: [
                { id: "wamid.A", status: "delivered", recipient_id: "573004128805" },
                { id: "wamid.B", status: "failed", errors: [{ code: 131026, title: "Message undeliverable" }] },
                { id: "wamid.C", status: "deleted" },
                { status: "read" },
              ],
            },
          },
          { value: { messages: [{ from: "573004128805", text: { body: "hola" } }] } },
        ],
      },
    ],
  };
  assert.deepEqual(leerEstados(aviso), [
    { wamid: "wamid.A", estado: "delivered", error: null },
    { wamid: "wamid.B", estado: "failed", error: "131026: Message undeliverable" },
  ]);
  assert.deepEqual(leerEstados(null), []);
  assert.deepEqual(leerEstados({ entry: "x" }), []);
});

test("el envío llama a la API de Meta con el token y devuelve el wamid; si falla, no filtra datos", async () => {
  const antes = { token: process.env.WHATSAPP_TOKEN, id: process.env.WHATSAPP_PHONE_NUMBER_ID, fetch: globalThis.fetch };
  process.env.WHATSAPP_TOKEN = "token-de-prueba";
  process.env.WHATSAPP_PHONE_NUMBER_ID = "1043566368850714";
  const llamadas: { url: string; init: RequestInit }[] = [];
  try {
    globalThis.fetch = (async (url: string, init: RequestInit) => {
      llamadas.push({ url, init });
      return new Response(JSON.stringify({ messages: [{ id: "wamid.XYZ" }] }), { status: 200 });
    }) as typeof fetch;
    const { enviarCodigoPorWhatsApp } = await import("./whatsapp");
    assert.equal(await enviarCodigoPorWhatsApp("+573004128805", "482913"), "wamid.XYZ");
    assert.match(llamadas[0].url, /graph\.facebook\.com\/v\d+\.\d+\/1043566368850714\/messages$/);
    assert.equal((llamadas[0].init.headers as Record<string, string>).Authorization, "Bearer token-de-prueba");
    assert.equal(JSON.parse(String(llamadas[0].init.body)).to, "573004128805");

    globalThis.fetch = (async () =>
      new Response(JSON.stringify({ error: { message: "Template name does not exist", code: 132001 } }), {
        status: 404,
      })) as typeof fetch;
    await assert.rejects(
      () => enviarCodigoPorWhatsApp("+573004128805", "482913"),
      (err: Error) => /132001|Template name/.test(err.message) && !/482913|3004128805/.test(err.message),
    );
  } finally {
    globalThis.fetch = antes.fetch;
    if (antes.token === undefined) delete process.env.WHATSAPP_TOKEN;
    else process.env.WHATSAPP_TOKEN = antes.token;
    if (antes.id === undefined) delete process.env.WHATSAPP_PHONE_NUMBER_ID;
    else process.env.WHATSAPP_PHONE_NUMBER_ID = antes.id;
  }
});
