"use client";

import { useActionState } from "react";
import { reportUser, updateProfile, type ProfileResult } from "./actions";
import { Button, ErrorNote, Field } from "@/components/ui";
import { zonaReconocida } from "@/features/ubicacion/zonas";
import { CampoDeZona } from "@/features/ubicacion/CampoDeZona";

const REASONS = [
  { value: "estafa", label: "Intentó estafarme" },
  { value: "fuera_app", label: "Insiste en pagar fuera de la app" },
  { value: "acoso", label: "Me trató mal o me acosó" },
  { value: "suplantacion", label: "Se hace pasar por otra persona" },
  { value: "otro", label: "Otra cosa" },
];

export function ProfileForm({
  alias,
  zone,
  bio,
  conPunto = false,
}: {
  alias: string;
  zone: string | null;
  bio: string | null;
  /** Si tiene guardado un punto de su celular (no solo el centro de la zona). */
  conPunto?: boolean;
}) {
  const [result, submit, pending] = useActionState<
    ProfileResult | null,
    FormData
  >(updateProfile, null);
  // Una zona escrita a mano antes de la lista que la migración no reconoció queda
  // vacía: se le pide elegir.
  const zona = zonaReconocida(zone)?.nombre ?? null;

  return (
    <form action={submit} className="mt-5 flex flex-col gap-4">
      {result?.error ? <ErrorNote>{result.error}</ErrorNote> : null}
      {result && !result.error && (
        <p
          role="status"
          className="rounded-xl bg-brand/10 px-4 py-3 text-sm text-brand"
        >
          Guardado.
        </p>
      )}

      <Field
        id="alias"
        name="alias"
        label="Alias público"
        required
        defaultValue={alias}
        hint="Es lo que ven los demás. Tu nombre completo nunca es público."
      />
      {/* Correcciones 43 y 51 (D-122): una lista cerrada. Escrita a mano, el filtro
          mostraba «Chapinero», «chapinero» y «Chapi» como tres zonas distintas. */}
      <CampoDeZona zona={zona} conPunto={conPunto} />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="bio" className="text-sm font-medium">
          Sobre ti
        </label>
        <textarea
          id="bio"
          name="bio"
          rows={3}
          defaultValue={bio ?? ""}
          className="rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none transition duration-200 ease-salida hover:border-brand/30 focus:border-brand focus:ring-3 focus:ring-brand/15"
          placeholder="Vendo cosas que ya no uso, respondo rápido."
        />
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Guardando…" : "Guardar"}
      </Button>
    </form>
  );
}

export function ReportUserForm({ userId }: { userId: string }) {
  const [result, submit, pending] = useActionState<
    ProfileResult | null,
    FormData
  >(reportUser, null);

  if (result && !result.error) {
    return (
      <p
        role="status"
        className="mt-4 rounded-xl bg-brand/10 px-4 py-3 text-sm text-brand"
      >
        Gracias. Lo vamos a revisar.
      </p>
    );
  }

  return (
    <details className="mt-6">
      <summary className="cursor-pointer text-sm text-muted underline">
        Reportar a esta persona
      </summary>
      <form action={submit} className="mt-3 flex flex-col gap-3">
        {result?.error ? <ErrorNote>{result.error}</ErrorNote> : null}
        <input type="hidden" name="userId" value={userId} />
        <select
          name="reason"
          aria-label="Motivo del reporte"
          required
          defaultValue=""
          className="rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none transition duration-200 ease-salida hover:border-brand/30 focus:border-brand focus:ring-3 focus:ring-brand/15"
        >
          <option value="" disabled>
            ¿Qué pasó?
          </option>
          {REASONS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
        <input
          name="detail"
          aria-label="Detalle del reporte"
          placeholder="Cuéntanos más (opcional)"
          className="rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none transition duration-200 ease-salida hover:border-brand/30 focus:border-brand focus:ring-3 focus:ring-brand/15"
        />
        <Button type="submit" variant="outline" disabled={pending}>
          {pending ? "Enviando…" : "Reportar"}
        </Button>
      </form>
    </details>
  );
}
