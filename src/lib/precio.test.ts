import { test } from "node:test";
import assert from "node:assert/strict";
import { digitosDePrecio, formatearPrecio, problemaDePrecio } from "./precio";
import { parseCop } from "@/features/payments/money";

test("solo quedan los dígitos, se pegue como se pegue", () => {
  assert.equal(digitosDePrecio("$ 260.000"), "260000");
  assert.equal(digitosDePrecio("260,000"), "260000");
  assert.equal(digitosDePrecio("260.000,00"), "260000");
  assert.equal(digitosDePrecio("260.000,5"), "260000");
  assert.equal(digitosDePrecio("doscientos"), "");
  assert.equal(digitosDePrecio("12abc3"), "123");
  assert.equal(digitosDePrecio("-5000"), "5000");
  assert.equal(digitosDePrecio("000450"), "450");
});

test("borrar hacia atrás en un número agrupado no pierde dígitos", () => {
  // «1.500» con Retroceso al final queda «1.50»: son 150, no 1 con decimales.
  assert.equal(digitosDePrecio("1.50"), "150");
});

test("no pasa de nueve dígitos", () => {
  assert.equal(digitosDePrecio("12345678901"), "123456789");
});

test("agrupa de a tres con punto, también a medias", () => {
  assert.equal(formatearPrecio("260000"), "260.000");
  assert.equal(formatearPrecio("2600"), "2.600");
  assert.equal(formatearPrecio("999"), "999");
  assert.equal(formatearPrecio("1234567"), "1.234.567");
  assert.equal(formatearPrecio(""), "");
});

test("lo que muestra el campo es lo que entiende el servidor", () => {
  for (const d of ["10000", "260000", "1234567", "999999999"]) {
    assert.equal(parseCop(formatearPrecio(d)), Number(d));
  }
});

test("explica qué falta", () => {
  assert.equal(problemaDePrecio("", 10_000), "Escribe el precio en pesos.");
  assert.equal(problemaDePrecio("9.999", 10_000), "El mínimo es $10.000.");
  assert.equal(problemaDePrecio("10.000", 10_000), null);
  assert.equal(problemaDePrecio("1", 1), null);
});
