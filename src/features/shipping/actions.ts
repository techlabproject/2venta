"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { currentUser } from "@/lib/session";
import { query } from "@/lib/db";
import { getOrder } from "@/features/payments/orders";
import { getAddress } from "./queries";
import { shippingProvider } from "./provider";

export type ShipResult = { error: string };

/** El vendedor genera la guía. D-18: la guía sale de la plataforma. */
export async function createShipment(
  _prev: ShipResult | null,
  form: FormData
): Promise<ShipResult> {
  const user = await currentUser();
  if (!user) redirect("/ingresar");

  const orderId = String(form.get("orderId") ?? "");
  const order = await getOrder(orderId);
  if (!order) return { error: "Ese pedido no existe." };

  // Solo el vendedor de ese pedido despacha. Sin esto, cualquiera con el
  // identificador podría generar guías ajenas.
  if (order.seller_id !== user.id) return { error: "Ese pedido no es tuyo." };
  if (order.status !== "pagado") {
    return { error: "Solo se despacha un pedido que ya esté pagado." };
  }

  const address = await getAddress(order.id);
  if (!address) return { error: "Ese pedido no tiene dirección de entrega." };

  const shipment = await shippingProvider.createShipment({
    orderId: order.id,
    recipient: address.recipient,
    line1: address.line1,
    zone: address.zone,
  });

  await query(
    `update orders set carrier = $2, tracking_number = $3, status = 'despachado',
                       updated_at = now()
      where id = $1 and status = 'pagado'`,
    [order.id, shipment.carrier, shipment.trackingNumber]
  );

  await query(
    `insert into order_events (order_id, from_status, to_status, source, detail)
     values ($1, 'pagado', 'despachado', 'vendedor', $2)`,
    [order.id, `Guía ${shipment.trackingNumber} con ${shipment.carrier}`]
  );

  revalidatePath(`/pedido/${order.id}`);
  return { error: "" };
}
