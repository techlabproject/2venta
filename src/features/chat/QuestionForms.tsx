"use client";

import { useActionState, useRef } from "react";
import { answerQuestion, askQuestion, startConversation, type ChatResult } from "./actions";
import { Button, ErrorNote } from "@/components/ui";

const inputClass =
  "flex-1 rounded-xl border border-brand/20 bg-white px-4 py-3 text-sm outline-none focus:border-brand";

export function AskForm({ listingId }: { listingId: string }) {
  const ref = useRef<HTMLFormElement>(null);
  const [result, submit, pending] = useActionState<ChatResult | null, FormData>(
    async (prev, form) => {
      const res = await askQuestion(prev, form);
      if (!res.error) ref.current?.reset();
      return res;
    },
    null
  );

  return (
    <form ref={ref} action={submit} className="mt-4 flex flex-col gap-2">
      {result?.error ? <ErrorNote>{result.error}</ErrorNote> : null}
      <input type="hidden" name="listingId" value={listingId} />
      <div className="flex gap-2">
        <input name="body" aria-label="Tu pregunta" placeholder="Pregunta algo del producto"
          className={inputClass} required />
        <Button type="submit" variant="outline" disabled={pending} className="w-auto px-5">
          Preguntar
        </Button>
      </div>
      <p className="text-xs text-muted">
        Las preguntas y las respuestas las ve cualquiera que abra este artículo.
      </p>
    </form>
  );
}

export function AnswerForm({ questionId }: { questionId: string }) {
  const ref = useRef<HTMLFormElement>(null);
  const [result, submit, pending] = useActionState<ChatResult | null, FormData>(
    async (prev, form) => {
      const res = await answerQuestion(prev, form);
      if (!res.error) ref.current?.reset();
      return res;
    },
    null
  );

  return (
    <form ref={ref} action={submit} className="mt-2 flex flex-col gap-2">
      {result?.error ? <ErrorNote>{result.error}</ErrorNote> : null}
      <input type="hidden" name="questionId" value={questionId} />
      <div className="flex gap-2">
        <input name="answer" aria-label="Tu respuesta" placeholder="Responder"
          className={inputClass} required />
        <Button type="submit" variant="outline" disabled={pending} className="w-auto px-4">
          Responder
        </Button>
      </div>
    </form>
  );
}

export function ChatButton({ listingId }: { listingId: string }) {
  const [result, submit, pending] = useActionState<ChatResult | null, FormData>(
    startConversation,
    null
  );

  return (
    <form action={submit} className="mt-3 flex flex-col gap-2">
      {result?.error ? <ErrorNote>{result.error}</ErrorNote> : null}
      <input type="hidden" name="listingId" value={listingId} />
      <Button type="submit" variant="outline" disabled={pending}>
        {pending ? "Abriendo…" : "Escribirle al vendedor"}
      </Button>
    </form>
  );
}
