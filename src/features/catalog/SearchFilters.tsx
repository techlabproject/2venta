import Link from "next/link";
import { CamposDeFiltro, campoClass } from "./CamposDeFiltro";
import type { Category } from "./queries";
import type { SearchFilters as Filters } from "./search";

// Los formularios mandan por GET: los filtros quedan en la dirección, la página se
// sigue renderizando en el servidor y el botón de atrás funciona como la gente
// espera. Nada de esto necesita JavaScript del cliente.

/**
 * Los filtros puestos, como campos ocultos.
 *
 * Buscar otra palabra no debe borrar los filtros que ya se eligieron, y la barra
 * de búsqueda es un formulario aparte de los filtros (corrección 3).
 */
export function FiltrosOcultos({ filters }: { filters: Filters }) {
  return (
    <>
      {filters.categories.map((c) => (
        <input key={c} type="hidden" name="categoria" value={c} />
      ))}
      {filters.minCop !== null && <input type="hidden" name="min" value={filters.minCop} />}
      {filters.maxCop !== null && <input type="hidden" name="max" value={filters.maxCop} />}
      {filters.conditions.map((c) => (
        <input key={c} type="hidden" name="estado" value={c} />
      ))}
      {filters.zone && <input type="hidden" name="zona" value={filters.zone} />}
      {filters.verifiedOnly && <input type="hidden" name="verificados" value="1" />}
      {filters.sort !== "recientes" && <input type="hidden" name="orden" value={filters.sort} />}
    </>
  );
}

export function BarraDeBusqueda({ filters }: { filters: Filters }) {
  return (
    <form action="/buscar" method="get" className="flex gap-2">
      <input
        type="search"
        name="q"
        defaultValue={filters.q}
        aria-label="Buscar"
        placeholder="Busca celulares, ropa, coches…"
        className={`${campoClass} min-w-0 flex-1 py-2.5`}
      />
      <FiltrosOcultos filters={filters} />
      <button
        type="submit"
        className="rounded-xl border border-accent-edge/50 bg-accent px-4 text-sm font-medium text-on-accent transition duration-200 ease-salida hover:brightness-[0.97] active:scale-[0.98]"
      >
        Buscar
      </button>
    </form>
  );
}

/**
 * La columna de filtros del escritorio (corrección 3).
 *
 * Antes los filtros eran un bloque plegable encima de los resultados que, abierto,
 * empujaba la grilla fuera de la pantalla. En escritorio sobra ancho: los filtros
 * se quedan a la izquierda, siempre a la vista, y la grilla a la derecha. En el
 * teléfono esta columna no se ve y los mismos campos van en el panel lateral; sin
 * JavaScript el botón del panel trae aquí (`#filtros`), y por eso la página la
 * muestra también en el teléfono cuando no hay JavaScript.
 */
export function FiltrosLaterales({
  filters,
  categories,
  zones,
}: {
  filters: Filters;
  categories: Category[];
  zones: string[];
}) {
  return (
    // Fija a la vista y con su propio desplazamiento: los campos ocupan más de lo
    // que cabe en 800 px de alto, y con el `sticky` en el formulario —que llena su
    // columna— no se quedaba en ningún sitio y «Aplicar» quedaba bajo el pliegue
    // (Luna, corrección 3). Las acciones van arriba, junto al título: abajo quedaban
    // fuera de la pantalla al cargar, porque la columna empieza a media página.
    <aside
      id="filtros"
      aria-labelledby="titulo-filtros-lateral"
      className="filtros-lateral hidden rounded-2xl bg-white shadow-xs ring-1 ring-line lg:sticky lg:top-4 lg:block lg:max-h-[calc(100dvh-2rem)] lg:overflow-y-auto"
    >
      <form action="/buscar" method="get" className="flex flex-col">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 rounded-t-2xl border-b border-line bg-white px-5 py-3">
          <h2 id="titulo-filtros-lateral" className="font-title text-base font-semibold">
            Filtros
          </h2>
          <div className="flex items-center gap-3">
            <Link
              href={filters.q ? `/buscar?q=${encodeURIComponent(filters.q)}` : "/buscar"}
              className="text-sm text-ink2 underline"
            >
              Limpiar
            </Link>
            <button
              type="submit"
              className="rounded-xl bg-brand px-4 py-2 text-sm font-medium text-cream transition duration-200 ease-salida hover:bg-brand-l active:scale-[0.98]"
            >
              Aplicar
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-5 p-5">
          {filters.q && <input type="hidden" name="q" value={filters.q} />}
          {/* La llave rehace los campos cuando cambian los filtros: «Limpiar»
              navega sin recargar y dejaba montados los valores de antes. */}
          <CamposDeFiltro
            key={JSON.stringify(filters)}
            filters={filters}
            categories={categories}
            zones={zones}
            prefijo="lateral"
          />
        </div>
      </form>
    </aside>
  );
}
