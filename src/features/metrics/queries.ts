import { query } from "@/lib/db";

export type ListingMetrics = {
  listing_id: string;
  title: string;
  status: string;
  price_cop: number;
  /** La primera foto; si la publicación no tiene, el cuadro del video. */
  poster_path: string;
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

/**
 * Las publicaciones del vendedor con sus cifras, más recientes primero.
 *
 * `retiradas` separa las que se recuperan desde su propio grupo (corrección 31); el
 * límite es la paginación de «Tus publicaciones» (corrección 34).
 */
export function listSellerMetrics(
  sellerId: string,
  { retiradas = false, limite = 1000 }: { retiradas?: boolean; limite?: number } = {},
): Promise<ListingMetrics[]> {
  return query<ListingMetrics>(
    `select l.id as listing_id, l.title, l.status, l.price_cop,
            coalesce(
              (select p.path from listing_photos p
                where p.listing_id = l.id order by p.position, p.id limit 1),
              l.poster_path
            ) as poster_path,
            (select count(*)::int from listing_views v where v.listing_id = l.id) as views,
            (select count(*)::int from favorites f where f.listing_id = l.id) as favorites,
            (select count(*)::int from conversations c where c.listing_id = l.id) as messages
       from listings l
      where l.seller_id = $1 and l.status <> 'borrador'
        and (l.status = 'retirada') = $2
      order by l.created_at desc
      limit $3`,
    [sellerId, retiradas, limite]
  );
}

export type ResumenDelVendedor = {
  /** Sin borradores ni retiradas: lo que se pagina en «Tus publicaciones». */
  vigentes: number;
  retiradas: number;
  activas: number;
  visitas: number;
  guardados: number;
};

/** Las cifras de arriba, sin cargar todas las publicaciones para sumarlas. */
export async function resumenDelVendedor(sellerId: string): Promise<ResumenDelVendedor> {
  const rows = await query<ResumenDelVendedor>(
    `select count(*) filter (where l.status <> 'retirada')::int as vigentes,
            count(*) filter (where l.status = 'retirada')::int as retiradas,
            count(*) filter (where l.status = 'activa')::int as activas,
            -- Visitas y guardados de lo vigente: lo retirado ya no suma interés.
            coalesce(sum((select count(*) from listing_views v where v.listing_id = l.id))
              filter (where l.status <> 'retirada'), 0)::int as visitas,
            coalesce(sum((select count(*) from favorites f where f.listing_id = l.id))
              filter (where l.status <> 'retirada'), 0)::int as guardados
       from listings l
      where l.seller_id = $1 and l.status <> 'borrador'`,
    [sellerId]
  );
  return rows[0];
}
