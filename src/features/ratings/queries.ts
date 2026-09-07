import { query } from "@/lib/db";

export type Reputation = {
  /** Ventas completadas. Es la base de todo lo demás. */
  sales: number;
  /** Promedio de estrellas, o null si todavía no lo han calificado. */
  average: number | null;
  ratings: number;
  /** Porcentaje de ventas que terminaron en reclamo. */
  disputeRate: number | null;
};

export type Review = {
  stars: number;
  review: string | null;
  rater_alias: string;
  created_at: Date;
};

/**
 * Reputación pública de un vendedor.
 *
 * Devuelve ceros y nulos sin adornos; es la pantalla la que decide no mostrar
 * cifras en cero (ver la D-17 y la especificación de esta rebanada). Un vendedor
 * nuevo con "0 ventas, 0 estrellas" parece malo cuando en realidad es nuevo, y en
 * una plataforma que arranca eso son todos.
 */
export async function getReputation(sellerId: string): Promise<Reputation> {
  const rows = await query<{
    sales: string;
    average: string | null;
    ratings: string;
    disputes: string;
  }>(
    `select
       (select count(*)::text from orders
         where seller_id = $1 and status in ('liberado','reembolsado')) as sales,
       (select round(avg(stars), 1)::text from ratings where ratee_id = $1) as average,
       (select count(*)::text from ratings where ratee_id = $1) as ratings,
       (select count(*)::text from claims c
          join orders o on o.id = c.order_id
         where o.seller_id = $1) as disputes`,
    [sellerId]
  );

  const r = rows[0];
  const sales = Number(r.sales);
  return {
    sales,
    average: r.average === null ? null : Number(r.average),
    ratings: Number(r.ratings),
    disputeRate: sales === 0 ? null : Math.round((Number(r.disputes) / sales) * 1000) / 10,
  };
}

export function listReviews(sellerId: string, limit = 10): Promise<Review[]> {
  return query<Review>(
    `select r.stars, r.review, coalesce(u.alias, u.name) as rater_alias, r.created_at
       from ratings r join "user" u on u.id = r.rater_id
      where r.ratee_id = $1 and r.review is not null
      order by r.created_at desc limit $2`,
    [sellerId, limit]
  );
}

export async function hasRated(orderId: string, raterId: string): Promise<boolean> {
  const rows = await query(
    `select 1 from ratings where order_id = $1 and rater_id = $2`,
    [orderId, raterId]
  );
  return rows.length > 0;
}
