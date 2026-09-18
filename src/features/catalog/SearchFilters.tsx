import Link from "next/link";
import { CONDITION_LABEL } from "./labels";
import type { Category } from "./queries";
import type { SearchFilters as Filters } from "./search";

// El formulario manda por GET: los filtros quedan en la dirección, la página se
// sigue renderizando en el servidor y el botón de atrás funciona como la gente
// espera. Nada de esto necesita JavaScript del cliente.
export function SearchFilters({
  filters,
  categories,
  zones,
}: {
  filters: Filters;
  categories: Category[];
  zones: string[];
}) {
  const input =
    "rounded-xl border border-line bg-white px-3 py-2 text-sm outline-none transition duration-200 ease-salida hover:border-brand/30 focus:border-brand focus:ring-3 focus:ring-brand/15";

  return (
    <form action="/buscar" method="get" className="flex flex-col gap-4">
      <div className="flex gap-2">
        <input
          type="search"
          name="q"
          defaultValue={filters.q}
          aria-label="Buscar"
          placeholder="Busca celulares, ropa, coches…"
          className={`${input} flex-1`}
        />
        <button
          type="submit"
          className="rounded-xl bg-accent px-4 text-sm font-medium text-on-accent"
        >
          Buscar
        </button>
      </div>

      <details
        className="rounded-xl bg-white p-4"
        open={hasActiveFilters(filters)}
      >
        <summary className="cursor-pointer text-sm font-medium">
          Filtros
        </summary>

        <div className="mt-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="categoria" className="text-sm font-medium">
              Categoría
            </label>
            <select
              id="categoria"
              name="categoria"
              defaultValue={filters.category ?? ""}
              className={input}
            >
              <option value="">Todas</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <fieldset>
            <legend className="mb-1.5 text-sm font-medium">Precio</legend>
            <div className="flex items-center gap-2">
              <input
                type="text"
                inputMode="numeric"
                name="min"
                aria-label="Precio mínimo"
                defaultValue={filters.minCop ?? ""}
                placeholder="Desde"
                className={`${input} w-full`}
              />
              <span className="text-muted">—</span>
              <input
                type="text"
                inputMode="numeric"
                name="max"
                aria-label="Precio máximo"
                defaultValue={filters.maxCop ?? ""}
                placeholder="Hasta"
                className={`${input} w-full`}
              />
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-1.5 text-sm font-medium">
              Estado del artículo
            </legend>
            <div className="flex flex-col gap-1.5">
              {Object.entries(CONDITION_LABEL).map(([value, label]) => (
                <label key={value} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="estado"
                    value={value}
                    defaultChecked={filters.conditions.includes(value as never)}
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="zona" className="text-sm font-medium">
              Zona
            </label>
            {/* El mockup filtra por distancia en kilómetros. No hay coordenadas de
                nada todavía, así que se filtra por zona y la distancia entra
                cuando exista el dato. */}
            <select
              id="zona"
              name="zona"
              defaultValue={filters.zone ?? ""}
              className={input}
            >
              <option value="">Toda Bogotá</option>
              {zones.map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="verificados"
              value="1"
              defaultChecked={filters.verifiedOnly}
            />
            Solo vendedores con identidad verificada
          </label>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="orden" className="text-sm font-medium">
              Ordenar por
            </label>
            <select
              id="orden"
              name="orden"
              defaultValue={filters.sort}
              className={input}
            >
              <option value="recientes">Más recientes</option>
              <option value="precio_asc">Menor precio</option>
              <option value="precio_desc">Mayor precio</option>
            </select>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="submit"
              className="rounded-xl bg-brand px-4 py-2 text-sm font-medium text-cream"
            >
              Aplicar
            </button>
            <Link href="/buscar" className="text-sm text-ink2 underline">
              Limpiar
            </Link>
          </div>
        </div>
      </details>
    </form>
  );
}

function hasActiveFilters(f: Filters): boolean {
  return Boolean(
    f.category ||
    f.minCop ||
    f.maxCop ||
    f.conditions.length ||
    f.zone ||
    f.verifiedOnly,
  );
}
