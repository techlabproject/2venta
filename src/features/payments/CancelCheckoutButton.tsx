"use client";

import { useActionState } from "react";
import { cancelCheckout, type BuyResult } from "./actions";
import { Button, ErrorNote } from "@/components/ui";

/** Suelta el artículo de un pago que no se terminó, para quien decidió que no. */
export function CancelCheckoutButton({ orderId }: { orderId: string }) {
  const [result, submit, pending] = useActionState<BuyResult | null, FormData>(
    cancelCheckout,
    null
  );

  return (
    <form action={submit} className="flex flex-col gap-2">
      {result?.error ? <ErrorNote>{result.error}</ErrorNote> : null}
      <input type="hidden" name="orderId" value={orderId} />
      <Button type="submit" variant="ghost" disabled={pending}>
        {pending ? "Cancelando…" : "Cancelar este pedido"}
      </Button>
    </form>
  );
}
