"use client";

import type { ComponentProps } from "react";
import { CampoValidado } from "./CampoValidado";
import { digitosDePrecio, formatearPrecio, problemaDePrecio } from "@/lib/precio";

/**
 * Un precio en pesos colombianos (corrección 24): «$» delante y «COP» detrás, solo
 * dígitos, con los puntos de miles puestos solos mientras se escribe (260.000), y
 * revisado al salir del campo como el correo y el celular (D-104). Lo usan publicar,
 * editar y el panel de oferta, para que el precio se escriba igual en todas partes.
 *
 * El servidor no le cree: vuelve a leerlo con `parseCop`, que acepta los puntos.
 */
export function CampoPrecio({
  minimo,
  defaultValue,
  ...props
}: Omit<
  ComponentProps<typeof CampoValidado>,
  "validar" | "limpiar" | "type" | "prefijo" | "sufijo" | "defaultValue"
> & {
  /** El precio más bajo que se acepta, en pesos. */
  minimo: number;
  defaultValue?: number;
}) {
  return (
    <CampoValidado
      {...props}
      defaultValue={defaultValue ? formatearPrecio(String(defaultValue)) : undefined}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      prefijo="$"
      sufijo="COP"
      validar={(v) => problemaDePrecio(v, minimo)}
      limpiar={(v) => formatearPrecio(digitosDePrecio(v))}
    />
  );
}
