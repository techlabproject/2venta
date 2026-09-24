import { currentUser } from "@/lib/session";
import { getConversation } from "@/features/chat/queries";
import { escucharConversacion } from "@/lib/tiempo-real";

/**
 * Avisos en vivo de una conversación (corrección 20), como eventos del servidor.
 *
 * Solo empuja «algo cambió»; el navegador vuelve a pedir la pantalla y ahí se decide
 * qué ve cada quien (incluido lo que oculta un reporte, corrección 22). Por eso el
 * aviso no lleva ningún texto de la conversación.
 *
 * IMPORTANT: solo las dos partes de la conversación pueden escucharla. Saber cuándo
 * alguien escribe ya es un dato de esa conversación.
 */
export const dynamic = "force-dynamic";

// El balanceador corta a los 60 s sin tráfico y CloudFront antes. Un comentario
// cada 20 s mantiene la conexión viva sin que el navegador lo note.
const LATIDO_MS = 20_000;

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await currentUser();
  if (!user) return new Response(null, { status: 401 });
  const { id } = await params;
  const conversation = await getConversation(id);
  if (
    !conversation ||
    (conversation.buyer_id !== user.id && conversation.seller_id !== user.id)
  ) {
    return new Response(null, { status: 404 });
  }

  const codificar = new TextEncoder();
  let cerrar = () => {};
  const flujo = new ReadableStream<Uint8Array>({
    async start(control) {
      let abierto = true;
      const enviar = (texto: string) => {
        if (!abierto) return;
        try {
          control.enqueue(codificar.encode(texto));
        } catch {
          cerrar();
        }
      };
      const dejarDeOir = await escucharConversacion(conversation.id, () =>
        enviar("event: cambio\ndata: 1\n\n"),
      );
      const latido = setInterval(() => enviar(": latido\n\n"), LATIDO_MS);
      cerrar = () => {
        if (!abierto) return;
        abierto = false;
        clearInterval(latido);
        dejarDeOir();
        try {
          control.close();
        } catch {}
      };
      req.signal.addEventListener("abort", cerrar);
      // Reintentar a los 3 s si se corta (un despliegue, el celular que cambia de red).
      enviar("retry: 3000\n\n");
    },
    cancel() {
      cerrar();
    },
  });

  return new Response(flujo, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-store, no-transform",
      Connection: "keep-alive",
      // Que nadie en medio (compresión incluida) acumule el flujo antes de mandarlo.
      "X-Accel-Buffering": "no",
      "Content-Encoding": "none",
    },
  });
}
