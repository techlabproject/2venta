"use client";

import { useActionState } from "react";
import { uploadBulk, type StoreResult } from "./actions";
import { Button, ErrorNote, Field } from "@/components/ui";
import { COLUMNS, MAX_ROWS } from "./bulk";

export function BulkUploadForm() {
  const [result, submit, pending] = useActionState<
    StoreResult | null,
    FormData
  >(uploadBulk, null);

  return (
    <form action={submit} className="mt-4 flex flex-col gap-3">
      {result?.error ? <ErrorNote>{result.error}</ErrorNote> : null}

      {result?.created !== undefined && (
        <div
          role="status"
          className="rounded-xl bg-brand/10 px-4 py-3 text-sm text-brand"
        >
          <p data-testid="lote-creados">
            {result.created === 1
              ? "Se creó 1 borrador."
              : `Se crearon ${result.created} borradores.`}{" "}
            Ahora hay que grabarles el video.
          </p>
          {result.rowErrors && result.rowErrors.length > 0 && (
            <ul
              data-testid="lote-errores"
              className="mt-2 flex flex-col gap-1 text-warn"
            >
              {result.rowErrors.map((e, i) => (
                <li key={i}>
                  Línea {e.line}: {e.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <input
        type="file"
        name="file"
        accept=".csv,text/csv"
        aria-label="Archivo de artículos"
        required
        className="rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none transition duration-200 ease-salida hover:border-brand/30 focus:border-brand focus:ring-3 focus:ring-brand/15"
      />

      <Button type="submit" variant="outline" disabled={pending}>
        {pending ? "Cargando…" : "Cargar artículos"}
      </Button>

      <p className="text-xs text-muted">
        Un archivo separado por comas con estas columnas: {COLUMNS.join(", ")}.
        Máximo {MAX_ROWS} filas. El IMEI solo hace falta en tecnología.
      </p>
    </form>
  );
}
