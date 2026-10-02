"use client";

import { useState, useSyncExternalStore } from "react";
import { CampoPesos, formatearPesos } from "@/components/CampoPesos";

/**
 * Escalones del deslizador (D-129, corrección 4 en su versión 3). El primero es «sin
 * mínimo» y el último «sin máximo». No son lineales: entre $10.000 y $50.000 cada
 * paso importa; entre $3.000.000 y $5.000.000, no tanto.
 */
const ESCALONES = [
  0, 10_000, 20_000, 30_000, 50_000, 80_000, 100_000, 150_000, 200_000, 300_000, 500_000,
  800_000, 1_000_000, 1_500_000, 2_000_000, 3_000_000, 5_000_000, Infinity,
];
const ULTIMO = ESCALONES.length - 1;

// Sin JavaScript el deslizador no se dibuja: quedan las dos casillas, que funcionan
// como formulario normal (D-25).
const sinSuscripcion = () => () => {};
const useHidratado = () =>
  useSyncExternalStore(sinSuscripcion, () => true, () => false);

const pesos = (n: number) => `$ ${formatearPesos(String(n))}`;

/** El escalón más alto que no pasa del valor (un precio de la dirección puede no ser escalón). */
function escalonDe(valor: number | null, siNoHay: number): number {
  if (valor === null) return siNoHay;
  let i = 0;
  while (i < ULTIMO - 1 && ESCALONES[i + 1] <= valor) i++;
  return i;
}

function resumen(min: number | null, max: number | null): string {
  if (min === null && max === null) return "Cualquier precio";
  if (max === null) return `Desde ${pesos(min!)}`;
  if (min === null) return `Hasta ${pesos(max)}`;
  return `${pesos(min)} – ${pesos(max)}`;
}

export function CampoPrecio({
  minCop,
  maxCop,
  prefijo,
}: {
  minCop: number | null;
  maxCop: number | null;
  prefijo: string;
}) {
  const hidratado = useHidratado();
  // El valor exacto que se manda. Un precio que llega en la dirección y no es escalón
  // se respeta hasta que la persona mueva esa punta.
  const [min, setMin] = useState<number | null>(minCop || null);
  const [max, setMax] = useState<number | null>(maxCop || null);
  const iMin = escalonDe(min, 0);
  const iMax = max === null ? ULTIMO : Math.max(escalonDe(max, ULTIMO), iMin + 1);

  const leyenda = (
    <legend className="mb-1.5 text-sm font-medium">
      Precio <span className="font-normal text-muted">(pesos colombianos)</span>
    </legend>
  );

  if (!hidratado) {
    return (
      <fieldset>
        {leyenda}
        <div className="flex items-center gap-2">
          <CampoPesos
            id={`${prefijo}-min`}
            name="min"
            ariaLabel="Precio mínimo"
            defaultValue={minCop}
            placeholder="Desde"
            className="flex-1"
          />
          <span className="text-muted">—</span>
          <CampoPesos
            id={`${prefijo}-max`}
            name="max"
            ariaLabel="Precio máximo"
            defaultValue={maxCop}
            placeholder="Hasta"
            className="flex-1"
          />
        </div>
      </fieldset>
    );
  }

  const izquierda = (iMin / ULTIMO) * 100;
  const derecha = 100 - (iMax / ULTIMO) * 100;

  return (
    <fieldset>
      {leyenda}
      <p data-testid="rango-precio" className="mb-2 text-sm font-semibold tabular-nums text-ink">
        {resumen(min, max)}
      </p>
      {/* Lo que viaja en el formulario: pesos, no la posición del deslizador. */}
      <input type="hidden" name="min" value={min ?? ""} />
      <input type="hidden" name="max" value={max ?? ""} />
      <div className="deslizador-doble relative h-8">
        <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-line" />
        <div
          className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-brand"
          style={{ left: `${izquierda}%`, right: `${derecha}%` }}
        />
        <input
          type="range"
          id={`${prefijo}-min`}
          aria-label="Precio mínimo"
          aria-valuetext={iMin === 0 ? "Sin mínimo" : pesos(min!)}
          min={0}
          max={ULTIMO}
          step={1}
          value={iMin}
          onChange={(e) => {
            const i = Math.min(Number(e.target.value), iMax - 1);
            setMin(i === 0 ? null : ESCALONES[i]);
          }}
        />
        <input
          type="range"
          id={`${prefijo}-max`}
          aria-label="Precio máximo"
          aria-valuetext={iMax === ULTIMO ? "Sin máximo" : pesos(max!)}
          min={0}
          max={ULTIMO}
          step={1}
          value={iMax}
          onChange={(e) => {
            const i = Math.max(Number(e.target.value), iMin + 1);
            setMax(i === ULTIMO ? null : ESCALONES[i]);
          }}
        />
      </div>
      <div className="mt-1 flex justify-between text-xs text-muted">
        <span>Sin mínimo</span>
        <span>Sin máximo</span>
      </div>
    </fieldset>
  );
}
