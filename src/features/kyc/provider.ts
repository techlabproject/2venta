import { createHmac, timingSafeEqual, randomUUID } from "node:crypto";

// La verificación de identidad se delega por completo (D-02, RF-07): 2venta nunca
// guarda la cédula ni la selfie. Esta interfaz es el único punto por donde entra
// el proveedor, así que cambiarlo cuando R-02 tenga respuesta es escribir otra
// implementación, no tocar pantallas ni base de datos.
export type KycProvider = {
  name: string;
  /** Arranca la verificación y devuelve a dónde mandar al usuario. */
  start(userId: string): Promise<{ reference: string; redirectUrl: string }>;
  /** Comprueba que el aviso viene de verdad del proveedor. */
  verifySignature(rawBody: string, signature: string | null): boolean;
};

const SECRET = process.env.KYC_WEBHOOK_SECRET ?? "";

// Implementación de prueba mientras R-02 no tenga respuesta. Se comporta igual que
// la real: entrega una referencia, manda a una pantalla y avisa por webhook
// firmado. No aprueba nada por su cuenta.
export const testProvider: KycProvider = {
  name: "prueba",

  async start(userId) {
    const reference = `ref_${randomUUID()}`;
    return { reference, redirectUrl: `/dev/kyc/${reference}?u=${userId}` };
  },

  verifySignature(rawBody, signature) {
    if (!SECRET || !signature) return false;
    const expected = createHmac("sha256", SECRET).update(rawBody).digest("hex");
    const a = Buffer.from(expected, "utf8");
    const b = Buffer.from(signature, "utf8");
    // Comparación de tiempo constante: comparar con === filtra información sobre
    // cuántos caracteres del principio coinciden.
    return a.length === b.length && timingSafeEqual(a, b);
  },
};

export const kycProvider: KycProvider = testProvider;

export function signPayload(rawBody: string): string {
  return createHmac("sha256", SECRET).update(rawBody).digest("hex");
}
