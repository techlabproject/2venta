import { query } from "@/lib/db";
import { LISTING_SELECT, type Listing } from "@/features/catalog/queries";

export async function isFavorite(userId: string, listingId: string): Promise<boolean> {
  const rows = await query(
    `select 1 from favorites where user_id = $1 and listing_id = $2`,
    [userId, listingId]
  );
  return rows.length > 0;
}

/**
 * Los favoritos de alguien.
 *
 * Incluye los vendidos a propósito: al comprador le sirve saber que eso que le
 * gustaba ya se fue, y hacerlo desaparecer en silencio se siente como un error de
 * la app. La pantalla los marca como no disponibles.
 */
export function listFavorites(userId: string): Promise<Listing[]> {
  return query<Listing>(
    `${LISTING_SELECT}
      join favorites f on f.listing_id = l.id and f.user_id = $1
     where l.status in ('activa','reservada','vendida')
     order by f.created_at desc`,
    [userId]
  );
}
