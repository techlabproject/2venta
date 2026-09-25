"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { revokeOtherSessions, revokeSession } from "./recovery";
import { Button } from "@/components/ui";

export function RevokeButton({ sessionId }: { sessionId: string }) {
  const [, submit, pending] = useActionState(revokeSession, null);
  return (
    <form action={submit}>
      <input type="hidden" name="sessionId" value={sessionId} />
      <Button type="submit" variant="ghost" size="sm" disabled={pending}>
        Cerrar
      </Button>
    </form>
  );
}

/**
 * Corrección 42: cierra todas las sesiones menos esta. Es un formulario, como
 * «Cerrar», para que funcione aunque el JavaScript no haya terminado de cargar.
 */
export function RevokeOthersButton() {
  return (
    <form action={revokeOtherSessions}>
      <CerrarLasDemas />
    </form>
  );
}

function CerrarLasDemas() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="outline" size="sm" disabled={pending}>
      Cerrar todas las demás
    </Button>
  );
}
