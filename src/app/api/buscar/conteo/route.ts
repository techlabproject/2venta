import { NextResponse } from "next/server";
import { listCategories } from "@/features/catalog/queries";
import {
  conCategoriasConocidas,
  countListings,
  parseFilters,
} from "@/features/catalog/search";

/**
 * Cuántos artículos dan unos filtros, para el «Ver N resultados» del panel.
 *
 * Público y sin datos de nadie: es el mismo conteo que cualquiera obtiene
 * contando la grilla de `/buscar` con esos filtros.
 */
export async function GET(req: Request) {
  const filtros = conCategoriasConocidas(
    parseFilters(new URL(req.url).searchParams),
    await listCategories(),
  );
  return NextResponse.json({ total: await countListings(filtros) });
}
