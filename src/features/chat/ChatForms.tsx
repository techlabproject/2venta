"use client";

import { useActionState, useRef, useState } from "react";
import {
  makeOffer,
  reportConversation,
  respondToOffer,
  sendMessage,
  type ChatResult,
} from "./actions";
import { uploadBlob, UploadError } from "@/features/publish/useUpload";
import { Button, ErrorNote } from "@/components/ui";

const inputClass =
  "flex-1 rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none transition duration-200 ease-salida hover:border-brand/30 focus:border-brand focus:ring-3 focus:ring-brand/15";

export function MessageForm({
  conversationId,
  puedeAdjuntar = false,
}: {
  conversationId: string;
  /** Solo quien vende manda fotos (D-92). */
  puedeAdjuntar?: boolean;
}) {
  const ref = useRef<HTMLFormElement>(null);
  const [foto, setFoto] = useState<{ archivo: File; url: string } | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [errorFoto, setErrorFoto] = useState<string | null>(null);

  const [result, submit, pending] = useActionState<ChatResult | null, FormData>(
    async (prev, form) => {
      // La foto sube DIRECTO al bucket desde el navegador (D-50) y al servidor
      // solo le llega la clave, que él comprueba. Subirla aquí y no antes evita
      // dejar archivos huérfanos cada vez que alguien escoge una y se arrepiente.
      if (foto) {
        setSubiendo(true);
        try {
          form.set("imageKey", await uploadBlob(foto.archivo, "image"));
        } catch (e) {
          setSubiendo(false);
          return {
            error:
              e instanceof UploadError
                ? e.message
                : "No se pudo subir la foto. Intenta otra vez.",
          };
        }
        setSubiendo(false);
      }

      const res = await sendMessage(prev, form);
      if (!res.error) {
        ref.current?.reset();
        quitarFoto();
      }
      return res;
    },
    null,
  );

  function quitarFoto() {
    setFoto((f) => {
      if (f) URL.revokeObjectURL(f.url);
      return null;
    });
    setErrorFoto(null);
  }

  function escoger(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    e.target.value = "";
    if (!archivo) return;
    if (!archivo.type.startsWith("image/")) {
      setErrorFoto("Eso no es una imagen.");
      return;
    }
    quitarFoto();
    setFoto({ archivo, url: URL.createObjectURL(archivo) });
  }

  return (
    <form ref={ref} action={submit} className="flex flex-col gap-2">
      {result?.error ? <ErrorNote>{result.error}</ErrorNote> : null}
      <input type="hidden" name="conversationId" value={conversationId} />

      {errorFoto ? <ErrorNote>{errorFoto}</ErrorNote> : null}

      {foto && (
        <div className="flex items-center gap-3 rounded-xl bg-white p-2 ring-1 ring-line">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={foto.url}
            alt=""
            aria-hidden
            className="h-14 w-14 rounded-lg bg-ph object-cover"
          />
          <span className="flex-1 text-xs text-muted">
            {subiendo ? "Subiendo la foto…" : "Se manda con el mensaje"}
          </span>
          <button
            type="button"
            onClick={quitarFoto}
            className="rounded-lg px-2 py-1 text-xs text-danger underline"
          >
            Quitar
          </button>
        </div>
      )}

      <div className="flex items-end gap-2">
        {puedeAdjuntar && (
          // El control nativo no se puede traducir ni dar forma, así que va oculto
          // y lo dispara la etiqueta, que sí. `peer-focus-visible` le devuelve el
          // contorno a quien navega con teclado.
          <label className="flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-full border border-line bg-white text-ink2 shadow-xs transition duration-200 ease-salida hover:border-brand/30 hover:bg-ph active:scale-90 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand">
            <span className="sr-only">Adjuntar una foto</span>
            <input
              type="file"
              accept="image/*"
              onChange={escoger}
              className="sr-only"
            />
            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
              <path
                d="M21 12.5l-8.4 8.4a5 5 0 01-7.1-7.1l9-9a3.4 3.4 0 014.8 4.8l-9 9a1.8 1.8 0 01-2.5-2.5l8.3-8.3"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </label>
        )}
        <input
          name="body"
          aria-label="Mensaje"
          placeholder="Escribe tu mensaje"
          className={`${inputClass} rounded-full`}
          required={!foto}
        />
        {/* Redondo y con el icono, como en cualquier chat: el botón de enviar es
            el mismo gesto en todas partes y no necesita que lo lean. La palabra
            sigue ahí para quien usa lector de pantalla. */}
        <button
          type="submit"
          disabled={pending || subiendo}
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
      <label htmlFor="precio-oferta" className="text-sm font-medium">
        Cuánto ofreces
      </label>
      <input
        id="precio-oferta"
        name="price"
        inputMode="numeric"
        autoFocus
        placeholder={String(askingPrice)}
        aria-describedby="pista-oferta"
        className={`${inputClass} text-center font-title text-2xl tabular-nums`}
        required
      />
      <p id="pista-oferta" className="text-xs text-muted">
        En pesos y sin centavos. Pide {askingPrice.toLocaleString("es-CO")}.
      </p>
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
        Lo estamos revisando. No le avisamos a la otra persona que reportaste.
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
          como está para que podamos revisarla.
        </p>
      </form>
    </details>
  );
}
