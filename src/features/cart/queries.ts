import { query } from "@/lib/db";

export type CartItem = {
  listing_id: string;
  title: string;
  price_cop: number;
  poster_path: string | null;
  status: string;
  seller_id: string;
  seller_alias: string;
};

export function listCart(userId: string): Promise<CartItem[]> {
  return query<CartItem>(
    `select l.id as listing_id, l.title, l.price_cop, l.poster_path, l.status,
            l.seller_id, coalesce(u.alias, u.name) as seller_alias
       from cart_items c
       join listings l on l.id = c.listing_id
       join "user" u   on u.id = l.seller_id
      where c.user_id = $1
      order by c.added_at`,
    [userId]
  );
}

export async function cartCount(userId: string): Promise<number> {
  const rows = await query<{ n: string }>(
    `select count(*)::text as n from cart_items where user_id = $1`,
    [userId]
  );
  return Number(rows[0].n);
}

export async function isInCart(userId: string, listingId: string): Promise<boolean> {
  const rows = await query(
    `select 1 from cart_items where user_id = $1 and listing_id = $2`,
    [userId, listingId]
  );
  return rows.length > 0;
}
