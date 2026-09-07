import { query } from "@/lib/db";
import { paymentProvider } from "./provider";
import { transition } from "./orders";

/** Días desde la entrega registrada hasta la liberación automática (D-11b). */
export const AUTO_RELEASE_DAYS = 7;

/**
 * Libera los pedidos entregados que ya cumplieron el plazo.
 *
 * Los siete días no son la ventana de reclamo, que es de 48 horas: cubren un caso
 * distinto, el paquete que la transportadora marcó como entregado y nunca llegó.
 */
export async function releaseExpiredOrders(): Promise<number> {
  const pending = await query<{ id: string }>(
    `select id from orders
      where status in ('pagado','despachado','entregado')
        and delivered_at is not null
        and delivered_at < now() - ($1 || ' days')::interval
        -- Un pedido en disputa no se libera solo. Sin esto, un reclamo del día
        -- seis se resolvería al día siete a favor del vendedor por vencimiento.
        and not exists (
          select 1 from claims c
           where c.order_id = orders.id and c.resolved_at is null
        )
      order by delivered_at
      limit 200`,
    [String(AUTO_RELEASE_DAYS)]
  );

  let released = 0;
  for (const { id } of pending) {
    const moved = await transition({
      orderId: id,
      to: "liberado",
      source: "sistema",
      detail: `Liberación automática a los ${AUTO_RELEASE_DAYS} días de la entrega`,
      onCommit: async (order) => {
        if (order.provider_ref) await paymentProvider.release(order.provider_ref);
      },
    });
    if (moved) released++;
  }
  return released;
}
