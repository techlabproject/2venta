"use client";

import { useActionState } from "react";
import { rateCounterpart, type RatingResult } from "./actions";
import { Button, ErrorNote } from "@/components/ui";

export function RateForm({
  orderId,
  counterpart,
}: {
  orderId: string;
  counterpart: string;
}) {
  const [result, submit, pending] = useActionState<
    RatingResult | null,
    FormData
  >(rateCounterpart, null);

  return (
    <section className="mt-6 rounded-2xl bg-white shadow-xs p-4 ring-1 ring-line">
      <h2 className="font-medium">¿Cómo te fue con {counterpart}?</h2>
      <form action={submit} className="mt-3 flex flex-col gap-3">
        {result?.error ? <ErrorNote>{result.error}</ErrorNote> : null}
        <input type="hidden" name="orderId" value={orderId} />

        <fieldset className="flex flex-col gap-1.5">
          <legend className="sr-only">Estrellas</legend>
          {[5, 4, 3, 2, 1].map((n) => (
            <label key={n} className="flex items-center gap-2 text-sm">
              <input type="radio" name="stars" value={n} required />
              <span aria-hidden="true" className="text-accent-text">
                {"★".repeat(n)}
              </span>
              <span className="sr-only">{n} de 5</span>
            </label>
          ))}
        </fieldset>

        <textarea
          name="review"
          aria-label="Tu reseña"
          rows={3}
          className="rounded-xl border border-brand/20 bg-white px-4 py-3 text-sm outline-none focus:border-brand"
          placeholder="Cuenta cómo fue (opcional). Lo va a leer el siguiente comprador."
        />

        <Button type="submit" disabled={pending}>
          {pending ? "Enviando…" : "Calificar"}
        </Button>
      </form>
    </section>
  );
}
