"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { activeUser } from "@/lib/session";
import { query } from "@/lib/db";
import { parseCop, MIN_PRICE_COP } from "@/features/payments/money";
import { moderateListing } from "@/features/moderation/rules";
import { CONDITION_LABEL } from "@/features/catalog/labels";

export type EditResult = { error: string };

/** Estados desde los que todavía se puede editar o cambiar de estado. */
const EDITABLE = ["activa", "en_revision", "reservada"];

/**
 * RF-16. Se puede cambiar el título, el precio, la descripción y el estado del
 * artículo.
 *
 * La categoría y el IMEI no se tocan: cambiar la categoría saltaría la revisión que
 * la publicación ya pasó, y cambiar el IMEI convertiría una publicación aprobada en
 * otra cosa. Para eso se publica de nuevo.
 */
export async function editListing(
  _prev: EditResult | null,
  form: FormData
): Promise<EditResult> {
  const user = await activeUser();

  const id = String(form.get("listingId") ?? "");
  const owned = await query<{ status: string }>(
    `select status from listings where id = $1 and seller_id = $2`,
    [id, user.id]
  );
  if (owned.length === 0) return { error: "Esa publicación no es tuya." };
  if (!EDITABLE.includes(owned[0].status)) {
    return { error: "Una publicación vendida o retirada ya no se puede editar." };
  }

  const title = String(form.get("title") ?? "").trim();
  const description = String(form.get("description") ?? "").trim();
  if (!title || !description) return { error: "Falta el título o la descripción." };

  const price = parseCop(String(form.get("price") ?? ""));
  if (price === null) {
    return { error: "El precio tiene que ser un número mayor que cero, sin centavos." };
  }
  if (price < MIN_PRICE_COP) {
    return { error: `El precio mínimo es de $${MIN_PRICE_COP.toLocaleString("es-CO")}.` };
  }

  const condition = String(form.get("condition") ?? "");
  if (!(condition in CONDITION_LABEL)) return { error: "Elige el estado del artículo." };

  // Editar no es la puerta trasera: si no se volviera a filtrar, bastaría publicar
  // algo inocente y cambiarlo después.
  const verdict = moderateListing({ title, description });
  if (!verdict.allowed) return { error: verdict.reason };

  await query(
    `update listings set title = $2, description = $3, price_cop = $4, condition = $5
      where id = $1 and seller_id = $6`,
    [id, title, description, price, condition, user.id]
  );

  revalidatePath(`/producto/${id}`);
  revalidatePath("/");
  redirect(`/producto/${id}`);
}

const TRANSITIONS: Record<string, string[]> = {
  reservada: ["activa"],
  activa: ["reservada"],
  vendida: ["activa", "reservada"],
  retirada: ["activa", "en_revision", "reservada"],
};

/** RF-17. Marcar como reservada, vendida, o retirar. */
export async function setListingStatus(
  _prev: EditResult | null,
  form: FormData
): Promise<EditResult> {
  const user = await activeUser();

  const id = String(form.get("listingId") ?? "");
  const to = String(form.get("status") ?? "");
  const allowedFrom = TRANSITIONS[to];
  if (!allowedFrom) return { error: "Ese estado no existe." };

  // La comprobación de dueño y de estado de origen va en la misma consulta: sin
  // ventana entre comprobar y escribir.
  const rows = await query<{ id: string }>(
    `update listings set status = $3
      where id = $1 and seller_id = $2 and status = any($4)
      returning id`,
    [id, user.id, to, allowedFrom]
  );
  if (rows.length === 0) {
    return { error: "Esa publicación no es tuya o ya no está en ese estado." };
  }

  // D-65: al retirar o marcar vendida, el destacado termina y no se devuelve.
  // Nadie lo va a ver, y era el vendedor quien decidió sacarla.
  if (to === "retirada" || to === "vendida") {
    await query(
      `update promotions set ends_at = now()
        where listing_id = $1 and status = 'activa' and ends_at > now()`,
      [id]
    );
  }

  revalidatePath(`/producto/${id}`);
  revalidatePath("/");
  revalidatePath("/vender/metricas");
  return { error: "" };
}
