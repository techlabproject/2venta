"use server";

import { activeUser } from "@/lib/session";
import { getVerification } from "@/features/kyc/queries";
import {
  AVATAR_MAX_BYTES,
  isAllowedType,
  MAX_BYTES,
  signUpload,
  type SignedUpload,
} from "@/lib/storage";

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
  kind: "video" | "image" | "avatar" | "prueba";
}): Promise<UploadResult> {
  const user = await activeUser();
  if (!user.phoneNumberVerified) {
    return { error: "Confirma tu celular antes de subir archivos." };
  }
  // Dos excepciones a la verificación de identidad, por la misma razón: la D-02
  // solo le pide la cédula a quien vende.
  //
  // La foto de perfil, porque quien compra también tiene cara. Y la prueba de un
  // reclamo, porque quien reclama es casi siempre el comprador: exigirle KYC para
  // enseñar una foto del producto roto significaría que solo el vendedor puede
  // probar algo en una disputa, que es exactamente al revés de lo que hace falta
  // (S-39).
  if (input.kind !== "avatar" && input.kind !== "prueba") {
    const verification = await getVerification(user.id);
    if (verification?.status !== "aprobado") {
      return { error: "Necesitas verificar tu identidad antes de publicar." };
    }
  }

  const contentType = String(input.contentType ?? "");
  const size = Number(input.size);
  const isImage = input.kind !== "video";
  const expected = isImage ? /^image\// : /^video\//;
  if (!isAllowedType(contentType) || !expected.test(contentType)) {
    return {
      error: isImage ? "Alguno de los archivos no es una imagen." : "Ese tipo de archivo no sirve.",
    };
  }
  // Una foto de perfil se muestra en 40 px: 60 MB ahí no son una foto, son un
  // error o un abuso.
  const limit = input.kind === "avatar" ? AVATAR_MAX_BYTES : MAX_BYTES;
  if (!Number.isInteger(size) || size <= 0 || size > limit) {
    return {
      error:
        input.kind === "avatar"
          ? "La foto pesa demasiado. El máximo son 8 MB."
          : isImage
            ? "Alguna foto pesa demasiado."
            : "El video pesa demasiado. Graba uno más corto.",
    };
  }

  return signUpload(contentType, size, user.id);
}
