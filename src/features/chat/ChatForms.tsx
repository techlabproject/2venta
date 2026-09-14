"use client";

import { useActionState, useRef } from "react";
import { makeOffer, respondToOffer, sendMessage, type ChatResult } from "./actions";
import { Button, ErrorNote } from "@/components/ui";

const inputClass =
  "flex-1 rounded-xl border border-brand/20 bg-white px-4 py-3 text-sm outline-none focus:border-brand";

export function MessageForm({ conversationId }: { conversationId: string }) {
  const ref = useRef<HTMLFormElement>(null);
  const [result, submit, pending] = useActionState<ChatResult | null, FormData>(
    async (prev, form) => {
      const res = await sendMessage(prev, form);
      if (!res.error) ref.current?.reset();
      return res;
    },
    null
  );

  return (
    <form ref={ref} action={submit} className="mt-4 flex flex-col gap-2">
      {result?.error ? <ErrorNote>{result.error}</ErrorNote> : null}
      <input type="hidden" name="conversationId" value={conversationId} />
      <div className="flex gap-2">
        <input
          name="body"
          aria-label="Mensaje"
          placeholder="Escribe tu mensaje"
          className={inputClass}
          required
        />
        <Button type="submit" disabled={pending} size="inline">
          Enviar
        </Button>
      </div>
    </form>
  );
}

export function OfferForm({ conversationId }: { conversationId: string }) {
  const ref = useRef<HTMLFormElement>(null);
  const [result, submit, pending] = useActionState<ChatResult | null, FormData>(
    async (prev, form) => {
      const res = await makeOffer(prev, form);
      if (!res.error) ref.current?.reset();
      return res;
    },
    null
  );

  return (
    <form ref={ref} action={submit} className="flex flex-col gap-2">
      {result?.error ? <ErrorNote>{result.error}</ErrorNote> : null}
      <input type="hidden" name="conversationId" value={conversationId} />
      <div className="flex gap-2">
        <input
          name="price"
          inputMode="numeric"
          aria-label="Cuánto ofreces"
          placeholder="Cuánto ofreces"
          className={inputClass}
          required
        />
        <Button type="submit" variant="outline" disabled={pending} size="inline">
          Ofertar
        </Button>
      </div>
      <p className="text-xs text-muted">La oferta vence en 24 horas.</p>
    </form>
  );
}

export function OfferDecision({ offerId }: { offerId: string }) {
  const [result, submit, pending] = useActionState<ChatResult | null, FormData>(
    respondToOffer,
    null
  );

  return (
    <form action={submit} className="mt-3 flex flex-col gap-2">
      {result?.error ? <ErrorNote>{result.error}</ErrorNote> : null}
      <input type="hidden" name="offerId" value={offerId} />
      <div className="flex gap-2">
        <Button type="submit" name="decision" value="aceptar" disabled={pending}>
          Aceptar
        </Button>
        <Button type="submit" name="decision" value="rechazar" variant="outline" disabled={pending}>
          Rechazar
        </Button>
      </div>
    </form>
  );
}
