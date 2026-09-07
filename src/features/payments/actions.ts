"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { currentUser } from "@/lib/session";
import { query } from "@/lib/db";
import { getListing } from "@/features/catalog/queries";
import { paymentProvider, newIdempotencyKey } from "./provider";
import { createOrder, getOrder, transition } from "./orders";
import { MIN_PRICE_COP, breakdown } from "./money";
import { shippingProvider } from "@/features/shipping/provider";
import { saveAddress } from "@/features/shipping/queries";
import { getOffer } from "@/features/chat/queries";

export type BuyResult = { error: string };

/** Empieza la compra de un artículo y manda al comprador al pago. */
export async function buyListing(
  _prev: BuyResult | null,
  form: FormData
): Promise<BuyResult> {
  const user = await currentUser();
  if (!user) redirect("/ingresar");

  // D-01: sin celular verificado no se compra. La comprobación va en el servidor.
  if (!user.phoneNumberVerified) {
    return { error: "Confirma tu celular antes de comprar." };
  }

  const listingId = String(form.get("listingId") ?? "");

  // S-06: sin dirección no hay envío y sin envío no hay total que cobrar.
  const address = {
    recipient: String(form.get("recipient") ?? "").trim(),
    phone: String(form.get("phone") ?? "").trim(),
    line1: String(form.get("line1") ?? "").trim(),
    details: String(form.get("details") ?? "").trim() || null,
    city: "Bogotá",
    zone: String(form.get("zone") ?? "").trim(),
    notes: String(form.get("notes") ?? "").trim() || null,
  };
  if (!address.recipient || !address.phone || !address.line1 || !address.zone) {
    return { error: "Completa la dirección de entrega para poder pagar." };
  }

  const listing = await getListing(listingId);
  if (!listing) return { error: "Ese artículo ya no existe." };

  if (listing.seller_id === user.id) {
    return { error: "No puedes comprar tu propio artículo." };
  }
  // D-21: si hay una oferta aceptada, el precio es el de la oferta, no el de la
  // publicación. Se comprueba en el servidor que sea de este comprador, de este
  // artículo, y que siga aceptada: si no, cualquiera pagaría lo que quisiera.
  let priceCop = listing.price_cop;
  const offerId = String(form.get("offerId") ?? "");
  if (offerId) {
    const offer = await getOffer(offerId);
    if (!offer || offer.listing_id !== listing.id || offer.status !== "aceptada") {
      return { error: "Esa oferta ya no está en pie." };
    }
    priceCop = offer.price_cop;
  }

  if (priceCop < MIN_PRICE_COP) {
    return { error: "Ese artículo está por debajo del precio mínimo." };
  }

  // El artículo se reserva marcándolo como vendido en la misma consulta que
  // comprueba que siga activo. Hacerlo en dos pasos deja una ventana en la que dos
  // compradores pagan lo mismo.
  const claimed = await query<{ id: string }>(
    `update listings set status = 'reservada'
      where id = $1 and status = 'activa'
      returning id`,
    [listingId]
  );
  if (claimed.length === 0) {
    return { error: "Alguien más se adelantó: ese artículo ya no está disponible." };
  }

  // La clave de idempotencia se genera antes de llamar al proveedor. Es lo que
  // impide que un reintento por timeout cobre dos veces.
  const idempotencyKey = newIdempotencyKey();

  const quote = await shippingProvider.quote({
    zone: address.zone,
    priceCop,
  });

  const order = await createOrder({
    buyerId: user.id,
    sellerId: listing.seller_id,
    listingId: listing.id,
    title: listing.title,
    priceCop,
    shippingCop: quote.costCop,
    provider: paymentProvider.name,
    idempotencyKey,
  });

  await saveAddress(order.id, address);

  const checkout = await paymentProvider.createCheckout({
    orderId: order.id,
    amountCop: breakdown(order.subtotal_cop, order.shipping_cop).buyerTotalCop,
    commissionCop: order.commission_cop,
    sellerId: listing.seller_id,
    idempotencyKey,
  });

  await query(`update orders set provider_ref = $2 where id = $1`, [
    order.id,
    checkout.reference,
  ]);

  redirect(checkout.redirectUrl);
}

/** El comprador confirma que recibió y con eso se libera el dinero (D-11). */
export async function confirmReceipt(
  _prev: BuyResult | null,
  form: FormData
): Promise<BuyResult> {
  const user = await currentUser();
  if (!user) redirect("/ingresar");

  const orderId = String(form.get("orderId") ?? "");
  const order = await getOrder(orderId);
  if (!order) return { error: "Ese pedido no existe." };

  // Solo el comprador de ese pedido libera su propio dinero. Sin esto, cualquiera
  // con el identificador podría liberarlo.
  if (order.buyer_id !== user.id) {
    return { error: "Ese pedido no es tuyo." };
  }

  const moved = await transition({
    orderId: order.id,
    to: "liberado",
    source: "comprador",
    detail: "El comprador confirmó que recibió",
    onCommit: async (o) => {
      if (o.provider_ref) await paymentProvider.release(o.provider_ref);
    },
  });

  if (!moved) {
    return { error: "Ese pedido no está en un estado que permita liberar el pago." };
  }

  await query(
    `update listings set status = 'vendida'
      where id in (select listing_id from order_items where order_id = $1)`,
    [order.id]
  );

  revalidatePath(`/pedido/${order.id}`);
  return { error: "" };
}
