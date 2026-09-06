import { notFound } from "next/navigation";
import Link from "next/link";
import { getPublicSeller, listSellerListings } from "@/features/catalog/queries";
import { ListingCard } from "@/features/catalog/ListingCard";
import { AppHeader } from "@/components/AppHeader";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { formatMonthYear } from "@/lib/money";

// Pantalla 1g del mockup: perfil público del vendedor.
// D-04: solo alias y zona. Nombre completo, correo, celular y dirección no salen
// de la consulta, así que no existe la posibilidad de filtrarlos por descuido.
export const dynamic = "force-dynamic";

export default async function PerfilVendedor({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const seller = await getPublicSeller(id);
  if (!seller) notFound();

  const listings = await listSellerListings(id);

  return (
    <>
      <AppHeader zone={seller.zone} />
      <main className="mx-auto max-w-3xl px-5 py-6">
        <Link href="/" className="text-sm text-ink2 underline">
          Volver
        </Link>

        <h1 className="mt-5 font-title text-2xl font-semibold">{seller.alias}</h1>
        <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-muted">
          {seller.verified ? (
            <VerifiedBadge label="Identidad verificada" />
          ) : (
            <span className="text-warn">Identidad sin verificar</span>
          )}
          <span>· {seller.zone}</span>
        </p>
        <p className="mt-1 text-sm text-muted">Miembro desde {formatMonthYear(seller.member_since)}</p>

        {/* Calificación, ventas y tasa de disputa llegan con S-12. Mostrarlas en
            cero ahora daría una impresión falsa de mal desempeño. */}

        <h2 className="mt-8 font-title text-lg font-semibold">
          {seller.listing_count === 1
            ? "1 publicación activa"
            : `${seller.listing_count} publicaciones activas`}
        </h2>
        <ul className="mt-4 grid grid-cols-2 gap-3">
          {listings.map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </ul>
      </main>
    </>
  );
}
