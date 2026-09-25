import { cookies } from "next/headers";
import { aCuadricula, dentroDelArea, zonaReconocida } from "./zonas";
import type { Punto } from "./punto";

/**
 * Dónde está quien mira el catálogo (D-122), para decirle a cuántos km está cada
 * artículo y filtrar por radio.
 *
 * IMPORTANT: vive solo en una cookie de su navegador, ya en la cuadrícula de ~1 km:
 * nunca en la base ni en la dirección (una dirección se comparte, queda en
 * historiales y en registros de servidor). Solo el servidor la lee (`httpOnly`).
 */
export const COOKIE_UBICACION = "ubicacion";

export type PuntoDelComprador = Punto & {
  /** «dispositivo» si la dio el celular; si no, el nombre de la zona elegida. */
  origen: string;
};

/** Lee y valida la cookie. Cualquier cosa rara se ignora: sin punto, sin distancias. */
export function leerPunto(valor: string | undefined): PuntoDelComprador | null {
  if (!valor) return null;
  const [latTexto, lngTexto, ...resto] = valor.split("|");
  const lat = Number(latTexto);
  const lng = Number(lngTexto);
  if (!latTexto || !lngTexto || !dentroDelArea(lat, lng)) return null;
  const origenCrudo = resto.join("|");
  const origen =
    origenCrudo === "dispositivo" ? "dispositivo" : zonaReconocida(origenCrudo)?.nombre;
  if (!origen) return null;
  return { lat: aCuadricula(lat), lng: aCuadricula(lng), origen };
}

export function escribirPunto(p: PuntoDelComprador): string {
  return `${aCuadricula(p.lat)}|${aCuadricula(p.lng)}|${p.origen}`;
}

export async function puntoDelComprador(): Promise<PuntoDelComprador | null> {
  return leerPunto((await cookies()).get(COOKIE_UBICACION)?.value);
}
