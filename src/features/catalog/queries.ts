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
  seller_is_store: boolean;
  /** La foto del vendedor, si puso una. Es una clave del bucket, no una dirección. */
  seller_avatar_path: string | null;
  /**
   * Si la publicación registró IMEI. Solo el hecho, nunca el número: el IMEI
   * identifica un equipo concreto y publicarlo deja rastrear a su dueño.
   */
  has_imei: boolean;
  /** Corrección 38: solo en ropa y en artículos para niños; null en lo anterior. */
  talla: string | null;
  edad: string | null;
  promoted: boolean;
  status: string;
  /**
   * D-122: km entre el vendedor y quien mira, si se sabe dónde están los dos. Sale
   * de puntos en cuadrícula de ~1 km, así que se muestra redondeada.
   */
  distancia_km: number | null;
};

// El distintivo de verificado no es una columna que la aplicación pueda escribir:
// sale del estado que reportó el proveedor externo. Si no hay fila aprobada, no hay
// distintivo.
//
// `distancia` es una expresión que arma el buscador con números de parámetro
// (`distancia_km(u.ubicacion_lat, u.ubicacion_lng, $1, $2)`), nunca con valores: los
// del comprador entran como parámetros (D-122). Sin punto, la columna es nula.
export function listingSelect(distancia: string | null): string {
  return LISTING_SELECT.replace("/*distancia*/ null", distancia ?? "null");
}

export const LISTING_SELECT = `
  select l.id, l.title, l.description, l.category, l.condition, l.price_cop,
         l.video_path,
         -- La portada es la primera foto si la hay; si no, el cuadro del video.
         coalesce(
           (select p.path from listing_photos p
             where p.listing_id = l.id order by p.position, p.id limit 1),
           l.poster_path
         ) as poster_path,
         l.status,
         c.label as category_label,
         l.seller_id,
         coalesce(u.alias, u.name) as seller_alias,
         coalesce(u.zone, 'Bogotá') as seller_zone,
         (k.status = 'aprobado') as seller_verified,
         (st.user_id is not null) as seller_is_store,
         u.avatar_path as seller_avatar_path,
         (l.imei is not null) as has_imei,
         l.talla, l.edad,
         (pr.id is not null) as promoted,
         /*distancia*/ null::double precision as distancia_km
  from listings l
  -- Las publicaciones de una cuenta suspendida no se ven (RF-41).
  join "user" u          on u.id = l.seller_id and u.suspended_at is null
  join categories c      on c.slug = l.category
  left join kyc_verifications k on k.user_id = l.seller_id
  left join stores st on st.user_id = l.seller_id and st.archivada_at is null and st.nit_confirmado_at is not null
  left join lateral (
    select p.id from promotions p
     where p.listing_id = l.id and p.status = 'activa' and p.ends_at > now()
     limit 1
  ) pr on true
`;

export function listCategories(): Promise<Category[]> {
  return query<Category>(
    `select slug, label from categories where active order by position`
  );
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type PublicSeller = {
  id: string;
  alias: string;
  zone: string;
  verified: boolean;
  is_store: boolean;
  legal_name: string | null;
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
            (st.user_id is not null)   as is_store,
            st.legal_name,
            u."createdAt"              as member_since,
            (select count(*)::int from listings l where l.seller_id = u.id) as listing_count
       from "user" u
       left join kyc_verifications k on k.user_id = u.id
       left join stores st on st.user_id = u.id and st.archivada_at is null and st.nit_confirmado_at is not null
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
