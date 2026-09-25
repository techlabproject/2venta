"use client";

import { useState, useSyncExternalStore } from "react";
import { pedirUbicacion, SIN_PERMISO } from "./pedirUbicacion";
import { dentroDelArea, FUERA_DEL_AREA, ZONAS, zonaMasCercana } from "./zonas";

const sinSuscripcion = () => () => {};

/**
 * La zona del perfil (D-122): de la lista cerrada y, si se quiere, con el punto del
 * celular para que la distancia sea más precisa que el centro de la zona. El punto
 * viaja ya redondeado a ~1 km en campos ocultos; la zona es lo que ven los demás.
 *
 * Cambiar la zona a mano descarta el punto del celular: si la zona sugerida no era,
 * probablemente el punto tampoco.
 */
export function CampoDeZona({
  zona,
  conPunto,
}: {
  zona: string | null;
  /** Si ya hay un punto del celular guardado. */
  conPunto: boolean;
}) {
  const [valor, setValor] = useState(zona ?? "");
  const [punto, setPunto] = useState<{ lat: number; lng: number } | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [buscando, setBuscando] = useState(false);
  // Con JavaScript cargado; sin él, el botón no haría nada (ver `CampoPrecio`).
  const conJs = useSyncExternalStore(sinSuscripcion, () => true, () => false);

  async function usarUbicacion() {
    setBuscando(true);
    setError(null);
    setAviso(null);
    try {
      const p = await pedirUbicacion();
      if (!dentroDelArea(p.lat, p.lng)) {
        setError(FUERA_DEL_AREA);
        return;
      }
      const cerca = zonaMasCercana(p.lat, p.lng);
      setPunto(p);
      setValor(cerca.nombre);
      setAviso(`Listo: tomamos un punto aproximado a 1 km, cerca de ${cerca.nombre}. Revisa la zona y guarda.`);
    } catch {
      setError(SIN_PERMISO);
    } finally {
      setBuscando(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor="zone" className="text-sm font-medium">
        Zona
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <select
          id="zone"
          name="zone"
          value={valor}
          onChange={(e) => {
            setValor(e.target.value);
            setPunto(null);
            setAviso(null);
          }}
          className="min-w-0 flex-1 rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none transition duration-200 ease-salida hover:border-brand/30 focus:border-brand focus:ring-3 focus:ring-brand/15"
        >
          <option value="">Elige tu zona</option>
          <optgroup label="Bogotá">
            {ZONAS.filter((z) => z.grupo === "bogota").map((z) => (
              <option key={z.nombre} value={z.nombre}>
                {z.nombre}
              </option>
            ))}
          </optgroup>
          <optgroup label="Municipios vecinos">
            {ZONAS.filter((z) => z.grupo === "vecino").map((z) => (
              <option key={z.nombre} value={z.nombre}>
                {z.nombre}
              </option>
            ))}
          </optgroup>
        </select>
        {conJs && (
          <button
            type="button"
            onClick={usarUbicacion}
            disabled={buscando}
            aria-busy={buscando}
            className="rounded-xl border border-line bg-white px-3 py-3 text-sm font-medium text-brand transition duration-200 ease-salida hover:border-brand/30 hover:bg-ph disabled:opacity-60"
          >
            {buscando ? "Buscando…" : "Usar mi ubicación"}
          </button>
        )}
      </div>
      {punto && (
        <>
          <input type="hidden" name="lat" value={punto.lat} />
          <input type="hidden" name="lng" value={punto.lng} />
        </>
      )}
      {aviso && (
        <p role="status" className="text-xs text-brand">
          {aviso}
        </p>
      )}
      {error && (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
      <p className="text-xs text-muted">
        Los compradores ven tu zona y a cuántos kilómetros estás, nunca tu dirección.
        {conPunto && !punto && " Tienes guardado un punto de tu celular, aproximado a 1 km."}
      </p>
    </div>
  );
}
