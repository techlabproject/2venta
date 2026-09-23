"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { CampoPesos, formatearPesos } from "@/components/CampoPesos";

// Rangos generales para las tres categorías (decisión de Nicolás, corrección 4).
// Vacío es «sin límite» de ese lado.
const RANGOS = [
  { etiqueta: "Menos de $50.000", min: "", max: "50000" },
  { etiqueta: "$50.000 a $200.000", min: "50000", max: "200000" },
  { etiqueta: "$200.000 a $1.000.000", min: "200000", max: "1000000" },
  { etiqueta: "Más de $1.000.000", min: "1000000", max: "" },
];

// Los botones de rango solo sirven con JavaScript; sin él no se dibujan y quedan
// los dos campos, que funcionan como formulario normal.
const sinSuscripcion = () => () => {};
const useHidratado = () =>
  useSyncExternalStore(sinSuscripcion, () => true, () => false);

/**
 * Escribe un valor en el campo como si lo hubiera tecleado la persona, para que el
 * formulario se entere (el panel recuenta resultados en su `onChange`). Asignar
 * `value` a secas no dispara nada: React compara contra el último valor que vio.
 */
function escribir(campo: HTMLInputElement | null, digitos: string) {
  if (!campo) return;
  const asignar = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
  asignar?.call(campo, formatearPesos(digitos));
  campo.dispatchEvent(new Event("input", { bubbles: true }));
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
  const campoMin = useRef<HTMLInputElement>(null);
  const campoMax = useRef<HTMLInputElement>(null);
  const [min, setMin] = useState(minCop ? String(minCop) : "");
  const [max, setMax] = useState(maxCop ? String(maxCop) : "");

  function elegir(rango: (typeof RANGOS)[number]) {
    const yaPuesto = rango.min === min && rango.max === max;
    // Tocar el rango que ya está puesto lo quita.
    escribir(campoMin.current, yaPuesto ? "" : rango.min);
    escribir(campoMax.current, yaPuesto ? "" : rango.max);
  }

  const invertidos = min !== "" && max !== "" && Number(min) > Number(max);

  return (
    <fieldset>
      <legend className="mb-1.5 text-sm font-medium">
        Precio <span className="font-normal text-muted">(pesos colombianos)</span>
      </legend>

      {hidratado && (
        <div className="mb-2.5 flex flex-wrap gap-1.5">
          {RANGOS.map((r) => {
            const puesto = r.min === min && r.max === max;
            return (
              <button
                key={r.etiqueta}
                type="button"
                aria-pressed={puesto}
                onClick={() => elegir(r)}
                className={`rounded-full border px-3 py-1 text-xs transition duration-200 ease-salida active:scale-[0.97] ${
                  puesto
                    ? "border-brand bg-brand font-medium text-cream"
                    : "border-line bg-white text-ink2 hover:border-brand/30 hover:bg-ph"
                }`}
              >
                {r.etiqueta}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex items-center gap-2">
        <CampoPesos
          ref={campoMin}
          id={`${prefijo}-min`}
          name="min"
          ariaLabel="Precio mínimo"
          defaultValue={minCop}
          placeholder="Desde"
          className="flex-1"
          onValor={setMin}
        />
        <span className="text-muted">—</span>
        <CampoPesos
          ref={campoMax}
          id={`${prefijo}-max`}
          name="max"
          ariaLabel="Precio máximo"
          defaultValue={maxCop}
          placeholder="Hasta"
          className="flex-1"
          onValor={setMax}
        />
      </div>
      {invertidos && (
        <p role="status" className="mt-1.5 text-xs text-warn">
          El mínimo quedó mayor que el máximo: los vamos a usar al revés.
        </p>
      )}
    </fieldset>
  );
}
