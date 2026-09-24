/**
 * El celular colombiano, en un solo sitio (corrección 7).
 *
 * La versión 1 es solo Colombia (D-06, corrección 10): 10 dígitos que empiezan por
 * 3, guardados como `+57…`. Lo usan la pantalla (para limpiar, agrupar y explicar)
 * y el servidor (para no creerle a la pantalla). No importa nada.
 */

/** Solo los 10 dígitos, aunque se pegue «+57 300 412 8805» o «(300) 412-8805». */
export function digitosDeCelular(crudo: string): string {
  let d = crudo.replace(/\D/g, "");
  if (d.length > 10 && d.startsWith("57")) d = d.slice(2);
  return d.slice(0, 10);
}

/** «3004128805» → «300 412 8805», también a medias («300 41»). */
export function formatearCelular(digitos: string): string {
  return [digitos.slice(0, 3), digitos.slice(3, 6), digitos.slice(6, 10)]
    .filter(Boolean)
    .join(" ");
}

/** Qué está mal, en palabras de persona; `null` si es un celular colombiano. */
export function problemaDeCelular(crudo: string): string | null {
  const d = digitosDeCelular(crudo);
  if (!d) return "Escribe tu celular.";
  if (!d.startsWith("3")) return "¡Uy! Los celulares en Colombia empiezan por 3.";
  if (d.length < 10) {
    const faltan = 10 - d.length;
    return `Te ${faltan === 1 ? "falta 1 dígito" : `faltan ${faltan} dígitos`}: son 10 en total.`;
  }
  return null;
}

/** `+573004128805`, o `null` si no es un celular colombiano. */
export function normalizarCelular(crudo: string): string | null {
  const d = digitosDeCelular(crudo);
  return /^3\d{9}$/.test(d) ? `+57${d}` : null;
}

/** Lo que guarda la base: `+57` y diez dígitos, nada más. */
export const CELULAR_GUARDADO = /^\+573\d{9}$/;
