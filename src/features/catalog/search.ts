import { query } from "@/lib/db";
import { CONDITION_LABEL, type Condition } from "./labels";
import { listingSelect, type Listing } from "./queries";
import { MAX_PROMOTED_PER_PAGE } from "@/features/promotions/config";
import { POR_PAGINA } from "./paginas";
import { RADIOS, type Radio } from "@/features/ubicacion/zonas";
import type { Punto } from "@/features/ubicacion/punto";

/** El mayor valor que cabe en `price_cop` (integer de Postgres). */
const MAX_PRECIO_COP = 2_147_483_647;

export type SortKey = "recientes" | "precio_asc" | "precio_desc" | "cerca";

export type SearchFilters = {
  q: string;
  /** Varias a la vez (corrección 2): «Ropa» y «Artículos para niños» juntas suman, no se excluyen. */
  categories: string[];
  minCop: number | null;
  maxCop: number | null;
  conditions: Condition[];
  zone: string | null;
  /** D-122: km alrededor de quien busca. Solo filtra si se sabe dónde está. */
  radio: Radio | null;
  verifiedOnly: boolean;
  sort: SortKey;
};

const SORT_SQL: Record<SortKey, string> = {
  recientes: "l.created_at desc",
  precio_asc: "l.price_cop asc",
  precio_desc: "l.price_cop desc",
  // Sin punto de quien busca no hay «cerca»: se ordena como «recientes». Con punto,
  // `ordenSql` lo reemplaza.
  cerca: "l.created_at desc",
};

/**
 * Lee los filtros de la dirección.
 *
 * Todo parámetro con basura se ignora en silencio en vez de romper la página: una
 * dirección compartida por chat llega recortada o pegada con cosas de más más
 * seguido de lo que uno cree, y un catálogo que se cae por eso pierde la venta.
 */
export function parseFilters(params: URLSearchParams): SearchFilters {
  // Pesos enteros: sin puntos (150000) o con los puntos de miles bien puestos
  // (150.000), con o sin «$». Cualquier otra cosa se descarta: antes se le
  // quitaba todo lo que no fuera dígito y «1abc2» filtraba por 12, «-999999» por
  // 999.999 y «1.5» por 15 (Luna, corrección 4).
  const int = (name: string): number | null => {
    const raw = params.get(name)?.trim().replace(/^\$\s*/, "");
    if (!raw || !/^(\d{1,3}(\.\d{3})+|\d+)$/.test(raw)) return null;
    const digitos = raw.replaceAll(".", "").replace(/^0+/, "");
    if (!digitos) return null;
    // Un número bien escrito pero enorme es «más que cualquier precio», no basura:
    // la caja lo trata así, y la dirección tiene que decir lo mismo (Luna).
    const n = digitos.length > 15 ? MAX_PRECIO_COP : Number(digitos);
    // `price_cop` es un entero de 32 bits: pasarle más tumbaba la consulta con
    // un 500. Por encima de eso no hay artículo, así que recortar no cambia nada.
    return Math.min(n, MAX_PRECIO_COP);
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
    // El tope solo protege de direcciones absurdas; es alto porque se aplica
    // antes de descartar las inventadas (`conCategoriasConocidas`), y con diez,
    // diez basuras delante se comían las válidas (Luna, corrección 2).
    categories: [...new Set(params.getAll("categoria").filter(Boolean))].slice(0, 50),
    minCop,
    maxCop,
    conditions,
    zone: params.get("zona") || null,
    radio: (RADIOS as readonly number[]).includes(Number(params.get("radio")))
      ? (Number(params.get("radio")) as Radio)
      : null,
    verifiedOnly: params.get("verificados") === "1",
    sort: sort && sort in SORT_SQL ? (sort as SortKey) : "recientes",
  };
}

/**
 * Deja solo las categorías que existen.
 *
 * `parseFilters` no conoce las categorías (no habla con la base), y una inventada
 * en la dirección contaba como filtro puesto: «Filtros 1» sin ninguna etiqueta
 * marcada y cero resultados (Luna, corrección 2).
 */
export function conCategoriasConocidas(
  f: SearchFilters,
  conocidas: { slug: string }[],
): SearchFilters {
  const slugs = new Set(conocidas.map((c) => c.slug));
  return { ...f, categories: f.categories.filter((c) => slugs.has(c)) };
}

/**
 * Los filtros en palabras, para proponer el nombre de un aviso: «Tecnología
 * hasta $999» o «Ropa y Artículos para niños en Chapinero». Sin esto, quien pedía el aviso
 * desde la portada tenía que inventarle un nombre (Luna, corrección 5).
 */
export function describirFiltros(f: SearchFilters, categorias: { slug: string; label: string }[]): string {
  const pesos = (n: number) => `$${n.toLocaleString("es-CO")}`;
  const nombres = f.categories
    .map((s) => categorias.find((c) => c.slug === s)?.label)
    .filter(Boolean) as string[];
  const partes = [
    f.q,
    nombres.length > 1
      ? `${nombres.slice(0, -1).join(", ")} y ${nombres.at(-1)}`
      : nombres[0],
    // Los tres estados marcados no filtran nada: nombrarlos solo alargaba el
    // nombre con «nuevo o usado, buen estado o usado, estado regular» (Luna).
    f.conditions.length && f.conditions.length < Object.keys(CONDITION_LABEL).length
      ? `(${f.conditions.map((c) => CONDITION_LABEL[c].toLowerCase()).join(" o ")})`
      : "",
    f.minCop && f.maxCop
      ? `de ${pesos(f.minCop)} a ${pesos(f.maxCop)}`
      : f.maxCop
        ? `hasta ${pesos(f.maxCop)}`
        : f.minCop
          ? `desde ${pesos(f.minCop)}`
          : "",
    f.zone ? `en ${f.zone}` : "",
    // El radio no entra: depende de dónde está quien busca, que no se guarda con el
    // aviso (D-122).
    f.verifiedOnly ? "de vendedores verificados" : "",
  ].filter(Boolean);
  const texto = partes.join(" ");
  if (texto.length <= 80) return texto;
  // Se corta en un espacio y se dice que se cortó: «de vendedo» sin más parecía
  // un error (Luna, corrección 5).
  const corte = texto.slice(0, 79);
  const espacio = corte.lastIndexOf(" ");
  return `${corte.slice(0, espacio > 40 ? espacio : 79).replace(/[\s,(]+$/, "")}…`;
}

