"use client";

import { useActionState, useRef } from "react";
import { confirmReceipt, type BuyResult } from "./actions";
import { Button, ErrorNote } from "@/components/ui";

/**
 * «Ya lo recibí, liberar pago». Liberar no tiene vuelta atrás: la plata pasa a quien
 * vendió y ya no se puede abrir un reclamo. Por eso pide confirmar, con el mismo
 * diálogo que «Retirar» (exploradora y revisión de diseño, D-129).
 */
export function ConfirmReceiptButton({ orderId }: { orderId: string }) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const [result, submit, pending] = useActionState<BuyResult | null, FormData>(
    async (prev, form) => {
      const res = await confirmReceipt(prev, form);
      dialogo.current?.close();
      return res;
    },
    null,
  );

  return (
    <div className="mt-5 flex flex-col gap-3">
      {result?.error ? <ErrorNote>{result.error}</ErrorNote> : null}
      <Button type="button" onClick={() => dialogo.current?.showModal()}>
        Ya lo recibí, liberar pago
      </Button>
      <p className="text-xs text-muted">
        Revisa el producto antes de confirmar. Una vez liberado, el dinero es
        del vendedor.
      </p>
      <dialog
        ref={dialogo}
        aria-labelledby={`liberar-${orderId}`}
        onClick={(e) => e.target === dialogo.current && dialogo.current.close()}
        className="m-auto w-[min(92vw,26rem)] rounded-2xl bg-white p-5 text-ink shadow-xl backdrop:bg-ink/40"
      >
        <form action={submit} className="flex flex-col gap-3">
          <input type="hidden" name="orderId" value={orderId} />
          <h2 id={`liberar-${orderId}`} className="font-title text-lg font-semibold">
            ¿Liberar el pago?
          </h2>
          <p className="text-sm text-ink2">
            Hazlo solo si ya revisaste el producto y está como decía. Después la
            plata es de quien vendió y ya no puedes abrir un reclamo.
          </p>
          <div className="mt-1 flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={() => dialogo.current?.close()}
              className="rounded-xl px-4 py-2 text-sm font-medium text-ink2 underline"
            >
              Cancelar
            </button>
            <Button type="submit" disabled={pending} size="inline">
              {pending ? "Liberando…" : "Sí, liberar el pago"}
            </Button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
