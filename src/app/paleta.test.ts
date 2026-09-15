import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// El contraste de la paleta, medido contra WCAG 2.1 y no juzgado a ojo (D-84).
//
// Existe porque el problema que arregló —el coral no llegaba al 3:1 que pide WCAG
// 1.4.11 para el contorno de un control— llevaba ahí desde la primera paleta, con
// la mostaza a 1,88:1, y nadie lo había visto en año y medio. A ojo no se ve. Solo
// se ve midiendo, y solo se sigue viendo si se mide en cada corrida.
//
// Los colores se leen del CSS de verdad: una copia de los valores aquí se
// desincronizaría del `@theme` en el primer retoque y la prueba pasaría sobre una
// paleta que ya no existe.

const css = readFileSync(new URL("./globals.css", import.meta.url), "utf8");

function token(nombre: string): string {
  const m = css.match(new RegExp(`--color-${nombre}:\\s*(#[0-9a-fA-F]{6})`));
  assert.ok(m, `No existe el color --color-${nombre} en globals.css`);
  return m[1];
}

const canalLineal = (v: number) =>
  v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;

/** Luminancia relativa, tal y como la define WCAG 2.1. */
function luminancia(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) =>
    canalLineal(c / 255),
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contraste(a: string, b: string): number {
  const [claro, oscuro] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (claro + 0.05) / (oscuro + 0.05);
}

const BLANCO = "#ffffff";

/** [qué se mide, tinta, fondo, mínimo exigido] */
const PARES: [string, string, string, number][] = [
  // Texto: AA pide 4,5:1 para tamaño normal.
  ["texto principal sobre crema", token("ink"), token("cream"), 4.5],
  ["texto principal sobre blanco", token("ink"), BLANCO, 4.5],
  ["texto secundario sobre crema", token("ink2"), token("cream"), 4.5],
  ["texto tenue sobre crema", token("muted"), token("cream"), 4.5],
  ["texto tenue sobre blanco", token("muted"), BLANCO, 4.5],
  ["crema sobre petróleo (cabecera)", token("cream"), token("brand"), 4.5],
  ["precio sobre blanco", token("brand-d"), BLANCO, 4.5],
  ["coral de texto sobre blanco", token("accent-text"), BLANCO, 4.5],
  ["coral de texto sobre crema", token("accent-text"), token("cream"), 4.5],
  ["coral claro sobre petróleo", token("accent-on-brand"), token("brand"), 4.5],
  ["aviso sobre blanco", token("warn"), BLANCO, 4.5],
  ["peligro sobre blanco", token("danger"), BLANCO, 4.5],

  // El texto del botón principal va sobre el coral. Blanco aquí da 2,82:1.
  ["texto del botón principal", token("on-accent"), token("accent"), 4.5],

  // WCAG 1.4.11: el contorno de un control necesita 3:1 contra lo que tiene detrás.
  // El coral por sí solo no llega (2,57:1); por eso existe `accent-edge`.
  ["borde del botón principal sobre crema", token("accent-edge"), token("cream"), 3],
  ["contorno de foco sobre crema", token("brand"), token("cream"), 3],
];

for (const [nombre, tinta, fondo, minimo] of PARES) {
  test(`contraste — ${nombre}`, () => {
    const r = contraste(tinta, fondo);
    assert.ok(
      r >= minimo,
      `${nombre}: ${r.toFixed(2)}:1, por debajo del mínimo de ${minimo}:1 (${tinta} sobre ${fondo})`,
    );
  });
}

test("el acento y el peligro no se confunden entre sí", () => {
  // Coral y carmesí son los dos rojizos del producto, y uno dice «compra» mientras
  // el otro dice «esto borra algo». Si se parecen demasiado, el color deja de ser
  // información. No es una regla WCAG: es una regla del producto (D-84).
  const r = contraste(token("accent"), token("danger"));
  assert.ok(r >= 2, `El coral y el peligro solo se separan por ${r.toFixed(2)}:1`);
});
