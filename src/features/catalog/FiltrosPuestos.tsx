import Link from "next/link";
import { CONDITION_LABEL } from "./labels";
import type { SearchFilters } from "./search";

/**
 * Los filtros puestos, como etiquetas arriba de los resultados, cada una con su X
 * (revisión de diseño, D-130, decisión 3). Antes solo se veía un número en el botón
 * «Filtros» y no se sabía qué estaba filtrando. Son enlaces: funcionan sin JavaScript
 * y cada uno es la misma dirección sin ese filtro.
 *
 * `base` es la pantalla (`/` o `/buscar`); `conservar` lo que «Quitar todo» no quita
 * (la palabra buscada).
 */
const pesos = (n: number) => `$ ${n.toLocaleString("es-CO")}`;

export function FiltrosPuestos({
  base,
  params,
  filters,
  categories,
  conservar = [],
}: {
  base: string;
  params: URLSearchParams;
  filters: SearchFilters;
  categories: { slug: string; label: string }[];
  conservar?: string[];
}) {
  const sin = (quitar: (clave: string, valor: string) => boolean) => {
    const p = new URLSearchParams();
    for (const [k, v] of params) if (!quitar(k, v) && k !== "pagina") p.append(k, v);
    const qs = p.toString();
    return qs ? `${base}?${qs}` : base;
  };

  const etiquetas: { texto: string; href: string }[] = [];
  for (const slug of filters.categories) {
    const c = categories.find((x) => x.slug === slug);
    if (c) etiquetas.push({ texto: c.label, href: sin((k, v) => k === "categoria" && v === slug) });
  }
  if (filters.minCop || filters.maxCop) {
    const texto =
      filters.minCop && filters.maxCop
        ? `${pesos(filters.minCop)} – ${pesos(filters.maxCop)}`
        : filters.minCop
          ? `Desde ${pesos(filters.minCop)}`
          : `Hasta ${pesos(filters.maxCop!)}`;
    etiquetas.push({ texto, href: sin((k) => k === "min" || k === "max") });
  }
  for (const e of filters.conditions) {
    etiquetas.push({ texto: CONDITION_LABEL[e], href: sin((k, v) => k === "estado" && v === e) });
  }
  if (filters.radio) etiquetas.push({ texto: `A menos de ${filters.radio} km`, href: sin((k) => k === "radio") });
  if (filters.zone) etiquetas.push({ texto: `Vende en ${filters.zone}`, href: sin((k) => k === "zona") });
  if (filters.verifiedOnly) etiquetas.push({ texto: "Solo verificados", href: sin((k) => k === "verificados") });

  if (etiquetas.length === 0) return null;
  const todo = sin((k) => !conservar.includes(k));

  return (
    // Un grupo y no una lista: la grilla de artículos es la lista de la página.
    <div role="group" aria-label="Filtros puestos" className="mt-3 flex flex-wrap items-center gap-2">
      {etiquetas.map((e) => (
          <span key={e.texto} data-testid="filtro-puesto" className="inline-flex items-center gap-1 rounded-full bg-brand/10 py-1 pl-3 pr-1 text-sm text-brand">
            {e.texto}
            <Link
              href={e.href}
              scroll={false}
              aria-label={`Quitar ${e.texto}`}
              className="grid size-6 place-items-center rounded-full transition hover:bg-brand/15"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </Link>
          </span>
      ))}
      <Link href={todo} scroll={false} className="px-1 text-sm text-ink2 underline">
        Quitar todo
      </Link>
    </div>
  );
}
