"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { currentUser } from "@/lib/session";
import { query } from "@/lib/db";
import { redact } from "@/features/chat/redact";

export type ProfileResult = { error: string };

/** RF-12. El usuario de la sesión edita lo suyo; el identificador no viene del formulario. */
export async function updateProfile(
  _prev: ProfileResult | null,
  form: FormData
): Promise<ProfileResult> {
  const user = await currentUser();
  if (!user) redirect("/ingresar");

  const alias = String(form.get("alias") ?? "").trim();
  if (alias.length < 2 || alias.length > 40) {
    return { error: "El alias tiene entre 2 y 40 caracteres." };
  }

  const zone = String(form.get("zone") ?? "").trim().slice(0, 60) || null;
  // La descripción es pública, así que pasa por el mismo filtro que el chat.
  const rawBio = String(form.get("bio") ?? "").trim().slice(0, 300);
  const bio = rawBio ? redact(rawBio).text : null;

  // El alias anterior queda registrado. Un vendedor con malas reseñas no puede
  // limpiar su rastro cambiándose el nombre, que es lo primero que intentaría.
  if (user.alias && user.alias !== alias) {
    await query(`insert into alias_history (user_id, alias) values ($1, $2)`, [
      user.id,
      user.alias,
    ]);
  }

  await query(`update "user" set alias = $2, zone = $3, bio = $4 where id = $1`, [
    user.id,
    alias,
    zone,
    bio,
  ]);

  revalidatePath("/cuenta");
  revalidatePath(`/vendedor/${user.id}`);
  return { error: "" };
}

/** RF-32. Reportar a una persona, no a una publicación. */
export async function reportUser(
  _prev: ProfileResult | null,
  form: FormData
): Promise<ProfileResult> {
  const user = await currentUser();
  if (!user) redirect("/ingresar");

  const reportedId = String(form.get("userId") ?? "");
  if (reportedId === user.id) return { error: "No puedes reportarte a ti mismo." };

  const reason = String(form.get("reason") ?? "");
  if (!["estafa", "acoso", "fuera_app", "suplantacion", "otro"].includes(reason)) {
    return { error: "Elige un motivo." };
  }

  await query(
    `insert into user_reports (reported_id, reporter_id, reason, detail)
     values ($1, $2, $3, $4)
     on conflict (reported_id, reporter_id) do nothing`,
    [reportedId, user.id, reason, String(form.get("detail") ?? "").trim().slice(0, 500) || null]
  );

  revalidatePath(`/vendedor/${reportedId}`);
  return { error: "" };
}
