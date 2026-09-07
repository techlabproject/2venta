import { pool, query } from "@/lib/db";
import { breakdown } from "./money";

export type OrderStatus =
  | "pendiente_pago"
  | "pagado"
  | "despachado"
  | "entregado"
  | "en_disputa"
  | "liberado"
  | "cancelado"
  | "reembolsado";

export type Order = {
  id: string;
  buyer_id: string;
  seller_id: string;
  status: OrderStatus;
  subtotal_cop: number;
  shipping_cop: number;
  delivery_method: "envio" | "presencial";
  meeting_zone: string | null;
  carrier: string | null;
  tracking_number: string | null;
  commission_cop: number;
  seller_payout_cop: number;
  provider_ref: string | null;
  delivered_at: Date | null;
  released_at: Date | null;
  created_at: Date;
};

/**
 * Qué transiciones son legales.
 *
 * Escrito como dato y no como una cadena de condiciones porque el desorden es la
 * norma con los avisos de un proveedor: llegan repetidos y a destiempo. Un aviso
 * de "pagado" cuando el pedido ya está liberado tiene que no hacer nada, no
 * retroceder el estado.
 */
const ALLOWED: Record<OrderStatus, OrderStatus[]> = {
  pendiente_pago: ["pagado", "cancelado"],
  pagado: ["despachado", "entregado", "en_disputa", "liberado", "reembolsado"],
  despachado: ["entregado", "en_disputa", "liberado", "reembolsado"],
  entregado: ["en_disputa", "liberado", "reembolsado"],
  // Una disputa solo sale hacia una de las dos partes, nunca vuelve atrás.
  en_disputa: ["liberado", "reembolsado"],
  liberado: [],
  cancelado: [],
  reembolsado: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ALLOWED[from].includes(to);
}

export async function createOrder(input: {
  buyerId: string;
  sellerId: string;
  listingId: string;
  title: string;
  priceCop: number;
  shippingCop?: number;
  provider: string;
  idempotencyKey: string;
}): Promise<Order> {
  const money = breakdown(input.priceCop, input.shippingCop ?? 0);

  // Pedido y renglones se escriben juntos o no se escribe ninguno: un pedido sin
  // renglones no dice qué se compró, y eso rompe cualquier reclamo posterior.
  const client = await pool.connect();
  try {
    await client.query("begin");

    const { rows } = await client.query<Order>(
      `insert into orders
         (buyer_id, seller_id, subtotal_cop, commission_cop, seller_payout_cop,
          shipping_cop, provider, idempotency_key)
       values ($1, $2, $3, $4, $5, $6, $7, $8)
       returning *`,
      [
        input.buyerId,
        input.sellerId,
        money.subtotalCop,
        money.commissionCop,
        money.sellerPayoutCop,
        money.shippingCop,
        input.provider,
        input.idempotencyKey,
      ]
    );
    const order = rows[0];

    await client.query(
      `insert into order_items (order_id, listing_id, title_cop, price_cop)
       values ($1, $2, $3, $4)`,
      [order.id, input.listingId, input.title, input.priceCop]
    );

    await client.query(
      `insert into order_events (order_id, from_status, to_status, source, detail)
       values ($1, null, 'pendiente_pago', 'comprador', 'Pedido creado')`,
      [order.id]
    );

    await client.query("commit");
    return order;
  } catch (err) {
    await client.query("rollback");
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Cambia el estado si la transición es legal, y deja registro.
 *
 * Devuelve `false` cuando no aplica, que es el caso normal de un aviso repetido o
 * fuera de orden. No es un error: es lo que tiene que pasar.
 *
 * Todo ocurre en una transacción con la fila bloqueada, para que dos avisos
 * simultáneos no liberen el dinero dos veces.
 */
export async function transition(input: {
  orderId: string;
  to: OrderStatus;
  source: "comprador" | "vendedor" | "proveedor" | "sistema";
  detail?: string;
  providerEventId?: string;
  providerRef?: string;
  onCommit?: (order: Order) => Promise<void>;
}): Promise<boolean> {
  const client = await pool.connect();
  try {
    await client.query("begin");

    const { rows } = await client.query<Order>(
      `select * from orders where id = $1 for update`,
      [input.orderId]
    );
    const order = rows[0];
    if (!order) {
      await client.query("rollback");
      return false;
    }

    // El mismo aviso del proveedor procesado dos veces no vuelve a mover nada.
    if (input.providerEventId) {
      const seen = await client.query(
        `select 1 from order_events where provider_event_id = $1`,
        [input.providerEventId]
      );
      if (seen.rowCount) {
        await client.query("rollback");
        return false;
      }
    }

    if (!canTransition(order.status, input.to)) {
      await client.query("rollback");
      return false;
    }

    await client.query(
      `update orders
          set status = $2,
              provider_ref = coalesce($3, provider_ref),
              released_at = case when $2 = 'liberado' then now() else released_at end,
              updated_at = now()
        where id = $1`,
      [order.id, input.to, input.providerRef ?? null]
    );

    await client.query(
      `insert into order_events
         (order_id, from_status, to_status, source, provider_event_id, detail)
       values ($1, $2, $3, $4, $5, $6)`,
      [
        order.id,
        order.status,
        input.to,
        input.source,
        input.providerEventId ?? null,
        input.detail ?? null,
      ]
    );

    // El efecto externo (llamar al proveedor) ocurre antes de confirmar: si falla,
    // la transacción se deshace y el estado local no miente sobre lo que pasó.
    if (input.onCommit) await input.onCommit(order);

    await client.query("commit");
    return true;
  } catch (err) {
    await client.query("rollback");
    throw err;
  } finally {
    client.release();
  }
}

export async function getOrder(id: string): Promise<Order | null> {
  const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID.test(id)) return null;
  const rows = await query<Order>(`select * from orders where id = $1`, [id]);
  return rows[0] ?? null;
}

export async function findByProviderRef(ref: string): Promise<Order | null> {
  const rows = await query<Order>(`select * from orders where provider_ref = $1`, [ref]);
  return rows[0] ?? null;
}

export type OrderItem = { title_cop: string; price_cop: number; listing_id: string };

export function getOrderItems(orderId: string): Promise<OrderItem[]> {
  return query<OrderItem>(
    `select listing_id, title_cop, price_cop from order_items where order_id = $1`,
    [orderId]
  );
}
