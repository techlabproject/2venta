import { test } from "node:test";
import assert from "node:assert/strict";
import { codeMatches, decryptCode, encryptCode, generateCode, normalize } from "./otp";

process.env.PHONE_CODE_SECRET ??= "secreto-de-prueba";

test("genera códigos de seis dígitos, incluidos los que empiezan por cero", () => {
  const codes = Array.from({ length: 2000 }, generateCode);
  for (const c of codes.slice(0, 100)) assert.match(c, /^\d{6}$/);
  // Si se guardaran como número, "000123" se volvería "123" y el usuario dictaría
  // un código que no existe.
  assert.ok(codes.some((c) => c.startsWith("0")));
  assert.ok(new Set(codes).size > 1500, "demasiadas repeticiones");
});

test("el cifrado no contiene el código y se puede revertir con la clave", () => {
  const stored = encryptCode("482137");
  assert.ok(!stored.includes("482137"));
  assert.equal(decryptCode(stored), "482137");
});

test("dos cifrados del mismo código son distintos", () => {
  assert.notEqual(encryptCode("482137"), encryptCode("482137"));
});

test("un dato alterado no se descifra", () => {
  const stored = encryptCode("482137");
  assert.equal(decryptCode(stored.slice(0, -2) + "ff"), null);
  assert.equal(decryptCode("basura"), null);
});

test("reconoce el correcto y rechaza los demás", () => {
  const stored = encryptCode("482137");
  assert.ok(codeMatches("482137", stored));
  assert.ok(codeMatches("482 137", stored));
  assert.ok(!codeMatches("482138", stored));
  assert.ok(!codeMatches("", stored));
});

test("normaliza a dígitos", () => {
  assert.equal(normalize("482-137"), "482137");
});
