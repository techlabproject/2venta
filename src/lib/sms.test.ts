import { test } from "node:test";
import assert from "node:assert/strict";
import { sendVerificationCode } from "./sms";

// Hasta que exista proveedor, en producción no se manda nada: un código en el
// registro del servidor es una filtración.
test("en producción se niega a operar sin proveedor", async () => {
  const before = process.env.APP_ENV;
  process.env.APP_ENV = "produccion";
  try {
    await assert.rejects(
      () => sendVerificationCode("+573001234567", "123456"),
      /No hay proveedor de SMS configurado/
    );
  } finally {
    if (before === undefined) delete process.env.APP_ENV;
    else process.env.APP_ENV = before;
  }
});

test("en desarrollo lo escribe en el registro", async () => {
  const before = process.env.APP_ENV;
  process.env.APP_ENV = "desarrollo";
  const lines: string[] = [];
  const original = console.info;
  console.info = (msg: string) => void lines.push(msg);
  try {
    await sendVerificationCode("+573001234567", "123456");
    assert.match(lines[0], /123456/);
  } finally {
    console.info = original;
    if (before === undefined) delete process.env.APP_ENV;
    else process.env.APP_ENV = before;
  }
});
