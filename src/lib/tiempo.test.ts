import { test } from "node:test";
import assert from "node:assert/strict";
import { cuandoFue } from "./tiempo";

// La hora relativa de la bandeja de conversaciones (S-35).
//
// Se prueba con un «ahora» fijo y no con el reloj de verdad: una prueba que depende
// de la hora a la que se corre falla sola a medianoche y nadie sabe por qué.

/** Un instante concreto en Bogotá: 15 de septiembre de 2026, 9:00 de la mañana. */
const AHORA = new Date("2026-09-15T14:00:00Z"); // 09:00 en America/Bogota (UTC-5)
const hace = (ms: number) => new Date(AHORA.getTime() - ms);

const MIN = 60_000;
const HORA = 60 * MIN;

test("lo de hace menos de un minuto es «ahora»", () => {
  assert.equal(cuandoFue(hace(10_000), AHORA), "ahora");
  assert.equal(cuandoFue(hace(59_000), AHORA), "ahora");
});

test("dentro de la hora cuenta minutos", () => {
  assert.equal(cuandoFue(hace(5 * MIN), AHORA), "hace 5 min");
  assert.equal(cuandoFue(hace(59 * MIN), AHORA), "hace 59 min");
});

test("dentro del día muestra la hora", () => {
  // 3 horas antes de las 9:00 son las 6:00 de la mañana.
  assert.match(cuandoFue(hace(3 * HORA), AHORA), /6:00/);
});

test("«ayer» se mide por día de calendario, no por 24 horas", () => {
  // Anoche a las 11 son 10 horas atrás: menos de un día, pero es ayer.
  // Este es el caso que falla si se compara «hace más de 24 horas».
  const anocheALas11 = new Date("2026-09-15T04:00:00Z"); // 14 sept, 23:00 en Bogotá
  assert.equal(cuandoFue(anocheALas11, AHORA), "ayer");
});

test("más atrás muestra el día, y con año cuando se pasa de uno", () => {
  // «8 de sept», con el «de» del español de Colombia, que es como lo escribe Intl.
  const haceUnaSemana = new Date("2026-09-08T14:00:00Z");
  assert.equal(cuandoFue(haceUnaSemana, AHORA), "8 de sept");

  const haceDosAnios = new Date("2024-09-08T14:00:00Z");
  assert.equal(cuandoFue(haceDosAnios, AHORA), "8 de sept de 2024");
});

test("una fecha del futuro no produce «hace -3 min»", () => {
  // Un reloj desfasado entre el servidor y la base alcanza para esto.
  const dentroDeUnRato = new Date(AHORA.getTime() + 5 * MIN);
  assert.equal(cuandoFue(dentroDeUnRato, AHORA), "ahora");
});
