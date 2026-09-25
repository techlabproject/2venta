"use client";

import { useActionState, useRef } from "react";
import { editListing, setListingStatus, type EditResult } from "./edit";
import { Button, ErrorNote, Field } from "@/components/ui";
import { CONDITION_LABEL } from "@/features/catalog/labels";
import { CampoPrecio } from "@/components/CampoPrecio";
import { CampoDeCategoria } from "./CampoDeCategoria";
import { CAMPO_DE_CATEGORIA } from "@/features/catalog/atributos";
import { MIN_PRICE_COP } from "@/features/payments/money";
import { formatearPrecio } from "@/lib/precio";
import type { OpcionesDeAtributos } from "@/features/configuracion/queries";

export function EditForm({
  listing,
  opciones,
}: {
  opciones?: OpcionesDeAtributos;
  listing: {
    id: string;
    title: string;
    description: string;
    price_cop: number;
    condition: string;
    category: string;
    category_label: string;
    has_imei: boolean;
    talla: string | null;
    edad: string | null;
  };
}) {
  const [result, submit, pending] = useActionState<EditResult | null, FormData>(
    editListing,
    null,
  );

  return (
    <form action={submit} className="mt-5 flex flex-col gap-4">
      {result?.error ? <ErrorNote>{result.error}</ErrorNote> : null}
      <input type="hidden" name="listingId" value={listing.id} />

      <Field
        id="title"
        name="title"
        label="Título"
        required
        defaultValue={listing.title}
      />
      <CampoPrecio
        id="price"
        name="price"
        label="Precio"
        required
        minimo={MIN_PRICE_COP}
        defaultValue={listing.price_cop}
        hint={`Mínimo $${formatearPrecio(String(MIN_PRICE_COP))}.`}
      />

      {/* Corrección 38: la talla o la edad sí se corrigen. */}
      {CAMPO_DE_CATEGORIA[listing.category] && (
        <CampoDeCategoria
          campo={CAMPO_DE_CATEGORIA[listing.category]!}
          valor={CAMPO_DE_CATEGORIA[listing.category] === "talla" ? listing.talla : listing.edad}
          opciones={opciones}
        />
      )}

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium">
          Estado del artículo
        </legend>
        {Object.entries(CONDITION_LABEL).map(([value, label]) => (
          <label key={value} className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="condition"
              value={value}
              required
              defaultChecked={listing.condition === value}
            />
            {label}
          </label>
        ))}
      </fieldset>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="description" className="text-sm font-medium">
          Descripción
        </label>
        <textarea
          id="description"
          name="description"
          required
          rows={4}
          defaultValue={listing.description}
          className="rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none transition duration-200 ease-salida hover:border-brand/30 focus:border-brand focus:ring-3 focus:ring-brand/15"
        />
      </div>

      <p className="text-xs text-muted">
        {/* El IMEI solo se nombra si el artículo tiene uno: salía también en ropa
            y juguetes, que nunca lo pidieron (corrección 25). */}
        {listing.has_imei
          ? `La categoría (${listing.category_label}) y el IMEI no se cambian: para eso hay que publicar de nuevo.`
          : `La categoría (${listing.category_label}) no se cambia: para eso hay que publicar de nuevo.`}
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
  retirada: "Retirar la publicación",
};

// En el panel del vendedor conviven tres o cuatro de estos botones en una tarjeta
// del ancho de una tarjeta: ahí la etiqueta larga no cabe y no hace falta, porque
// el contexto ya dice de qué publicación se habla.
const LABEL_CORTA: Record<string, string> = {
  reservada: "Reservar",
  activa: "Republicar",
  retirada: "Retirar",
};

/**
 * Cambiar el estado de una publicación (RF-17).
 *
 * Retirar pide confirmación (correcciones 26, 28 y 30): un toque de más sacaba el
 * artículo del catálogo sin decir nada. El diálogo dice qué pasa y cómo se
 * recupera. «Marcar como vendida» ya no existe (corrección 29).
 */
export function StatusButton({
  listingId,
  status,
  titulo,
  variant = "outline",
  compact = false,
}: {
  listingId: string;
  status: keyof typeof LABEL;
  /** El título de la publicación, para que el diálogo diga cuál se retira. */
  titulo?: string;
  variant?: "outline" | "ghost";
  compact?: boolean;
}) {
  const [result, submit, pending] = useActionState<EditResult | null, FormData>(
    setListingStatus,
    null,
  );
  const dialogo = useRef<HTMLDialogElement>(null);
  const etiqueta = compact ? LABEL_CORTA[status] : LABEL[status];

  const campos = (
    <>
      <input type="hidden" name="listingId" value={listingId} />
      <input type="hidden" name="status" value={status} />
    </>
  );

  if (status !== "retirada") {
    return (
      <form action={submit} className={compact ? "contents" : "flex flex-col gap-2"}>
        {result?.error ? <ErrorNote>{result.error}</ErrorNote> : null}
        {campos}
        <Button type="submit" variant={variant} size={compact ? "sm" : "md"} disabled={pending}>
          {pending ? "Guardando…" : etiqueta}
        </Button>
      </form>
    );
  }

  return (
    <div className={compact ? "contents" : "flex flex-col gap-2"}>
      {result?.error ? <ErrorNote>{result.error}</ErrorNote> : null}
      <Button
        type="button"
        variant={variant}
        size={compact ? "sm" : "md"}
        onClick={() => dialogo.current?.showModal()}
      >
        {etiqueta}
      </Button>
      <dialog
        ref={dialogo}
        aria-labelledby={`retirar-${listingId}`}
        // Tocar fuera cierra, como Cancelar y Escape (Luna, correcciones 26–31): el
        // clic en el fondo le llega al propio <dialog>, no a su contenido.
        onClick={(e) => {
          if (e.target === e.currentTarget) e.currentTarget.close();
        }}
        className="m-auto w-[calc(100vw-2.5rem)] max-w-sm rounded-2xl bg-white p-5 text-left shadow-lg ring-1 ring-line backdrop:bg-ink/40"
      >
        <form action={submit} className="flex flex-col gap-3">
          {campos}
          <h2 id={`retirar-${listingId}`} className="font-title text-lg font-semibold">
            {titulo ? `¿Retirar «${titulo}»?` : "¿Retirar esta publicación?"}
          </h2>
          <p className="text-sm text-ink2">
            Deja de verse en el catálogo y nadie más puede comprarla. No se borra:
            queda en «Tus publicaciones», en Retiradas, y la puedes volver a
            publicar cuando quieras.
          </p>
          <div className="mt-1 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={() => dialogo.current?.close()}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="outline" disabled={pending}>
              {pending ? "Retirando…" : "Sí, retirarla"}
            </Button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
