"use server";

import { revalidatePath } from "next/cache";
import { activeUser } from "@/lib/session";
import { getVerification } from "@/features/kyc/queries";
import { claim } from "./claim";
import { MAX_PHOTOS } from "./photos";
import { query } from "@/lib/db";
import { MIN_PRICE_COP, parseCop } from "@/features/payments/money";
import { isValidImei, normalizeImei } from "@/features/moderation/imei";
import { initialStatus, moderateListing } from "@/features/moderation/rules";
import { pareceCelular } from "@/features/moderation/pareceCelular";
import { CAMPO_DE_CATEGORIA, EDADES, TALLAS } from "@/features/catalog/atributos";
import { enqueueOrLog } from "@/lib/queue";

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

  // D-15, corrección 40: IMEI solo en celulares. Lo dice quien publica («¿Es un
  // celular?»), y si el texto habla de un celular se pide igual: contestar «No»
  // no es la forma de no poner el IMEI. El dígito verificador descarta al que
  // escribe cualquier cosa por salir del paso, sin consultar nada externo.
  let imei: string | null = null;
  const dijoCelular = String(form.get("esCelular") ?? "") === "si";
  if (category === "tecnologia" && (dijoCelular || pareceCelular(title, description))) {
    const raw = String(form.get("imei") ?? "");
    if (!raw.trim() && !dijoCelular) {
      return {
        error:
          "Parece un celular: para publicarlo necesitamos el IMEI. Marca «Sí» en «¿Es un celular?» y escríbelo.",
      };
    }
    if (!isValidImei(raw)) {
      return {
        error:
          "Ese IMEI no es válido. Márcalo en el teclado con *#06# y cópialo tal cual, son 15 dígitos.",
      };
    }
    imei = normalizeImei(raw);
  }

  // Corrección 38: talla en ropa, edad en artículos para niños. De una lista
  // cerrada: lo que no está en ella no se guarda.
  const campo = CAMPO_DE_CATEGORIA[category];
  const talla = campo === "talla" ? String(form.get("talla") ?? "") : null;
  const edad = campo === "edad" ? String(form.get("edad") ?? "") : null;
  if (talla !== null && !TALLAS.includes(talla)) return { error: "Elige la talla." };
  if (edad !== null && !(EDADES as readonly string[]).includes(edad)) {
    return { error: "Elige para qué edad es." };
  }

  // D-14: sin video no hay publicación, y esto se comprueba aquí y no solo en
  // la pantalla. El video ya está en el bucket; aquí llega su clave (D-50).
  const video = await claim(form.get("video_key"), user.id, "video");
  if ("error" in video) return video;
  const poster = await claim(form.get("poster_key"), user.id, "image");
  if ("error" in poster) return { error: "Falta la portada del video." };
  const videoPath = video.key;
  const posterPath = poster.key;

  // RF-15: hasta seis fotos. A diferencia del video, sí pueden venir de la galería:
  // el video ya prueba que el artículo existe, y las fotos son presentación. Exigir
  // que se tomen dentro de la app solo las haría peores sin agregar garantía.
  const photoKeys = form.getAll("photo_keys").map(String).filter(Boolean);
  if (photoKeys.length > MAX_PHOTOS) {
    return { error: `Máximo ${MAX_PHOTOS} fotos.` };
  }
  const photos: string[] = [];
  for (const raw of photoKeys) {
    const photo = await claim(raw, user.id, "image");
    if ("error" in photo) return { error: "Alguno de los archivos no es una imagen." };
    photos.push(photo.key);
  }

  // Un mismo IMEI publicado dos veces no es coincidencia. La base tiene el índice
  // único; aquí se traduce el choque a un mensaje que se entienda.
  let rows: { id: string }[];
  try {
    rows = await query<{ id: string }>(
      `insert into listings
         (seller_id, title, description, category, condition, price_cop,
          video_path, poster_path, imei, status, talla, edad)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       returning id`,
      [
        user.id, title, description, category, condition, price,
        videoPath, posterPath, imei, initialStatus(), talla, edad,
      ]
    );
  } catch (err) {
    if (err instanceof Error && /listings_imei_unico/.test(err.message)) {
      return { error: "Ese IMEI ya está publicado. Si es tuyo, escríbenos." };
    }
    throw err;
  }

  for (const [index, path] of photos.entries()) {
    await query(
      `insert into listing_photos (listing_id, path, position) values ($1, $2, $3)`,
      [rows[0].id, path, index]
    );
  }

  // S-15: avisar a quien guardó una búsqueda que coincide. Solo si quedó visible;
  // avisar de algo que está en revisión sería mandar a la gente a una pantalla que
  // no existe. Lo hace el worker (D-51): el vendedor no espera por un trabajo que
  // no le importa.
  if (initialStatus() === "activa") {
    await enqueueOrLog({ type: "avisar", listingId: rows[0].id });
  }
  // S-30: convertir el video a un formato que reproduzca cualquier teléfono.
  await enqueueOrLog({ type: "transcodificar", key: videoPath });

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

  const video = await claim(form.get("video_key"), user.id, "video");
  if ("error" in video) return video;
  const poster = await claim(form.get("poster_key"), user.id, "image");
  if ("error" in poster) return { error: "Falta la portada del video." };
  const videoPath = video.key;
  const posterPath = poster.key;

  // El borrador sigue el mismo camino que cualquier publicación, revisión de
  // electrónica incluida: cargar en lote no salta la moderación.
  await query(
    `update listings set video_path = $2, poster_path = $3, status = $4
      where id = $1 and status = 'borrador'`,
    [draft.id, videoPath, posterPath, initialStatus()]
  );

  if (initialStatus() === "activa") {
    await enqueueOrLog({ type: "avisar", listingId: draft.id });
  }
  await enqueueOrLog({ type: "transcodificar", key: videoPath });

  revalidatePath("/");
  revalidatePath("/tienda");
  return { id: draft.id };
}
