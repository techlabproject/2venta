// Validación del NIT colombiano.
//
// El NIT trae dígito de verificación calculado con pesos fijos sobre módulo 11, así
// que un número inventado se detecta sin consultar nada. No prueba que la empresa
// exista ni que esté activa: eso necesitaría acceso a la DIAN, que no hay.
//
// Sirve para lo mismo que el IMEI: filtrar al que escribe cualquier cosa por salir
// del paso, que es la mayoría de los casos.

const WEIGHTS = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71];

export function normalizeNit(raw: string): string {
  return raw.replace(/\D/g, "");
}

/** Calcula el dígito de verificación de un NIT sin él. */
export function checkDigit(base: string): number {
  const digits = normalizeNit(base).split("").reverse();
  const sum = digits.reduce((acc, d, i) => acc + Number(d) * WEIGHTS[i], 0);
  const rest = sum % 11;
  return rest > 1 ? 11 - rest : rest;
}

/**
 * Acepta el NIT escrito con o sin el dígito de verificación.
 *
 * La gente lo escribe de las dos formas, y con puntos y guion. Si trae el dígito,
 * se comprueba; si no, se acepta el número base.
 */
export function isValidNit(raw: string): boolean {
  const text = raw.trim();
  const withDv = text.match(/^([\d.]{6,19})\s*-\s*(\d)$/);
  if (withDv) {
    const base = normalizeNit(withDv[1]);
    return base.length >= 6 && base.length <= 15 && checkDigit(base) === Number(withDv[2]);
  }
  const digits = normalizeNit(text);
  return digits.length >= 6 && digits.length <= 15 && !/^0+$/.test(digits);
}

/** Guarda siempre en el mismo formato: base con guion y dígito. */
export function formatNit(raw: string): string {
  const withDv = raw.trim().match(/^([\d.]{6,19})\s*-\s*(\d)$/);
  const base = normalizeNit(withDv ? withDv[1] : raw);
  return `${base}-${withDv ? withDv[2] : checkDigit(base)}`;
}
