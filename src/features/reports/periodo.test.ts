import { test } from "node:test";
import assert from "node:assert/strict";
import { parsePeriod } from "./periodo";

// Luna (fila 54, D-129): el Excel decía «del 1 de septiembre al 1 de octubre» y la
// pantalla «2026-09-02 a 2026-10-02». La pantalla formateaba en UTC: de noche en
// Bogotá ya mostraba el día siguiente. Y «hasta» dejaba fuera su propio día.

const p = (q: string, ahora?: Date) => parsePeriod(new URLSearchParams(q), ahora);

test("los días son de Bogotá: a las 8 p. m. del 1 de octubre, hoy es el 1", () => {
  const ahora = new Date("2026-10-02T01:00:00Z"); // 8:00 p. m. del 1 en Bogotá
  const r = p("", ahora);
  assert.equal(r.hasta, "2026-10-01");
  assert.equal(r.desde, "2026-09-01");
});

test("«hasta» incluye su día completo", () => {
  const r = p("desde=2026-09-01&hasta=2026-09-15");
  assert.equal(r.from.toISOString(), "2026-09-01T05:00:00.000Z");
  assert.equal(r.to.toISOString(), "2026-09-16T05:00:00.000Z");
});

test("fechas al revés se ordenan y lo inválido vuelve al periodo por defecto", () => {
  const r = p("desde=2026-12-31&hasta=2026-01-01");
  assert.equal(r.desde, "2026-01-01");
  assert.equal(r.hasta, "2026-12-31");
  const ahora = new Date("2026-10-02T15:00:00Z");
  const malo = p("desde=hola&hasta=--", ahora);
  assert.equal(malo.hasta, "2026-10-02");
  assert.equal(malo.desde, "2026-09-02");
});
