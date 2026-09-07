import { query } from "@/lib/db";

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

export type OpenClaim = Claim & {
  buyer_alias: string;
  seller_alias: string;
  subtotal_cop: number;
  listing_title: string;
  video_path: string;
};

/** La cola de arbitraje, con lo necesario para decidir sin abrir cinco pantallas. */
export function listOpenClaims(): Promise<OpenClaim[]> {
  return query<OpenClaim>(
    `select c.*,
            coalesce(b.alias, b.name) as buyer_alias,
            coalesce(s.alias, s.name) as seller_alias,
            o.subtotal_cop,
            i.title_cop as listing_title,
            l.video_path
       from claims c
       join orders o      on o.id = c.order_id
       join "user" b      on b.id = o.buyer_id
       join "user" s      on s.id = o.seller_id
       join order_items i on i.order_id = o.id
       join listings l    on l.id = i.listing_id
      where c.resolved_at is null
      order by c.created_at`
  );
}
