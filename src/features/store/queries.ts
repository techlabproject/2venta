import { query } from "@/lib/db";

export type Store = { user_id: string; legal_name: string; nit: string };

export async function getStore(userId: string): Promise<Store | null> {
  const rows = await query<Store>(
    // Solo la persona jurídica vigente y con el NIT confirmado (corrección 15): las
    // tiendas de antes quedaron archivadas y una empresa nueva espera la revisión.
    `select user_id, legal_name, nit from stores
      where user_id = $1 and archivada_at is null and nit_confirmado_at is not null`,
    [userId]
  );
  return rows[0] ?? null;
}

export type Draft = {
  id: string;
  title: string;
  price_cop: number;
  category_label: string;
};

/** Borradores de la tienda: tienen todo menos el video. */
export function listDrafts(userId: string): Promise<Draft[]> {
  return query<Draft>(
    `select l.id, l.title, l.price_cop, c.label as category_label
       from listings l join categories c on c.slug = l.category
      where l.seller_id = $1 and l.status = 'borrador'
      order by l.created_at`,
    [userId]
  );
}
