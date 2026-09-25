import { AppHeader } from "@/components/AppHeader";
import { SaveSearchForm } from "@/features/alerts/Forms";
import { currentUser } from "@/lib/session";
import { ListingCard } from "@/features/catalog/ListingCard";
import {
  BarraDeBusqueda,
  FiltrosLaterales,
} from "@/features/catalog/SearchFilters";
import { ZONAS } from "@/features/ubicacion/zonas";
import { puntoDelComprador } from "@/features/ubicacion/comprador";
import { BarraDeUbicacion } from "@/features/ubicacion/BarraDeUbicacion";
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
  parseFilters,
  searchListings,
  sinDistanciaSinPunto,
} from "@/features/catalog/search";
import { Volver } from "@/components/Volver";
import { VerMas } from "@/components/VerMas";
import { hrefDePagina, leerPagina, sinCamposVacios } from "@/features/catalog/paginas";
import { redirect } from "next/navigation";

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

  // Sin `min=&max=&zona=` en la dirección: un formulario GET manda todo (Luna).
  const limpios = sinCamposVacios(params);
  if (limpios.toString() !== params.toString()) {
    redirect(limpios.size ? `/buscar?${limpios}` : "/buscar");
  }

  const [user, categories] = await Promise.all([currentUser(), listCategories()]);
  // D-122: dónde está quien mira, de su cookie. Sin punto, el radio y «Más cerca»
  // no aplican.
  const punto = await puntoDelComprador();
  const filters = sinDistanciaSinPunto(conCategoriasConocidas(parseFilters(params), categories), punto);
  // Correcciones 33 y 34: 24 por página y «Ver más»; la página no viaja con los
  // filtros (cambiarlos o guardar la búsqueda vuelve a la primera).
  const pagina = leerPagina(params.get("pagina"));
  params.delete("pagina");
  const [listings, total] = await Promise.all([
    searchListings(filters, pagina, punto),
    countListings(filters, punto),
  ]);
  const nombresDeZona = ZONAS.map((z) => z.nombre);

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
            conPunto={Boolean(punto)}
          />

          <div>
            {/* Sin resultados el aviso va dentro del mensaje vacío, como salida. */}
            {/* Corrección 48: la cuenta del equipo no pide avisos (Luna). */}
            {user && user.role !== "admin" && listings.length > 0 && (
              <SaveSearchForm params={params.toString()} />
            )}

            <BarraDeUbicacion punto={punto} volver={params.size ? `/buscar?${params}` : "/buscar"} />

            <div className="mt-2 flex items-center justify-between gap-3">
              <div>
                <p data-testid="conteo" className="text-sm text-muted">
                  {total === 1 ? "1 resultado" : `${total} resultados`}
                </p>
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
                    conPunto={Boolean(punto)}
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
                equipo={user?.role === "admin"}
                sugerencia={describirFiltros(filters, categories)}
              />
            ) : (
              <>
                <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:gap-4">
                  {listings.map((l) => (
                    <ListingCard key={l.id} listing={l} />
                  ))}
                </ul>
                <VerMas
                  mostrados={listings.length}
                  total={total}
                  href={hrefDePagina("/buscar", params, pagina + 1)}
                />
              </>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
