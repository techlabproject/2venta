import { AppHeader } from "@/components/AppHeader";
import { SaveSearchForm } from "@/features/alerts/Forms";
import { currentUser } from "@/lib/session";
import { ListingCard } from "@/features/catalog/ListingCard";
import {
  BarraDeBusqueda,
  FiltrosLaterales,
} from "@/features/catalog/SearchFilters";
import { CamposDeFiltro } from "@/features/catalog/CamposDeFiltro";
import { PanelDeFiltros } from "@/features/catalog/PanelDeFiltros";
import { SinResultados } from "@/features/catalog/SinResultados";
import { listCategories } from "@/features/catalog/queries";
import {
  conCategoriasConocidas,
  countListings,
  cuantosFiltros,
  describirFiltros,
  hayFiltros,
  listZones,
  parseFilters,
  searchListings,
} from "@/features/catalog/search";
import { Volver } from "@/components/Volver";

// Pantalla 1e del mockup. Renderizada en servidor: los filtros viven en la
// dirección, así que un resultado se puede compartir por chat y el buscador la
// puede indexar (D-25).
export const dynamic = "force-dynamic";

export default async function Buscar({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) {
    for (const v of Array.isArray(value) ? value : value ? [value] : []) {
      params.append(key, v);
    }
  }

  const [user, categories, zones] = await Promise.all([
    currentUser(),
    listCategories(),
    listZones(),
  ]);
  const filters = conCategoriasConocidas(parseFilters(params), categories);
  const [listings, total] = await Promise.all([
    searchListings(filters),
    countListings(filters),
  ]);
  const nombresDeZona = zones.map((z) => z.zone);

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-6xl px-5 py-6">
        <Volver href="/" />

        {/* `anywhere`: una palabra de 120 letras sin espacios empujaba la página
            a lo ancho (Luna, corrección 5). */}
        <h1 className="mt-4 mb-5 font-title text-xl font-semibold [overflow-wrap:anywhere]">
          {filters.q ? `Resultados para “${filters.q}”` : "Buscar"}
        </h1>

        <BarraDeBusqueda filters={filters} />

        {/* Corrección 3: los resultados primero. En el teléfono los filtros van
            en el panel lateral; en escritorio, en una columna fija a la izquierda.
            Antes eran un bloque plegable que, abierto, ocupaba toda la pantalla
            antes del primer producto. */}
        <div className="mt-6 lg:grid lg:grid-cols-[17rem_minmax(0,1fr)] lg:items-start lg:gap-8">
          {/* Sin JavaScript el panel no abre y su botón trae a esta columna, que
              entonces se muestra también en el teléfono (D-25). */}
          <noscript>
            <style>{`.filtros-lateral{display:block;margin-bottom:1.5rem}`}</style>
          </noscript>
          <FiltrosLaterales
            filters={filters}
            categories={categories}
            zones={nombresDeZona}
          />

          <div>
            {/* Sin resultados el aviso va dentro del mensaje vacío, como salida. */}
            {user && listings.length > 0 && <SaveSearchForm params={params.toString()} />}

            <div className="mt-2 flex items-center justify-between gap-3">
              <div>
                <p data-testid="conteo" className="text-sm text-muted">
                  {total === 1 ? "1 resultado" : `${total} resultados`}
                </p>
                {/* Hasta que haya paginación (corrección 33) se traen 60. */}
                {total > listings.length && (
                  <p className="text-xs text-muted">
                    Se muestran los {listings.length} primeros.
                  </p>
                )}
              </div>
              <div className="lg:hidden">
                <PanelDeFiltros
                  accion="/buscar"
                  respaldo="#filtros"
                  activos={cuantosFiltros(filters)}
                  total={total}
                  limpiar={filters.q ? `/buscar?q=${encodeURIComponent(filters.q)}` : "/buscar"}
                  tono="claro"
                >
                  {filters.q && <input type="hidden" name="q" value={filters.q} />}
                  <CamposDeFiltro
                    key={params.toString()}
                    filters={filters}
                    categories={categories}
                    zones={nombresDeZona}
                    prefijo="panel"
                  />
                </PanelDeFiltros>
              </div>
            </div>

            {listings.length === 0 ? (
              <SinResultados
                q={filters.q}
                conFiltros={hayFiltros({ ...filters, q: "" })}
                quitarFiltros={filters.q ? `/buscar?q=${encodeURIComponent(filters.q)}` : "/buscar"}
                verTodo="/buscar"
                params={params.toString()}
                aquí={`/buscar?${params}`}
                conSesion={Boolean(user)}
                sugerencia={describirFiltros(filters, categories)}
              />
            ) : (
              <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:gap-4">
                {listings.map((l) => (
                  <ListingCard key={l.id} listing={l} />
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
