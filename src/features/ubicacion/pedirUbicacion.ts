import { aCuadricula } from "./zonas";

/**
 * Pide la ubicación al navegador y la devuelve ya en la cuadrícula de ~1 km: el punto
 * exacto no sale del celular (D-122). Sin nada del servidor: la usan componentes de
 * cliente.
 */
export function pedirUbicacion(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("sin-geolocalizacion"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: aCuadricula(p.coords.latitude), lng: aCuadricula(p.coords.longitude) }),
      (err) => reject(err),
      { enableHighAccuracy: false, timeout: 15_000, maximumAge: 5 * 60_000 },
    );
  });
}

export const SIN_PERMISO =
  "No pudimos usar tu ubicación. Revisa el permiso del navegador o elige tu zona de la lista.";
