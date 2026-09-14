import { SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs";

// La cola de trabajo en segundo plano (D-51). Este es el único archivo que sabe que
// existe: la aplicación encola con `enqueue` y el worker (`src/worker/`) consume.
//
// SQS entrega al menos una vez. Todo trabajo que entre aquí tiene que tolerar
// repetirse: ver slices/28-worker-y-cola.md, "Idempotencia".

export type Job =
  | { type: "liberar" }
  | { type: "caducar" }
  | { type: "avisar"; listingId: string }
  | { type: "transcodificar"; key: string }
  | { type: "video_listo"; original: string; salida: string };

const TYPES = new Set<Job["type"]>([
  "liberar",
  "caducar",
  "avisar",
  "transcodificar",
  "video_listo",
]);

/** Interpreta el cuerpo de un mensaje. Devuelve null si no tiene la forma esperada. */
export function parseJob(body: string): Job | null {
  let raw: unknown;
  try {
    raw = JSON.parse(body);
  } catch {
    return null;
  }
  if (typeof raw !== "object" || raw === null) return null;
  const job = raw as Record<string, unknown>;
  if (!TYPES.has(job.type as Job["type"])) return null;
  if (job.type === "avisar" && typeof job.listingId !== "string") return null;
  if (job.type === "transcodificar" && typeof job.key !== "string") return null;
  if (job.type === "video_listo" && (typeof job.original !== "string" || typeof job.salida !== "string")) {
    return null;
  }
  return job as Job;
}

let client: SQSClient | undefined;

export function sqsClient(): SQSClient {
  return (client ??= new SQSClient({
    region: process.env.AWS_REGION,
    ...(process.env.SQS_ENDPOINT ? { endpoint: process.env.SQS_ENDPOINT } : {}),
  }));
}

export function queueUrl(): string {
  return process.env.SQS_QUEUE_URL!;
}

export async function enqueue(job: Job): Promise<void> {
  await sqsClient().send(
    new SendMessageCommand({ QueueUrl: queueUrl(), MessageBody: JSON.stringify(job) })
  );
}

/**
 * Encola sin dejar que un fallo de la cola tumbe lo que la llamó. Para trabajos
 * que son consecuencia de algo que ya pasó (una publicación que ya salió): el aviso
 * que no se manda es peor que nada, pero una publicación que no sale porque la
 * cola estaba caída es peor que eso. El error queda en el registro.
 */
export async function enqueueOrLog(job: Job): Promise<void> {
  try {
    await enqueue(job);
  } catch (err) {
    console.error(`[cola] no se pudo encolar ${JSON.stringify(job)}:`, err);
  }
}
