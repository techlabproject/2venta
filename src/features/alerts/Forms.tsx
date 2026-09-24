"use client";

import { useActionState } from "react";
import { deleteSearch, saveSearch, type AlertResult } from "./actions";
import { Button, ErrorNote } from "@/components/ui";

export function SaveSearchForm({
  params,
  sugerencia,
  destacado = false,
}: {
  params: string;
  /** Nombre propuesto para la búsqueda (lo que se escribió). */
  sugerencia?: string;
  /**
   * Dentro del «no hay resultados» (corrección 5) el aviso es una de las salidas
   * y se ve como botón, no como un enlace suelto.
   */
  destacado?: boolean;
}) {
  const [result, submit, pending] = useActionState<
    AlertResult | null,
    FormData
  >(saveSearch, null);

  if (result && !result.error) {
    return (
      <p
        role="status"
        className="mt-4 rounded-xl bg-brand/10 px-4 py-3 text-sm text-brand"
      >
        Guardada. Te avisamos cuando aparezca algo que coincida.
      </p>
    );
  }

  return (
    <details className={destacado ? "mt-3" : "mt-6"}>
      <summary
        className={
          destacado
            ? "inline-flex cursor-pointer list-none items-center gap-2 rounded-xl border border-line bg-white px-5 py-3 text-sm font-medium text-ink shadow-xs transition duration-200 ease-salida hover:border-brand/30 hover:bg-ph [&::-webkit-details-marker]:hidden"
            : "cursor-pointer text-sm text-ink2 underline"
        }
      >
        {destacado && (
          <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0" />
          </svg>
        )}
        {destacado ? "Avísame cuando aparezca" : "Avísame cuando aparezca algo así"}
      </summary>
      <form action={submit} className="mt-3 flex gap-2">
        {result?.error ? <ErrorNote>{result.error}</ErrorNote> : null}
        <input type="hidden" name="params" value={params} />
        <input
          name="label"
          aria-label="Nombre de la búsqueda"
          required
          defaultValue={sugerencia}
          placeholder="iPhone hasta 2 millones"
          className="flex-1 rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none transition duration-200 ease-salida hover:border-brand/30 focus:border-brand focus:ring-3 focus:ring-brand/15"
        />
        <Button
          type="submit"
          variant="outline"
          size="inline"
          disabled={pending}
        >
          Guardar
        </Button>
      </form>
    </details>
  );
}

export function DeleteSearchButton({ id }: { id: string }) {
  const [, submit, pending] = useActionState<AlertResult | null, FormData>(
    deleteSearch,
    null,
  );
  return (
    <form action={submit}>
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        disabled={pending}
        className="text-sm text-muted underline"
      >
        Quitar
      </button>
    </form>
  );
}
