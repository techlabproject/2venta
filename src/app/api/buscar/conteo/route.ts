import { NextResponse } from "next/server";
import { listCategories } from "@/features/catalog/queries";
import {
  conCategoriasConocidas,
  countListings,
  parseFilters,
  sinDistanciaSinPunto,
} from "@/features/catalog/search";
import { puntoDelComprador } from "@/features/ubicacion/comprador";

/**
 * Cuántos artículos dan unos filtros, para el «Ver N resultados» del panel.
 *
 * Público y sin datos de nadie: es el mismo conteo que cualquiera obtiene
 * contando la grilla de `/buscar` con esos filtros.
 */
export async function GET(req: Request) {
  // D-122: el radio se cuenta desde el punto de la cookie de quien pregunta.
  const punto = await puntoDelComprador();
  const filtros = sinDistanciaSinPunto(
    conCategoriasConocidas(parseFilters(new URL(req.url).searchParams), await listCategories()),
    punto,
  );
  return NextResponse.json({ total: await countListings(filtros, punto) });
}
