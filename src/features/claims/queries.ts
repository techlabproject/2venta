import { query } from "@/lib/db";
import { MAX_PRUEBAS } from "./limites";

export { MAX_PRUEBAS };

export type ClaimKind = "no_coincide" | "no_llego";

export type Claim = {
  id: string;
  order_id: string;
  opened_by: string;
  kind: ClaimKind;
  detail: string;
  seller_reply: string | null;
  resolution: "comprador" | "vendedor" | null;
  resolution_note: string | null;
  resolved_at: Date | null;
  created_at: Date;
};

/** Plazos de la D-12, en horas desde la entrega registrada. */
export const WINDOW_HOURS: Record<ClaimKind, number> = {
  // El comprador ya tuvo el producto en la mano: la ventana es corta a propósito.
  no_coincide: 48,
  // Una guía marcada como entregada no siempre significa que llegó algo.
  no_llego: 24 * 7,
};

export const KIND_LABEL: Record<ClaimKind, string> = {
  no_coincide: "No coincide con lo publicado",
  no_llego: "Nunca me llegó",
};

export async function getClaim(orderId: string): Promise<Claim | null> {
  const rows = await query<Claim>(`select * from claims where order_id = $1`, [orderId]);
  return rows[0] ?? null;
}

export type ClaimPhoto = {
  id: string;
  path: string;
  uploaded_by: string;
  created_at: Date;
};

/**
 * Las fotos de un reclamo, en orden de llegada.
 *
 * No lleva comprobación de permiso dentro a propósito: quien la llama ya comprobó
 * que mira un pedido suyo (`/pedido/[id]`) o que es administrador (la cola de
 * disputas). Ponerla aquí también sería duplicar la regla en dos sitios y que se
 * separen con el tiempo.
 */
export function listClaimPhotos(claimId: string): Promise<ClaimPhoto[]> {
  return query<ClaimPhoto>(
    `select id::text, path, uploaded_by, created_at
       from claim_photos where claim_id = $1 order by created_at, id`,
    [claimId],
  );
}

export type OpenClaim = Claim & {
  buyer_alias: string;
  seller_alias: string;
  subtotal_cop: number;
  listing_title: string;
  video_path: string;
  /** Las pruebas de las dos partes, para decidir sin abrir otra pantalla. */
  photos: ClaimPhoto[];
};

/** La cola de arbitraje, con lo necesario para decidir sin abrir cinco pantallas. */
export function listOpenClaims(): Promise<OpenClaim[]> {
  return query<OpenClaim>(
    // El artículo sale de un `join lateral` con `limit 1` y no de un join directo
    // contra `order_items`. Con el join directo, un pedido de dos artículos
    // devolvía el MISMO reclamo dos veces, así que la cola decía «2 reclamos
    // abiertos» sobre un solo pedido y quien moderaba resolvía uno y seguía viendo
    // el otro (S-39; es el mismo error que la ronda de usuario encontró en
    // «Tu actividad»).
    `select c.*,
            coalesce(b.alias, b.name) as buyer_alias,
            coalesce(s.alias, s.name) as seller_alias,
            o.subtotal_cop,
            it.listing_title,
            it.video_path,
            coalesce(
              (select json_agg(
                        json_build_object(
                          'id', p.id::text, 'path', p.path,
                          'uploaded_by', p.uploaded_by, 'created_at', p.created_at)
                        order by p.created_at, p.id)
                 from claim_photos p where p.claim_id = c.id),
              '[]'::json) as photos
       from claims c
       join orders o on o.id = c.order_id
       join "user" b on b.id = o.buyer_id
       join "user" s on s.id = o.seller_id
       join lateral (
         select i.title_cop as listing_title, l.video_path
           from order_items i
           join listings l on l.id = i.listing_id
          where i.order_id = o.id
          order by i.id
          limit 1
       ) it on true
      where c.resolved_at is null
      order by c.created_at`
  );
}
