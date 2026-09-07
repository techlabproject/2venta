"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { publishListing, type PublishResult } from "./actions";
import { VideoCapture } from "./VideoCapture";
import { Button, ErrorNote, Field } from "@/components/ui";
import { CONDITION_LABEL } from "@/features/catalog/labels";
import type { Category } from "@/features/catalog/queries";
import type { SuggestionMap } from "@/features/pricing/suggest";
import { formatCop } from "@/lib/money";

const EXTENSION: Record<string, string> = {
  "video/webm": "webm",
  "video/mp4": "mp4",
  "image/jpeg": "jpg",
  "image/png": "png",
};

function asFile(blob: Blob, base: string): File {
  // El tipo se limpia de los parámetros de códec. MediaRecorder produce cosas como
  // "video/webm;codecs=vp8,opus", y ese punto y coma rompe la cabecera del envío:
  // el archivo llega al servidor declarado como texto plano.
  const type = blob.type.split(";")[0];
  return new File([blob], `${base}.${EXTENSION[type] ?? "bin"}`, { type });
}

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

  const [result, submit, pending] = useActionState<PublishResult | null, FormData>(
    async (prev, form) => {
      if (media) {
        // El nombre lleva extensión a propósito: sin ella, el tipo del archivo se
        // pierde al cruzar hacia el servidor y llega como texto plano.
        form.set("video", asFile(media.video, "video"));
        form.set("poster", asFile(media.poster, "poster"));
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
        placeholder="260000" hint="En pesos, sin puntos ni comas. Mínimo $10.000." />

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
        {pending ? "Publicando…" : media ? "Publicar" : "Graba el video para continuar"}
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
