import { createHmac, timingSafeEqual, randomUUID } from "node:crypto";

// El dinero nunca lo toca 2venta (D-11). El proveedor retiene, divide y libera.
// Esta interfaz es el único punto por donde entra, así que conectar el proveedor
// real cuando R-02 tenga respuesta es escribir otra implementación.
//
// Límite honesto de esta técnica aquí: con el envío de mensajes, cambiar de
// implementación no altera nada más. Con pagos sí puede: si resulta que la
// retención no se puede condicionar a un evento nuestro, cambia el flujo del
// producto y no solo la integración.
export type PaymentProvider = {
  name: string;

  /** Arranca el cobro y devuelve a dónde mandar al comprador. */
  createCheckout(input: {
    orderId: string;
    amountCop: number;
    commissionCop: number;
    sellerId: string;
    idempotencyKey: string;
  }): Promise<{ reference: string; redirectUrl: string }>;

  /**
   * A dónde volver para terminar un pago que quedó a medias.
   *
   * Existe porque un comprador que cierra la pestaña en la pasarela tiene que poder
   * retomar; sin esto, su única salida era cancelar y empezar de cero. Un proveedor
   * real puede necesitar recrear la sesión a partir de la referencia: eso se
   * resuelve dentro de su implementación, no en las pantallas.
   */
  checkoutUrl(input: { orderId: string; reference: string }): string;

  /** Libera hacia el vendedor los fondos retenidos. */
  release(reference: string): Promise<void>;

  /** Devuelve el dinero al comprador. */
  refund(reference: string): Promise<void>;

  verifySignature(rawBody: string, signature: string | null): boolean;
};

const SECRET = process.env.PAYMENTS_WEBHOOK_SECRET ?? "";

export const testProvider: PaymentProvider = {
  name: "prueba",

  async createCheckout({ orderId, idempotencyKey }) {
    // Un proveedor real devuelve la misma referencia ante la misma clave de
    // idempotencia. Aquí se deriva de la clave para imitar ese comportamiento.
    const reference = `pay_${idempotencyKey.slice(0, 24)}`;
    return { reference, redirectUrl: `/dev/pago/${orderId}` };
  },

  checkoutUrl({ orderId }) {
    return `/dev/pago/${orderId}`;
  },

  async release() {
    // El proveedor real mueve el dinero aquí. La implementación de prueba no
    // tiene nada que mover, pero el punto de llamada queda escrito.
  },

  async refund() {},

  verifySignature(rawBody, signature) {
    if (!SECRET || !signature) return false;
    const expected = createHmac("sha256", SECRET).update(rawBody).digest("hex");
    const a = Buffer.from(expected, "utf8");
    const b = Buffer.from(signature, "utf8");
    // Tiempo constante: comparar con === filtra cuántos caracteres coinciden.
    return a.length === b.length && timingSafeEqual(a, b);
  },
};

export const paymentProvider: PaymentProvider = testProvider;

export function signPayload(rawBody: string): string {
  return createHmac("sha256", SECRET).update(rawBody).digest("hex");
}

export function newIdempotencyKey(): string {
  return randomUUID().replace(/-/g, "");
}
