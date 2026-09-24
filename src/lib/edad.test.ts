import { test } from "node:test";
import assert from "node:assert/strict";
import { edadCumplida, problemaDeNacimiento } from "./edad";

test("cuenta los años cumplidos, incluido el día del cumpleaños", () => {
  assert.equal(edadCumplida("2008-09-24", "2026-09-24"), 18);
  assert.equal(edadCumplida("2008-09-25", "2026-09-24"), 17);
  assert.equal(edadCumplida("2008-02-29", "2026-02-28"), 17);
});

test("dice qué está mal", () => {
  assert.equal(problemaDeNacimiento("1995-05-20", "2026-09-24"), null);
  assert.match(problemaDeNacimiento("2010-01-01", "2026-09-24")!, /18 años o más/);
  assert.match(problemaDeNacimiento("2027-01-01", "2026-09-24")!, /no parece real/);
  assert.match(problemaDeNacimiento("1995-02-31", "2026-09-24")!, /no parece real/);
  assert.match(problemaDeNacimiento("1800-01-01", "2026-09-24")!, /no parece real/);
  assert.match(problemaDeNacimiento("", "2026-09-24")!, /Escribe/);
});
