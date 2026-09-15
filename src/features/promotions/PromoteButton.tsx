"use client";

import { useActionState } from "react";
import { promoteListing, type PromotionResult } from "./actions";
import { Button, ErrorNote } from "@/components/ui";
import { PROMOTION_DAYS, PROMOTION_PRICE_COP } from "./config";

export function PromoteButton({
  listingId,
  extending = false,
}: {
  listingId: string;
  extending?: boolean;
}) {
  const [result, submit, pending] = useActionState<
    PromotionResult | null,
    FormData
  >(promoteListing, null);

  return (
    <form action={submit} className="mt-4 flex flex-col gap-2">
      {result?.error ? <ErrorNote>{result.error}</ErrorNote> : null}
      <input type="hidden" name="listingId" value={listingId} />
      <Button type="submit" variant="outline" disabled={pending}>
        {pending
          ? "Preparando el pago…"
          : `${extending ? "Extender" : "Destacar por"} ${PROMOTION_DAYS} días · $${PROMOTION_PRICE_COP.toLocaleString("es-CO")}`}
      </Button>
      <p className="text-xs text-muted">
        {extending
          ? "Los días nuevos se suman al final del periodo actual, no se solapan."
          : "Aparece primero en el catálogo y en las búsquedas, marcado como destacado."}
      </p>
    </form>
  );
}
