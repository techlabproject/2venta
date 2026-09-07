"use client";

import { useActionState } from "react";
import { createShipment, type ShipResult } from "./actions";
import { Button, ErrorNote } from "@/components/ui";

export function ShipButton({ orderId }: { orderId: string }) {
  const [result, submit, pending] = useActionState<ShipResult | null, FormData>(
    createShipment,
    null
  );

  return (
    <form action={submit} className="mt-4 flex flex-col gap-3">
      {result?.error ? <ErrorNote>{result.error}</ErrorNote> : null}
      <input type="hidden" name="orderId" value={orderId} />
      <Button type="submit" disabled={pending}>
        {pending ? "Generando la guía…" : "Generar guía y despachar"}
      </Button>
    </form>
  );
}
