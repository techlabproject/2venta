import { currentUser } from "@/lib/session";
import { escucharPersona, flujoDeEventos } from "@/lib/tiempo-real";

/**
 * Avisos en vivo de una persona (fila 73 de la revisión 4, D-131): le llegó una
 * notificación o cambió alguna de sus conversaciones. Cada quien escucha solo lo
 * suyo, y el aviso no lleva contenido: el navegador vuelve a pedir la pantalla y
 * `/api/avisos/ultimo`, que tienen sus propios controles.
 */
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = await currentUser();
  if (!user) return new Response(null, { status: 401 });
  return flujoDeEventos(req, (avisar) => escucharPersona(user.id, avisar));
}
