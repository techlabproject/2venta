"use client";

import { useState, useSyncExternalStore, useTransition } from "react";
import { fijarUbicacion } from "./acciones";
import { pedirUbicacion, SIN_PERMISO } from "./pedirUbicacion";
import { dentroDelArea, FUERA_DEL_AREA } from "./zonas";

const sinSuscripcion = () => () => {};

/**
 * «Usar mi ubicación» del catálogo (D-122). Solo aparece con JavaScript cargado: sin
 * él, el botón no haría nada, y la barra ya tiene la lista de zonas que sí funciona.
 */
export function UsarMiUbicacion({ volver }: { volver: string }) {
  // Con JavaScript cargado (ver `CampoPrecio`).
  const listo = useSyncExternalStore(sinSuscripcion, () => true, () => false);
  const [error, setError] = useState<string | null>(null);
  const [pendiente, empezar] = useTransition();
  if (!listo) return null;

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        disabled={pendiente}
        aria-busy={pendiente}
        onClick={() =>
          empezar(async () => {
            setError(null);
            let punto;
            try {
              punto = await pedirUbicacion();
            } catch {
              setError(SIN_PERMISO);
              return;
            }
            if (!dentroDelArea(punto.lat, punto.lng)) {
              setError(FUERA_DEL_AREA);
              return;
            }
            const form = new FormData();
            form.set("lat", String(punto.lat));
            form.set("lng", String(punto.lng));
            form.set("volver", volver);
            const res = await fijarUbicacion(form);
            if (res?.error) setError(res.error);
          })
        }
        className="inline-flex items-center gap-1.5 self-start rounded-xl border border-line bg-white px-3 py-2 text-sm font-medium text-brand transition duration-200 ease-salida hover:border-brand/30 hover:bg-ph disabled:opacity-60"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
        </svg>
        {pendiente ? "Buscando…" : "Usar mi ubicación"}
      </button>
      {error && (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
