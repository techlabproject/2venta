"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { currentUser } from "@/lib/session";
import { getVerification } from "@/features/kyc/queries";
import { isAllowedType, MAX_BYTES, store } from "@/lib/storage";
import { query } from "@/lib/db";
import { MIN_PRICE_COP } from "@/features/payments/money";
import { isValidImei, normalizeImei } from "@/features/moderation/imei";
import { initialStatus, moderateListing } from "@/features/moderation/rules";

export type PublishResult = { error: string } | { id: string };

export async function publishListing(
  _prev: PublishResult | null,
  form: FormData
): Promise<PublishResult> {
  const user = await currentUser();
  if (!user) redirect("/ingresar");

  // D-01: sin celular confirmado no se publica. La comprobación de la pantalla no
  // basta: alguien puede llamar esta acción directamente.
  if (!user.phoneNumberVerified) {
    return { error: "Confirma tu celular antes de publicar." };
  }

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

  // D-16: la moderación automática filtra lo evidentemente prohibido antes de que
  // llegue a estar visible. Lo demás lo trae a revisión la cola de reportes.
  const verdict = moderateListing({ title, description });
  if (!verdict.allowed) return { error: verdict.reason };

  // D-15: IMEI solo en electrónica. El dígito verificador descarta al que escribe
  // cualquier cosa por salir del paso, sin consultar nada externo.
  let imei: string | null = null;
  if (category === "tecnologia") {
    const raw = String(form.get("imei") ?? "");
    if (!isValidImei(raw)) {
      return {
        error:
          "Ese IMEI no es válido. Márcalo en el teclado con *#06# y cópialo tal cual, son 15 dígitos.",
      };
    }
    imei = normalizeImei(raw);
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

  // Un mismo IMEI publicado dos veces no es coincidencia. La base tiene el índice
  // único; aquí se traduce el choque a un mensaje que se entienda.
  let rows: { id: string }[];
  try {
    rows = await query<{ id: string }>(
      `insert into listings
         (seller_id, title, description, category, condition, price_cop,
          video_path, poster_path, imei, status)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       returning id`,
      [
        user.id, title, description, category, condition, price,
        videoPath, posterPath, imei, initialStatus(category),
      ]
    );
  } catch (err) {
    if (err instanceof Error && /listings_imei_unico/.test(err.message)) {
      return { error: "Ese IMEI ya está publicado. Si es tuyo, escríbenos." };
    }
    throw err;
  }

  revalidatePath("/");
  return { id: rows[0].id };
}
