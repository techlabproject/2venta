"use client";

import { useActionState, useState } from "react";
import {
  openClaim,
  replyToClaim,
  resolveClaim,
  type ClaimResult,
} from "./actions";
import { Button, ErrorNote } from "@/components/ui";
import { uploadBlob, UploadError } from "@/features/publish/useUpload";
import { MAX_PRUEBAS } from "./limites";

const field =
  "w-full rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none transition duration-200 ease-salida hover:border-brand/30 focus:border-brand focus:ring-3 focus:ring-brand/15";


/**
 * Escoger fotos de prueba, hasta el tope.
 *
 * El estado vive aquí y no en el formulario porque las fotos suben DENTRO del envío
 * —directo al bucket con URL prefirmada (D-50)— y hay que poder cancelar el envío
 * si la subida falla. Subirlas al escogerlas dejaría un archivo huérfano en el
 * bucket cada vez que alguien se arrepiente.
 */
function usePruebas() {
  const [fotos, setFotos] = useState<{ archivo: File; url: string }[]>([]);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function escoger(e: React.ChangeEvent<HTMLInputElement>) {
    const nuevos = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (nuevos.length === 0) return;
    if (nuevos.some((a) => !a.type.startsWith("image/"))) {
      setError("Solo se pueden adjuntar imágenes.");
      return;
    }
    setError(null);
    setFotos((antes) => {
      const hueco = MAX_PRUEBAS - antes.length;
      if (hueco <= 0) {
        setError(`Puedes adjuntar hasta ${MAX_PRUEBAS} fotos.`);
        return antes;
      }
      if (nuevos.length > hueco) {
        setError(`Solo caben ${MAX_PRUEBAS} fotos; se quedaron las primeras.`);
      }
      return [
        ...antes,
        ...nuevos.slice(0, hueco).map((archivo) => ({
          archivo,
          url: URL.createObjectURL(archivo),
        })),
      ];
    });
  }

  function quitar(url: string) {
    URL.revokeObjectURL(url);
    setFotos((antes) => antes.filter((f) => f.url !== url));
    setError(null);
  }

  /** Sube lo escogido y deja las claves en el formulario. Devuelve el error si falla. */
  async function subir(form: FormData): Promise<string | null> {
    if (fotos.length === 0) return null;
    setSubiendo(true);
    try {
      for (const f of fotos) {
        form.append("photoKeys", await uploadBlob(f.archivo, "prueba"));
      }
      return null;
    } catch (e) {
      return e instanceof UploadError
        ? e.message
        : "No se pudieron subir las fotos. Intenta otra vez.";
    } finally {
      setSubiendo(false);
    }
  }

  function limpiar() {
    fotos.forEach((f) => URL.revokeObjectURL(f.url));
    setFotos([]);
    setError(null);
  }

  return { fotos, escoger, quitar, subir, subiendo, error, limpiar };
}

