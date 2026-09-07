"use client";

import { useActionState } from "react";
import { openClaim, replyToClaim, resolveClaim, type ClaimResult } from "./actions";
import { Button, ErrorNote } from "@/components/ui";

const field =
  "w-full rounded-xl border border-brand/20 bg-white px-4 py-3 text-sm outline-none focus:border-brand";

export function OpenClaimForm({ orderId }: { orderId: string }) {
  const [result, submit, pending] = useActionState<ClaimResult | null, FormData>(
    openClaim,
    null
  );

  return (
    <details className="mt-4">
      <summary className="cursor-pointer text-sm text-ink2 underline">
        Tengo un problema con el pedido
      </summary>
      <form action={submit} className="mt-3 flex flex-col gap-3">
        {result?.error ? <ErrorNote>{result.error}</ErrorNote> : null}
        <input type="hidden" name="orderId" value={orderId} />

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-medium">¿Qué pasó?</legend>
          <label className="flex items-start gap-2 text-sm">
            <input type="radio" name="kind" value="no_coincide" className="mt-0.5" required />
            <span>
              Llegó, pero no es lo que decía la publicación
              <span className="block text-xs text-muted">Tienes 48 horas desde la entrega.</span>
            </span>
          </label>
          <label className="flex items-start gap-2 text-sm">
            <input type="radio" name="kind" value="no_llego" className="mt-0.5" />
            <span>
              Nunca me llegó
              <span className="block text-xs text-muted">Tienes 7 días desde la entrega.</span>
            </span>
          </label>
        </fieldset>

        <textarea name="detail" aria-label="Qué pasó" rows={4} required className={field}
          placeholder="Cuéntanos qué pasó. Compara con lo que decía la publicación y con el video." />

        <Button type="submit" disabled={pending}>
          {pending ? "Abriendo el reclamo…" : "Abrir reclamo"}
        </Button>
        <p className="text-xs text-muted">
          Mientras revisamos, tu dinero no se mueve. Ni al vendedor ni de vuelta a ti,
          hasta que alguien mire las dos versiones.
        </p>
      </form>
    </details>
  );
}

export function ReplyClaimForm({ orderId }: { orderId: string }) {
  const [result, submit, pending] = useActionState<ClaimResult | null, FormData>(
    replyToClaim,
    null
  );

  return (
    <form action={submit} className="mt-3 flex flex-col gap-3">
      {result?.error ? <ErrorNote>{result.error}</ErrorNote> : null}
      <input type="hidden" name="orderId" value={orderId} />
      <textarea name="reply" aria-label="Tu versión" rows={4} required className={field}
        placeholder="Cuenta tu versión. Si el video de tu publicación lo muestra, dilo." />
      <Button type="submit" disabled={pending}>
        {pending ? "Enviando…" : "Responder"}
      </Button>
    </form>
  );
}

export function ResolveClaimForm({ orderId }: { orderId: string }) {
  const [result, submit, pending] = useActionState<ClaimResult | null, FormData>(
    resolveClaim,
    null
  );

  return (
    <form action={submit} className="mt-4 flex flex-col gap-2">
      {result?.error ? <ErrorNote>{result.error}</ErrorNote> : null}
      <input type="hidden" name="orderId" value={orderId} />
      <input name="note" aria-label="Nota de la decisión" className={field}
        placeholder="Por qué se decide así (queda en el registro)" />
      <div className="flex gap-2">
        <Button type="submit" name="favor" value="comprador" disabled={pending}>
          Devolver al comprador
        </Button>
        <Button type="submit" name="favor" value="vendedor" variant="outline" disabled={pending}>
          Liberar al vendedor
        </Button>
      </div>
    </form>
  );
}
