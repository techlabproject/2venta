"use client";

import type { ComponentProps } from "react";
import { CampoValidado } from "./CampoValidado";
import { digitosDeCelular, formatearCelular, problemaDeCelular } from "@/lib/celular";

/**
 * Un celular colombiano (corrección 7, decisión de Nicolás): «+57» fijo, solo
 * dígitos, máximo diez, agrupados solos mientras se escribe (300 412 8805), y
 * revisado al salir del campo como el correo (D-104). Solo Colombia, sin selector
 * de país (corrección 10).
 */
export function CampoCelular(
  props: Omit<ComponentProps<typeof CampoValidado>, "validar" | "limpiar" | "type" | "prefijo">,
) {
  return (
    <CampoValidado
      placeholder="300 412 8805"
      {...props}
      type="tel"
      inputMode="numeric"
      prefijo="+57"
      validar={problemaDeCelular}
      limpiar={(v) => formatearCelular(digitosDeCelular(v))}
    />
  );
}
