"use server";

import { revalidatePath } from "next/cache";
import { activeUser } from "@/lib/session";
import { query } from "@/lib/db";
import { getOrder } from "@/features/payments/orders";
import { redact } from "@/features/chat/redact";

export type RatingResult = { error: string };

/** D-17: calificación mutua después de una venta completada. */
export async function rateCounterpart(
  _prev: RatingResult | null,
  form: FormData
): Promise<RatingResult> {
  const user = await activeUser();

  const order = await getOrder(String(form.get("orderId") ?? ""));
  if (!order) return { error: "Ese pedido no existe." };

  const isBuyer = order.buyer_id === user.id;
  const isSeller = order.seller_id === user.id;
  if (!isBuyer && !isSeller) return { error: "Ese pedido no es tuyo." };

  // Solo se califica lo que terminó. Calificar antes convertiría la reseña en una
  // forma de presionar durante la transacción.
  if (order.status !== "liberado" && order.status !== "reembolsado") {
    return { error: "Puedes calificar cuando el pedido esté completado." };
  }

  const stars = Number(String(form.get("stars") ?? ""));
  if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
    return { error: "Elige entre una y cinco estrellas." };
  }

  // Las reseñas son públicas, así que el filtro anti-desvío también aplica aquí.
  const raw = String(form.get("review") ?? "").trim().slice(0, 500);
  const review = raw ? redact(raw).text : null;

  const rows = await query<{ id: string }>(
    `insert into ratings (order_id, rater_id, ratee_id, stars, review)
     values ($1, $2, $3, $4, $5)
     on conflict (order_id, rater_id) do nothing
     returning id`,
    [order.id, user.id, isBuyer ? order.seller_id : order.buyer_id, stars, review]
  );
  if (rows.length === 0) return { error: "Ya calificaste este pedido." };

  revalidatePath(`/pedido/${order.id}`);
  revalidatePath(`/vendedor/${order.seller_id}`);
  return { error: "" };
}
