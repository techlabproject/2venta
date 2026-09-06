import { notFound } from "next/navigation";
import Link from "next/link";
import { getListing } from "@/features/catalog/queries";
import { CONDITION_LABEL } from "@/features/catalog/labels";
import { formatCop } from "@/lib/money";
import { AppHeader } from "@/components/AppHeader";

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
    <>
      <AppHeader zone={listing.seller_zone} />
      <main className="mx-auto max-w-3xl px-5 py-6">
        <Link href="/" className="text-sm text-ink2 underline">
          Volver
        </Link>

        {/* El carrusel con video obligatorio llega en S-03. */}
        <div className="mt-4 flex aspect-[4/3] items-center justify-center rounded-2xl bg-ph text-sm text-muted">
          Sin foto
        </div>

        <p className="mt-5 font-title text-3xl font-semibold">
          {formatCop(listing.price_cop)}
        </p>
        <h1 className="mt-1 text-lg font-medium">{listing.title}</h1>

        <dl className="mt-5 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
          <dt className="text-muted">Categoría</dt>
          <dd>{listing.category_label}</dd>
          <dt className="text-muted">Estado</dt>
          <dd>{CONDITION_LABEL[listing.condition]}</dd>
          <dt className="text-muted">Vendedor</dt>
          {/* D-04: alias y zona. Nunca nombre completo ni dirección exacta. */}
          <dd>
            {listing.seller_alias} · {listing.seller_zone}
          </dd>
        </dl>

        <p className="mt-5 text-sm leading-relaxed text-ink2">{listing.description}</p>

        <div className="mt-6 rounded-2xl bg-white p-4 text-sm">
          <p className="font-medium">Pago protegido</p>
          <p className="mt-1 text-muted">
            Guardamos tu plata hasta que confirmes que recibiste el producto. Comprar
            llega en una próxima entrega.
          </p>
        </div>
      </main>
    </>
  );
}
