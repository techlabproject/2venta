import { test } from "node:test";
import assert from "node:assert/strict";
import { pareceCelular } from "./pareceCelular";

test("reconoce un celular por su título", () => {
  for (const t of [
    "iPhone 13 de 128 GB",
    "Samsung Galaxy S21 Ultra",
    "Galaxy A54 negro",
    "Xiaomi Redmi Note 12",
    "Moto G84 como nuevo",
    "Celular Huawei P30",
    "Google Pixel 7",
    "Smartphone Oppo A78",
  ]) {
    assert.equal(pareceCelular(t), true, t);
  }
});

test("lo que no es un celular no pide IMEI", () => {
  for (const t of [
    "Xbox Series S",
    "PlayStation 5 con dos controles",
    "Portátil Lenovo IdeaPad",
    "iPad Air 5",
    "Galaxy Tab S8",
    "Galaxy Watch 5",
    "Audífonos Galaxy Buds 2",
    "Forro para iPhone 13",
    "Cargador rápido para celular",
    "Vidrio templado Galaxy S21",
  ]) {
    assert.equal(pareceCelular(t), false, t);
  }
});

test("la descripción cuenta si el título no dice nada", () => {
  assert.equal(pareceCelular("Teléfono en buen estado", "Es un celular iPhone 11, batería al 90%"), true);
  assert.equal(pareceCelular("iPhone 12", "Viene con su cargador y forro"), true);
  assert.equal(pareceCelular("Consola retro", "Se conecta al televisor"), false);
});
