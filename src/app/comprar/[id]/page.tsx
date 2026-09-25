import { notFound, redirect } from "next/navigation";
import { activeUser } from "@/lib/session";
import { getListing } from "@/features/catalog/queries";
import { ZONAS } from "@/features/ubicacion/zonas";
import { shippingProvider } from "@/features/shipping/provider";
import { AddressForm } from "@/features/shipping/AddressForm";
import { AppHeader } from "@/components/AppHeader";
import { getConversation, getOffer } from "@/features/chat/queries";
import { listCart } from "@/features/cart/queries";
import { Volver } from "@/components/Volver";
import { esEmpresa } from "@/features/sellers/queries";

// Paso previo al pago: a dónde llega y cuánto cuesta llevarlo. El comprador ve el
// total completo antes de que le cobren nada.
export const dynamic = "force-dynamic";

export default async function Comprar({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ oferta?: string }>;
}) {
  // Una cuenta suspendida no llega a las pantallas que escriben.
  const user = await activeUser();
  if (!user.phoneNumberVerified) redirect("/verificar");

  const { id } = await params;
  // Corrección 17: una empresa no compra; la ficha y el carrito le dicen por qué.
  if (await esEmpresa(user.id)) redirect(id === "carrito" ? "/carrito" : `/producto/${encodeURIComponent(id)}`);

  // "carrito" no es un artículo: es el pedido completo de un solo vendedor (D-20).
  const cart = id === "carrito" ? await listCart(user.id) : [];
  if (id === "carrito" && cart.length === 0) redirect("/carrito");

  const listing = await getListing(id === "carrito" ? cart[0].listing_id : id);
  if (!listing) notFound();

  // Si viene de una oferta aceptada, el precio es el de la oferta. La comprobación
  // de que sea válida vuelve a hacerse en el servidor al pagar.
  const { oferta } = await searchParams;
  const offer = oferta ? await getOffer(oferta) : null;
  // La oferta tiene que ser de quien está mirando. Sin esto, el precio que negoció
  // otra persona se le enseñaba a cualquiera que llegara con el identificador en
  // la dirección (ronda de verificación, 2026-09-20).
  const offerConversation = offer
    ? await getConversation(offer.conversation_id)
    : null;
  const ofertaPropia =
    offer &&
    offer.listing_id === listing.id &&
    offer.status === "aceptada" &&
    offerConversation?.buyer_id === user.id;
  const priceCop =
    id === "carrito"
      ? cart.reduce((sum, i) => sum + i.price_cop, 0)
      : ofertaPropia
        ? offer.price_cop
        : listing.price_cop;

  const quote = await shippingProvider.quote({ zone: listing.seller_zone, priceCop });
  // D-122: la misma lista cerrada de zonas que el perfil y los filtros.
  const zoneNames = ZONAS.map((z) => z.nombre);

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-md px-5 py-6">
        <Volver href={`/producto/${listing.id}`} fijo>Volver al artículo</Volver>
        <h1 className="mt-4 font-title text-xl font-semibold">
          ¿A dónde lo llevamos?
        </h1>
        <p className="mt-1 mb-6 text-sm text-muted">
          {id === "carrito"
            ? cart.length === 1
              ? cart[0].title
              : `${cart.length} artículos de ${cart[0].seller_alias}`
            : listing.title}
        </p>

        <AddressForm
          listingId={listing.id}
          priceCop={priceCop}
          offerId={ofertaPropia ? offer.id : undefined}
          fromCart={id === "carrito"}
          shippingCop={quote.costCop}
          zones={zoneNames}
        />
      </main>
    </>
  );
}
