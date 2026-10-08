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

  // D-132: sin ubicación es una sola línea que se abre al tocarla. Abierta ocupaba
  // media pantalla del celular encima de los resultados, en todas las búsquedas, y
  // empujaba los artículos fuera de la primera vista.
  if (!punto) {
    return (
      <section
        aria-label="Tu ubicación"
        data-testid="barra-ubicacion"
        className="mt-4 rounded-2xl bg-white px-4 py-3 text-sm shadow-xs ring-1 ring-line"
      >
        {/* Llaves distintas en los dos estados: si no, React reutiliza el mismo
            <details> y, al elegir la zona, quedaba abierto en la barra nueva. */}
        <details key="sin-ubicacion" className="group">
          <summary className="flex cursor-pointer list-none items-center gap-3 [&::-webkit-details-marker]:hidden">
            <Pin />
            <span className="min-w-0 flex-1">
              <span className="font-medium text-ink">¿Dónde estás?</span>{" "}
              <span className="text-muted">Te mostramos a cuántos km está cada artículo.</span>
            </span>
            <span className="shrink-0 font-medium text-brand underline group-open:hidden">Elegir</span>
            <span className="hidden shrink-0 text-brand underline group-open:inline">Cerrar</span>
          </summary>
          <div className="mt-3 border-t border-line pt-3">
            <p className="mb-3 text-xs text-muted">
              Solo lo guardamos en este navegador, aproximado a 1 km.
            </p>
            {formulario}
          </div>
        </details>
      </section>
    );
  }

  // Con ubicación: una sola tarjeta, como la de arriba. «Cambiar» abre el formulario
  // debajo, dentro de la misma tarjeta y alineado a su borde; antes salía como otra
  // tarjeta blanca suelta al lado del texto (Catalina, fila 60, D-129).
  return (
    <section
      aria-label="Tu ubicación"
      data-testid="barra-ubicacion"
      className="mt-4 flex items-start gap-3 rounded-2xl bg-white px-4 py-3 text-sm shadow-xs ring-1 ring-line"
    >
      <details key="con-ubicacion" className="group min-w-0 flex-1">
        <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-3 gap-y-1 [&::-webkit-details-marker]:hidden">
          <Pin />
          <span className="text-ink2">
            Distancias desde{" "}
            <span className="font-medium text-ink">
              {punto.origen === "dispositivo" ? "tu ubicación" : punto.origen}
            </span>
          </span>
          <span className="text-brand underline group-open:hidden">Cambiar</span>
          <span className="hidden text-brand underline group-open:inline">Cerrar</span>
        </summary>
        <div className="mt-3 border-t border-line pt-3">{formulario}</div>
      </details>
      <form action={quitarUbicacion} className="shrink-0">
        <input type="hidden" name="volver" value={volver} />
        <button type="submit" className="text-muted underline">
          Quitar
        </button>
      </form>
    </section>
  );
}

function Pin() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4 shrink-0 text-brand" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21s-7-6.2-7-11a7 7 0 1 1 14 0c0 4.8-7 11-7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}
