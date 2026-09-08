import { query } from "@/lib/db";

export type Photo = { id: string; path: string };

export function listPhotos(listingId: string): Promise<Photo[]> {
  return query<Photo>(
    `select id::text, path from listing_photos where listing_id = $1
      order by position, id`,
    [listingId]
  );
}
