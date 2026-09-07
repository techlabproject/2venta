import { query } from "@/lib/db";
import { CONDITION_LABEL, type Condition } from "./labels";
import { LISTING_SELECT, type Listing } from "./queries";
import { MAX_PROMOTED_PER_PAGE } from "@/features/promotions/config";

export type SortKey = "recientes" | "precio_asc" | "precio_desc";

export type SearchFilters = {
  q: string;
  category: string | null;
  minCop: number | null;
  maxCop: number | null;
  conditions: Condition[];
  zone: string | null;
  verifiedOnly: boolean;
  sort: SortKey;
};

const SORT_SQL: Record<SortKey, string> = {
  recientes: "l.created_at desc",
  precio_asc: "l.price_cop asc",
  precio_desc: "l.price_cop desc",
};

/**
 * Sube los destacados al principio, con tope.
 *
 * Dos reglas que salieron de la D-10 y que importan más que el orden en sí:
 *
 * El destacado NO altera los filtros. Se aplica sobre el conjunto que el comprador
 * ya filtró, así que un destacado que no cumpla el rango de precio o la categoría
 * no se cuela. Un destacado que ignora el filtro es publicidad disfrazada de
 * resultado, y el comprador lo nota una vez y ya no confía en el orden nunca más.
 *
 * Y el tope: como máximo tres arriba. El resto del listado sigue el orden que pidió
 * el comprador, no el de quien más paga.
 */
function reorderWithPromoted(rows: Listing[], max: number): Listing[] {
  const promoted = rows.filter((r) => r.promoted).slice(0, max);
  const ids = new Set(promoted.map((r) => r.id));
  return [...promoted, ...rows.filter((r) => !ids.has(r.id))];
}

/**
 * Lee los filtros de la dirección.
 *
 * Todo parámetro con basura se ignora en silencio en vez de romper la página: una
 * dirección compartida por chat llega recortada o pegada con cosas de más más
 * seguido de lo que uno cree, y un catálogo que se cae por eso pierde la venta.
 */
export function parseFilters(params: URLSearchParams): SearchFilters {
  const int = (name: string): number | null => {
    const raw = params.get(name)?.replace(/\D/g, "");
    if (!raw) return null;
    const n = Number(raw);
    return Number.isSafeInteger(n) && n > 0 ? n : null;
  };

  let minCop = int("min");
  let maxCop = int("max");
  // Un mínimo mayor que el máximo no devuelve nada útil, así que se ordenan.
  if (minCop !== null && maxCop !== null && minCop > maxCop) {
    [minCop, maxCop] = [maxCop, minCop];
  }

  const conditions = params
    .getAll("estado")
    .filter((c): c is Condition => c in CONDITION_LABEL);

  const sort = params.get("orden");

  return {
    q: (params.get("q") ?? "").trim().slice(0, 120),
    category: params.get("categoria") || null,
    minCop,
    maxCop,
    conditions,
    zone: params.get("zona") || null,
    verifiedOnly: params.get("verificados") === "1",
    sort: sort && sort in SORT_SQL ? (sort as SortKey) : "recientes",
  };
}

export async function searchListings(f: SearchFilters): Promise<Listing[]> {
  // Toda entrada del usuario entra como parámetro numerado. Nunca se concatena en
  // el texto de la consulta, ni siquiera "solo para este caso": eso es inyección
  // de SQL, y una comilla en el buscador bastaría.
  const where: string[] = [];
  const values: unknown[] = [];
  const add = (sql: string, value: unknown) => {
    values.push(value);
    where.push(sql.replace("$?", `$${values.length}`));
  };

  if (f.q) {
    add(
      `to_tsvector('spanish', sin_tildes(l.title || ' ' || l.description))
         @@ plainto_tsquery('spanish', sin_tildes($?))`,
      f.q
    );
  }
  if (f.category) add("l.category = $?", f.category);
  if (f.minCop !== null) add("l.price_cop >= $?", f.minCop);
  if (f.maxCop !== null) add("l.price_cop <= $?", f.maxCop);
  if (f.conditions.length) add("l.condition = any($?::listing_condition[])", f.conditions);
  if (f.zone) add("u.zone = $?", f.zone);
  if (f.verifiedOnly) where.push("k.status = 'aprobado'");

  where.push("l.status = 'activa'");

  const rows = await query<Listing>(
    `${LISTING_SELECT} where ${where.join(" and ")} order by ${SORT_SQL[f.sort]} limit 60`,
    values
  );
  return reorderWithPromoted(rows, MAX_PROMOTED_PER_PAGE);
}

export function listZones(): Promise<{ zone: string }[]> {
  return query<{ zone: string }>(
    `select distinct u.zone from listings l join "user" u on u.id = l.seller_id
      where u.zone is not null order by u.zone`
  );
}
