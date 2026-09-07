"use client";

import { useActionState } from "react";
import { revokeSession } from "./recovery";
import { Button } from "@/components/ui";

export function RevokeButton({ sessionId }: { sessionId: string }) {
  const [, submit, pending] = useActionState(revokeSession, null);
  return (
    <form action={submit}>
      <input type="hidden" name="sessionId" value={sessionId} />
      <Button type="submit" variant="ghost" disabled={pending} className="w-auto px-3 py-1.5">
        Cerrar
      </Button>
    </form>
  );
}
