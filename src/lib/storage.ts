import { randomUUID } from "node:crypto";
import { HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Los archivos viven en un bucket de S3. Este es el único archivo que sabe dónde
// y cómo; en el portátil el bucket lo da MinIO con la misma API.
//
// El navegador sube directo al bucket con una URL que firma este módulo (D-50).
// Un video de hasta 60 MB nunca atraviesa la aplicación. El precio es que la
// acción de publicar ya no recibe el archivo sino una clave que eligió el
// cliente, y por eso `describe` existe: comprueba contra S3, no contra el cliente.

const EXTENSION: Record<string, string> = {
  "video/webm": "webm",
  "video/mp4": "mp4",
  "image/jpeg": "jpg",
  "image/png": "png",
};

export const MAX_BYTES = 60 * 1024 * 1024;

/** Cuánto vale una URL de subida. Corto a propósito: se pide justo antes de usarla. */
const UPLOAD_TTL_SECONDS = 5 * 60;

/** La forma exacta de una clave que generó este módulo. Nada más se acepta. */
export const KEY_PATTERN = /^\d{4}-\d{2}\/[0-9a-f-]{36}\.(webm|mp4|jpg|png)$/;

export function isAllowedType(type: string): boolean {
  return type.split(";")[0] in EXTENSION;
}

export function isValidKey(key: string): boolean {
  return KEY_PATTERN.test(key);
}

function bucket(): string {
  return process.env.S3_BUCKET!;
}

/**
 * Dos clientes por una razón concreta: la firma incluye el host. Dentro del
 * contenedor el servidor llega a MinIO como `minio:9000`, pero el navegador lo ve
 * como `localhost:9000`, y una URL firmada para el primero no vale en el segundo.
 * En AWS no hay endpoint propio y los dos son el mismo cliente.
 */
function clientOptions(endpoint: string | undefined) {
  return {
    region: process.env.AWS_REGION,
    ...(endpoint ? { endpoint, forcePathStyle: true } : {}),
  };
}

let internal: S3Client | undefined;
let signing: S3Client | undefined;

function internalClient(): S3Client {
  return (internal ??= new S3Client(clientOptions(process.env.S3_ENDPOINT)));
}

function signingClient(): S3Client {
  const publicEndpoint = process.env.S3_PUBLIC_ENDPOINT ?? process.env.S3_ENDPOINT;
  if (publicEndpoint === process.env.S3_ENDPOINT) return internalClient();
  return (signing ??= new S3Client(clientOptions(publicEndpoint)));
}

export type SignedUpload = {
  key: string;
  url: string;
  /** Cabeceras que el navegador tiene que mandar tal cual: están dentro de la firma. */
  headers: Record<string, string>;
};

/**
 * Firma una subida. La firma cubre el tipo, el tamaño y el dueño: si el navegador
 * cambia cualquiera de los tres, S3 rechaza el PUT. Así lo que `describe` lee
 * después es lo que se firmó aquí, no lo que el cliente decidió mandar.
 *
 * El nombre lo genera el servidor. Nunca se usa el que manda el cliente.
 */
export async function signUpload(
  contentType: string,
  size: number,
  ownerId: string
): Promise<SignedUpload> {
  const type = contentType.split(";")[0];
  const ext = EXTENSION[type];
  if (!ext) throw new Error(`Tipo de archivo no permitido: ${contentType}`);
  if (!Number.isInteger(size) || size <= 0 || size > MAX_BYTES) {
    throw new Error(`Tamaño fuera de límite: ${size}`);
  }

  const key = `${new Date().toISOString().slice(0, 7)}/${randomUUID()}.${ext}`;
  const command = new PutObjectCommand({
    Bucket: bucket(),
    Key: key,
    ContentType: type,
    ContentLength: size,
    Metadata: { owner: ownerId },
  });
  // Por defecto el SDK saca las cabeceras de la firma y las pone en la URL. Aquí
  // se fuerzan dentro de la firma: es lo que hace que S3 rechace un PUT donde el
  // navegador cambió el tipo, el tamaño o el dueño.
  const signable = new Set(["content-type", "content-length", "x-amz-meta-owner"]);
  const url = await getSignedUrl(signingClient(), command, {
    expiresIn: UPLOAD_TTL_SECONDS,
    signableHeaders: signable,
    unhoistableHeaders: signable,
  });

  return {
    key,
    url,
    headers: { "content-type": type, "x-amz-meta-owner": ownerId },
  };
}

export type StoredObject = { contentType: string; size: number; ownerId: string | null };

/**
 * Lo que S3 sabe del objeto. Es la única fuente que vale al publicar: la clave la
 * eligió el cliente, y sin esta consulta podría publicar con el video de otro
 * vendedor o con un objeto que nunca subió.
 */
export async function describe(key: string): Promise<StoredObject | null> {
  if (!isValidKey(key)) return null;
  try {
    const head = await internalClient().send(
      new HeadObjectCommand({ Bucket: bucket(), Key: key })
    );
    return {
      contentType: head.ContentType ?? "application/octet-stream",
      size: head.ContentLength ?? 0,
      ownerId: head.Metadata?.owner ?? null,
    };
  } catch (err) {
    if (isNotFound(err)) return null;
    throw err;
  }
}

function isNotFound(err: unknown): boolean {
  const e = err as { name?: string; $metadata?: { httpStatusCode?: number } };
  return e?.name === "NotFound" || e?.$metadata?.httpStatusCode === 404;
}
