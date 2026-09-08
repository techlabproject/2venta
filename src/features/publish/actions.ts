"use server";

import { revalidatePath } from "next/cache";
import { activeUser } from "@/lib/session";
import { getVerification } from "@/features/kyc/queries";
import { isAllowedType, MAX_BYTES, store } from "@/lib/storage";
import { MAX_PHOTOS } from "./photos";
import { query } from "@/lib/db";
import { MIN_PRICE_COP, parseCop } from "@/features/payments/money";
import { isValidImei, normalizeImei } from "@/features/moderation/imei";
import { initialStatus, moderateListing } from "@/features/moderation/rules";
import { notifyMatchingSearches } from "@/features/alerts/queries";

export type PublishResult = { error: string } | { id: string };

export async function publishListing(
  _prev: PublishResult | null,
  form: FormData
): Promise<PublishResult> {
  const user = await activeUser();

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
  const price = parseCop(String(form.get("price") ?? ""));

  if (!title || !description) return { error: "Falta el título o la descripción." };
  if (price === null) {
    return { error: "El precio tiene que ser un número mayor que cero, sin centavos." };
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

  // RF-15: hasta seis fotos. A diferencia del video, sí pueden venir de la galería:
  // el video ya prueba que el artículo existe, y las fotos son presentación. Exigir
  // que se tomen dentro de la app solo las haría peores sin agregar garantía.
  const photos = form.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
  if (photos.length > MAX_PHOTOS) {
    return { error: `Máximo ${MAX_PHOTOS} fotos.` };
  }
  for (const photo of photos) {
    if (!isAllowedType(photo.type)) return { error: "Alguno de los archivos no es una imagen." };
    if (photo.size > MAX_BYTES) return { error: "Alguna foto pesa demasiado." };
  }

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

  for (const [index, photo] of photos.entries()) {
    const path = await store(await photo.arrayBuffer(), photo.type);
    await query(
      `insert into listing_photos (listing_id, path, position) values ($1, $2, $3)`,
      [rows[0].id, path, index]
    );
  }

  // S-15: avisar a quien guardó una búsqueda que coincide. Solo si quedó visible;
  // avisar de algo que está en revisión sería mandar a la gente a una pantalla que
  // no existe.
  if (initialStatus(category) === "activa") {
    await notifyMatchingSearches({ id: rows[0].id, title, seller_id: user.id });
  }

  revalidatePath("/");
  return { id: rows[0].id };
}

/** Completa un borrador de carga en lote grabándole el video (S-13). */
export async function publishDraft(
  _prev: PublishResult | null,
  form: FormData
): Promise<PublishResult> {
  const user = await activeUser();
  if (!user.phoneNumberVerified) {
    return { error: "Confirma tu celular antes de publicar." };
  }

  const verification = await getVerification(user.id);
  if (verification?.status !== "aprobado") {
    return { error: "Necesitas verificar tu identidad antes de publicar." };
  }

  const draftId = String(form.get("draftId") ?? "");
  const drafts = await query<{ id: string; category: string }>(
    `select id, category from listings
      where id = $1 and seller_id = $2 and status = 'borrador'`,
    [draftId, user.id]
  );
  const draft = drafts[0];
  if (!draft) return { error: "Ese borrador no existe o ya se publicó." };

  const video = form.get("video");
  const poster = form.get("poster");
  if (!(video instanceof File) || !(poster instanceof File)) {
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

  // El borrador sigue el mismo camino que cualquier publicación, revisión de
  // electrónica incluida: cargar en lote no salta la moderación.
  await query(
    `update listings set video_path = $2, poster_path = $3, status = $4
      where id = $1 and status = 'borrador'`,
    [draft.id, videoPath, posterPath, initialStatus(draft.category)]
  );

  if (initialStatus(draft.category) === "activa") {
    const titles = await query<{ title: string }>(
      `select title from listings where id = $1`,
      [draft.id]
    );
    await notifyMatchingSearches({
      id: draft.id,
      title: titles[0].title,
      seller_id: user.id,
    });
  }

  revalidatePath("/");
  revalidatePath("/tienda");
  return { id: draft.id };
}
