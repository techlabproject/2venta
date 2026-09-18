"use client";

import { useActionState } from "react";
import { reportListing, reviewListing, type ModerationResult } from "./actions";
import { Button, ErrorNote } from "@/components/ui";

const REASONS = [
  { value: "robado", label: "Parece robado" },
  { value: "prohibido", label: "Es algo prohibido" },
  { value: "enganoso", label: "La descripción engaña" },
  { value: "precio", label: "El precio es sospechoso" },
  { value: "otro", label: "Otra cosa" },
];

export function ReportForm({ listingId }: { listingId: string }) {
  const [result, submit, pending] = useActionState<
    ModerationResult | null,
    FormData
  >(reportListing, null);

  if (result && !result.error) {
    return (
      <p
        role="status"
        className="mt-3 rounded-xl bg-brand/10 px-4 py-3 text-sm text-brand"
      >
        Gracias. Lo vamos a revisar.
      </p>
    );
  }

  return (
    <details className="mt-6">
      <summary className="cursor-pointer text-sm text-muted underline">
        Reportar esta publicación
      </summary>
      <form action={submit} className="mt-3 flex flex-col gap-3">
        {result?.error ? <ErrorNote>{result.error}</ErrorNote> : null}
        <input type="hidden" name="listingId" value={listingId} />
        <select
          name="reason"
          aria-label="Motivo"
          required
          defaultValue=""
          className="rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none transition duration-200 ease-salida hover:border-brand/30 focus:border-brand focus:ring-3 focus:ring-brand/15"
        >
          <option value="" disabled>
            ¿Qué pasa con esta publicación?
          </option>
          {REASONS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
        <input
          name="detail"
          aria-label="Detalle"
          placeholder="Cuéntanos más (opcional)"
          className="rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none transition duration-200 ease-salida hover:border-brand/30 focus:border-brand focus:ring-3 focus:ring-brand/15"
        />
        <Button type="submit" variant="outline" disabled={pending}>
          {pending ? "Enviando…" : "Reportar"}
        </Button>
      </form>
    </details>
  );
}

export function ReviewForm({ listingId }: { listingId: string }) {
  const [result, submit, pending] = useActionState<
    ModerationResult | null,
    FormData
  >(reviewListing, null);

  return (
    <form action={submit} className="mt-3 flex flex-col gap-2">
      {result?.error ? <ErrorNote>{result.error}</ErrorNote> : null}
      <input type="hidden" name="listingId" value={listingId} />
      <input
        name="note"
        aria-label="Nota de revisión"
        placeholder="Nota (opcional)"
        className="rounded-xl border border-line bg-white px-3 py-2 text-sm outline-none transition duration-200 ease-salida hover:border-brand/30 focus:border-brand focus:ring-3 focus:ring-brand/15"
      />
      <div className="flex gap-2">
        <Button
          type="submit"
          name="decision"
          value="aprobar"
          disabled={pending}
        >
          Aprobar
        </Button>
        <Button
          type="submit"
          name="decision"
          value="rechazar"
          variant="outline"
          disabled={pending}
        >
          Rechazar
        </Button>
      </div>
    </form>
  );
}
