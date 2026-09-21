"use server";

import { revalidatePath } from "next/cache";
import { activeUser, currentAdmin } from "@/lib/session";
import { query } from "@/lib/db";

export type ModerationResult = { error: string };

const REASONS = ["robado", "prohibido", "enganoso", "precio", "otro"] as const;

export async function reportListing(
  _prev: ModerationResult | null,
  form: FormData
): Promise<ModerationResult> {
  // `activeUser()` y no `currentUser()`: una cuenta suspendida no reporta. Lo dice
  // la propia documentación de `activeUser`, y la prueba que decía cubrirlo —«no
  // puede publicar ni reportar»— solo probaba publicar (ronda de verificación,
  // 2026-09-20).
  const user = await activeUser();

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

/**
 * RF-41. Suspende una cuenta.
 *
 * Suspender NO borra nada. La cuenta deja de poder entrar y sus publicaciones dejan
 * de verse, pero sus pedidos, conversaciones y calificaciones siguen existiendo:
 * al otro lado de cada pedido hay alguien que no hizo nada malo, y si suspender
 * borrara, suspender a un estafador dejaría a sus víctimas sin evidencia justo
 * cuando más la necesitan.
 */
export async function suspendUser(
  _prev: ModerationResult | null,
  form: FormData
): Promise<ModerationResult> {
  const admin = await currentAdmin();
  if (!admin) return { error: "No tienes permiso para esto." };

  const userId = String(form.get("userId") ?? "");
  if (userId === admin.id) return { error: "No puedes suspenderte a ti mismo." };

  const reason = String(form.get("reason") ?? "").trim().slice(0, 300);
  if (reason.length < 5) return { error: "Escribe el motivo de la suspensión." };

  const rows = await query<{ id: string }>(
    `update "user" set suspended_at = now(), suspended_reason = $2
      where id = $1 and suspended_at is null returning id`,
    [userId, reason]
  );
  if (rows.length === 0) return { error: "Esa cuenta no existe o ya está suspendida." };

  // Las publicaciones dejan de verse. Los pedidos y conversaciones no se tocan.
  await query(
    `update listings set status = 'retirada'
      where seller_id = $1 and status in ('activa','en_revision','reservada')`,
    [userId]
  );
  // Y se le cierran las sesiones abiertas.
  await query(`delete from session where "userId" = $1`, [userId]);

  await query(
    `update user_reports set resolved_at = now()
      where reported_id = $1 and resolved_at is null`,
    [userId]
  );

  revalidatePath("/admin/usuarios");
  return { error: "" };
}
