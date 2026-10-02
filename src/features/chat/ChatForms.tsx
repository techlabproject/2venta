"use client";

import { useActionState, useRef } from "react";
import {
  makeOffer,
  reportConversation,
  respondToOffer,
  sendMessage,
  type ChatResult,
} from "./actions";
import { Button, ErrorNote } from "@/components/ui";
import { CampoPrecio } from "@/components/CampoPrecio";
import { formatearPrecio } from "@/lib/precio";
import { MIN_PRICE_COP } from "@/features/payments/money";

const inputClass =
  "flex-1 rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none transition duration-200 ease-salida hover:border-brand/30 focus:border-brand focus:ring-3 focus:ring-brand/15";

/**
 * Escribir en el chat. Solo texto: las fotos se quitaron en la versión 3 de las
 * correcciones (fila 21, D-129); lo que se enseña va en las fotos y el video del
 * artículo.
 */
export function MessageForm({ conversationId }: { conversationId: string }) {
  const ref = useRef<HTMLFormElement>(null);

  const [result, submit, pending] = useActionState<ChatResult | null, FormData>(
    async (prev, form) => {
      const res = await sendMessage(prev, form);
      if (!res.error) ref.current?.reset();
      return res;
    },
    null,
  );

  return (
    <form ref={ref} action={submit} className="flex flex-col gap-2">
      {result?.error ? <ErrorNote>{result.error}</ErrorNote> : null}
      <input type="hidden" name="conversationId" value={conversationId} />

      <div className="flex items-end gap-2">
        <input
          name="body"
          aria-label="Mensaje"
          placeholder="Escribe tu mensaje"
          className={`${inputClass} rounded-full`}
          required
        />
        {/* Redondo y con el icono, como en cualquier chat: el botón de enviar es
            el mismo gesto en todas partes y no necesita que lo lean. La palabra
            sigue ahí para quien usa lector de pantalla. */}
        <button
          type="submit"
          disabled={pending}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-accent-edge/70 bg-accent text-on-accent shadow-sm transition duration-200 ease-salida hover:brightness-[0.97] active:scale-90 disabled:opacity-60 disabled:active:scale-100"
        >
          <span className="sr-only">Enviar</span>
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
            <path
              d="M20 12L4 4l4 8-4 8 16-8z"
              fill="currentColor"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </form>
  );
}

/**
 * El formulario del panel de oferta (`/chat/[id]/oferta`).
 *
 * Aquí el campo de precio sí manda, porque es lo único que hay en la pantalla. En
 * el chat no: allí la acción de cada día es escribir (D-91).
 */
export function OfferPanelForm({
  conversationId,
  askingPrice,
}: {
  conversationId: string;
  askingPrice: number;
}) {
  const [result, submit, pending] = useActionState<ChatResult | null, FormData>(
    makeOffer,
    null,
  );

  return (
    <form action={submit} className="mt-5 flex flex-col gap-3">
      {result?.error ? <ErrorNote>{result.error}</ErrorNote> : null}
      <input type="hidden" name="conversationId" value={conversationId} />
      {/* El mismo campo de precio que publicar y editar (corrección 24). Con el
          mismo mínimo: una oferta aceptada por debajo no se podía pagar. */}
      <CampoPrecio
        id="precio-oferta"
        name="price"
        label="Cuánto ofreces"
        monto
        autoFocus
        required
        minimo={MIN_PRICE_COP}
        placeholder={formatearPrecio(String(askingPrice))}
        hint={`Pide $${formatearPrecio(String(askingPrice))}.`}
      />
      <Button type="submit" disabled={pending}>
        Enviar la oferta
      </Button>
    </form>
  );
}

export function OfferDecision({ offerId }: { offerId: string }) {
  const [result, submit, pending] = useActionState<ChatResult | null, FormData>(
    respondToOffer,
    null,
  );

  return (
    <form action={submit} className="mt-3 flex flex-col gap-2">
      {result?.error ? <ErrorNote>{result.error}</ErrorNote> : null}
      <input type="hidden" name="offerId" value={offerId} />
      <div className="flex gap-2">
        <Button
          type="submit"
          name="decision"
          value="aceptar"
          disabled={pending}
        >
          Aceptar
        </Button>
        <Button
          type="submit"
          name="decision"
          value="rechazar"
          variant="outline"
          disabled={pending}
        >
          Rechazar
        </Button>
      </div>
    </form>
  );
}

const MOTIVOS: { value: string; label: string }[] = [
  { value: "insultos", label: "Me está insultando o amenazando" },
  { value: "contenido_sexual", label: "Me mandó contenido sexual" },
  { value: "estafa", label: "Está intentando estafarme" },
  { value: "datos_personales", label: "Me pide datos o pagos por fuera" },
  { value: "otro", label: "Otra cosa" },
];

/**
 * Reportar la conversación (S-37, D-92).
 *
 * Va cerrado dentro de un `<details>` y en texto pequeño: tiene que estar siempre
 * a mano y no tiene que gritar. Un botón rojo permanente en una conversación
 * normal sugiere que hablar con desconocidos aquí es peligroso, que es justo lo
 * contrario de lo que el producto promete.
 */
export function ReportChatForm({ conversationId }: { conversationId: string }) {
  const [result, submit, pending] = useActionState<ChatResult | null, FormData>(
    reportConversation,
    null,
  );

  if (result && !result.error) {
    return (
      <p
        role="status"
        data-testid="reporte-hecho"
        className="rounded-xl bg-brand/10 px-3 py-2 text-xs text-brand"
      >
        Lo estamos revisando. No le avisamos a la otra persona que reportaste, y
        desde ahora no te llegan sus mensajes ni sus ofertas aquí.
      </p>
    );
  }

  return (
    <details data-testid="reportar">
      <summary className="cursor-pointer text-xs text-ink2 underline">
        Reportar esta conversación
      </summary>

      <form action={submit} className="mt-2 flex flex-col gap-2">
        {result?.error ? <ErrorNote>{result.error}</ErrorNote> : null}
        <input type="hidden" name="conversationId" value={conversationId} />

        <label htmlFor="motivo-reporte" className="text-xs font-medium">
          Qué está pasando
        </label>
        <select
          id="motivo-reporte"
          name="reason"
          required
          defaultValue=""
          className={`${inputClass} py-2 text-sm`}
        >
          <option value="" disabled>
            Escoge una
          </option>
          {MOTIVOS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>

        <textarea
          name="detail"
          aria-label="Cuéntanos qué pasó"
          placeholder="Cuéntanos qué pasó (opcional)"
          rows={3}
          className={`${inputClass} py-2 text-sm`}
        />

        <Button type="submit" variant="outline" disabled={pending}>
          Enviar el reporte
        </Button>
        <p className="text-[11px] text-muted">
          No le avisamos a la otra persona. La conversación queda guardada tal y
          como está para que podamos revisarla, y desde ese momento dejan de
          llegarte sus mensajes aquí.
        </p>
      </form>
    </details>
  );
}
