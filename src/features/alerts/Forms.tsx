"use client";

import { useActionState } from "react";
import { deleteSearch, saveSearch, type AlertResult } from "./actions";
import { Button, ErrorNote } from "@/components/ui";

export function SaveSearchForm({ params }: { params: string }) {
  const [result, submit, pending] = useActionState<AlertResult | null, FormData>(
    saveSearch,
    null
  );

  if (result && !result.error) {
    return (
      <p role="status" className="mt-4 rounded-xl bg-brand/10 px-4 py-3 text-sm text-brand">
        Guardada. Te avisamos cuando aparezca algo que coincida.
      </p>
    );
  }

  return (
    <details className="mt-6">
      <summary className="cursor-pointer text-sm text-ink2 underline">
        Avísame cuando aparezca algo así
      </summary>
      <form action={submit} className="mt-3 flex gap-2">
        {result?.error ? <ErrorNote>{result.error}</ErrorNote> : null}
        <input type="hidden" name="params" value={params} />
        <input name="label" aria-label="Nombre de la búsqueda" required
          placeholder="iPhone hasta 2 millones"
          className="flex-1 rounded-xl border border-brand/20 bg-white px-4 py-3 text-sm" />
        <Button type="submit" variant="outline" size="inline" disabled={pending}>
          Guardar
        </Button>
      </form>
    </details>
  );
}

export function DeleteSearchButton({ id }: { id: string }) {
  const [, submit, pending] = useActionState<AlertResult | null, FormData>(
    deleteSearch,
    null
  );
  return (
    <form action={submit}>
      <input type="hidden" name="id" value={id} />
      <button type="submit" disabled={pending} className="text-sm text-muted underline">
        Quitar
      </button>
    </form>
  );
}