/** La tira de miniaturas con su botón de adjuntar. */
function CampoDePruebas({
  pruebas,
  ayuda,
}: {
  pruebas: ReturnType<typeof usePruebas>;
  ayuda: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      {pruebas.error ? <ErrorNote>{pruebas.error}</ErrorNote> : null}

      {pruebas.fotos.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {pruebas.fotos.map((f) => (
            <li key={f.url} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={f.url}
                alt=""
                aria-hidden
                className="h-20 w-20 rounded-xl bg-ph object-cover ring-1 ring-line"
              />
              <button
                type="button"
                onClick={() => pruebas.quitar(f.url)}
                className="absolute -top-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs text-danger shadow-xs ring-1 ring-line transition hover:bg-ph"
              >
                <span className="sr-only">Quitar esta foto</span>
                <span aria-hidden>×</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {pruebas.fotos.length < MAX_PRUEBAS && (
        // El control nativo no se puede traducir ni dar forma, así que va oculto y
        // lo dispara la etiqueta. `has-[:focus-visible]` le devuelve el contorno a
        // quien navega con teclado.
        <label className="inline-flex w-auto cursor-pointer items-center gap-2 self-start rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink2 shadow-xs transition duration-200 ease-salida hover:border-brand/30 hover:bg-ph active:scale-[0.98] has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={pruebas.escoger}
            className="sr-only"
          />
          <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
            <path
              d="M21 12.5l-8.4 8.4a5 5 0 01-7.1-7.1l9-9a3.4 3.4 0 014.8 4.8l-9 9a1.8 1.8 0 01-2.5-2.5l8.3-8.3"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {pruebas.fotos.length === 0 ? "Adjuntar fotos" : "Adjuntar otra"}
        </label>
      )}

      <p className="text-xs text-muted">{ayuda}</p>
    </div>
  );
}

export function OpenClaimForm({ orderId }: { orderId: string }) {
  const pruebas = usePruebas();
  const [result, submit, pending] = useActionState<
    ClaimResult | null,
    FormData
  >(async (prev, form) => {
    const fallo = await pruebas.subir(form);
    if (fallo) return { error: fallo };
    const res = await openClaim(prev, form);
    if (!res.error) pruebas.limpiar();
    return res;
  }, null);

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
            <input
              type="radio"
              name="kind"
              value="no_coincide"
              className="mt-0.5"
              required
            />
            <span>
              Llegó, pero no es lo que decía la publicación
              <span className="block text-xs text-muted">
                Tienes 48 horas desde la entrega.
              </span>
            </span>
          </label>
          <label className="flex items-start gap-2 text-sm">
            <input
              type="radio"
              name="kind"
              value="no_llego"
              className="mt-0.5"
            />
            <span>
              Nunca me llegó
              <span className="block text-xs text-muted">
                Tienes 7 días desde la entrega.
              </span>
            </span>
          </label>
        </fieldset>

        <textarea
          name="detail"
          aria-label="Qué pasó"
          rows={4}
          required
          className={field}
          placeholder="Cuéntanos qué pasó. Compara con lo que decía la publicación y con el video."
        />

        <CampoDePruebas
          pruebas={pruebas}
          ayuda={`Si se puede ver, enséñalo: la rotura, el empaque, la etiqueta. Hasta ${MAX_PRUEBAS} fotos, y se quedan en el reclamo.`}
        />

        <Button type="submit" disabled={pending || pruebas.subiendo}>
          {pruebas.subiendo
            ? "Subiendo las fotos…"
            : pending
              ? "Abriendo el reclamo…"
              : "Abrir reclamo"}
        </Button>
        <p className="text-xs text-muted">
          Mientras revisamos, tu dinero no se mueve. Ni al vendedor ni de vuelta
          a ti, hasta que alguien mire las dos versiones.
        </p>
      </form>
    </details>
  );
}

export function ReplyClaimForm({ orderId }: { orderId: string }) {
  const pruebas = usePruebas();
  const [result, submit, pending] = useActionState<
    ClaimResult | null,
    FormData
  >(async (prev, form) => {
    const fallo = await pruebas.subir(form);
    if (fallo) return { error: fallo };
    const res = await replyToClaim(prev, form);
    if (!res.error) pruebas.limpiar();
    return res;
  }, null);

  return (
    <form action={submit} className="mt-3 flex flex-col gap-3">
      {result?.error ? <ErrorNote>{result.error}</ErrorNote> : null}
      <input type="hidden" name="orderId" value={orderId} />
      <textarea
        name="reply"
        aria-label="Tu versión"
        rows={4}
        required
        className={field}
        placeholder="Cuenta tu versión. Si el video de tu publicación lo muestra, dilo."
      />
      <CampoDePruebas
        pruebas={pruebas}
        ayuda={`Si lo grabaste o lo fotografiaste antes de despacharlo, adjúntalo. Hasta ${MAX_PRUEBAS} fotos.`}
      />

      <Button type="submit" disabled={pending || pruebas.subiendo}>
        {pruebas.subiendo
          ? "Subiendo las fotos…"
          : pending
            ? "Enviando…"
            : "Responder"}
      </Button>
    </form>
  );
}

export function ResolveClaimForm({ orderId }: { orderId: string }) {
  const [result, submit, pending] = useActionState<
    ClaimResult | null,
    FormData
  >(resolveClaim, null);

  return (
    <form action={submit} className="mt-4 flex flex-col gap-2">
      {result?.error ? <ErrorNote>{result.error}</ErrorNote> : null}
      <input type="hidden" name="orderId" value={orderId} />
      <input
        name="note"
        aria-label="Nota de la decisión"
        className={field}
        placeholder="Por qué se decide así (queda en el registro)"
      />
      <div className="flex gap-2">
        <Button type="submit" name="favor" value="comprador" disabled={pending}>
          Devolver al comprador
        </Button>
        <Button
          type="submit"
          name="favor"
          value="vendedor"
          variant="outline"
          disabled={pending}
        >
          Liberar al vendedor
        </Button>
      </div>
    </form>
  );
}
