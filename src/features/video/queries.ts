import { query } from "@/lib/db";
import { describe } from "@/lib/storage";
import { outputKeyFor, videoProvider } from "./provider";

/**
 * Pide la conversión del video de una publicación (S-30).
 *
 * Solo si la clave pertenece a una publicación: al bucket también llegan
 * portadas y fotos, y un `Object Created` de algo que no es video se descarta.
 * Y solo si la salida no existe ya: SQS entrega al menos una vez, y un segundo
 * trabajo de MediaConvert sería plata tirada.
 */
export async function requestTranscode(key: string): Promise<string> {
  const rows = await query<{ id: string }>(
    `select id from listings where video_path = $1 or video_original_path = $1 limit 1`,
    [key]
  );
  if (!rows.length) return "no es el video de una publicación, descartado";
  if (await describe(outputKeyFor(key))) return "la salida ya existe, descartado";
  await videoProvider.transcode(key);
  return "trabajo creado";
}

/**
 * La conversión terminó: la ficha pasa a servir la salida y se conserva el
 * original. Idempotente: un segundo aviso encuentra `video_path = salida` y no
 * cambia nada.
 */
export async function markVideoReady(original: string, salidaRaw: string): Promise<number> {
  // EventBridge entrega la salida como s3://bucket/clave; aquí solo importa la clave.
  const salida = salidaRaw.replace(/^s3:\/\/[^/]+\//, "");
  const rows = await query<{ id: string }>(
    `update listings
        set video_path = $2, video_original_path = $1
      where video_path = $1 or (video_original_path = $1 and video_path = $2)
      returning id`,
    [original, salida]
  );
  return rows.length;
}
