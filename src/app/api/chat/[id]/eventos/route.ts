import { currentUser } from "@/lib/session";
import { getConversation } from "@/features/chat/queries";
import { escucharConversacion, flujoDeEventos } from "@/lib/tiempo-real";

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

  return flujoDeEventos(req, (avisar) => escucharConversacion(conversation.id, avisar));
}
