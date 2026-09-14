"use client";

import { useActionState } from "react";
import { revokeSession } from "./recovery";
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
