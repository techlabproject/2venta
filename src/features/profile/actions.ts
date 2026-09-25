"use server";

import { revalidatePath } from "next/cache";
import { activeUser } from "@/lib/session";
import { query } from "@/lib/db";
import { CONTACT_REJECTED, hasContact, redact } from "@/features/chat/redact";
import { claim } from "@/features/publish/claim";
import { AVATAR_MAX_BYTES } from "@/lib/storage";
import {
  aCuadricula,
  dentroDelArea,
  FUERA_DEL_AREA,
  puntoEnZona,
  zonaReconocida,
} from "@/features/ubicacion/zonas";

export type ProfileResult = { error: string };

/** RF-12. El usuario de la sesión edita lo suyo; el identificador no viene del formulario. */
export async function updateProfile(
  _prev: ProfileResult | null,
  form: FormData
): Promise<ProfileResult> {
  const user = await activeUser();

  const alias = String(form.get("alias") ?? "").trim();
  if (alias.length < 2 || alias.length > 40) {
    return { error: "El alias tiene entre 2 y 40 caracteres." };
  }
  // El alias es lo más público que hay: un teléfono ahí se ve en cada tarjeta
  // (hallazgo de QA, 2026-09-13).
  if (hasContact(alias)) return { error: `El alias ${CONTACT_REJECTED.charAt(0).toLowerCase()}${CONTACT_REJECTED.slice(1)}` };
  // Un alias elegido no puede ser el de otra persona, sin distinguir mayúsculas
  // (hallazgo de QA, 2026-09-13). No es un índice único: el alias inicial se
  // deriva del nombre ("Catalina R.") y dos Catalinas R. son inevitables (D-04).
  // Lo que se cierra es hacerse pasar a propósito por alguien concreto.
  // Solo se comprueba al cambiarlo: quien guarda su perfil con el alias de
  // siempre no tiene por qué chocar con otra "Camila V." que llegó después.
  if (alias.toLowerCase() !== (user.alias ?? "").toLowerCase()) {
    const alreadyUsed = await query<{ id: string }>(
      `select id from "user" where lower(alias) = lower($1) and id <> $2 limit 1`,
      [alias, user.id]
    );
    if (alreadyUsed.length) return { error: "Ese alias ya lo usa otra persona. Elige otro." };
  }


  // D-122: de la lista cerrada, con su punto aproximado (el centro de la zona). Lo que
  // no está en la lista se rechaza: un formulario manipulado no inventa zonas.
  const zonaEscrita = String(form.get("zone") ?? "").trim();
  const zona = zonaEscrita ? zonaReconocida(zonaEscrita) : null;
  if (zonaEscrita && !zona) return { error: "Elige tu zona de la lista." };

  // El punto: el del celular si lo mandó («Usar mi ubicación», ya redondeado; se
  // redondea otra vez por si acaso); si no, el que ya tenía, mientras siga en la
  // misma zona; si cambió de zona, el centro de la nueva.
  let punto: { lat: number; lng: number } | null = null;
  const latTexto = String(form.get("lat") ?? "");
  const lngTexto = String(form.get("lng") ?? "");
  if (zona && latTexto && lngTexto) {
    const lat = Number(latTexto);
    const lng = Number(lngTexto);
    if (!dentroDelArea(lat, lng)) return { error: FUERA_DEL_AREA };
    // La zona es lo que se muestra y el punto de donde sale la distancia: tienen que
    // decir lo mismo (Luna).
    if (!puntoEnZona(lat, lng, zona.nombre)) {
      return {
        error: `Ese punto no queda en ${zona.nombre}. Vuelve a tocar «Usar mi ubicación» o elige la zona sin él.`,
      };
    }
    punto = { lat: aCuadricula(lat), lng: aCuadricula(lng) };
  } else if (zona) {
    const actual = await query<{ zone: string | null; lat: number | null; lng: number | null }>(
      `select zone, ubicacion_lat as lat, ubicacion_lng as lng from "user" where id = $1`,
      [user.id],
    );
    const antes = actual[0];
    punto =
      antes?.zone === zona.nombre && antes.lat !== null && antes.lng !== null
        ? { lat: antes.lat, lng: antes.lng }
        : { lat: aCuadricula(zona.lat), lng: aCuadricula(zona.lng) };
  }
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

  await query(
    `update "user" set alias = $2, zone = $3, bio = $4, ubicacion_lat = $5, ubicacion_lng = $6
      where id = $1`,
    [
      user.id,
      alias,
      zona?.nombre ?? null,
      bio,
      punto?.lat ?? null,
      punto?.lng ?? null,
    ],
  );

  revalidatePath("/cuenta");
  revalidatePath(`/vendedor/${user.id}`);
  return { error: "" };
}

/** RF-32. Reportar a una persona, no a una publicación. */
export async function reportUser(
  _prev: ProfileResult | null,
  form: FormData
): Promise<ProfileResult> {
  const user = await activeUser();

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

/**
 * Guarda la foto de perfil (S-31).
 *
 * La clave la eligió el navegador al subir el archivo directo al bucket (D-50), así
 * que aquí no se confía en ella: `claim()` le pregunta a S3 si ese objeto existe, si
 * es una imagen y si el dueño es quien la está guardando. Sin eso, cualquiera podría
 * ponerse de foto el video de otra persona con solo mandar su clave.
 */
export async function saveAvatar(
  _prev: ProfileResult | null,
  form: FormData
): Promise<ProfileResult> {
  const user = await activeUser();

  const claimed = await claim(form.get("avatar"), user.id, "image");
  if ("error" in claimed) return { error: "No pudimos guardar esa foto. Intenta con otra." };
  if (claimed.object.size > AVATAR_MAX_BYTES) {
    return { error: "La foto pesa demasiado. El máximo son 8 MB." };
  }

  await query(`update "user" set avatar_path = $2 where id = $1`, [user.id, claimed.key]);

  // La foto sale en la cabecera de todas las pantallas, no solo en la cuenta.
  revalidatePath("/", "layout");
  return { error: "" };
}

/** Quitar la foto deja las iniciales, que es el estado de siempre. */
export async function removeAvatar(): Promise<void> {
  const user = await activeUser();
  await query(`update "user" set avatar_path = null where id = $1`, [user.id]);
  revalidatePath("/", "layout");
}
