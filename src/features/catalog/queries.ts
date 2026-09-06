import { query } from "@/lib/db";

export type Listing = {
  id: string;
  title: string;
  description: string;
  category: "tecnologia" | "ropa" | "hogar";
  condition: "nuevo" | "usado_bueno" | "usado_regular";
  price_cop: number;
  seller_alias: string;
  seller_zone: string;
};

const SELECT = `
  select l.id, l.title, l.description, l.category, l.condition, l.price_cop,
         s.alias as seller_alias, s.zone as seller_zone
  from listings l
  join sellers s on s.id = l.seller_id
`;

export function listListings(): Promise<Listing[]> {
  return query<Listing>(`${SELECT} order by l.created_at desc`);
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getListing(id: string): Promise<Listing | null> {
  // Un id con formato inválido no debe llegar a Postgres: allí produciría una
  // excepción de tipo en vez de un 404 limpio.
  if (!UUID.test(id)) return null;
  const rows = await query<Listing>(`${SELECT} where l.id = $1`, [id]);
  return rows[0] ?? null;
}
