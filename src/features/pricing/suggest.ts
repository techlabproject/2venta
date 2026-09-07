import { query } from "@/lib/db";

/**
 * Rango de precio sugerido al publicar (D-24).
 *
 * La decisión habla de un modelo predictivo. No hay con qué entrenarlo: la
 * plataforma no tiene histórico. Lo honesto es lo que se hace aquí: el rango sale
 * de lo que se ha vendido de verdad en esa categoría y ese estado dentro de 2venta.
 *
 * Y si no hay suficientes ventas, no se muestra nada. Un promedio de dos ventas es
 * ruido presentado como consejo, y quien fija su precio por un dato inventado se
 * lleva la peor parte.
 */
export const MIN_SALES_FOR_SUGGESTION = 5;

export type PriceRange = { low: number; high: number; sales: number };

export async function suggestPrice(
  category: string,
  condition: string
): Promise<PriceRange | null> {
  const rows = await query<{ low: string | null; high: string | null; sales: string }>(
    `select
       percentile_disc(0.25) within group (order by o.subtotal_cop)::text as low,
       percentile_disc(0.75) within group (order by o.subtotal_cop)::text as high,
       count(*)::text as sales
     from orders o
     join order_items i on i.order_id = o.id
     join listings l    on l.id = i.listing_id
    where o.status = 'liberado'
      and l.category = $1
      and l.condition = $2::listing_condition`,
    [category, condition]
  );

  const r = rows[0];
  const sales = Number(r.sales);
  if (sales < MIN_SALES_FOR_SUGGESTION || r.low === null || r.high === null) return null;

  return { low: Number(r.low), high: Number(r.high), sales };
}

export type SuggestionMap = Record<string, PriceRange | null>;

/** Rango por categoría, para el estado "usado bueno", que es el más común. */
export async function suggestAll(categories: string[]): Promise<SuggestionMap> {
  const entries = await Promise.all(
    categories.map(async (c) => [c, await suggestPrice(c, "usado_bueno")] as const)
  );
  return Object.fromEntries(entries);
}
