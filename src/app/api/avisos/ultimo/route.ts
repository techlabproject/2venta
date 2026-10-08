import { currentUser } from "@/lib/session";
import { ultimaSinLeer } from "@/features/alerts/queries";

/**
 * La notificación sin leer más reciente de quien pregunta, para el aviso que aparece
 * en pantalla cuando llega algo (D-131). Solo la propia: el id sale de la sesión,
 * nunca de la petición.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await currentUser();
  if (!user) return new Response(null, { status: 401 });
  const ultima = await ultimaSinLeer(user.id);
  return Response.json(ultima, { headers: { "Cache-Control": "no-store" } });
}
