"use client";

import { forwardRef } from "react";

// Diez dígitos alcanzan para cualquier precio real ($9.999.999.999).
const MAX_DIGITOS = 10;

/** «150000» → «150.000». Vacío si no hay dígitos. */
export function formatearPesos(digitos: string): string {
  return digitos ? Number(digitos).toLocaleString("es-CO") : "";
}

/**
 * Un monto en pesos: solo acepta dígitos y pone los puntos de miles al escribir.
 *
 * Antes los campos de precio eran texto libre: se podía escribir «abc» y el filtro
 * se ignoraba en silencio (corrección 4 de Catalina). El signo `$` va fuera de la
 * caja para que quede claro que son pesos colombianos sin que haya que escribirlo.
 *
 * Manda el valor con los puntos (`150.000`); el servidor los acepta. Sin JavaScript
 * es una caja numérica normal.
 */
export const CampoPesos = forwardRef<
  HTMLInputElement,
  {
    name: string;
    id?: string;
    ariaLabel?: string;
    defaultValue?: number | null;
    placeholder?: string;
    className?: string;
    onValor?: (digitos: string) => void;
  }
>(function CampoPesos(
  { name, id, ariaLabel, defaultValue, placeholder, className = "", onValor },
  ref,
) {
  function alEscribir(e: React.FormEvent<HTMLInputElement>) {
    const campo = e.currentTarget;
    // Cuántos dígitos había antes del cursor, para devolverlo al mismo sitio
    // después de poner los puntos.
    const antes = campo.value.slice(0, campo.selectionStart ?? campo.value.length);
    const digitosAntes = antes.replace(/\D/g, "").length;
    const digitos = campo.value.replace(/\D/g, "").replace(/^0+/, "").slice(0, MAX_DIGITOS);
    const texto = formatearPesos(digitos);
    if (texto !== campo.value) {
      campo.value = texto;
      let pos = 0;
      for (let vistos = 0; pos < texto.length && vistos < digitosAntes; pos++) {
        if (/\d/.test(texto[pos])) vistos++;
      }
      campo.setSelectionRange(pos, pos);
    }
    onValor?.(digitos);
  }

  return (
    <span className={`relative flex min-w-0 items-center ${className}`}>
      <span aria-hidden="true" className="pointer-events-none absolute left-3 text-sm text-muted">
        $
      </span>
      <input
        ref={ref}
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        name={name}
        aria-label={ariaLabel}
        defaultValue={defaultValue ? formatearPesos(String(defaultValue)) : ""}
        placeholder={placeholder}
        onInput={alEscribir}
        className="w-full min-w-0 rounded-xl border border-line bg-white py-2 pr-3 pl-7 text-sm tabular-nums outline-none transition duration-200 ease-salida hover:border-brand/30 focus:border-brand focus:ring-3 focus:ring-brand/15"
      />
    </span>
  );
});
