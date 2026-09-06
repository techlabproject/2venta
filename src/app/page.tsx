import Link from "next/link";
import { listListings } from "@/features/catalog/queries";
import { CATEGORY_LABEL } from "@/features/catalog/labels";
import { formatCop } from "@/lib/money";

// Renderizado en servidor y sin caché: la ficha y la lista tienen que existir
// como HTML para que un buscador las indexe (D-25).
export const dynamic = "force-dynamic";

export default async function Home() {
  const listings = await listListings();

  return (
    <main>
      <h1 className="text-2xl font-semibold">2venta</h1>
      <p className="mt-1 text-sm text-gray-600">
        Esqueleto caminante. Tres productos sembrados, sin cuentas ni pagos todavía.
      </p>

      <ul className="mt-8 divide-y">
        {listings.map((l) => (
          <li key={l.id} className="py-4">
            <Link href={`/producto/${l.id}`} className="font-medium underline">
              {l.title}
            </Link>
            <div className="text-sm text-gray-600">
              {formatCop(l.price_cop)} · {CATEGORY_LABEL[l.category]} · {l.seller_zone}
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
