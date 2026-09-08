"use server";

import { revalidatePath } from "next/cache";
import { activeUser, currentAdmin } from "@/lib/session";
import { query } from "@/lib/db";
import { getOrder, transition } from "@/features/payments/orders";
import { paymentProvider } from "@/features/payments/provider";
import { getClaim, KIND_LABEL, WINDOW_HOURS, type ClaimKind } from "./queries";

export type ClaimResult = { error: string };

const KINDS: ClaimKind[] = ["no_coincide", "no_llego"];

/** El comprador abre un reclamo. Los fondos quedan congelados (D-13). */
export async function openClaim(
  _prev: ClaimResult | null,
  form: FormData
): Promise<ClaimResult> {
  const user = await activeUser();

  const order = await getOrder(String(form.get("orderId") ?? ""));
  if (!order) return { error: "Ese pedido no existe." };
  if (order.buyer_id !== user.id) return { error: "Ese pedido no es tuyo." };

  const kind = KINDS.find((k) => k === form.get("kind"));
  if (!kind) return { error: "Elige qué pasó con el pedido." };

  const detail = String(form.get("detail") ?? "").trim().slice(0, 1000);
  if (detail.length < 10) {
    return { error: "Cuéntanos qué pasó, con algo de detalle. Es lo que vamos a leer." };
  }

  if (order.status === "liberado" || order.status === "reembolsado") {
    return { error: "Este pedido ya se cerró. Escríbenos si necesitas ayuda." };
  }
  if (order.status === "en_disputa") {
    return { error: "Ya hay un reclamo abierto en este pedido." };
  }
  if (order.status === "pendiente_pago" || order.status === "cancelado") {
    return { error: "Este pedido no llegó a pagarse." };
  }

  // D-12: las dos ventanas. Se cuentan desde la entrega registrada; si todavía no
  // hay entrega registrada, el plazo no ha empezado y el reclamo se acepta.
  if (order.delivered_at) {
    const hours = (Date.now() - order.delivered_at.getTime()) / 3_600_000;
    if (hours > WINDOW_HOURS[kind]) {
      return {
        error:
          kind === "no_coincide"
            ? "El plazo para reclamar por no coincidencia es de 48 horas desde la entrega."
            : "El plazo para reclamar que no llegó es de 7 días desde la entrega.",
      };
    }
  }

  const moved = await transition({
    orderId: order.id,
    to: "en_disputa",
    source: "comprador",
    detail: `Reclamo abierto: ${KIND_LABEL[kind]}`,
  });
  if (!moved) return { error: "Este pedido no admite un reclamo en su estado actual." };

  await query(
    `insert into claims (order_id, opened_by, kind, detail) values ($1, $2, $3, $4)
     on conflict (order_id) do nothing`,
    [order.id, user.id, kind, detail]
  );

  revalidatePath(`/pedido/${order.id}`);
  return { error: "" };
}

/** El vendedor da su versión. */
export async function replyToClaim(
  _prev: ClaimResult | null,
  form: FormData
): Promise<ClaimResult> {
  const user = await activeUser();

  const order = await getOrder(String(form.get("orderId") ?? ""));
  if (!order) return { error: "Ese pedido no existe." };
  if (order.seller_id !== user.id) return { error: "Ese pedido no es tuyo." };

  const reply = String(form.get("reply") ?? "").trim().slice(0, 1000);
  if (reply.length < 10) return { error: "Cuenta tu versión con algo de detalle." };

  const rows = await query<{ id: string }>(
    `update claims set seller_reply = $2, replied_at = now()
      where order_id = $1 and resolved_at is null
      returning id`,
    [order.id, reply]
  );
  if (rows.length === 0) return { error: "Ese reclamo ya se resolvió." };

  revalidatePath(`/pedido/${order.id}`);
  return { error: "" };
}

/**
 * Arbitraje. 2venta decide a quién va el dinero (D-13).
 *
 * Es la única acción del sistema que le quita plata a alguien, así que la
 * comprobación de rol va en el servidor y el resultado queda en el registro de
 * auditoría del pedido.
 */
export async function resolveClaim(
  _prev: ClaimResult | null,
  form: FormData
): Promise<ClaimResult> {
  const admin = await currentAdmin();
  if (!admin) return { error: "No tienes permiso para esto." };

  const orderId = String(form.get("orderId") ?? "");
  const order = await getOrder(orderId);
  if (!order) return { error: "Ese pedido no existe." };

  const favor = String(form.get("favor") ?? "");
  if (favor !== "comprador" && favor !== "vendedor") {
    return { error: "Elige a favor de quién se resuelve." };
  }
  const note = String(form.get("note") ?? "").trim().slice(0, 500) || null;

  const claim = await getClaim(order.id);
  if (!claim) return { error: "Ese pedido no tiene reclamo." };
  if (claim.resolved_at) return { error: "Ese reclamo ya se resolvió." };

  const to = favor === "comprador" ? "reembolsado" : "liberado";
  const moved = await transition({
    orderId: order.id,
    to,
    source: "sistema",
    detail: `Disputa resuelta a favor del ${favor}${note ? `: ${note}` : ""}`,
    onCommit: async (o) => {
      if (!o.provider_ref) return;
      if (favor === "comprador") await paymentProvider.refund(o.provider_ref);
      else await paymentProvider.release(o.provider_ref);
    },
  });
  if (!moved) return { error: "Ese pedido ya no está en disputa." };

  // Marcar resuelto solo si sigue abierto: dos administradores decidiendo a la vez
  // no pueden mover el dinero dos veces.
  await query(
    `update claims set resolution = $2, resolution_note = $3,
                       resolved_at = now(), resolved_by = $4
      where order_id = $1 and resolved_at is null`,
    [order.id, favor, note, admin.id]
  );

  revalidatePath("/admin/disputas");
  revalidatePath(`/pedido/${order.id}`);
  return { error: "" };
}
