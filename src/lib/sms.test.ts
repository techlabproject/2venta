import { test } from "node:test";
import assert from "node:assert/strict";
import { sendVerificationCode } from "./sms";

// Sin WhatsApp configurado, en producción no se manda nada: un código en el
// registro del servidor es una filtración.
test("en producción se niega a operar sin proveedor", async () => {
  const before = process.env.APP_ENV;
  const token = process.env.WHATSAPP_TOKEN;
  delete process.env.WHATSAPP_TOKEN;
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
