"use client";

import type { ComponentProps } from "react";
import { CampoValidado } from "./CampoValidado";

const LARGO = 6;

/**
 * Los dígitos del código, aunque se pegue el SMS entero. Si hay un bloque de
 * exactamente seis dígitos, es ese: el mensaje dice «2venta», y sumar todos los
 * dígitos metía el «2» de la marca delante del código.
 */
export function digitosDeCodigo(crudo: string): string {
  // Seis dígitos seguidos o partidos por guion, espacio o punto («482-913»). Si
  // hay varios bloques, el último: el código va al final del mensaje, y antes
  // puede haber una fecha («2026-09-23») que también suma seis (Luna).
  const bloques = [...crudo.matchAll(/(?<!\d)\d(?:[ .-]?\d){5}(?!\d)/g)];
  const ultimo = bloques.at(-1);
  if (ultimo) return ultimo[0].replace(/\D/g, "");
  return crudo.replace(/\D/g, "").slice(0, LARGO);
}

export function problemaDeCodigo(crudo: string): string | null {
  const d = digitosDeCodigo(crudo);
  if (!d) return "Escribe el código que te llegó por SMS.";
  if (d.length < LARGO) {
    const faltan = LARGO - d.length;
    return `Te ${faltan === 1 ? "falta 1 dígito" : `faltan ${faltan} dígitos`}: el código tiene ${LARGO}.`;
  }
  return null;
}

/**
 * El código de seis dígitos del SMS (corrección 8, decisión de Nicolás): una sola
 * caja grande, solo dígitos, revisada al salir como el correo y el celular (D-104).
 * No se confirma sola al llegar a seis: cada intento fallido cuenta, así que el
 * envío lo decide la persona con el botón.
 *
 * Una sola caja y no seis casillas: el autocompletado del SMS («De Mensajes:
 * 482913») y pegar funcionan sin trucos.
 */
export function CampoCodigo({
  label = "Código de seis dígitos",
  ...props
}: Omit<ComponentProps<typeof CampoValidado>, "validar" | "limpiar" | "type" | "label"> & {
  label?: string;
}) {
  return (
    <CampoValidado
      placeholder="000000"
      {...props}
      label={label}
      type="text"
      inputMode="numeric"
      autoComplete="one-time-code"
      grande
      validar={problemaDeCodigo}
      limpiar={digitosDeCodigo}
    />
  );
}
