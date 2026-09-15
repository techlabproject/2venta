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
  /** Cuántos artículos trae el pedido. Uno es el caso normal. */
  item_count: number;
};

// Una fila por PEDIDO, no por artículo.
//
// Antes esto unía `order_items` de frente, y un pedido de dos artículos salía dos
// veces en «Tu actividad» con el total del pedido completo en cada renglón: quien
// compró dos cosas de una vez veía su gasto duplicado. También era la causa del
// aviso de React de dos hijos con la misma clave, porque las dos filas traían el
// mismo `o.id`.
//
// El artículo que se muestra es el primero del pedido, elegido por `i.id` para que
// sea siempre el mismo y la lista no baile entre recargas. Los demás se cuentan.
const SUMMARY = `
  select o.id, o.status, o.subtotal_cop, o.shipping_cop, o.created_at,
         primero.title_cop as title,
         primero.poster_path,
         (select count(*) from order_items where order_id = o.id)::int as item_count,
         coalesce(u.alias, u.name) as counterpart_alias
    from orders o
    join lateral (
      select i.title_cop, l.poster_path
        from order_items i
        join listings l on l.id = i.listing_id
       where i.order_id = o.id
       order by i.id
       limit 1
    ) primero on true
`;

/** Lo que compré. El "contraparte" es quien vendió. */
export function listPurchases(userId: string): Promise<OrderSummary[]> {
  return query<OrderSummary>(
    `${SUMMARY} join "user" u on u.id = o.seller_id
      where o.buyer_id = $1 and o.status <> 'pendiente_pago'
      order by o.created_at desc limit 30`,
    [userId],
  );
}

/** Lo que vendí. El "contraparte" es quien compró. */
export function listSales(userId: string): Promise<OrderSummary[]> {
  return query<OrderSummary>(
    `${SUMMARY} join "user" u on u.id = o.buyer_id
      where o.seller_id = $1 and o.status <> 'pendiente_pago'
      order by o.created_at desc limit 30`,
    [userId],
  );
}
