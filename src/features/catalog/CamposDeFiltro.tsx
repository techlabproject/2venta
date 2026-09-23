import { CONDITION_LABEL } from "./labels";
import { CampoPrecio } from "./CampoPrecio";
import type { Category } from "./queries";
import type { SearchFilters as Filters } from "./search";

export const campoClass =
  "rounded-xl border border-line bg-white px-3 py-2 text-sm outline-none transition duration-200 ease-salida hover:border-brand/30 focus:border-brand focus:ring-3 focus:ring-brand/15";

/**
 * Los filtros personalizados, sin el formulario que los envuelve.
 *
 * Los usan el panel lateral de la portada y la pantalla de búsqueda: dos sitios
 * con los mismos campos, y si cada uno tuviera los suyos, tarde o temprano uno
 * filtraría por algo que el otro no conoce. Sin estado ni efectos: se dibuja en el
 * servidor y funciona sin JavaScript.
 *
 * `prefijo` separa los `id` cuando hay dos copias en la misma página.
 */
export function CamposDeFiltro({
  filters,
  categories,
  zones,
  prefijo = "f",
}: {
  filters: Filters;
  categories: Category[];
  zones: string[];
  prefijo?: string;
}) {
  return (
    <>
      <fieldset>
        {/* Casillas y no una lista desplegable: las categorías se suman
            (corrección 2, decisión de Nicolás). */}
        <legend className="mb-1.5 text-sm font-medium">Categoría</legend>
        <div className="flex flex-col gap-1.5">
          {categories.map((c) => (
            <label key={c.slug} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="size-4 accent-brand"
                name="categoria"
                value={c.slug}
                defaultChecked={filters.categories.includes(c.slug)}
              />
              {c.label}
            </label>
          ))}
        </div>
      </fieldset>

      <CampoPrecio
        minCop={filters.minCop}
        maxCop={filters.maxCop}
        prefijo={prefijo}
      />

      <fieldset>
        <legend className="mb-1.5 text-sm font-medium">Estado del artículo</legend>
        <div className="flex flex-col gap-1.5">
          {Object.entries(CONDITION_LABEL).map(([value, label]) => (
            <label key={value} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="size-4 accent-brand"
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
        <label htmlFor={`${prefijo}-zona`} className="text-sm font-medium">
          Zona
        </label>
        {/* El mockup filtra por distancia en kilómetros. No hay coordenadas de
            nada todavía, así que se filtra por zona y la distancia entra
            cuando exista el dato. */}
        <select
          id={`${prefijo}-zona`}
          name="zona"
          defaultValue={filters.zone ?? ""}
          className={campoClass}
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
          className="size-4 accent-brand"
          name="verificados"
          value="1"
          defaultChecked={filters.verifiedOnly}
        />
        Solo vendedores con identidad verificada
      </label>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${prefijo}-orden`} className="text-sm font-medium">
          Ordenar por
        </label>
        <select
          id={`${prefijo}-orden`}
          name="orden"
          defaultValue={filters.sort}
          className={campoClass}
        >
          <option value="recientes">Más recientes</option>
          <option value="precio_asc">Menor precio</option>
          <option value="precio_desc">Mayor precio</option>
        </select>
      </div>
    </>
  );
}
