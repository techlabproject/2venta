import { DeleteMessageCommand, ReceiveMessageCommand } from "@aws-sdk/client-sqs";
import { checkConfig, describeProblems } from "@/lib/config";
import { parseJob, queueUrl, sqsClient } from "@/lib/queue";
import { handle } from "./handlers";

// El worker: consume de la cola y llama a features (D-51). Mismo repositorio,
// misma imagen, otro punto de entrada.
//
// `--una-vez` vacía la cola y sale. Es lo que usan las pruebas y sirve como
// palanca de operación.

const ONCE = process.argv.includes("--una-vez");
/** Espera larga a propósito: SQS cobra por petición y así casi no hay vacías. */
const WAIT_SECONDS = ONCE ? 1 : 20;

/** Se dispara con SIGTERM para cortar la espera larga y salir limpio. */
const stop = new AbortController();

async function processBatch(): Promise<number> {
  let messages;
  try {
    const res = await sqsClient().send(
      new ReceiveMessageCommand({
        QueueUrl: queueUrl(),
        MaxNumberOfMessages: 10,
        WaitTimeSeconds: WAIT_SECONDS,
      }),
      { abortSignal: stop.signal }
    );
    messages = res.Messages ?? [];
  } catch (err) {
    if (stop.signal.aborted) return 0;
    throw err;
  }

  for (const m of messages) {
    const job = parseJob(m.Body ?? "");
    if (!job) {
      // Reintentar un mensaje malformado no lo arregla: se descarta con registro.
      console.error(`[worker] mensaje sin forma conocida, descartado: ${m.Body}`);
      await ack(m.ReceiptHandle!);
      continue;
    }

    try {
      const outcome = await handle(job);
      console.info(`[worker] ${job.type} → ${outcome}`);
      // Solo se borra si terminó. Si lanzó, SQS lo vuelve a entregar y, tras N
      // intentos, lo manda a la cola de fallidos: un trabajo perdido en silencio,
      // en este dominio, es un pago que no se liberó.
      await ack(m.ReceiptHandle!);
    } catch (err) {
      const e = err as { name?: string; message?: string; $metadata?: { httpStatusCode?: number } };
      console.error(
        `[worker] ${job.type} falló, se reintentará: ${e?.name ?? "Error"} ${e?.message ?? ""} (HTTP ${e?.$metadata?.httpStatusCode ?? "?"})`
      );
    }
  }
  return messages.length;
}

async function ack(receipt: string): Promise<void> {
  await sqsClient().send(
    new DeleteMessageCommand({ QueueUrl: queueUrl(), ReceiptHandle: receipt })
  );
}

async function main() {
  const problems = checkConfig();
  if (problems.length) {
    console.error(`\n${describeProblems(problems)}\n`);
    process.exit(1);
  }

  // ECS manda SIGTERM y da unos segundos antes de matar. Sin cortar la espera
  // larga, el proceso muere a la fuerza con un lote a medias.
  for (const signal of ["SIGTERM", "SIGINT"] as const) {
    process.on(signal, () => stop.abort());
  }

  console.info(`[worker] escuchando ${queueUrl()}${ONCE ? " (una vez)" : ""}`);
  while (!stop.signal.aborted) {
    const n = await processBatch();
    if (ONCE && n === 0) break;
  }
  console.info("[worker] fin");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
