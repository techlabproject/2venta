import { requestUpload } from "./upload";

// Sube un archivo directo al bucket: pide la firma al servidor y hace el PUT desde
// el navegador (D-50). El servidor nunca ve los bytes.
//
// Las cabeceras que devuelve la firma van tal cual: están dentro de ella, y
// cambiar una hace que el bucket rechace la subida.

export class UploadError extends Error {}

export async function uploadBlob(
  blob: Blob,
  kind: "video" | "image" | "avatar" | "prueba"
): Promise<string> {
  // MediaRecorder produce tipos como "video/webm;codecs=vp8,opus". Los parámetros
  // sobran y romperían la comparación de tipo al firmar.
  const contentType = blob.type.split(";")[0];
  const signed = await requestUpload({ contentType, size: blob.size, kind });
  if ("error" in signed) throw new UploadError(signed.error);

  const res = await fetch(signed.url, { method: "PUT", headers: signed.headers, body: blob });
  if (!res.ok) {
    throw new UploadError("No se pudo subir el archivo. Revisa la conexión e intenta otra vez.");
  }
  return signed.key;
}

export async function uploadImages(blobs: Blob[]): Promise<string[]> {
  return Promise.all(blobs.map((b) => uploadBlob(b, "image")));
}
