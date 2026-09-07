import { query } from "@/lib/db";
import type { Condition } from "./labels";

export type Category = { slug: string; label: string };

export type Listing = {
  id: string;
  title: string;
  description: string;
  category: string;
  category_label: string;
  condition: Condition;
  price_cop: number;
  video_path: string;
  poster_path: string;
  seller_id: string;
  seller_alias: string;
  seller_zone: string;
  /** Solo es cierto cuando el proveedor externo reportó "aprobado" (D-02). */
  seller_verified: boolean;
  status: string;
};

// El distintivo de verificado no es una columna que la aplicación pueda escribir:
// sale del estado que reportó el proveedor externo. Si no hay fila aprobada, no hay
// distintivo.
export const LISTING_SELECT = `
  select l.id, l.title, l.description, l.category, l.condition, l.price_cop,
         l.video_path, l.poster_path, l.status,
         c.label as category_label,
         l.seller_id,
         coalesce(u.alias, u.name) as seller_alias,
         coalesce(u.zone, 'Bogotá') as seller_zone,
         (k.status = 'aprobado') as seller_verified
  from listings l
  join "user" u          on u.id = l.seller_id
  join categories c      on c.slug = l.category
  left join kyc_verifications k on k.user_id = l.seller_id
`;

export function listCategories(): Promise<Category[]> {
  return query<Category>(
    `select slug, label from categories where active order by position`
  );
}

// Solo lo activo sale al público: lo que está en revisión, rechazado o vendido no
// tiene por qué verse.
export function listListings(category?: string): Promise<Listing[]> {
  if (category) {
    return query<Listing>(
      `${LISTING_SELECT} where l.status = 'activa' and l.category = $1 order by l.created_at desc`,
      [category]
    );
  }
  return query<Listing>(`${LISTING_SELECT} where l.status = 'activa' order by l.created_at desc`);
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type PublicSeller = {
  id: string;
  alias: string;
  zone: string;
  verified: boolean;
  member_since: Date;
  listing_count: number;
};

// Perfil público. D-04: alias y zona, nunca nombre completo, correo, celular ni
// dirección. La consulta ni siquiera trae esas columnas, para que no exista la
// posibilidad de filtrarlas por descuido en una pantalla.
export async function getPublicSeller(id: string): Promise<PublicSeller | null> {
  const rows = await query<PublicSeller>(
    `select u.id,
            coalesce(u.alias, u.name)  as alias,
            coalesce(u.zone, 'Bogotá') as zone,
            (k.status = 'aprobado')    as verified,
            u."createdAt"              as member_since,
            (select count(*)::int from listings l where l.seller_id = u.id) as listing_count
       from "user" u
       left join kyc_verifications k on k.user_id = u.id
      where u.id = $1`,
    [id]
  );
  return rows[0] ?? null;
}

export function listSellerListings(sellerId: string): Promise<Listing[]> {
  return query<Listing>(
    `${LISTING_SELECT} where l.seller_id = $1 and l.status = 'activa'
      order by l.created_at desc`,
    [sellerId]
  );
}

export async function getListing(id: string): Promise<Listing | null> {
  // Un id con formato inválido no debe llegar a Postgres: allí produciría una
  // excepción de tipo en vez de un 404 limpio.
  if (!UUID.test(id)) return null;
  const rows = await query<Listing>(`${LISTING_SELECT} where l.id = $1`, [id]);
  return rows[0] ?? null;
}
