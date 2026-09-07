import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { currentUser } from "@/lib/session";
import { getListing } from "@/features/catalog/queries";
import { listZones } from "@/features/catalog/search";
import { shippingProvider } from "@/features/shipping/provider";
import { AddressForm } from "@/features/shipping/AddressForm";
import { AppHeader } from "@/components/AppHeader";

// Paso previo al pago: a dónde llega y cuánto cuesta llevarlo. El comprador ve el
// total completo antes de que le cobren nada.
export const dynamic = "force-dynamic";

export default async function Comprar({ params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) redirect("/ingresar");
  if (!user.phoneNumberVerified) redirect("/verificar");

  const { id } = await params;
  const listing = await getListing(id);
  if (!listing) notFound();

  const [quote, zones] = await Promise.all([
    shippingProvider.quote({ zone: listing.seller_zone, priceCop: listing.price_cop }),
    listZones(),
  ]);

  const zoneNames = Array.from(
    new Set([...zones.map((z) => z.zone), "Chapinero", "Usaquén", "Teusaquillo", "Suba"])
  ).sort();

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-md px-5 py-6">
        <Link href={`/producto/${listing.id}`} className="text-sm text-ink2 underline">
          Volver al artículo
        </Link>
        <h1 className="mt-4 font-title text-xl font-semibold">¿A dónde lo llevamos?</h1>
        <p className="mt-1 mb-6 text-sm text-muted">{listing.title}</p>

        <AddressForm
          listingId={listing.id}
          priceCop={listing.price_cop}
          shippingCop={quote.costCop}
          zones={zoneNames}
        />
      </main>
    </>
  );
}
