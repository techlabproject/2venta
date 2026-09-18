"use client";

import { useActionState } from "react";
import { suspendUser, type ModerationResult } from "./actions";
import { Button, ErrorNote } from "@/components/ui";

export function SuspendForm({ userId }: { userId: string }) {
  const [result, submit, pending] = useActionState<
    ModerationResult | null,
    FormData
  >(suspendUser, null);

  return (
    <form action={submit} className="mt-3 flex flex-col gap-2">
      {result?.error ? <ErrorNote>{result.error}</ErrorNote> : null}
      <input type="hidden" name="userId" value={userId} />
      <input
        name="reason"
        aria-label="Motivo de la suspensión"
        required
        placeholder="Motivo (queda en el registro)"
        className="rounded-xl border border-line bg-white px-3 py-2 text-sm outline-none transition duration-200 ease-salida hover:border-brand/30 focus:border-brand focus:ring-3 focus:ring-brand/15"
      />
      <Button type="submit" variant="outline" disabled={pending}>
        {pending ? "Suspendiendo…" : "Suspender la cuenta"}
      </Button>
    </form>
  );
}
