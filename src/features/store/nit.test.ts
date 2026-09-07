import { test } from "node:test";
import assert from "node:assert/strict";
import { checkDigit, formatNit, isValidNit, normalizeNit } from "./nit";

test("calcula el dígito de verificación", () => {
  assert.equal(checkDigit("899999063"), 3);
  assert.equal(checkDigit("830053105"), 3);
});

test("acepta el NIT con su dígito correcto", () => {
  assert.ok(isValidNit("899999063-3"));
  assert.ok(isValidNit("899.999.063-3"));
  assert.ok(isValidNit("830053105-3"));
});

test("rechaza el NIT con el dígito equivocado", () => {
  assert.ok(!isValidNit("899999063-9"));
  assert.ok(!isValidNit("830053105-0"));
});

test("acepta el NIT sin dígito de verificación", () => {
  // La gente lo escribe de las dos formas.
  assert.ok(isValidNit("899999063"));
  assert.ok(isValidNit("899.999.063"));
});

test("rechaza lo que no es un NIT", () => {
  for (const raw of ["", "   ", "abc", "12345", "000000000", "9".repeat(20)]) {
    assert.ok(!isValidNit(raw), `aceptó de más: ${JSON.stringify(raw)}`);
  }
});

test("guarda siempre en el mismo formato", () => {
  // Sin esto, el mismo NIT escrito de tres formas ocuparía tres filas distintas y
  // la restricción de unicidad no serviría de nada.
  assert.equal(formatNit("899999063"), "899999063-3");
  assert.equal(formatNit("899.999.063"), "899999063-3");
  assert.equal(formatNit("899999063-3"), "899999063-3");
  assert.equal(formatNit(" 899.999.063 - 3 "), "899999063-3");
});

test("normaliza dejando solo dígitos", () => {
  assert.equal(normalizeNit("899.999.063-3"), "8999990633");
});
