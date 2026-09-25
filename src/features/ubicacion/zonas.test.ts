import { test } from "node:test";
import assert from "node:assert/strict";
import {
  aCuadricula,
  dentroDelArea,
  distanciaKm,
  textoDeDistancia,
  ZONAS,
  zonaMasCercana,
  zonaReconocida,
} from "./zonas";

test("la lista tiene las 19 localidades urbanas y los 8 municipios vecinos, sin Sumapaz", () => {
  assert.equal(ZONAS.filter((z) => z.grupo === "bogota").length, 19);
  assert.equal(ZONAS.filter((z) => z.grupo === "vecino").length, 8);
  assert.equal(zonaReconocida("Sumapaz"), null);
  // Todos los centros caen dentro del área que se acepta.
  for (const z of ZONAS) assert.ok(dentroDelArea(z.lat, z.lng), z.nombre);
});

test("reconoce lo escrito a mano sin importar tildes, mayúsculas ni espacios", () => {
  assert.equal(zonaReconocida("  usaquen ")?.nombre, "Usaquén");
  assert.equal(zonaReconocida("CIUDAD   BOLIVAR")?.nombre, "Ciudad Bolívar");
  assert.equal(zonaReconocida("Chapi"), null);
  assert.equal(zonaReconocida(""), null);
  assert.equal(zonaReconocida(null), null);
});

test("el área cubre Bogotá y sus vecinos, y deja fuera otras ciudades", () => {
  assert.equal(dentroDelArea(4.6533, -74.0836), true); // Teusaquillo
  assert.equal(dentroDelArea(4.863, -74.059), true); // Chía
  assert.equal(dentroDelArea(6.2442, -75.5812), false); // Medellín
  assert.equal(dentroDelArea(4.8133, -75.6961), false); // Pereira
  assert.equal(dentroDelArea(Number.NaN, -74.08), false);
});

test("la cuadrícula redondea a 0,01° y nunca guarda el punto exacto", () => {
  assert.equal(aCuadricula(4.65337), 4.65);
  assert.equal(aCuadricula(-74.08361), -74.08);
});

test("la zona sugerida es la de centro más cercano", () => {
  assert.equal(zonaMasCercana(4.649, -74.06).nombre, "Chapinero");
  assert.equal(zonaMasCercana(4.58, -74.215).nombre, "Soacha");
});

test("la distancia se dice redondeada", () => {
  const chapinero = zonaReconocida("Chapinero")!;
  const soacha = zonaReconocida("Soacha")!;
  const km = distanciaKm(chapinero, soacha);
  assert.ok(km > 15 && km < 20, String(km));
  assert.equal(textoDeDistancia(0.4), "a menos de 1 km");
  assert.equal(textoDeDistancia(3.4), "a unos 3 km");
  assert.equal(textoDeDistancia(12.6), "a unos 13 km");
});
