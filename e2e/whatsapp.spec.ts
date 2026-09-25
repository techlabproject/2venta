import { test, expect } from "@playwright/test";
import { createHmac, randomUUID } from "node:crypto";
import { withDb } from "./helpers";

// D-117: los avisos de entrega de WhatsApp Cloud. La firma es el HMAC-SHA256 del
// cuerpo crudo con el secreto de la app; en pruebas es uno generado al azar.

const URL_WEBHOOK = "/api/whatsapp/webhook";

function firmar(cuerpo: string, secreto = process.env.WHATSAPP_APP_SECRET!) {
  return "sha256=" + createHmac("sha256", secreto).update(cuerpo).digest("hex");
}

function aviso(wamid: string, status: string, errors?: { code: number; title: string }[]) {
  return JSON.stringify({
    object: "whatsapp_business_account",
    entry: [{ id: "1357017676448330", changes: [{ field: "messages", value: { statuses: [{ id: wamid, status, recipient_id: "573004128805", errors }] } }] }],
  });
}

async function envio(wamid: string) {
  await withDb((c) =>
    c.query(`insert into envios_codigo (mensaje_id, telefono, motivo) values ($1, '+573004128805', 'registro')`, [wamid]),
  );
}

async function estadoDe(wamid: string) {
  return withDb(async (c) => {
    const { rows } = await c.query<{ estado: string; error: string | null }>(
      `select estado, error from envios_codigo where mensaje_id = $1`,
      [wamid],
    );
    return rows[0];
  });
}

test("Meta verifica la dirección solo con el verify token correcto", async ({ request }) => {
  const bueno = await request.get(URL_WEBHOOK, {
    params: {
      "hub.mode": "subscribe",
      "hub.verify_token": process.env.WHATSAPP_VERIFY_TOKEN!,
      "hub.challenge": "1158201444",
    },
  });
  expect(bueno.status()).toBe(200);
  expect(await bueno.text()).toBe("1158201444");

  const malo = await request.get(URL_WEBHOOK, {
    params: { "hub.mode": "subscribe", "hub.verify_token": "otro", "hub.challenge": "1158201444" },
  });
  expect(malo.status()).toBe(403);
  expect(await malo.text()).not.toContain("1158201444");
});

test("un aviso sin firma o con firma ajena se rechaza y no cambia nada", async ({ request }) => {
  const wamid = `wamid.${randomUUID()}`;
  await envio(wamid);
  const cuerpo = aviso(wamid, "delivered");

  for (const firma of [undefined, firmar(cuerpo, "secreto-ajeno"), firmar(cuerpo + " ")]) {
    const res = await request.post(URL_WEBHOOK, {
      data: cuerpo,
      headers: { "content-type": "application/json", ...(firma ? { "x-hub-signature-256": firma } : {}) },
    });
    expect(res.status()).toBe(401);
  }
  expect((await estadoDe(wamid)).estado).toBe("aceptado");
});

test("los avisos marcan si el código llegó, aunque vengan repetidos o en desorden", async ({ request }) => {
  const wamid = `wamid.${randomUUID()}`;
  await envio(wamid);
  const mandar = (status: string, errors?: { code: number; title: string }[]) => {
    const cuerpo = aviso(wamid, status, errors);
    return request.post(URL_WEBHOOK, {
      data: cuerpo,
      headers: { "content-type": "application/json", "x-hub-signature-256": firmar(cuerpo) },
    });
  };

  expect((await mandar("delivered")).status()).toBe(200);
  expect((await estadoDe(wamid)).estado).toBe("delivered");
  // «enviado» llega tarde: no retrocede.
  await mandar("sent");
  expect((await estadoDe(wamid)).estado).toBe("delivered");
  await mandar("read");
  await mandar("read");
  expect((await estadoDe(wamid)).estado).toBe("read");

  // Uno que falla queda con el motivo de Meta.
  const otro = `wamid.${randomUUID()}`;
  await envio(otro);
  const cuerpo = aviso(otro, "failed", [{ code: 131026, title: "Message undeliverable" }]);
  await request.post(URL_WEBHOOK, {
    data: cuerpo,
    headers: { "content-type": "application/json", "x-hub-signature-256": firmar(cuerpo) },
  });
  expect(await estadoDe(otro)).toEqual({ estado: "failed", error: "131026: Message undeliverable" });
});

test("un aviso de un mensaje que no es nuestro se acepta sin tocar nada", async ({ request }) => {
  // Si se respondiera con error, Meta reintentaría sin fin.
  const cuerpo = JSON.stringify({
    object: "whatsapp_business_account",
    entry: [{ changes: [{ value: { messages: [{ from: "573004128805", text: { body: "hola" } }] } }] }],
  });
  const res = await request.post(URL_WEBHOOK, {
    data: cuerpo,
    headers: { "content-type": "application/json", "x-hub-signature-256": firmar(cuerpo) },
  });
  expect(res.status()).toBe(200);
});
