"use client";

import { useActionState } from "react";
import { editListing, setListingStatus, type EditResult } from "./edit";
import { Button, ErrorNote, Field } from "@/components/ui";
import { CONDITION_LABEL } from "@/features/catalog/labels";

export function EditForm({
  listing,
}: {
  listing: { id: string; title: string; description: string; price_cop: number; condition: string };
}) {
  const [result, submit, pending] = useActionState<EditResult | null, FormData>(
    editListing,
    null
  );

  return (
    <form action={submit} className="mt-5 flex flex-col gap-4">
      {result?.error ? <ErrorNote>{result.error}</ErrorNote> : null}
      <input type="hidden" name="listingId" value={listing.id} />

      <Field id="title" name="title" label="Título" required defaultValue={listing.title} />
      <Field id="price" name="price" label="Precio" inputMode="numeric" required
        defaultValue={String(listing.price_cop)} hint="En pesos, sin puntos ni comas." />

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium">Estado del artículo</legend>
        {Object.entries(CONDITION_LABEL).map(([value, label]) => (
          <label key={value} className="flex items-center gap-2 text-sm">
            <input type="radio" name="condition" value={value} required
              defaultChecked={listing.condition === value} />
            {label}
          </label>
        ))}
      </fieldset>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="description" className="text-sm font-medium">Descripción</label>
        <textarea id="description" name="description" required rows={4}
          defaultValue={listing.description}
          className="rounded-xl border border-brand/20 bg-white px-4 py-3 text-sm outline-none focus:border-brand" />
      </div>

      <p className="text-xs text-muted">
        La categoría y el IMEI no se cambian: eso alteraría la revisión que esta
        publicación ya pasó. Para eso hay que publicar de nuevo.
      </p>

      <Button type="submit" disabled={pending}>
        {pending ? "Guardando…" : "Guardar cambios"}
      </Button>
    </form>
  );
}

const LABEL: Record<string, string> = {
  reservada: "Marcar como reservada",
  activa: "Volver a publicar",
  vendida: "Marcar como vendida",
  retirada: "Retirar la publicación",
};

// En el panel del vendedor conviven tres o cuatro de estos botones en una tarjeta
// del ancho de una tarjeta: ahí la etiqueta larga no cabe y no hace falta, porque
// el contexto ya dice de qué publicación se habla.
const LABEL_CORTA: Record<string, string> = {
  reservada: "Reservar",
  activa: "Republicar",
  vendida: "Vendida",
  retirada: "Retirar",
};

export function StatusButton({
  listingId,
  status,
  variant = "outline",
  compact = false,
}: {
  listingId: string;
  status: keyof typeof LABEL;
  variant?: "outline" | "ghost";
  compact?: boolean;
}) {
  const [result, submit, pending] = useActionState<EditResult | null, FormData>(
    setListingStatus,
    null
  );

  return (
    <form action={submit} className={compact ? "contents" : "flex flex-col gap-2"}>
      {result?.error ? <ErrorNote>{result.error}</ErrorNote> : null}
      <input type="hidden" name="listingId" value={listingId} />
      <input type="hidden" name="status" value={status} />
      <Button
        type="submit"
        variant={variant}
        size={compact ? "sm" : "md"}
        disabled={pending}
      >
        {pending ? "Guardando…" : compact ? LABEL_CORTA[status] : LABEL[status]}
      </Button>
    </form>
  );
}
