import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { SaveSearchForm } from "@/features/alerts/Forms";
import { currentUser } from "@/lib/session";
import { ListingCard } from "@/features/catalog/ListingCard";
import { SearchFilters } from "@/features/catalog/SearchFilters";
import { listCategories } from "@/features/catalog/queries";
import { listZones, parseFilters, searchListings } from "@/features/catalog/search";

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

  const filters = parseFilters(params);
  const user = await currentUser();
  const [listings, categories, zones] = await Promise.all([
    searchListings(filters),
    listCategories(),
    listZones(),
  ]);

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-3xl px-5 py-6">
        <Link href="/" className="text-sm text-ink2 underline">
          Volver
        </Link>

        <h1 className="mt-4 mb-5 font-title text-xl font-semibold">
          {filters.q ? `Resultados para “${filters.q}”` : "Buscar"}
        </h1>

        <SearchFilters filters={filters} categories={categories} zones={zones.map((z) => z.zone)} />

        {user && <SaveSearchForm params={params.toString()} />}

        <p data-testid="conteo" className="mt-6 text-sm text-muted">
          {listings.length === 1 ? "1 resultado" : `${listings.length} resultados`}
        </p>

        {listings.length === 0 ? (
          // Una lista vacía y muda deja al comprador sin saber qué hacer.
          <div className="mt-4 rounded-2xl bg-white p-6 text-sm">
            <p className="font-medium">No encontramos nada con eso.</p>
            <p className="mt-1 text-ink2">
              Prueba con menos filtros o con otra palabra. También puedes{" "}
              <Link href="/buscar" className="text-brand underline">
                ver todo lo publicado
              </Link>
              .
            </p>
          </div>
        ) : (
          <ul className="mt-4 grid grid-cols-2 gap-3">
            {listings.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
