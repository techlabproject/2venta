"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { activeUser } from "@/lib/session";
import { query } from "@/lib/db";
import { getListing } from "@/features/catalog/queries";
import { paymentProvider, newIdempotencyKey } from "./provider";
import { createOrder, getOrder, transition } from "./orders";
import { MIN_PRICE_COP, breakdown } from "./money";
import { cancelPendingOrder, findOwnPendingOrder } from "./abandon";
import { shippingProvider } from "@/features/shipping/provider";
import { saveAddress } from "@/features/shipping/queries";
import { getOffer } from "@/features/chat/queries";
import { listCart } from "@/features/cart/queries";
import { clearCart } from "@/features/cart/actions";

export type BuyResult = { error: string };

/** Empieza la compra de un artículo y manda al comprador al pago. */
export async function buyListing(
  _prev: BuyResult | null,
  form: FormData
): Promise<BuyResult> {
  const user = await activeUser();

  // D-01: sin celular verificado no se compra. La comprobación va en el servidor.
  if (!user.phoneNumberVerified) {
    return { error: "Confirma tu celular antes de comprar." };
  }

  // Puede venir un artículo suelto o el carrito completo. En los dos casos es un
  // solo vendedor (D-20).
  const listingId = String(form.get("listingId") ?? "");
  const fromCart = String(form.get("desdeCarrito") ?? "") === "1";

  // D-19: envío a domicilio o encuentro en persona.
  const presencial = String(form.get("metodo") ?? "envio") === "presencial";
  const meetingZone = String(form.get("meetingZone") ?? "").trim();
  if (presencial && !meetingZone) {
    return { error: "Elige en qué zona se van a encontrar." };
  }

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
  if (!presencial && (!address.recipient || !address.phone || !address.line1 || !address.zone)) {
    return { error: "Completa la dirección de entrega para poder pagar." };
  }

  const cart = fromCart ? await listCart(user.id) : [];
  if (fromCart && cart.length === 0) return { error: "Tu carrito está vacío." };
  if (fromCart && cart.some((i) => i.status !== "activa")) {
    return { error: "Algo de tu carrito ya no está disponible. Quítalo y vuelve a intentar." };
  }

  const listing = fromCart ? await getListing(cart[0].listing_id) : await getListing(listingId);
  if (!listing) return { error: "Ese artículo ya no existe." };

  if (listing.seller_id === user.id) {
    return { error: "No puedes comprar tu propio artículo." };
  }
  // D-21: si hay una oferta aceptada, el precio es el de la oferta, no el de la
  // publicación. Se comprueba en el servidor que sea de este comprador, de este
  // artículo, y que siga aceptada: si no, cualquiera pagaría lo que quisiera.
  let priceCop = fromCart
    ? cart.reduce((sum, i) => sum + i.price_cop, 0)
    : listing.price_cop;

  /*
   * El comprador manda el total que vio en pantalla. Si no coincide con el de
   * ahora, no se cobra.
   *
   * Antes se recalculaba en silencio con los precios del momento de confirmar, así
   * que si el vendedor subía el precio en el medio se cobraba el nuevo. No hace
   * falta mala fe para que ocurra: basta que esté ajustando precios mientras
   * alguien compra. Cobrar un precio distinto al que alguien aceptó no es un
   * detalle técnico.
   */
  const expected = Number(String(form.get("totalEsperado") ?? "").replace(/\D/g, ""));
  if (Number.isSafeInteger(expected) && expected > 0 && expected !== priceCop) {
    return {
      error: `El precio cambió mientras comprabas: ahora son $${priceCop.toLocaleString("es-CO")} en vez de $${expected.toLocaleString("es-CO")}. Vuelve a revisar antes de pagar.`,
    };
  }
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

  const ids = fromCart ? cart.map((i) => i.listing_id) : [listing.id];

  // Antes de intentar reservar: si estos artículos ya están retenidos por un pedido
  // sin pagar de esta misma persona, no es que «alguien se adelantó». Se la manda a
  // su pedido, donde puede terminar de pagar o cancelarlo (ronda de usuario,
  // 2026-09-14).
  const propio = await findOwnPendingOrder(user.id, ids);
  if (propio) redirect(`/pedido/${propio}`);

  // Los artículos se reservan en la misma consulta que comprueba que sigan activos.
  // Hacerlo en dos pasos deja una ventana en la que dos compradores pagan lo mismo.
  const claimed = await query<{ id: string }>(
    `update listings set status = 'reservada'
      where id = any($1::uuid[]) and status = 'activa'
      returning id`,
    [ids]
  );
  if (claimed.length !== ids.length) {
    // Si solo algunos se pudieron reservar, se devuelven los que sí, para no
    // dejarlos bloqueados por un pedido que nunca se creó.
    if (claimed.length > 0) {
      await query(`update listings set status = 'activa' where id = any($1::uuid[])`, [
        claimed.map((c) => c.id),
      ]);
    }
    // Decir por qué: "alguien se adelantó" no es verdad si el artículo está en
    // revisión o retirado (hallazgo de QA, 2026-09-13).
    const states = await query<{ status: string }>(
      `select status from listings where id = any($1::uuid[]) and status <> 'activa'`,
      [ids]
    );
    const status = states[0]?.status;
    if (status === "en_revision") {
      return { error: "Ese artículo todavía está en revisión. Podrás comprarlo cuando quede visible." };
    }
    if (status === "retirada" || status === "vendida") {
      return { error: "Ese artículo ya no está a la venta." };
    }
    return { error: "Alguien más se adelantó: algo de tu pedido ya no está disponible." };
  }

  // La clave de idempotencia se genera antes de llamar al proveedor. Es lo que
  // impide que un reintento por timeout cobre dos veces.
  const idempotencyKey = newIdempotencyKey();

  // En persona no hay envío que cobrar.
  const shippingCop = presencial
    ? 0
    : (await shippingProvider.quote({ zone: address.zone, priceCop })).costCop;

  const order = await createOrder({
    buyerId: user.id,
    sellerId: listing.seller_id,
    lines: fromCart
      ? cart.map((i) => ({
          listingId: i.listing_id,
          title: i.title,
          priceCop: i.price_cop,
        }))
      : [{ listingId: listing.id, title: listing.title, priceCop }],
    shippingCop,
    provider: paymentProvider.name,
    idempotencyKey,
  });

  if (fromCart) await clearCart();

  if (presencial) {
    await query(
      `update orders set delivery_method = 'presencial', meeting_zone = $2 where id = $1`,
      [order.id, meetingZone]
    );
  } else {
    await saveAddress(order.id, address);
  }

  const checkout = await paymentProvider.createCheckout({
    orderId: order.id,
    amountCop: breakdown(order.subtotal_cop, shippingCop).buyerTotalCop,
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
  const user = await activeUser();

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

/**
 * El comprador cancela su propio pedido sin pagar y suelta los artículos.
 *
 * Sin esto, cerrar la pestaña en la pasarela dejaba el artículo reservado y no
 * había forma de soltarlo desde la interfaz: ni para quien lo reservó, ni para el
 * vendedor. El barrido de `caducar` cubre a quien nunca vuelve; esto cubre a quien
 * vuelve y ya decidió que no.
 */
export async function cancelCheckout(
  _prev: BuyResult | null,
  form: FormData
): Promise<BuyResult> {
  const user = await activeUser();

  const orderId = String(form.get("orderId") ?? "");
  const order = await getOrder(orderId);
  // El mismo mensaje para "no existe" y "no es tuyo": decir cuál de los dos es
  // confirma la existencia de pedidos ajenos a quien prueba identificadores.
  if (!order || order.buyer_id !== user.id) return { error: "Ese pedido no existe." };
  if (order.status !== "pendiente_pago") {
    return { error: "Ese pedido ya no se puede cancelar." };
  }

  await cancelPendingOrder(orderId, "comprador", "El comprador canceló antes de pagar");

  revalidatePath(`/pedido/${orderId}`);
  revalidatePath("/");
  return { error: "" };
}
