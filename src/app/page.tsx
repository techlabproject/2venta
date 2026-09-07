import Link from "next/link";
import { listCategories, listListings } from "@/features/catalog/queries";
import { ListingCard } from "@/features/catalog/ListingCard";
import { AppHeader } from "@/components/AppHeader";

// Pantalla 1d del mockup. Renderizado en servidor y sin caché: la lista y la ficha
// tienen que existir como HTML para que un buscador las indexe (D-25).
export const dynamic = "force-dynamic";

export default async function Home() {
  const [listings, categories] = await Promise.all([listListings(), listCategories()]);

  return (
    <>
      <AppHeader zone="Bogotá" />
      <main className="mx-auto max-w-3xl px-5 py-6">
        <form action="/buscar" method="get" className="flex gap-2">
          <input
            type="search"
            name="q"
            aria-label="Buscar"
            placeholder="Busca celulares, ropa, coches…"
            className="flex-1 rounded-xl border border-brand/20 bg-white px-4 py-3 text-sm outline-none focus:border-brand"
          />
          <button type="submit" className="rounded-xl bg-accent px-4 text-sm font-medium text-on-accent">
            Buscar
          </button>
        </form>

        {/* Atajos del mockup. Son enlaces y no botones a propósito: cada uno es una
            dirección real que se puede compartir y que el buscador puede seguir. */}
        <nav aria-label="Atajos" className="mt-4 flex flex-wrap gap-2">
          <Chip href="/buscar?verificados=1">Verificados</Chip>
          {categories.map((c) => (
            <Chip key={c.slug} href={`/buscar?categoria=${c.slug}`}>
              {c.label}
            </Chip>
          ))}
        </nav>

        <h1 className="mt-7 font-title text-xl font-semibold">Cerca de ti</h1>
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

function Chip({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-full border border-brand/20 bg-white px-3.5 py-1.5 text-sm hover:bg-ph"
    >
      {children}
    </Link>
  );
}
