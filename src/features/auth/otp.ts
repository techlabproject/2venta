import { createCipheriv, createDecipheriv, createHash, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { CODIGO_VALIDO_MINUTOS } from "./vigencia";

// Código de verificación por celular.
//
// Cierra la D-27. La biblioteca de autenticación lo guardaba en texto plano en su
// tabla de verificación y su complemento no ofrecía opción de cifrarlo, así que
// quien tuviera lectura de la base podía tomar el control de cualquier cuenta
// durante los minutos que el código vive.
//
// Lo que se deja de delegar es un código de seis dígitos con vencimiento, que es
// lógica de aplicación. Las contraseñas, las sesiones y los tokens los sigue
// manejando la biblioteca: eso sí no se implementa a mano.
//
// Se cifra y no se hashea por la misma razón que en S-09: hay que poder mostrarlo
// en desarrollo y compararlo sin depender de un formato fijo. La propiedad que
// importa se conserva igual: sin el secreto del servidor, la base no sirve de nada.

export const CODE_LENGTH = 6;
export const MAX_ATTEMPTS = 5;
export const EXPIRY_MINUTES = CODIGO_VALIDO_MINUTOS;

function key(): Buffer {
  const value = process.env.PHONE_CODE_SECRET ?? process.env.PICKUP_CODE_SECRET;
  if (!value) {
    throw new Error("Falta PHONE_CODE_SECRET. Sin él no se puede proteger el código.");
  }
  return createHash("sha256").update(value).digest();
}

export function generateCode(): string {
  return String(randomInt(0, 10 ** CODE_LENGTH)).padStart(CODE_LENGTH, "0");
}

export function encryptCode(code: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const data = Buffer.concat([cipher.update(normalize(code), "utf8"), cipher.final()]);
  return [iv.toString("hex"), cipher.getAuthTag().toString("hex"), data.toString("hex")].join(":");
}

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

export function codeMatches(given: string, stored: string): boolean {
  const real = decryptCode(stored);
  if (real === null) return false;
  const a = Buffer.from(normalize(given), "utf8");
  const b = Buffer.from(real, "utf8");
  // Tiempo constante: la igualdad filtra cuántos caracteres del principio coinciden.
  return a.length === b.length && timingSafeEqual(a, b);
}

export function normalize(code: string): string {
  return code.replace(/\D/g, "");
}
