import { query } from "@/lib/db";

export type OrderSummary = {
  id: string;
  status: string;
  subtotal_cop: number;
  shipping_cop: number;
  created_at: Date;
  title: string;
  poster_path: string | null;
  counterpart_alias: string;
};

const SUMMARY = `
  select o.id, o.status, o.subtotal_cop, o.shipping_cop, o.created_at,
         i.title_cop as title,
         l.poster_path,
         coalesce(u.alias, u.name) as counterpart_alias
    from orders o
    join order_items i on i.order_id = o.id
    join listings l    on l.id = i.listing_id
`;

/** Lo que compré. El "contraparte" es quien vendió. */
export function listPurchases(userId: string): Promise<OrderSummary[]> {
  return query<OrderSummary>(
    `${SUMMARY} join "user" u on u.id = o.seller_id
      where o.buyer_id = $1 and o.status <> 'pendiente_pago'
      order by o.created_at desc limit 30`,
    [userId]
  );
}

/** Lo que vendí. El "contraparte" es quien compró. */
export function listSales(userId: string): Promise<OrderSummary[]> {
  return query<OrderSummary>(
    `${SUMMARY} join "user" u on u.id = o.buyer_id
      where o.seller_id = $1 and o.status <> 'pendiente_pago'
      order by o.created_at desc limit 30`,
    [userId]
  );
}
