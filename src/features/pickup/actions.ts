"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { currentUser } from "@/lib/session";
import { getOrder, transition } from "@/features/payments/orders";
import { paymentProvider } from "@/features/payments/provider";
import { query } from "@/lib/db";
import { checkCode } from "./queries";
import { isWellFormed, MAX_ATTEMPTS } from "./code";

export type PickupResult = { error: string };

const MESSAGES: Record<string, string> = {
  no_existe: "Este pedido no tiene código de entrega.",
  usado: "Ese código ya se usó. El pago de este pedido ya se liberó.",
  vencido: "Ese código venció. Escríbele al comprador por el chat.",
  bloqueado: `Se agotaron los ${MAX_ATTEMPTS} intentos. Escríbenos para desbloquearlo.`,
  incorrecto: "Ese código no es. Pídele al comprador que lo lea otra vez.",
};

/** Decirle cuántos intentos quedan evita que se bloquee sin darse cuenta. */
function describe(result: { reason: string; remaining?: number }): string {
  const base = MESSAGES[result.reason];
  if (result.reason !== "incorrecto" || result.remaining === undefined) return base;
  if (result.remaining === 0) return MESSAGES.bloqueado;
  return `${base} Te ${result.remaining === 1 ? "queda 1 intento" : `quedan ${result.remaining} intentos`}.`;
}

/**
 * El vendedor escribe el código que le dictó el comprador y el pago se libera.
 *
 * D-19: nunca hay efectivo. El comprador ya pagó por la app; lo que el código
 * libera es plata que estaba retenida.
 */
export async function redeemCode(
  _prev: PickupResult | null,
  form: FormData
): Promise<PickupResult> {
  const user = await currentUser();
  if (!user) redirect("/ingresar");

  const orderId = String(form.get("orderId") ?? "");
  const order = await getOrder(orderId);
  if (!order) return { error: "Ese pedido no existe." };

  // Es el vendedor quien escribe el código: el comprador lo tiene, el vendedor lo
  // usa. Si el comprador pudiera usarlo, el código no probaría ningún encuentro.
  if (order.seller_id !== user.id) return { error: "Ese pedido no es tuyo." };

  if (order.delivery_method !== "presencial") {
    return { error: "Este pedido es con envío, no con entrega en persona." };
  }
  if (order.status !== "pagado") {
    return { error: "Solo se puede cobrar un pedido que esté pagado." };
  }

  const given = String(form.get("code") ?? "");
  if (!isWellFormed(given)) {
    return { error: "El código son seis dígitos." };
  }

  const result = await checkCode(order.id, given);
  if (!result.ok) return { error: describe(result) };

  const moved = await transition({
    orderId: order.id,
    to: "liberado",
    source: "comprador",
    detail: "El comprador entregó el código en el encuentro",
    onCommit: async (o) => {
      if (o.provider_ref) await paymentProvider.release(o.provider_ref);
    },
  });

  if (!moved) return { error: "Ese pedido ya no está en un estado que permita liberar." };

  await query(
    `update listings set status = 'vendida'
      where id in (select listing_id from order_items where order_id = $1)`,
    [order.id]
  );

  revalidatePath(`/pedido/${order.id}`);
  return { error: "" };
}
