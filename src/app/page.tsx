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

      {/* La franja de marca continúa la cabecera en vez de cortarla. Antes el
          buscador flotaba sobre crema y la parte de arriba no decía nada: la
          promesa del producto, que es la razón de existir de 2venta, no tenía
          ninguna presencia visual. */}
      <div className="bg-brand pb-8 text-cream">
        <div className="mx-auto max-w-6xl px-5">
          <h1 className="max-w-xl font-title text-3xl leading-tight font-semibold text-balance sm:text-4xl">
            Compra usado sin miedo a que te tumben
          </h1>
          <p className="mt-2 max-w-lg text-sm text-cream/80">
            Cada artículo tiene video grabado por el vendedor y su identidad está
            verificada. Tu plata queda guardada hasta que confirmes que recibiste.
          </p>

          <form action="/buscar" method="get" className="mt-6 flex max-w-2xl gap-2">
            <input
              type="search"
              name="q"
              aria-label="Buscar"
              placeholder="Busca celulares, ropa, coches…"
              className="flex-1 rounded-xl border border-transparent bg-cream px-4 py-3 text-sm text-ink outline-none placeholder:text-muted focus:border-accent"
            />
            <button
              type="submit"
              className="rounded-xl bg-accent px-5 text-sm font-medium text-on-accent hover:brightness-95"
            >
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
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-5 py-8">
        <h2 className="font-title text-xl font-semibold">Cerca de ti</h2>
        <p className="mt-1 text-sm text-muted">
          Lo que se está vendiendo ahora mismo en Bogotá.
        </p>

        <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-4">
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
      className="rounded-full border border-cream/30 px-3.5 py-1.5 text-sm text-cream transition hover:border-cream/60 hover:bg-cream/10"
    >
      {children}
    </Link>
  );
}
