import { query } from "@/lib/db";

export type ListingMetrics = {
  listing_id: string;
  title: string;
  status: string;
  views: number;
  favorites: number;
  messages: number;
};

/** Registra una vista. No cuenta las del propio vendedor. */
export async function recordView(
  listingId: string,
  viewerId: string | null,
  sellerId: string
): Promise<void> {
  if (viewerId && viewerId === sellerId) return;
  await query(`insert into listing_views (listing_id, viewer_id) values ($1, $2)`, [
    listingId,
    viewerId,
  ]);
}

export function listSellerMetrics(sellerId: string): Promise<ListingMetrics[]> {
  return query<ListingMetrics>(
    `select l.id as listing_id, l.title, l.status,
            (select count(*)::int from listing_views v where v.listing_id = l.id) as views,
            (select count(*)::int from favorites f where f.listing_id = l.id) as favorites,
            (select count(*)::int from conversations c where c.listing_id = l.id) as messages
       from listings l
      where l.seller_id = $1 and l.status <> 'borrador'
      order by l.created_at desc`,
    [sellerId]
  );
}
