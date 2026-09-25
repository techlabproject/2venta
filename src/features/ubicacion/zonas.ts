/**
 * Zonas y ubicación aproximada (correcciones 43 a 45 y 51, D-122).
 *
 * Sin nada del servidor: lo importan también componentes de cliente (el botón «Usar
 * mi ubicación» sugiere la zona más cercana en el navegador).
 *
 * La versión 1 es Bogotá (D-06), pero «Bogotá» incluye los municipios vecinos donde
 * vive mucha gente que trabaja en la ciudad. Sumapaz no está: es rural (corrección 51,
 * «nada rural»).
 *
 * IMPORTANT: los centros son aproximados (el punto medio de la parte urbana de cada
 * localidad o municipio). Sirven para sugerir la zona y para medir distancias cuando
 * alguien no da permiso de ubicación; no son límites oficiales.
 */

export type Zona = { nombre: string; lat: number; lng: number; grupo: "bogota" | "vecino" };

export const ZONAS: readonly Zona[] = [
  { nombre: "Usaquén", lat: 4.711, lng: -74.03, grupo: "bogota" },
  { nombre: "Chapinero", lat: 4.648, lng: -74.061, grupo: "bogota" },
  { nombre: "Santa Fe", lat: 4.606, lng: -74.068, grupo: "bogota" },
  { nombre: "San Cristóbal", lat: 4.566, lng: -74.087, grupo: "bogota" },
  { nombre: "Usme", lat: 4.52, lng: -74.117, grupo: "bogota" },
  { nombre: "Tunjuelito", lat: 4.576, lng: -74.134, grupo: "bogota" },
  { nombre: "Bosa", lat: 4.617, lng: -74.19, grupo: "bogota" },
  { nombre: "Kennedy", lat: 4.63, lng: -74.155, grupo: "bogota" },
  { nombre: "Fontibón", lat: 4.678, lng: -74.145, grupo: "bogota" },
  { nombre: "Engativá", lat: 4.706, lng: -74.111, grupo: "bogota" },
  { nombre: "Suba", lat: 4.741, lng: -74.084, grupo: "bogota" },
  { nombre: "Barrios Unidos", lat: 4.668, lng: -74.075, grupo: "bogota" },
  { nombre: "Teusaquillo", lat: 4.638, lng: -74.087, grupo: "bogota" },
  { nombre: "Los Mártires", lat: 4.607, lng: -74.09, grupo: "bogota" },
  { nombre: "Antonio Nariño", lat: 4.589, lng: -74.1, grupo: "bogota" },
  { nombre: "Puente Aranda", lat: 4.616, lng: -74.115, grupo: "bogota" },
  { nombre: "La Candelaria", lat: 4.597, lng: -74.072, grupo: "bogota" },
  { nombre: "Rafael Uribe Uribe", lat: 4.57, lng: -74.115, grupo: "bogota" },
  { nombre: "Ciudad Bolívar", lat: 4.56, lng: -74.155, grupo: "bogota" },
  { nombre: "Soacha", lat: 4.579, lng: -74.217, grupo: "vecino" },
  { nombre: "Chía", lat: 4.863, lng: -74.059, grupo: "vecino" },
  { nombre: "Cajicá", lat: 4.918, lng: -74.028, grupo: "vecino" },
  { nombre: "Cota", lat: 4.809, lng: -74.103, grupo: "vecino" },
  { nombre: "Funza", lat: 4.716, lng: -74.211, grupo: "vecino" },
  { nombre: "Mosquera", lat: 4.706, lng: -74.23, grupo: "vecino" },
  { nombre: "Madrid", lat: 4.733, lng: -74.264, grupo: "vecino" },
  { nombre: "La Calera", lat: 4.721, lng: -73.969, grupo: "vecino" },
];

/**
 * El área donde funciona 2venta: un rectángulo que cubre Bogotá urbana y los
 * municipios vecinos. Un punto fuera se rechaza con un mensaje; no se «acerca».
 */
export const AREA = { latMin: 4.45, latMax: 4.97, lngMin: -74.32, lngMax: -73.92 } as const;

export function dentroDelArea(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= AREA.latMin &&
    lat <= AREA.latMax &&
    lng >= AREA.lngMin &&
    lng <= AREA.lngMax
  );
}

/**
 * Lleva un punto a la cuadrícula de 0,01° (unos 1,1 km en Bogotá). Es lo único que
 * se guarda: con la distancia exacta, alguien podría moverse, comparar distancias y
 * dar con la casa del vendedor. Con la cuadrícula, lo más que averigua es el cuadro.
 */
export function aCuadricula(n: number): number {
  return Math.round(n * 100) / 100;
}

const normalizar = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

/** La zona de la lista que corresponde a lo escrito («usaquen » → Usaquén), o null. */
export function zonaReconocida(texto: string | null | undefined): Zona | null {
  if (!texto) return null;
  const buscado = normalizar(texto);
  return ZONAS.find((z) => normalizar(z.nombre) === buscado) ?? null;
}

/** Distancia en km sobre la Tierra (fórmula del semiverseno). */
export function distanciaKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const rad = (g: number) => (g * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

/** La zona cuyo centro queda más cerca: la que se le sugiere a quien usa su ubicación. */
export function zonaMasCercana(lat: number, lng: number): Zona {
  let mejor = ZONAS[0];
  let menor = Infinity;
  for (const z of ZONAS) {
    const d = distanciaKm({ lat, lng }, z);
    if (d < menor) {
      menor = d;
      mejor = z;
    }
  }
  return mejor;
}

/** «a menos de 1 km», «a unos 3 km». Redondeada a propósito (ver `aCuadricula`). */
export function textoDeDistancia(km: number): string {
  if (km < 1) return "a menos de 1 km";
  return `a unos ${Math.round(km)} km`;
}

/** Los radios del filtro, en km. */
export const RADIOS = [2, 5, 10, 20] as const;
export type Radio = (typeof RADIOS)[number];

export const FUERA_DEL_AREA =
  "Por ahora 2venta funciona en Bogotá y sus municipios vecinos. Elige una zona de la lista.";
