import { createCipheriv, createDecipheriv, createHash, randomBytes, randomInt, timingSafeEqual } from "node:crypto";

// El código de entrega libera dinero, así que se trata como una credencial.
//
// Se guarda CIFRADO con un secreto del servidor, no hasheado. La primera versión
// usaba un hash, que es más fuerte, y estaba mal: el comprador necesita volver a
// ver su código cuando llega al encuentro, y de un hash no se recupera nada. Un
// código que solo se puede ver una vez no sirve para lo que existe.
//
// La propiedad que sí se conserva es la que importa aquí: quien tenga la base de
// datos pero no el secreto del servidor no puede leer ningún código, y por lo tanto
// no puede liberar pagos ajenos. Eso es exactamente lo que la D-27 no logra con el
// código por SMS, y aquí sí, porque el código es nuestro.
//
// Se usa AES-256-GCM: además de cifrar, detecta si alguien alteró el dato guardado.

export const CODE_LENGTH = 6;
export const MAX_ATTEMPTS = 5;
export const VALID_HOURS = 72;

function key(): Buffer {
  const value = process.env.PICKUP_CODE_SECRET;
  if (!value) {
    // Sin secreto, cifrar es teatro. Mejor romper aquí que guardar algo que
    // cualquiera con la base pueda revertir.
    throw new Error("Falta PICKUP_CODE_SECRET. Sin él no se puede proteger el código.");
  }
  // El secreto es texto de longitud variable; la clave tiene que ser de 32 bytes.
  return createHash("sha256").update(value).digest();
}

/** Genera un código de seis dígitos con aleatoriedad criptográfica. */
export function generateCode(): string {
  return String(randomInt(0, 10 ** CODE_LENGTH)).padStart(CODE_LENGTH, "0");
}

/** Devuelve `iv:etiqueta:cifrado`, todo en hexadecimal. */
export function encryptCode(code: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const encrypted = Buffer.concat([cipher.update(normalize(code), "utf8"), cipher.final()]);
  return [iv.toString("hex"), cipher.getAuthTag().toString("hex"), encrypted.toString("hex")].join(":");
}

/** Devuelve el código, o null si el dato fue alterado o la clave no corresponde. */
export function decryptCode(stored: string): string | null {
  try {
    const [ivHex, tagHex, dataHex] = stored.split(":");
    if (!ivHex || !tagHex || !dataHex) return null;
    const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(ivHex, "hex"));
    decipher.setAuthTag(Buffer.from(tagHex, "hex"));
    return Buffer.concat([
      decipher.update(Buffer.from(dataHex, "hex")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    return null;
  }
}

/** Compara en tiempo constante: la igualdad filtra cuántos caracteres coinciden. */
export function codeMatches(given: string, stored: string): boolean {
  const real = decryptCode(stored);
  if (real === null) return false;
  const a = Buffer.from(normalize(given), "utf8");
  const b = Buffer.from(real, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

/** La gente lo dicta con espacios o guiones; se comparan solo los dígitos. */
export function normalize(code: string): string {
  return code.replace(/\D/g, "");
}

export function isWellFormed(code: string): boolean {
  return normalize(code).length === CODE_LENGTH;
}
