"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Mantiene la conversación al día mientras está abierta (corrección 20).
 *
 * Escucha los avisos del servidor y, cuando la conversación cambia, vuelve a pedir
 * la pantalla: los mensajes nuevos aparecen sin recargar y lo que se estaba
 * escribiendo no se pierde. Si la conexión se corta, `EventSource` se reconecta
 * solo; al volver a la pestaña se pide una vez por si algo llegó mientras dormía.
 */
export function ChatEnVivo({ conversationId }: { conversationId: string }) {
  const router = useRouter();

  useEffect(() => {
    const fuente = new EventSource(`/api/chat/${conversationId}/eventos`);
    fuente.addEventListener("cambio", () => router.refresh());
    const alVolver = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    document.addEventListener("visibilitychange", alVolver);
    return () => {
      fuente.close();
      document.removeEventListener("visibilitychange", alVolver);
    };
  }, [conversationId, router]);

  return null;
}
