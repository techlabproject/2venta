"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { publishListing, type PublishResult } from "./actions";
import { uploadBlob, uploadImages, UploadError } from "./useUpload";
import { VideoCapture } from "./VideoCapture";
import { Button, ErrorNote, Field } from "@/components/ui";
import { CONDITION_LABEL } from "@/features/catalog/labels";
import type { Category } from "@/features/catalog/queries";
import type { SuggestionMap } from "@/features/pricing/suggest";
import { MAX_PHOTOS } from "./photos";
import { formatCop } from "@/lib/money";
import { commissionCop, MIN_PRICE_COP, parseCop, sellerPayoutCop } from "@/features/payments/money";

export function PublishForm({
  categories,
  suggestions,
}: {
  categories: Category[];
  suggestions: SuggestionMap;
}) {
  const router = useRouter();
  const [media, setMedia] = useState<{ video: Blob; poster: Blob } | null>(null);
  // D-15: el IMEI solo se pide en electrónica.
  const [category, setCategory] = useState(categories[0]?.slug ?? "");
  // Lo que le queda al vendedor, calculado mientras escribe el precio. Es el
  // dato que más le importa y nadie se lo decía (hallazgo de QA, 2026-09-13).
  const [price, setPrice] = useState<number | null>(null);
  // Cuántas fotos eligió. El control nativo de archivos dibuja su propio texto en
  // el idioma del navegador —«Choose Files · No file chosen»— y no hay forma de
  // traducirlo, así que se esconde y se dibuja encima uno propio. Es la única
  // pantalla del producto que estaba en inglés.
  const [photoCount, setPhotoCount] = useState(0);

  const [uploading, setUploading] = useState(false);

  const [result, submit, pending] = useActionState<PublishResult | null, FormData>(
    async (prev, form) => {
      // D-50: los archivos van directo al bucket y a la acción solo llegan las
      // claves. Los bytes nunca pasan por el servidor de la aplicación.
      if (media) {
        setUploading(true);
        try {
          const photos = form
            .getAll("photos")
            .filter((f): f is File => f instanceof File && f.size > 0);
          const [videoKey, posterKey, photoKeys] = await Promise.all([
            uploadBlob(media.video, "video"),
            uploadBlob(media.poster, "image"),
            uploadImages(photos),
          ]);
          form.set("video_key", videoKey);
          form.set("poster_key", posterKey);
          form.delete("photos");
          for (const key of photoKeys) form.append("photo_keys", key);
        } catch (err) {
          if (err instanceof UploadError) return { error: err.message };
          throw err;
        } finally {
          setUploading(false);
        }
      }
      const res = await publishListing(prev, form);
      if ("id" in res) {
        router.push(`/producto/${res.id}`);
        router.refresh();
      }
      return res;
    },
    null
  );

  return (
    <form action={submit} className="flex flex-col gap-5">
      {result && "error" in result && <ErrorNote>{result.error}</ErrorNote>}

      <div>
        <h2 className="text-sm font-medium">Video del artículo</h2>
        <p className="mt-1 mb-3 text-xs text-muted">Obligatorio, máximo 30 segundos.</p>
        <VideoCapture onCaptured={(video, poster) => setMedia({ video, poster })} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="photos" className="text-sm font-medium">
          Fotos <span className="font-normal text-muted">(opcional)</span>
        </label>
        <input
          id="photos"
          name="photos"
          type="file"
          accept="image/*"
          multiple
          className="peer sr-only"
          onChange={(e) => setPhotoCount(e.target.files?.length ?? 0)}
        />
        <label
          htmlFor="photos"
          className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-brand/25 bg-white px-4 py-3 text-sm font-medium text-ink transition hover:bg-ph peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand"
        >
          {photoCount === 0
            ? "Elegir fotos"
            : photoCount === 1
              ? "1 foto elegida · cambiar"
              : `${photoCount} fotos elegidas · cambiar`}
        </label>
        <p className="text-xs text-muted">
          Hasta {MAX_PHOTOS}. Estas sí las puedes subir de la galería: el video ya
          prueba que el artículo existe, las fotos son para que se vea bien.
        </p>
      </div>

      <Field id="title" name="title" label="Título" required
        placeholder="Coche Chicco reclinable" />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="category" className="text-sm font-medium">Categoría</label>
        <select id="category" name="category" required value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-xl border border-brand/20 bg-white px-4 py-3 text-sm">
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>{c.label}</option>
          ))}
        </select>
      </div>

      {category === "tecnologia" && (
        <Field id="imei" name="imei" label="IMEI del equipo" inputMode="numeric" required
          placeholder="490154203237518"
          hint="Márcalo en el teclado con *#06# y cópialo tal cual. Son 15 dígitos. Lo pedimos para que nadie venda equipos robados." />
      )}

      <Field id="price" name="price" label="Precio" inputMode="numeric" required
        placeholder="260000" hint="En pesos, sin puntos ni comas. Mínimo $10.000."
        onChange={(e) => setPrice(parseCop(e.target.value))} />
      {price !== null && price >= MIN_PRICE_COP && (
        <p data-testid="te-llegan" className="-mt-2 text-xs text-ink2">
          Te llegan <b>{formatCop(sellerPayoutCop(price))}</b> después de la comisión de 2venta
          ({formatCop(commissionCop(price))}). El comprador paga {formatCop(price)} más el envío.
        </p>
      )}

      {/* D-24: el rango sale de lo que se ha vendido de verdad en 2venta. Si no
          hay suficientes ventas no aparece nada, porque un promedio de dos ventas
          es ruido presentado como consejo, y quien fija su precio por un dato
          inventado se lleva la peor parte. */}
      {suggestions[category] && (
        <p data-testid="precio-sugerido" className="-mt-2 rounded-xl bg-brand/10 px-4 py-3 text-xs text-brand">
          En esta categoría, lo usado en buen estado se ha vendido entre{" "}
          {formatCop(suggestions[category]!.low)} y {formatCop(suggestions[category]!.high)}.
          Es lo que dicen {suggestions[category]!.sales} ventas de 2venta, no una
          estimación.
        </p>
      )}

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium">Estado del artículo</legend>
        {Object.entries(CONDITION_LABEL).map(([value, label], i) => (
          <label key={value} className="flex items-center gap-2 text-sm">
            <input type="radio" name="condition" value={value} defaultChecked={i === 1} required />
            {label}
          </label>
        ))}
      </fieldset>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="description" className="text-sm font-medium">Descripción</label>
        <textarea id="description" name="description" required rows={4}
          className="rounded-xl border border-brand/20 bg-white px-4 py-3 text-sm outline-none focus:border-brand"
          placeholder="Cuenta el uso que tuvo y cualquier detalle que se note." />
      </div>

      <Button type="submit" disabled={pending || !media}>
        {uploading
          ? "Subiendo…"
          : pending
            ? "Publicando…"
            : media
              ? "Publicar"
              : "Graba el video para continuar"}
      </Button>

      {category === "tecnologia" && (
        <p className="text-xs text-muted">
          La electrónica la revisa una persona antes de quedar visible. Suele tardar
          pocas horas y te avisamos.
        </p>
      )}
    </form>
  );
}
