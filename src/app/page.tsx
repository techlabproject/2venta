import { listListings } from "@/features/catalog/queries";
import { ListingCard } from "@/features/catalog/ListingCard";
import { AppHeader } from "@/components/AppHeader";

// Renderizado en servidor y sin caché: la lista y la ficha tienen que existir
// como HTML para que un buscador las indexe (D-25).
export const dynamic = "force-dynamic";

export default async function Home() {
  const listings = await listListings();

  return (
    <>
      <AppHeader zone="Bogotá" />
      <main className="mx-auto max-w-3xl px-5 py-6">
        <h1 className="font-title text-xl font-semibold">Cerca de ti</h1>
        <p className="mt-1 text-sm text-muted">
          Segunda mano, primera confianza. El pago queda guardado hasta que recibas.
        </p>

        <ul className="mt-5 grid grid-cols-2 gap-3">
          {listings.map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </ul>
      </main>
    </>
  );
}
