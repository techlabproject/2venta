import { fijarZona, quitarUbicacion } from "./acciones";
import type { PuntoDelComprador } from "./comprador";
import { UsarMiUbicacion } from "./UsarMiUbicacion";
import { ZONAS } from "./zonas";

/**
 * «¿Dónde estás?» sobre los resultados (D-122). Sin ubicación, la pide; con ella, dice
 * desde dónde se miden las distancias y deja cambiarla o quitarla.
 *
 * Todo es HTML del servidor: la lista de zonas y «Listo» funcionan sin JavaScript
 * (D-25). «Usar mi ubicación» aparece cuando el JavaScript ya cargó.
 */
export function BarraDeUbicacion({
  punto,
  volver,
}: {
  punto: PuntoDelComprador | null;
  volver: string;
}) {
  const formulario = (
    <div className="flex flex-wrap items-end gap-3">
      <UsarMiUbicacion volver={volver} />
      <form action={fijarZona} className="flex items-end gap-2">
        <input type="hidden" name="volver" value={volver} />
        <div className="flex flex-col gap-1">
          <label htmlFor="ubicacion-zona" className="text-xs text-muted">
            O elige tu zona
          </label>
          <select
            id="ubicacion-zona"
            name="zona"
            required
            defaultValue={punto && punto.origen !== "dispositivo" ? punto.origen : ""}
            className="rounded-xl border border-line bg-white px-3 py-2 text-sm outline-none transition duration-200 ease-salida hover:border-brand/30 focus:border-brand focus:ring-3 focus:ring-brand/15"
          >
            <option value="" disabled>
              Tu zona
            </option>
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
        </div>
        <button
          type="submit"
          className="rounded-xl border border-line bg-white px-3 py-2 text-sm font-medium text-ink transition duration-200 ease-salida hover:border-brand/30 hover:bg-ph"
        >
          Listo
        </button>
      </form>
    </div>
  );

  if (!punto) {
    return (
      <section
        aria-label="Tu ubicación"
        data-testid="barra-ubicacion"
        className="mt-4 rounded-2xl bg-white p-4 shadow-xs ring-1 ring-line"
      >
        <p className="text-sm font-medium">¿Dónde estás?</p>
        <p className="mt-0.5 mb-3 text-sm text-muted">
          Te decimos a cuántos kilómetros está cada artículo. Solo lo guardamos en este
          navegador, aproximado a 1 km.
        </p>
        {formulario}
      </section>
    );
  }

  return (
    <section
      aria-label="Tu ubicación"
      data-testid="barra-ubicacion"
      className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm"
    >
      <p className="text-ink2">
        Distancias desde{" "}
        <span className="font-medium text-ink">
          {punto.origen === "dispositivo" ? "tu ubicación" : punto.origen}
        </span>
      </p>
      <details className="group">
        <summary className="cursor-pointer text-brand underline">Cambiar</summary>
        <div className="mt-3 rounded-2xl bg-white p-4 shadow-xs ring-1 ring-line">
          {formulario}
        </div>
      </details>
      <form action={quitarUbicacion}>
        <input type="hidden" name="volver" value={volver} />
        <button type="submit" className="text-muted underline">
          Quitar
        </button>
      </form>
    </section>
  );
}
