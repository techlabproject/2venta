import { test } from "node:test";
import assert from "node:assert/strict";
import { rangoDeVisitas } from "./rangos";

test("cada cifra cae en su rango, con los bordes donde se leen", () => {
  assert.equal(rangoDeVisitas(0), "Menos de 10");
  assert.equal(rangoDeVisitas(9), "Menos de 10");
  assert.equal(rangoDeVisitas(10), "10 a 50");
  assert.equal(rangoDeVisitas(49), "10 a 50");
  assert.equal(rangoDeVisitas(50), "50 a 100");
  assert.equal(rangoDeVisitas(100), "100 a 500");
  assert.equal(rangoDeVisitas(499), "100 a 500");
  assert.equal(rangoDeVisitas(500), "Más de 500");
  assert.equal(rangoDeVisitas(12_000), "Más de 500");
});
