import { query } from "@/lib/db";
import { transition } from "./orders";

/**
 * Cuánto vive un pedido esperando el pago antes de caducar.
 *
 * Treinta minutos: de sobra para volver de la pasarela, pagar con PSE o pedirle
 * la tarjeta a alguien, y poco para el vendedor cuyo artículo está bloqueado
 * mientras tanto. El reloj corre desde que se creó el pedido.
 */
export const CHECKOUT_TTL_MINUTES = 30;

/**
 * Devuelve al catálogo los artículos de un pedido que no llegó a pagarse.
 *
 * Solo toca las publicaciones que siguen 'reservada': si el vendedor la retiró o
 * la marcó vendida mientras tanto, su decisión manda sobre este barrido.
 */
async function releaseListings(orderId: string): Promise<void> {
  await query(
    `update listings set status = 'activa'
      where status = 'reservada'
        and id in (select listing_id from order_items where order_id = $1)`,
    [orderId]
  );
}

/**
 * Cancela un pedido que se quedó esperando el pago y libera sus artículos.
 *
 * Existe porque reservar al empezar el checkout (que es lo correcto: evita que dos
 * compradores paguen lo mismo) dejaba el artículo bloqueado para siempre si la
 * persona cerraba la pestaña. Ni ella misma podía volver a comprarlo: le decían
 * «alguien más se adelantó», y ese alguien era ella (hallazgo de la ronda de
 * usuario, 2026-09-14).
 *
 * Tolera repetirse: `transition` comprueba el estado de origen dentro de la misma
 * consulta que escribe, así que el segundo intento no hace nada.
 */
export async function cancelPendingOrder(
  orderId: string,
  source: "comprador" | "sistema",
  detail: string
): Promise<boolean> {
  const moved = await transition({ orderId, to: "cancelado", source, detail });
  if (moved) await releaseListings(orderId);
  return moved;
}

/**
 * Barrido de pedidos abandonados. Lo llama el worker, igual que la liberación
 * automática, y por la misma razón: nadie puede depender de que el comprador
 * vuelva a la pestaña para que el artículo del vendedor se desbloquee.
 */
export async function expireAbandonedCheckouts(): Promise<number> {
  const stale = await query<{ id: string }>(
    `select id from orders
      where status = 'pendiente_pago'
        and created_at < now() - ($1 || ' minutes')::interval
      order by created_at
      limit 200`,
    [String(CHECKOUT_TTL_MINUTES)]
  );

  let cancelled = 0;
  for (const { id } of stale) {
    const moved = await cancelPendingOrder(
      id,
      "sistema",
      `Caducado a los ${CHECKOUT_TTL_MINUTES} minutos sin completar el pago`
    );
    if (moved) cancelled++;
  }
  return cancelled;
}

/**
 * El pedido sin pagar que ya tiene este comprador sobre alguno de estos artículos.
 *
 * Sirve para no decirle «alguien se adelantó» a quien se adelantó a sí mismo: se
 * le devuelve a su pedido, donde puede terminar de pagar o cancelarlo.
 */
export async function findOwnPendingOrder(
  buyerId: string,
  listingIds: string[]
): Promise<string | null> {
  const rows = await query<{ id: string }>(
    `select distinct o.id from orders o
       join order_items i on i.order_id = o.id
      where o.buyer_id = $1
        and o.status = 'pendiente_pago'
        and i.listing_id = any($2::uuid[])
      limit 1`,
    [buyerId, listingIds]
  );
  return rows[0]?.id ?? null;
}
