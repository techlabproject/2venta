/**
 * La edad para registrarse (corrección 11, hallazgo de Luna; decisión de Nicolás).
 *
 * El art. 52 de la Ley 1480 pide «las medidas posibles para verificar la edad» en
 * el comercio electrónico. La medida es pedir la fecha de nacimiento y no crear
 * cuentas de menores de 18: así no hay compras de menores que exijan constancia del
 * permiso de sus padres. La fecha viaja como AAAA-MM-DD (lo que da un `<input
 * type="date">`). No importa nada: la usan la pantalla y el servidor.
 */

export const EDAD_MINIMA = 18;

/** Años cumplidos el día `hoy` (AAAA-MM-DD), o `null` si la fecha no sirve. */
export function edadCumplida(fecha: string, hoy: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fecha);
  const h = /^(\d{4})-(\d{2})-(\d{2})$/.exec(hoy);
  if (!m || !h) return null;
  const [a, mes, dia] = [Number(m[1]), Number(m[2]), Number(m[3])];
  // Una fecha que el calendario no tiene (31 de febrero) no sirve.
  const d = new Date(Date.UTC(a, mes - 1, dia));
  if (d.getUTCFullYear() !== a || d.getUTCMonth() !== mes - 1 || d.getUTCDate() !== dia) return null;
  const [ha, hm, hd] = [Number(h[1]), Number(h[2]), Number(h[3])];
  let edad = ha - a;
  if (hm < mes || (hm === mes && hd < dia)) edad--;
  return edad;
}

/** Hoy en Bogotá, como AAAA-MM-DD. */
export function hoyEnBogota(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date());
}

/** Qué está mal, en palabras de persona; `null` si tiene 18 o más. */
export function problemaDeNacimiento(fecha: string, hoy = hoyEnBogota()): string | null {
  if (!fecha.trim()) return "Escribe tu fecha de nacimiento.";
  const edad = edadCumplida(fecha.trim(), hoy);
  if (edad === null || edad < 0 || edad > 120) return "Esa fecha no parece real. Revísala.";
  if (edad < EDAD_MINIMA) return `Para usar 2venta debes tener ${EDAD_MINIMA} años o más.`;
  return null;
}
