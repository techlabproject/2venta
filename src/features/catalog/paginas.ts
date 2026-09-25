/**
 * Paginación del catálogo y de «Tus publicaciones» (correcciones 33 y 34, decisión
 * de Nicolás): 24 por página y «Ver más» al final.
 *
 * `?pagina=N` muestra los primeros N × 24, no solo los de la página N: con
 * JavaScript, el enlace «Ver más» trae la página siguiente sin mover el scroll y lo
 * nuevo aparece debajo de lo que ya se veía; sin JavaScript es una página normal que
 * un buscador puede seguir (D-25). No hay estado en el navegador.
 *
 * No importa nada del servidor: lo usan pantallas y consultas.
 */
export const POR_PAGINA = 24;

/** Hasta 50 páginas (1.200 artículos): más que eso es un enlace armado a mano. */
export const MAX_PAGINAS = 50;

/** El número de página de la dirección; cualquier basura es la 1. */
export function leerPagina(crudo: string | string[] | null | undefined): number {
  const texto = Array.isArray(crudo) ? crudo[0] : crudo;
  if (!texto || !/^\d{1,3}$/.test(texto)) return 1;
  return Math.min(Math.max(Number(texto), 1), MAX_PAGINAS);
}

/** La misma dirección, con la página siguiente. Conserva los filtros. */
export function hrefDePagina(ruta: string, params: URLSearchParams, pagina: number): string {
  const p = new URLSearchParams(params);
  if (pagina <= 1) p.delete("pagina");
  else p.set("pagina", String(pagina));
  const qs = p.toString();
  return qs ? `${ruta}?${qs}` : ruta;
}
