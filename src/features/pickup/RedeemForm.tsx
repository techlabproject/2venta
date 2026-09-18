"use client";

import { useActionState } from "react";
import { redeemCode, type PickupResult } from "./actions";
import { Button, ErrorNote } from "@/components/ui";

export function RedeemForm({ orderId }: { orderId: string }) {
  const [result, submit, pending] = useActionState<
    PickupResult | null,
    FormData
  >(redeemCode, null);

  return (
    <form action={submit} className="mt-4 flex flex-col gap-3">
      {result?.error ? <ErrorNote>{result.error}</ErrorNote> : null}
      <input type="hidden" name="orderId" value={orderId} />
      <input
        name="code"
        aria-label="Código del comprador"
        inputMode="numeric"
        maxLength={9}
        placeholder="000000"
        required
        className="rounded-xl border border-line bg-white px-4 py-3 text-center font-title text-2xl tracking-[0.3em] outline-none transition duration-200 ease-salida hover:border-brand/30 focus:border-brand focus:ring-3 focus:ring-brand/15"
      />
      <Button type="submit" disabled={pending}>
        {pending ? "Comprobando…" : "Cobrar la venta"}
      </Button>
      <p className="text-xs text-muted">
        Pídeselo al comprador después de que revise el producto. No se lo pidas
        antes: el código es su garantía.
      </p>
    </form>
  );
}
