"use client";

import { useActionState, useRef } from "react";
import { toggleFavorite } from "./actions";

export function FavoriteButton({
  listingId,
  saved,
}: {
  listingId: string;
  saved: boolean;
}) {
  const [result, submit, pending] = useActionState(toggleFavorite, { saved });
  const isSaved = result?.saved ?? saved;

  // El corazón da un brinco al guardarse (D-86). La confirmación de que algo quedó
  // guardado tiene que llegar antes que el servidor: si lo único que cambia es una
  // palabra, uno no sabe si el toque sirvió y vuelve a tocar.
  //
  // Se lanza desde el manejador del envío y no desde el estado, por tres razones:
  // ocurre en el instante del toque y no cuando contesta el servidor; no hace
  // brincar el corazón solo al abrir un artículo que ya estaba guardado; y leer una
  // referencia mientras se dibuja está prohibido en React 19.
  //
  // La clase va en la envoltura, no en el dibujo: el dibujo se vuelve a dibujar
  // cuando llega la respuesta, y eso le borraría la animación a media carrera.
  const corazon = useRef<HTMLSpanElement>(null);

  function brincar() {
    const el = corazon.current;
    // Al tocar, `isSaved` todavía es el valor viejo: si era «sin guardar», este
    // toque lo guarda, y es el único caso que celebra algo.
    if (!el || isSaved) return;
    el.classList.remove("animate-pop");
    void el.offsetWidth; // Reinicia la animación aunque ya se haya lanzado antes.
    el.classList.add("animate-pop");
  }

  return (
    <form action={submit} onSubmit={brincar}>
      <input type="hidden" name="listingId" value={listingId} />
      <button
        type="submit"
        disabled={pending}
        data-testid="favorito"
        aria-pressed={isSaved}
        className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-3 text-sm font-medium shadow-xs transition duration-200 ease-salida hover:border-brand/30 hover:bg-ph active:scale-[0.98] disabled:opacity-60 disabled:active:scale-100"
      >
        <span ref={corazon} className="inline-flex">
          <svg
            viewBox="0 0 24 24"
            className={`h-4 w-4 ${isSaved ? "text-accent-text" : ""}`}
            aria-hidden="true"
            fill={isSaved ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M12 21s-7.5-4.7-9.3-9A5.2 5.2 0 0 1 12 6.7 5.2 5.2 0 0 1 21.3 12c-1.8 4.3-9.3 9-9.3 9z" />
          </svg>
        </span>
        {isSaved ? "Guardado" : "Guardar"}
      </button>
    </form>
  );
}
