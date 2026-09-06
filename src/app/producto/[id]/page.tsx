import { notFound } from "next/navigation";
import Link from "next/link";
import { getListing } from "@/features/catalog/queries";
import { CATEGORY_LABEL, CONDITION_LABEL } from "@/features/catalog/labels";
import { formatCop } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function ListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const listing = await getListing(id);

  // Un id inexistente o con formato inválido termina en 404, no en una
  // excepción ni en una pantalla en blanco.
  if (!listing) notFound();

  return (
    <main>
      <Link href="/" className="text-sm underline">
        Volver
      </Link>

      <h1 className="mt-6 text-2xl font-semibold">{listing.title}</h1>
      <p className="mt-1 text-xl">{formatCop(listing.price_cop)}</p>

      <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
        <dt className="text-gray-600">Categoría</dt>
        <dd>{CATEGORY_LABEL[listing.category]}</dd>
        <dt className="text-gray-600">Estado</dt>
        <dd>{CONDITION_LABEL[listing.condition]}</dd>
        <dt className="text-gray-600">Vendedor</dt>
        {/* D-04: alias y zona. Nunca nombre completo ni dirección. */}
        <dd>
          {listing.seller_alias} · {listing.seller_zone}
        </dd>
      </dl>

      <p className="mt-6 text-sm leading-relaxed">{listing.description}</p>
    </main>
  );
}
