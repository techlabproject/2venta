import { describe, isUploadKey, MAX_BYTES, type StoredObject } from "@/lib/storage";

export type Claimed = { error: string } | { key: string; object: StoredObject };

/**
 * Comprueba una clave que mandó el cliente contra lo que S3 sabe (D-50).
 *
 * La clave la eligió el cliente, así que aquí no se confía en nada suyo: la
 * forma tiene que ser la que genera el servidor, el objeto tiene que existir, el
 * dueño tiene que ser quien publica, y tipo y tamaño se leen de S3. Sin esto,
 * alguien podría publicar con el video de otro vendedor o con un objeto que
 * nunca subió.
 */
export async function claim(
  raw: FormDataEntryValue | null,
  ownerId: string,
  kind: "video" | "image"
): Promise<Claimed> {
  const key = String(raw ?? "");
  if (!isUploadKey(key)) return { error: "Falta el video del artículo." };

  const object = await describe(key);
  if (!object || object.ownerId !== ownerId) {
    return { error: "Ese archivo no existe o no es tuyo. Graba el video otra vez." };
  }
  const expected = kind === "video" ? /^video\// : /^image\//;
  if (!expected.test(object.contentType)) return { error: "Ese tipo de archivo no sirve." };
  if (object.size > MAX_BYTES) {
    return { error: "El video pesa demasiado. Graba uno más corto." };
  }
  return { key, object };
}
