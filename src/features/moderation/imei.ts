// Validación de IMEI (D-15, D-16).
//
// El IMEI trae dígito verificador calculado con Luhn, así que un número inventado
// se detecta sin consultar nada. Eso no prueba que el equipo no sea robado, pero
// filtra de entrada al que escribe cualquier cosa por salir del paso.
//
// R-03: no hay API pública para contrastar contra la base de equipos reportados,
// así que la verificación de verdad queda en revisión humana. Pedir el IMEI igual
// sirve por dos razones: se guarda desde ya para poder contrastar después sin
// volver a molestar a nadie, y pedirlo ahuyenta a una parte de quien vende robado.

export const IMEI_LENGTH = 15;

export function normalizeImei(raw: string): string {
  return raw.replace(/\D/g, "");
}

/** Comprueba largo y dígito verificador. */
export function isValidImei(raw: string): boolean {
  const imei = normalizeImei(raw);
  if (imei.length !== IMEI_LENGTH) return false;
  // Un IMEI de puros ceros pasa Luhn pero no existe.
  if (/^0+$/.test(imei)) return false;
  return luhnCheck(imei);
}

/**
 * Algoritmo de Luhn: se duplica un dígito de cada dos desde la derecha, y si el
 * resultado pasa de nueve se le restan nueve. La suma total tiene que ser múltiplo
 * de diez.
 */
function luhnCheck(digits: string): boolean {
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let value = Number(digits[digits.length - 1 - i]);
    if (i % 2 === 1) {
      value *= 2;
      if (value > 9) value -= 9;
    }
    sum += value;
  }
  return sum % 10 === 0;
}

/** Solo para pruebas y datos sembrados: completa un IMEI válido. */
export function imeiWithCheckDigit(first14: string): string {
  const base = normalizeImei(first14).slice(0, 14).padStart(14, "0");
  for (let d = 0; d <= 9; d++) {
    if (luhnCheck(base + d)) return base + d;
  }
  throw new Error("no se pudo calcular el dígito verificador");
}
