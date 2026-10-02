/**
 * El periodo de los reportes, en días de Bogotá (fila 54, D-129). Sin dependencias
 * del servidor para poder probarlo solo.
 *
 * `desde` y `hasta` son días («2026-09-15»), los dos incluidos. `from` es el comienzo
 * de `desde` y `to` el comienzo del día siguiente a `hasta`, para consultar con
 * `created_at >= from and created_at < to`.
 */
export type Period = { from: Date; to: Date; desde: string; hasta: string };

const DIA = /^\d{4}-\d{2}-\d{2}$/;
const UN_DIA = 86_400_000;

/** El día de Bogotá de un instante, como «AAAA-MM-DD». */
export function diaDeBogota(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(d);
}

const inicio = (dia: string) => new Date(`${dia}T00:00:00-05:00`);

function valido(raw: string | null): string | null {
  if (!raw || !DIA.test(raw)) return null;
  return Number.isNaN(inicio(raw).getTime()) ? null : raw;
}

export function parsePeriod(params: URLSearchParams, ahora = new Date()): Period {
  let hasta = valido(params.get("hasta")) ?? diaDeBogota(ahora);
  let desde = valido(params.get("desde")) ?? diaDeBogota(new Date(inicio(hasta).getTime() - 30 * UN_DIA));
  // Fechas al revés se ordenan solas en vez de devolver un periodo vacío.
  if (desde > hasta) [desde, hasta] = [hasta, desde];
  return { from: inicio(desde), to: new Date(inicio(hasta).getTime() + UN_DIA), desde, hasta };
}
