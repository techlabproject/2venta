import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CODE_LENGTH,
  codeMatches,
  decryptCode,
  encryptCode,
  generateCode,
  isWellFormed,
  normalize,
} from "./code";

// El secreto se lee cuando se cifra, no al importar, así que basta ponerlo aquí.
process.env.PICKUP_CODE_SECRET ??= "secreto-de-prueba";

test("genera códigos de seis dígitos", () => {
  for (let i = 0; i < 200; i++) {
    const code = generateCode();
    assert.equal(code.length, CODE_LENGTH);
    assert.match(code, /^\d{6}$/);
  }
});

test("genera códigos distintos", () => {
  // No es una prueba de aleatoriedad, pero atrapa el error de devolver siempre lo
  // mismo, que es el que de verdad ocurre.
  const codes = new Set(Array.from({ length: 500 }, generateCode));
  assert.ok(codes.size > 400, `demasiadas repeticiones: ${codes.size} de 500`);
});

test("incluye códigos que empiezan por cero", () => {
  // Si se guardaran como número en vez de texto, "000123" se volvería "123" y el
  // comprador dictaría un código que no existe.
  const conCero = Array.from({ length: 2000 }, generateCode).some((c) =>
    c.startsWith("0")
  );
  assert.ok(conCero, "nunca generó un código que empiece por cero");
});

test("el código cifrado no contiene el original", () => {
  const code = "482137";
  const stored = encryptCode(code);
  assert.ok(!stored.includes(code));
  assert.notEqual(stored, code);
});

test("el código se puede recuperar, que es de lo que depende volver a mostrarlo", () => {
  // Con un hash esto sería imposible, y el comprador no podría volver a ver su
  // código al llegar al encuentro.
  assert.equal(decryptCode(encryptCode("482137")), "482137");
  assert.equal(decryptCode(encryptCode("000123")), "000123");
});

test("dos cifrados del mismo código son distintos entre sí", () => {
  // Cada uno lleva su propio vector de inicialización: dos pedidos con el mismo
  // código no se ven iguales en la base.
  assert.notEqual(encryptCode("482137"), encryptCode("482137"));
});

test("un dato alterado no se puede descifrar", () => {
  const stored = encryptCode("482137");
  const alterado = stored.slice(0, -2) + (stored.endsWith("00") ? "11" : "00");
  assert.equal(decryptCode(alterado), null);
  assert.equal(decryptCode("basura"), null);
  assert.equal(decryptCode(""), null);
});

test("reconoce el código correcto y rechaza los demás", () => {
  const stored = encryptCode("482137");
  assert.ok(codeMatches("482137", stored));
  assert.ok(!codeMatches("482138", stored));
  assert.ok(!codeMatches("", stored));
  assert.ok(!codeMatches("48213", stored));
  assert.ok(!codeMatches("4821370", stored));
});

test("acepta el código dictado con espacios o guiones", () => {
  // La gente lo lee en voz alta y quien lo escribe lo separa como quiera.
  const stored = encryptCode("482137");
  for (const variante of ["482 137", "482-137", " 482137 ", "48 21 37"]) {
    assert.ok(codeMatches(variante, stored), `no aceptó: ${variante}`);
  }
});

test("normaliza y valida la forma", () => {
  assert.equal(normalize("482-137"), "482137");
  assert.ok(isWellFormed("482 137"));
  assert.ok(!isWellFormed("48213"));
  assert.ok(!isWellFormed("abcdef"));
});
