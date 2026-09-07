"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { currentAdmin, currentUser } from "@/lib/session";
import { query } from "@/lib/db";

export type ModerationResult = { error: string };

const REASONS = ["robado", "prohibido", "enganoso", "precio", "otro"] as const;

export async function reportListing(
  _prev: ModerationResult | null,
  form: FormData
): Promise<ModerationResult> {
  const user = await currentUser();
  if (!user) redirect("/ingresar");

  const listingId = String(form.get("listingId") ?? "");
  const reason = String(form.get("reason") ?? "");
  if (!REASONS.includes(reason as (typeof REASONS)[number])) {
    return { error: "Elige un motivo." };
  }

  // Una persona reporta una publicación una vez. El índice único lo garantiza;
  // aquí solo se evita mostrarle un error a quien reporta dos veces sin querer.
  await query(
    `insert into reports (listing_id, reporter_id, reason, detail)
     values ($1, $2, $3, $4)
     on conflict (listing_id, reporter_id) do nothing`,
    [listingId, user.id, reason, String(form.get("detail") ?? "").trim().slice(0, 500) || null]
  );

  revalidatePath(`/producto/${listingId}`);
  return { error: "" };
}

/** Aprueba o rechaza una publicación en revisión. Solo administración. */
export async function reviewListing(
  _prev: ModerationResult | null,
  form: FormData
): Promise<ModerationResult> {
  // La comprobación de rol va en el servidor. Que la pantalla no exista para el
  // resto no es control de acceso: cualquiera puede llamar esta acción.
  const admin = await currentAdmin();
  if (!admin) return { error: "No tienes permiso para esto." };

  const listingId = String(form.get("listingId") ?? "");
  const approve = String(form.get("decision") ?? "") === "aprobar";
  const note = String(form.get("note") ?? "").trim().slice(0, 300) || null;

  const rows = await query<{ id: string }>(
    `update listings set status = $2, review_note = $3
      where id = $1 and status in ('en_revision','activa')
      returning id`,
    [listingId, approve ? "activa" : "rechazada", note]
  );
  if (rows.length === 0) return { error: "Esa publicación ya no está en revisión." };

  // Resolver los reportes de esa publicación: ya fueron atendidos.
  await query(
    `update reports set resolved_at = now() where listing_id = $1 and resolved_at is null`,
    [listingId]
  );

  revalidatePath("/admin");
  return { error: "" };
}
