"use client";

import { useFormStatus } from "react-dom";
import { Button } from "./ui";
import type { ComponentProps } from "react";

// Un botón de envío que se apaga mientras el servidor contesta.
//
// Los formularios que usan `useActionState` ya tenían `pending` y lo aprovechaban.
// Los que solo pasan la acción directamente —«Marcar todo como visto», «Vaciar el
// carrito»— no tenían nada: se podían pulsar tres veces seguidas y mandaban tres
// peticiones. `useFormStatus` lee el estado del formulario que lo contiene, así que
// esto funciona sin que el formulario tenga que llevar estado propio.
export function SubmitButton({
  children,
  pendingLabel,
  ...props
}: ComponentProps<typeof Button> & { pendingLabel?: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} aria-busy={pending} {...props}>
      {pending ? (pendingLabel ?? children) : children}
    </Button>
  );
}
