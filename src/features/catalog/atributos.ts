/**
 * Los campos propios de cada categoría (corrección 38, decisión de Nicolás): talla
 * en ropa y edad en artículos para niños, además del IMEI de los celulares.
 * Listas cerradas: así se pueden filtrar después sin adivinar cómo escribió cada
 * quien «talla m», «M» o «mediana».
 *
 * No importa nada del servidor: lo usan el formulario y la validación.
 */

export const TALLAS_LETRA = ["XS", "S", "M", "L", "XL", "XXL", "Talla única"] as const;
/** Números de 2 a 46: niños (2–16), pantalón (28–40) y calzado (34–44, con impares). */
export const TALLAS_NUMERO = Array.from({ length: 45 }, (_, i) => String(2 + i));
export const TALLAS: readonly string[] = [...TALLAS_LETRA, ...TALLAS_NUMERO];

export const EDADES = [
  "0 a 6 meses",
  "6 a 12 meses",
  "1 a 2 años",
  "3 a 4 años",
  "5 a 7 años",
  "8 a 11 años",
  "12 años o más",
] as const;

/** Qué campo pide cada categoría, y cómo se ve en la ficha. */
export const CAMPO_DE_CATEGORIA: Record<string, "talla" | "edad" | undefined> = {
  ropa: "talla",
  ninos: "edad",
};

export function etiquetaDeTalla(talla: string): string {
  return talla === "Talla única" ? talla : `Talla ${talla}`;
}

export function etiquetaDeEdad(edad: string): string {
  return `Para ${edad}`;
}
