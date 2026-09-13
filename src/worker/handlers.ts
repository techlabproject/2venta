import type { Job } from "@/lib/queue";
import { releaseExpiredOrders } from "@/features/payments/release";
import { notifyForListing } from "@/features/alerts/queries";

// Un trabajo, una función de features. Aquí no hay lógica: si alguna vez la hay,
// el worker ya es un segundo sistema (regla 5 de ARQUITECTURA.md).
export async function handle(job: Job): Promise<string> {
  switch (job.type) {
    case "liberar": {
      const n = await releaseExpiredOrders();
      return `liberados: ${n}`;
    }
    case "avisar": {
      const n = await notifyForListing(job.listingId);
      return n === null ? "publicación inexistente, descartado" : `avisos: ${n}`;
    }
  }
}
