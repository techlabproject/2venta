import { query } from "@/lib/db";

export type Promotion = {
  id: string;
  listing_id: string;
  status: "pendiente_pago" | "activa" | "cancelada";
  ends_at: Date | null;
};

export async function getActivePromotion(listingId: string): Promise<Promotion | null> {
  const rows = await query<Promotion>(
    `select id, listing_id, status, ends_at from promotions
      where listing_id = $1 and status = 'activa' and ends_at > now()
      order by ends_at desc limit 1`,
    [listingId]
  );
  return rows[0] ?? null;
}

export async function findByProviderRef(ref: string): Promise<Promotion | null> {
  const rows = await query<Promotion>(
    `select id, listing_id, status, ends_at from promotions where provider_ref = $1`,
    [ref]
  );
  return rows[0] ?? null;
}
