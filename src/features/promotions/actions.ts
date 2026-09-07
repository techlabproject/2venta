"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { currentUser } from "@/lib/session";
import { query } from "@/lib/db";
import { newIdempotencyKey, paymentProvider } from "@/features/payments/provider";
import { PROMOTION_DAYS, PROMOTION_PRICE_COP } from "./config";

export type PromotionResult = { error: string };

/** El vendedor paga por destacar su propio artículo (D-10). */
export async function promoteListing(
  _prev: PromotionResult | null,
  form: FormData
): Promise<PromotionResult> {
  const user = await currentUser();
  if (!user) redirect("/ingresar");

  const listingId = String(form.get("listingId") ?? "");
  // La comprobación de dueño y de estado va en la misma consulta: no hay ventana
  // entre comprobar y cobrar.
  const rows = await query<{ id: string }>(
    `select id from listings where id = $1 and seller_id = $2 and status = 'activa'`,
    [listingId, user.id]
  );
  if (rows.length === 0) {
    return { error: "Solo puedes destacar una publicación tuya que esté activa." };
  }

  const idempotencyKey = newIdempotencyKey();
  const created = await query<{ id: string }>(
    `insert into promotions
       (listing_id, seller_id, price_cop, provider, idempotency_key)
     values ($1, $2, $3, $4, $5)
     returning id`,
    [listingId, user.id, PROMOTION_PRICE_COP, paymentProvider.name, idempotencyKey]
  );

  const checkout = await paymentProvider.createCheckout({
    orderId: created[0].id,
    amountCop: PROMOTION_PRICE_COP,
    commissionCop: PROMOTION_PRICE_COP,
    sellerId: user.id,
    idempotencyKey,
  });

  await query(`update promotions set provider_ref = $2 where id = $1`, [
    created[0].id,
    checkout.reference,
  ]);

  redirect(`/dev/destacar/${created[0].id}`);
}

/**
 * Activa el destacado cuando el proveedor confirma el pago.
 *
 * Destacar dos veces la misma publicación extiende el periodo en vez de crear dos
 * destacados solapados, que sería cobrar dos veces por lo mismo.
 */
export async function activatePromotion(promotionId: string): Promise<boolean> {
  const rows = await query<{ id: string }>(
    `update promotions p
        set status = 'activa',
            starts_at = now(),
            ends_at = greatest(
              now(),
              coalesce((select max(ends_at) from promotions o
                         where o.listing_id = p.listing_id and o.status = 'activa'
                           and o.ends_at > now()), now())
            ) + ($2 || ' days')::interval
      where p.id = $1 and p.status = 'pendiente_pago'
      returning p.id`,
    [promotionId, String(PROMOTION_DAYS)]
  );
  if (rows.length === 0) return false;

  revalidatePath("/");
  revalidatePath("/buscar");
  return true;
}

export async function cancelPromotion(promotionId: string): Promise<boolean> {
  const rows = await query<{ id: string }>(
    `update promotions set status = 'cancelada'
      where id = $1 and status = 'pendiente_pago' returning id`,
    [promotionId]
  );
  return rows.length > 0;
}
