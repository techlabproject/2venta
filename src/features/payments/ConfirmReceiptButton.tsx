"use client";

import { useActionState } from "react";
import { confirmReceipt, type BuyResult } from "./actions";
import { Button, ErrorNote } from "@/components/ui";

export function ConfirmReceiptButton({ orderId }: { orderId: string }) {
  const [result, submit, pending] = useActionState<BuyResult | null, FormData>(
    confirmReceipt,
    null,
  );

  return (
    <form action={submit} className="mt-5 flex flex-col gap-3">
      {result?.error ? <ErrorNote>{result.error}</ErrorNote> : null}
      <input type="hidden" name="orderId" value={orderId} />
      <Button type="submit" disabled={pending}>
        {pending ? "Liberando…" : "Ya lo recibí, liberar pago"}
      </Button>
      <p className="text-xs text-muted">
        Revisa el producto antes de confirmar. Una vez liberado, el dinero es
        del vendedor.
      </p>
    </form>
  );
}
