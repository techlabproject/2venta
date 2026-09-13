"use server";

import { activeUser } from "@/lib/session";
import { getVerification } from "@/features/kyc/queries";
import { isAllowedType, MAX_BYTES, signUpload, type SignedUpload } from "@/lib/storage";

export type UploadResult = { error: string } | SignedUpload;

/**
 * Firma una subida directa al bucket (D-50).
 *
 * Las mismas comprobaciones que la acción de publicar, y por la misma razón: la
 * pantalla que esconde el botón no es control de acceso. Sin esto, cualquiera con
 * sesión podría llenar el bucket sin haber pasado por la verificación.
 */
export async function requestUpload(input: {
  contentType: string;
  size: number;
  kind: "video" | "image";
}): Promise<UploadResult> {
  const user = await activeUser();
  if (!user.phoneNumberVerified) {
    return { error: "Confirma tu celular antes de publicar." };
  }
  const verification = await getVerification(user.id);
  if (verification?.status !== "aprobado") {
    return { error: "Necesitas verificar tu identidad antes de publicar." };
  }

  const contentType = String(input.contentType ?? "");
  const size = Number(input.size);
  const isImage = input.kind === "image";
  const expected = isImage ? /^image\// : /^video\//;
  if (!isAllowedType(contentType) || !expected.test(contentType)) {
    return {
      error: isImage ? "Alguno de los archivos no es una imagen." : "Ese tipo de archivo no sirve.",
    };
  }
  if (!Number.isInteger(size) || size <= 0 || size > MAX_BYTES) {
    return {
      error: isImage ? "Alguna foto pesa demasiado." : "El video pesa demasiado. Graba uno más corto.",
    };
  }

  return signUpload(contentType, size, user.id);
}
