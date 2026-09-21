"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  addToCart,
  clearCart,
  removeFromCart,
  type CartResult,
} from "./actions";
import { Button, ErrorNote } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";

export function AddToCartButton({
  listingId,
  inCart,
}: {
  listingId: string;
  inCart: boolean;
}) {
  const [result, submit, pending] = useActionState<CartResult | null, FormData>(
    addToCart,
    null,
  );

  if (inCart || (result && !result.error)) {
    return (
      <p className="mt-3 rounded-xl bg-brand/10 px-4 py-3 text-sm text-brand">
        Está en tu carrito.{" "}
        <Link href="/carrito" className="font-medium underline">
          Verlo
        </Link>
      </p>
    );
  }

  return (
    <form action={submit} className="mt-3 flex flex-col gap-2">
      {result?.error ? (
        <ErrorNote>
          {result.error}
          {result.otherSeller && (
            <>
              {" "}
              <Link href="/carrito" className="font-medium underline">
                Ver el carrito
              </Link>
            </>
          )}
        </ErrorNote>
      ) : null}
      <input type="hidden" name="listingId" value={listingId} />
      <Button type="submit" variant="outline" disabled={pending}>
        {pending ? "Agregando…" : "Agregar al carrito"}
      </Button>
    </form>
  );
}

export function RemoveFromCartButton({ listingId }: { listingId: string }) {
  const [, submit, pending] = useActionState<CartResult | null, FormData>(
    removeFromCart,
    null,
  );
  return (
    <form action={submit}>
      <input type="hidden" name="listingId" value={listingId} />
      <button
        type="submit"
        disabled={pending}
        className="text-sm text-muted underline"
      >
        Quitar
      </button>
    </form>
  );
}

export function ClearCartButton() {
  return (
    <form action={clearCart}>
      <SubmitButton variant="ghost" pendingLabel="Vaciando…">
        Vaciar el carrito
      </SubmitButton>
    </form>
  );
}
