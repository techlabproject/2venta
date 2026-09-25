/**
 * El precio mientras se escribe (corrección 24). Lo usan los campos de publicar,
 * editar y ofertar; el servidor sigue leyendo con `parseCop`, que acepta los puntos
 * de miles. No importa nada: corre en el navegador.
 *
 * Pesos colombianos enteros: no hay centavos (CLAUDE.md).
 */

/** Hasta mil millones menos uno: más que eso es un error de dedo, no un precio. */
const MAXIMO_DIGITOS = 9;

/** Solo los dígitos: «$ 260.000», «260,000» o «260.000,00» → «260000». */
export function digitosDePrecio(crudo: string): string {
  // Una coma con uno o dos dígitos al final es un decimal a la colombiana
  // («260.000,50»): se descarta, porque no hay centavos. Los puntos los pone el
  // campo, así que borrar hacia atrás en «1.500» no cae aquí.
  const sinDecimales = crudo.replace(/,\d{0,2}$/, "");
  return sinDecimales.replace(/\D/g, "").replace(/^0+/, "").slice(0, MAXIMO_DIGITOS);
}

/** «260000» → «260.000», también a medias («2.600»). */
export function formatearPrecio(digitos: string): string {
  return digitos.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/** Qué está mal, en palabras de persona; `null` si sirve. */
export function problemaDePrecio(crudo: string, minimo: number): string | null {
  const d = digitosDePrecio(crudo);
  if (!d) return "Escribe el precio en pesos.";
  if (Number(d) < minimo) return `El mínimo es $${formatearPrecio(String(minimo))}.`;
  return null;
}
