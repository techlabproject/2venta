"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { currentUser } from "@/lib/session";
import { getVerification } from "@/features/kyc/queries";
import { isAllowedType, MAX_BYTES, store } from "@/lib/storage";
import { query } from "@/lib/db";
import { MIN_PRICE_COP } from "@/features/payments/money";

export type PublishResult = { error: string } | { id: string };

export async function publishListing(
  _prev: PublishResult | null,
  form: FormData
): Promise<PublishResult> {
  const user = await currentUser();
  if (!user) redirect("/ingresar");

  // D-02: la comprobación vive en el servidor. Que la pantalla esconda el botón no
  // es control de acceso; alguien puede llamar esta acción directamente.
  const verification = await getVerification(user.id);
  if (verification?.status !== "aprobado") {
    return { error: "Necesitas verificar tu identidad antes de publicar." };
  }

  const title = String(form.get("title") ?? "").trim();
  const description = String(form.get("description") ?? "").trim();
  const category = String(form.get("category") ?? "");
  const condition = String(form.get("condition") ?? "");
  const price = Number(String(form.get("price") ?? "").replace(/\D/g, ""));

  if (!title || !description) return { error: "Falta el título o la descripción." };
  if (!Number.isInteger(price) || price <= 0) {
    return { error: "El precio tiene que ser un número mayor que cero." };
  }
  // D-29: consecuencia del piso de comisión. Por debajo de este precio, el piso se
  // come una parte absurda de la venta.
  if (price < MIN_PRICE_COP) {
    return {
      error: `El precio mínimo para publicar es de $${MIN_PRICE_COP.toLocaleString("es-CO")}.`,
    };
  }

  const video = form.get("video");
  const poster = form.get("poster");
  if (!(video instanceof File) || !(poster instanceof File)) {
    // D-14: sin video no hay publicación, y esto se comprueba aquí y no solo en
    // la pantalla.
    return { error: "Falta el video del artículo." };
  }
  if (!isAllowedType(video.type) || !isAllowedType(poster.type)) {
    return { error: "Ese tipo de archivo no sirve." };
  }
  if (video.size > MAX_BYTES || poster.size > MAX_BYTES) {
    return { error: "El video pesa demasiado. Graba uno más corto." };
  }

  const videoPath = await store(await video.arrayBuffer(), video.type);
  const posterPath = await store(await poster.arrayBuffer(), poster.type);

  const rows = await query<{ id: string }>(
    `insert into listings
       (seller_id, title, description, category, condition, price_cop, video_path, poster_path)
     values ($1, $2, $3, $4, $5, $6, $7, $8)
     returning id`,
    [user.id, title, description, category, condition, price, videoPath, posterPath]
  );

  revalidatePath("/");
  return { id: rows[0].id };
}