/** Cuántos filtros hay puestos, para la marca del botón «Filtros». */
export function cuantosFiltros(f: SearchFilters): number {
  return (
    f.categories.length +
    f.conditions.length +
    (f.minCop || f.maxCop ? 1 : 0) +
    (f.zone ? 1 : 0) +
    (f.radio ? 1 : 0) +
    (f.verifiedOnly ? 1 : 0)
  );
}

/** ¿Hay algo filtrando, aparte del orden? */
export function hayFiltros(f: SearchFilters): boolean {
  return Boolean(
    f.q ||
      f.categories.length ||
      f.minCop ||
      f.maxCop ||
      f.conditions.length ||
      f.zone ||
      f.radio ||
      f.verifiedOnly,
  );
}

function condiciones(
  f: SearchFilters,
  punto: Punto | null = null,
): { where: string[]; values: unknown[]; distancia: string | null } {
  // Toda entrada del usuario entra como parámetro numerado. Nunca se concatena en
  // el texto de la consulta, ni siquiera "solo para este caso": eso es inyección
  // de SQL, y una comilla en el buscador bastaría.
  const where: string[] = [];
  const values: unknown[] = [];
  const add = (sql: string, value: unknown) => {
    values.push(value);
    where.push(sql.replace("$?", `$${values.length}`));
  };

  // D-122: el punto de quien busca también entra como parámetro. La expresión solo
  // lleva los números de los parámetros, nunca los valores.
  let distancia: string | null = null;
  if (punto) {
    values.push(punto.lat, punto.lng);
    distancia = `distancia_km(u.ubicacion_lat, u.ubicacion_lng, $${values.length - 1}, $${values.length})`;
  }

  if (f.q) {
    add(
      `to_tsvector('spanish', sin_tildes(l.title || ' ' || l.description))
         @@ plainto_tsquery('spanish', sin_tildes($?))`,
      f.q
    );
  }
  if (f.categories.length) add("l.category = any($?::text[])", f.categories);
  if (f.minCop !== null) add("l.price_cop >= $?", f.minCop);
  if (f.maxCop !== null) add("l.price_cop <= $?", f.maxCop);
  if (f.conditions.length) add("l.condition = any($?::listing_condition[])", f.conditions);
  if (f.zone) add("u.zone = $?", f.zone);
  // Un vendedor sin ubicación no está «a menos de 5 km»: queda fuera del radio.
  if (f.radio && distancia) add(`${distancia} <= $?`, f.radio);
  if (f.verifiedOnly) where.push("k.status = 'aprobado'");

  where.push("l.status = 'activa'");
  return { where, values, distancia };
}

function ordenSql(f: SearchFilters, distancia: string | null): string {
  if (f.sort === "cerca" && distancia) return `${distancia} asc nulls last, l.created_at desc`;
  return SORT_SQL[f.sort];
}

/**
 * Los artículos que cumplen los filtros, hasta la página `pagina` (correcciones 33
 * y 34: `?pagina=N` muestra los primeros N × 24).
 *
 * Arriba, hasta tres destacados (D-10), aunque sean viejos: se pagaron para estar
 * arriba, y con páginas uno de hace un mes quedaba fuera de la primera. Debajo, el
 * resto en el orden que se pidió, sin repetirlos. Dos reglas de la D-10 que importan
 * más que el orden: el destacado NO se salta los filtros (uno que no cumple el precio
 * o la categoría no se cuela: sería publicidad disfrazada de resultado), y el tope
 * de tres (el resto sigue el orden del comprador, no el de quien más paga).
 */
export async function searchListings(
  f: SearchFilters,
  pagina = 1,
  punto: Punto | null = null,
): Promise<Listing[]> {
  const { where, values, distancia } = condiciones(f, punto);
  const filtro = where.join(" and ");
  const select = listingSelect(distancia);
  const orden = ordenSql(f, distancia);
  const destacados = await query<Listing>(
    `${select} where ${filtro} and pr.id is not null
      order by ${orden} limit ${MAX_PROMOTED_PER_PAGE}`,
    values
  );
  const resto = await query<Listing>(
    `${select} where ${filtro} and not (l.id = any($${values.length + 1}::uuid[]))
      order by ${orden} limit $${values.length + 2}`,
    [...values, destacados.map((d) => d.id), pagina * POR_PAGINA - destacados.length]
  );
  return [...destacados, ...resto];
}

/** Cuántos artículos cumplen los filtros, para el «Ver N resultados» del panel. */
export async function countListings(
  f: SearchFilters,
  punto: Punto | null = null,
): Promise<number> {
  const { where, values } = condiciones(f, punto);
  const rows = await query<{ total: number }>(
    `select count(*)::int as total
       from listings l
       -- Las mismas uniones que LISTING_SELECT: si no, el panel cuenta artículos
       -- de vendedores suspendidos que la grilla no muestra.
       join "user" u on u.id = l.seller_id and u.suspended_at is null
       join categories c on c.slug = l.category
       left join kyc_verifications k on k.user_id = l.seller_id
      where ${where.join(" and ")}`,
    values,
  );
  return rows[0].total;
}
