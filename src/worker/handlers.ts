import type { Job } from "@/lib/queue";
import { releaseExpiredOrders } from "@/features/payments/release";
import { expireAbandonedCheckouts } from "@/features/payments/abandon";
import { notifyForListing } from "@/features/alerts/queries";
import { markVideoReady, requestTranscode } from "@/features/video/queries";
import { borrarPendientesVencidos } from "@/features/auth/pendientes";

// Un trabajo, una función de features. Aquí no hay lógica: si alguna vez la hay,
// el worker ya es un segundo sistema (regla 5 de ARQUITECTURA.md).
export async function handle(job: Job): Promise<string> {
  switch (job.type) {
    case "liberar": {
      // El mismo programador de cada hora barre los registros sin confirmar (D-123):
      // un trabajo nuevo pediría otra regla en la nube para algo tan pequeño.
      const n = await releaseExpiredOrders();
      const borrados = await borrarPendientesVencidos();
      return `liberados: ${n}; registros vencidos borrados: ${borrados}`;
    }
    case "caducar": {
      const n = await expireAbandonedCheckouts();
      return `pedidos caducados: ${n}`;
    }
    case "avisar": {
      const n = await notifyForListing(job.listingId);
      return n === null ? "publicación inexistente, descartado" : `avisos: ${n}`;
    }
    case "transcodificar":
      return requestTranscode(job.key);
    case "video_listo": {
      const n = await markVideoReady(job.original, job.salida);
      return `publicaciones actualizadas: ${n}`;
    }
  }
}
