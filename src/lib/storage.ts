import { mkdir, writeFile, readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";

// Los archivos van a disco local mientras no haya almacenamiento de verdad. Esta
// interfaz es el único punto que sabe dónde viven, así que mover todo a un servicio
// en la nube es reescribir estas tres funciones.
const ROOT = path.resolve(process.cwd(), "uploads");

const EXTENSION: Record<string, string> = {
  "video/webm": "webm",
  "video/mp4": "mp4",
  "image/jpeg": "jpg",
  "image/png": "png",
};

export const MAX_BYTES = 60 * 1024 * 1024;

export function isAllowedType(type: string): boolean {
  return type.split(";")[0] in EXTENSION;
}

/**
 * Guarda el archivo y devuelve su ruta relativa.
 *
 * El nombre lo genera el servidor a partir de un identificador aleatorio y del
 * tipo declarado. Nunca se usa el nombre que manda el cliente: uno con `../`
 * escaparía del directorio de subidas y escribiría donde no debe.
 */
export async function store(bytes: ArrayBuffer, contentType: string): Promise<string> {
  const ext = EXTENSION[contentType.split(";")[0]];
  if (!ext) throw new Error(`Tipo de archivo no permitido: ${contentType}`);

  const name = `${randomUUID()}.${ext}`;
  const dir = new Date().toISOString().slice(0, 7); // carpetas por mes
  await mkdir(path.join(ROOT, dir), { recursive: true });
  await writeFile(path.join(ROOT, dir, name), Buffer.from(bytes));
  return `${dir}/${name}`;
}

export async function read(relative: string): Promise<Buffer | null> {
  // La ruta se normaliza y se comprueba que siga dentro del directorio: sin esto,
  // pedir `../../.env.local` devolvería los secretos del servidor.
  const full = path.resolve(ROOT, relative);
  if (!full.startsWith(ROOT + path.sep)) return null;
  try {
    return await readFile(full);
  } catch {
    return null;
  }
}

export function contentTypeOf(relative: string): string {
  const ext = relative.split(".").pop()?.toLowerCase();
  return (
    { webm: "video/webm", mp4: "video/mp4", jpg: "image/jpeg", png: "image/png" }[
      ext ?? ""
    ] ?? "application/octet-stream"
  );
}
