import { notFound } from "next/navigation";
import Link from "next/link";
import { getPublicSeller, listSellerListings } from "@/features/catalog/queries";
import { ListingCard } from "@/features/catalog/ListingCard";
import { AppHeader } from "@/components/AppHeader";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { formatMonthYear } from "@/lib/money";
import { getReputation, listReviews } from "@/features/ratings/queries";

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

  const [listings, reputation, reviews] = await Promise.all([
    listSellerListings(id),
    getReputation(id),
    listReviews(id),
  ]);

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

        {/* D-17: un vendedor sin ventas no muestra cifras en cero. "0 ventas, 0
            estrellas" parece mal desempeño cuando en realidad es ausencia de
            datos, y en una plataforma que arranca eso son todos. Lo único cierto
            que se puede decir de él es desde cuándo está y que se verificó. */}
        {reputation.sales > 0 ? (
          <dl data-testid="reputacion" className="mt-5 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-2xl bg-white p-3">
              <dt className="text-xs text-muted">Calificación</dt>
              <dd className="font-title text-xl font-semibold">
                {reputation.average !== null ? (
                  <>
                    {reputation.average.toFixed(1).replace(".", ",")}
                    <span aria-hidden="true" className="text-accent-text"> ★</span>
                  </>
                ) : (
                  <span className="text-base font-normal text-muted">Sin reseñas</span>
                )}
              </dd>
            </div>
            <div className="rounded-2xl bg-white p-3">
              <dt className="text-xs text-muted">Ventas</dt>
              <dd className="font-title text-xl font-semibold">{reputation.sales}</dd>
            </div>
            <div className="rounded-2xl bg-white p-3">
              <dt className="text-xs text-muted">Disputas</dt>
              <dd className="font-title text-xl font-semibold">
                {reputation.disputeRate?.toString().replace(".", ",")}%
              </dd>
            </div>
          </dl>
        ) : (
          <p data-testid="sin-ventas" className="mt-4 rounded-2xl bg-white p-4 text-sm text-ink2">
            Todavía no ha completado ninguna venta en 2venta. Su identidad sí está
            verificada, que es lo que garantiza que responde con su nombre real.
          </p>
        )}

        {reviews.length > 0 && (
          <section className="mt-8">
            <h2 className="font-title text-lg font-semibold">Lo que dicen los compradores</h2>
            <ul className="mt-3 flex flex-col gap-3">
              {reviews.map((r, i) => (
                <li key={i} className="rounded-2xl bg-white p-4 text-sm">
                  <p className="flex items-center gap-2">
                    <span className="font-medium">{r.rater_alias}</span>
                    <span aria-hidden="true" className="text-accent-text">
                      {"★".repeat(r.stars)}
                    </span>
                    <span className="sr-only">{r.stars} de 5</span>
                  </p>
                  {r.review && <p className="mt-1 text-ink2">{r.review}</p>}
                </li>
              ))}
            </ul>
          </section>
        )}

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
