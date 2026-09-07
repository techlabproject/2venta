"use client";

import { useActionState } from "react";
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

  return (
    <form action={submit}>
      <input type="hidden" name="listingId" value={listingId} />
      <button
        type="submit"
        disabled={pending}
        data-testid="favorito"
        aria-pressed={isSaved}
        className="inline-flex items-center gap-2 rounded-xl border border-brand/25 bg-white px-4 py-3 text-sm font-medium disabled:opacity-60"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true"
          fill={isSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
          <path d="M12 21s-7.5-4.7-9.3-9A5.2 5.2 0 0 1 12 6.7 5.2 5.2 0 0 1 21.3 12c-1.8 4.3-9.3 9-9.3 9z" />
        </svg>
        {isSaved ? "Guardado" : "Guardar"}
      </button>
    </form>
  );
}
