"use client";

import { useActionState } from "react";
import { buyListing, type BuyResult } from "./actions";
import { Button, ErrorNote } from "@/components/ui";

export function BuyButton({ listingId }: { listingId: string }) {
  const [result, submit, pending] = useActionState<BuyResult | null, FormData>(
    buyListing,
    null
  );

  return (
    <form action={submit} className="mt-4 flex flex-col gap-3">
      {result?.error && <ErrorNote>{result.error}</ErrorNote>}
      <input type="hidden" name="listingId" value={listingId} />
      <Button type="submit" disabled={pending}>
        {pending ? "Preparando el pago…" : "Comprar con pago protegido"}
      </Button>
    </form>
  );
}
