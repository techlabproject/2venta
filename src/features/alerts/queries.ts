import { query } from "@/lib/db";
import { parseFilters, searchListings } from "@/features/catalog/search";

export type SavedSearch = { id: string; label: string; params: string };
export type Notification = {
  id: string;
  title: string;
  href: string;
  read_at: Date | null;
  created_at: Date;
};

export function listSavedSearches(userId: string): Promise<SavedSearch[]> {
  return query<SavedSearch>(
    `select id, label, params from saved_searches where user_id = $1
      order by created_at desc`,
    [userId]
  );
}

export function listNotifications(userId: string): Promise<Notification[]> {
  return query<Notification>(
    `select id::text, title, href, read_at, created_at from notifications
      where user_id = $1 order by created_at desc limit 30`,
    [userId]
  );
}

export async function countUnread(userId: string): Promise<number> {
  const rows = await query<{ n: string }>(
    `select count(*)::text as n from notifications where user_id = $1 and read_at is null`,
    [userId]
  );
  return Number(rows[0].n);
}

/**
 * Avisa a quien guardó una búsqueda que coincide con esta publicación.
 *
 * La ejecuta el worker cuando llega el mensaje `avisar` que encola la acción de
 * publicar (D-51). Con el volumen de una ciudad, recorrer las búsquedas
 * guardadas y correr cada una es más simple y más barato que mantener un índice
 * invertido, y se puede cambiar sin que nadie lo note cuando deje de serlo.
 */
export async function notifyMatchingSearches(listing: {
  id: string;
  title: string;
  seller_id: string;
}): Promise<number> {
  const searches = await query<SavedSearch & { user_id: string }>(
    `select id, user_id, label, params from saved_searches`
  );

  let sent = 0;
  for (const search of searches) {
    // A nadie le interesa que le avisen de su propia publicación.
    if (search.user_id === listing.seller_id) continue;

    const filters = parseFilters(new URLSearchParams(search.params));
    const results = await searchListings(filters);
    if (!results.some((r) => r.id === listing.id)) continue;

    // La restricción de unicidad hace el resto: no se avisa dos veces de lo mismo.
    const inserted = await query<{ id: string }>(
      `insert into notifications (user_id, kind, title, href, subject_id)
       values ($1, 'busqueda', $2, $3, $4)
       on conflict (user_id, kind, subject_id) do nothing
       returning id`,
      [
        search.user_id,
        `Apareció algo en "${search.label}": ${listing.title}`,
        `/producto/${listing.id}`,
        listing.id,
      ]
    );
    if (inserted.length) sent++;
  }
  return sent;
}

/**
 * Lo que llama el worker: carga la publicación por id y avisa.
 *
 * Solo si sigue activa. Entre encolar y procesar pudo entrar a revisión o
 * retirarse, y avisar de algo que ya no se ve manda a la gente a una pantalla
 * que no existe. Devuelve null si la publicación no existe: el mensaje se
 * descarta, reintentarlo no la va a hacer aparecer.
 */
export async function notifyForListing(listingId: string): Promise<number | null> {
  const rows = await query<{ id: string; title: string; seller_id: string; status: string }>(
    `select id, title, seller_id, status from listings where id = $1`,
    [listingId]
  );
  const listing = rows[0];
  if (!listing) return null;
  if (listing.status !== "activa") return 0;
  return notifyMatchingSearches(listing);
}
