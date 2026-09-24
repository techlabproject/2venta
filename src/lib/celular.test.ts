import { test } from "node:test";
import assert from "node:assert/strict";
import {
  digitosDeCelular,
  formatearCelular,
  normalizarCelular,
  problemaDeCelular,
} from "./celular";

test("limpia lo que se pegue y deja diez dígitos", () => {
  assert.equal(digitosDeCelular("+57 300 412 8805"), "3004128805");
  assert.equal(digitosDeCelular("(300) 412-8805"), "3004128805");
  assert.equal(digitosDeCelular("300abc4128805999"), "3004128805");
});

test("agrupa como se dice en voz alta", () => {
  assert.equal(formatearCelular("3004128805"), "300 412 8805");
  assert.equal(formatearCelular("30041"), "300 41");
  assert.equal(formatearCelular(""), "");
});

test("explica qué falta", () => {
  assert.equal(problemaDeCelular("300 412 8805"), null);
  assert.match(problemaDeCelular("200 412 8805")!, /empiezan por 3/);
  assert.match(problemaDeCelular("300 412 88")!, /faltan 2 dígitos/);
  assert.match(problemaDeCelular("300 412 880")!, /falta 1 dígito/);
  assert.match(problemaDeCelular("")!, /Escribe tu celular/);
});

test("normaliza para guardar", () => {
  assert.equal(normalizarCelular("300 412 8805"), "+573004128805");
  assert.equal(normalizarCelular("+57 300 412 8805"), "+573004128805");
  assert.equal(normalizarCelular("1234"), null);
});
