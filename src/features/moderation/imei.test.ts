import { test } from "node:test";
import assert from "node:assert/strict";
import { imeiWithCheckDigit, isValidImei, normalizeImei } from "./imei";

test("acepta IMEI con su dígito verificador correcto", () => {
  // Números de ejemplo conocidos, con Luhn válido.
  assert.ok(isValidImei("490154203237518"));
  assert.ok(isValidImei("356938035643809"));
});

test("rechaza un IMEI con el dígito verificador equivocado", () => {
  // El mismo número con el último dígito cambiado.
  assert.ok(!isValidImei("490154203237519"));
  assert.ok(!isValidImei("356938035643800"));
});

test("rechaza por largo", () => {
  assert.ok(!isValidImei("49015420323751"));
  assert.ok(!isValidImei("4901542032375180"));
  assert.ok(!isValidImei(""));
});

test("rechaza lo que no son dígitos", () => {
  assert.ok(!isValidImei("abcdefghijklmno"));
  assert.ok(!isValidImei("49015420323751X"));
});

test("rechaza el IMEI de puros ceros aunque pase Luhn", () => {
  // Es el que escribe quien quiere salir del paso.
  assert.ok(!isValidImei("000000000000000"));
});

test("acepta el IMEI escrito con espacios o guiones", () => {
  // Viene impreso en la caja separado en grupos.
  assert.ok(isValidImei("49-015420-323751-8"));
  assert.ok(isValidImei("490154 203237 518"));
});

test("normaliza dejando solo los dígitos", () => {
  assert.equal(normalizeImei("49-015420-323751-8"), "490154203237518");
});

test("el generador de prueba produce IMEI que la validación acepta", () => {
  for (const base of ["35693803564380", "49015420323751", "12345678901234"]) {
    assert.ok(isValidImei(imeiWithCheckDigit(base)), `falló con ${base}`);
  }
});
