import { createHmac, timingSafeEqual } from "node:crypto";
import { ENVIO_FIJO_COP } from "./tarifa";

// R-04: la respuesta propuesta es un agregador logístico, que expone una sola API
// sobre Servientrega, Coordinadora, Interrapidísimo, Envía y TCC. Todavía no hay
// contrato, así que se construye contra esta interfaz.
export type Quote = { carrier: string; costCop: number; etaDays: number };

export type ShippingProvider = {
  name: string;
  /** Cuánto cuesta llevar un paquete a esa zona. */
  quote(input: { zone: string; priceCop: number }): Promise<Quote>;
  /** Genera la guía y devuelve su número. */
  createShipment(input: {
    orderId: string;
    recipient: string;
    line1: string;
    zone: string;
  }): Promise<{ carrier: string; trackingNumber: string }>;
  verifySignature(rawBody: string, signature: string | null): boolean;
};

const SECRET = process.env.SHIPPING_WEBHOOK_SECRET ?? "";

// Tarifa plana mientras no haya contrato (`tarifa.ts`, corrección 47). Lo que importa
// es que el flujo la pida antes de pagar y que el comprador vea el total completo.
const FLAT_RATE_COP = ENVIO_FIJO_COP;

export const testProvider: ShippingProvider = {
  name: "prueba",

  async quote() {
    return { carrier: "Transportadora de prueba", costCop: FLAT_RATE_COP, etaDays: 2 };
  },

  async createShipment({ orderId }) {
    return {
      carrier: "Transportadora de prueba",
      trackingNumber: `GUIA-${orderId.slice(0, 8).toUpperCase()}`,
    };
  },

  verifySignature(rawBody, signature) {
    if (!SECRET || !signature) return false;
    const expected = createHmac("sha256", SECRET).update(rawBody).digest("hex");
    const a = Buffer.from(expected, "utf8");
    const b = Buffer.from(signature, "utf8");
    return a.length === b.length && timingSafeEqual(a, b);
  },
};

export const shippingProvider: ShippingProvider = testProvider;

export function signPayload(rawBody: string): string {
  return createHmac("sha256", SECRET).update(rawBody).digest("hex");
}
