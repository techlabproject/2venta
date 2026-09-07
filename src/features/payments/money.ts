// Aritmética del dinero. Todo entero, en pesos colombianos.
//
// Vive aparte y sin depender de nada más para poder probarse sola: es el punto
// donde un error no se ve en pantalla y aparece meses después en la conciliación.

/** D-09b: 5% del subtotal, con piso y techo. */
export const COMMISSION_RATE = 0.05;
export const COMMISSION_MIN_COP = 2_500;
export const COMMISSION_MAX_COP = 120_000;

/**
 * D-29: precio mínimo de publicación.
 *
 * Es consecuencia directa del piso de comisión, y nadie lo había nombrado: sin un
 * mínimo, un artículo de $3.000 pagaría el 83% de comisión. En $10.000 el piso
 * equivale al 25%, que ya es alto pero defendible para el tramo más barato.
 */
export const MIN_PRICE_COP = 10_000;

/**
 * Comisión que cobra 2venta sobre un subtotal.
 *
 * El redondeo va al entero más cercano. La diferencia la absorbe la comisión y no
 * el vendedor: es de un peso como mucho, pero tener escrito hacia dónde cae evita
 * discusiones cuando alguien cuadre las cuentas del mes.
 */
export function commissionCop(subtotalCop: number): number {
  assertMoney(subtotalCop);
  const raw = Math.round(subtotalCop * COMMISSION_RATE);
  return clamp(raw, COMMISSION_MIN_COP, COMMISSION_MAX_COP);
}

/** Lo que recibe el vendedor: el subtotal menos la comisión. */
export function sellerPayoutCop(subtotalCop: number): number {
  return subtotalCop - commissionCop(subtotalCop);
}

/**
 * Desglose completo de un pedido. Que las tres cifras salgan de una sola función
 * es lo que garantiza que siempre cuadren entre sí.
 */
export function breakdown(subtotalCop: number, shippingCop = 0) {
  assertMoney(shippingCop);
  const commission = commissionCop(subtotalCop);
  return {
    subtotalCop,
    shippingCop,
    commissionCop: commission,
    sellerPayoutCop: subtotalCop - commission,
    /**
     * Lo que paga el comprador: producto más envío.
     *
     * El envío no entra en el cálculo de la comisión a propósito. 2venta no gana
     * sobre la plata de la transportadora, y cobrarle porcentaje al envío haría
     * que un artículo barato y pesado pague comisión por algo que no es la venta.
     */
    buyerTotalCop: subtotalCop + shippingCop,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function assertMoney(value: number): void {
  // Un monto no entero significa que en algún punto se usó punto flotante, y eso
  // produce diferencias que aparecen meses después. Mejor romper aquí.
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`Monto inválido: ${value}. Los montos son enteros en pesos.`);
  }
}

/**
 * Lee un monto en pesos escrito por una persona.
 *
 * Devuelve null si no es un monto válido, en vez de arreglarlo por su cuenta.
 *
 * Esto salió de un hallazgo de Luna, la verificadora: quitar todo lo que no fuera
 * dígito antes de validar se comía el signo, así que "-10000" se publicaba como
 * "10000". Corregir en silencio lo que alguien escribió es peor que rechazarlo:
 * publica un precio que el vendedor nunca puso.
 */
export function parseCop(raw: string): number | null {
  const text = raw.trim();
  if (!text) return null;
  // Solo dígitos y separadores de miles. Un signo, una letra o un decimal hacen
  // que el monto sea inválido, no que se limpie.
  if (!/^\d{1,3}(?:[.,]\d{3})*$|^\d+$/.test(text)) return null;
  const value = Number(text.replace(/[.,]/g, ""));
  return Number.isSafeInteger(value) && value > 0 ? value : null;
}
