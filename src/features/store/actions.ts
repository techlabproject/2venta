"use server";

import { CONTACT_REJECTED, hasContact } from "@/features/chat/redact";
import { revalidatePath } from "next/cache";
import { activeUser } from "@/lib/session";
import { query } from "@/lib/db";
import { getVerification } from "@/features/kyc/queries";
import { listCategories } from "@/features/catalog/queries";
import { formatNit, isValidNit } from "./nit";
import { parseBulk, type RowError } from "./bulk";
import { getStore } from "./queries";

export type StoreResult = { error: string; rowErrors?: RowError[]; created?: number };

/** D-07: cuenta de tienda con NIT. */
export async function registerStore(
  _prev: StoreResult | null,
  form: FormData
): Promise<StoreResult> {
  const user = await activeUser();

  // Una tienda es un vendedor: la identidad de quien la representa se verifica
  // igual que la de cualquiera (D-02).
  const verification = await getVerification(user.id);
  if (verification?.status !== "aprobado") {
    return { error: "Verifica tu identidad antes de registrar la tienda." };
  }

  const legalName = String(form.get("legalName") ?? "").trim().slice(0, 200);
  if (legalName.length < 3) return { error: "Escribe la razón social de la tienda." };
  // La razón social reemplaza al alias en el perfil público: mismo listón.
  if (hasContact(legalName)) return { error: `La razón social ${CONTACT_REJECTED.charAt(0).toLowerCase()}${CONTACT_REJECTED.slice(1)}` };

  const rawNit = String(form.get("nit") ?? "");
  if (!isValidNit(rawNit)) {
    return { error: "Ese NIT no es válido. Revisa el número y el dígito de verificación." };
  }

  try {
    await query(
      `insert into stores (user_id, legal_name, nit) values ($1, $2, $3)
       on conflict (user_id) do update set legal_name = excluded.legal_name`,
      [user.id, legalName, formatNit(rawNit)]
    );
  } catch (err) {
    if (err instanceof Error && /stores_nit_key/.test(err.message)) {
      return { error: "Ese NIT ya está registrado en otra cuenta." };
    }
    throw err;
  }

  revalidatePath("/tienda");
  return { error: "" };
}

/**
 * Carga en lote. Crea borradores, no publicaciones.
 *
 * El video se sigue grabando desde el móvil, uno por uno. Si una tienda pudiera
 * cargar cincuenta artículos con sus videos desde un archivo, la garantía de la
 * D-14 se cae. Lo que se ahorra es escribir, que es lo que de verdad cuesta.
 */
export async function uploadBulk(
  _prev: StoreResult | null,
  form: FormData
): Promise<StoreResult> {
  const user = await activeUser();

  const store = await getStore(user.id);
  if (!store) return { error: "La carga en lote es para cuentas de tienda." };

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Elige el archivo con tus artículos." };
  }
  if (file.size > 2 * 1024 * 1024) {
    return { error: "El archivo pesa demasiado. El máximo son 2 MB." };
  }

  const categories = (await listCategories()).map((c) => c.slug);
  const parsed = parseBulk(await file.text(), categories);
  if (!parsed.ok) return { error: parsed.error };

  for (const row of parsed.rows) {
    await query(
      `insert into listings
         (seller_id, title, description, category, condition, price_cop, imei, status)
       values ($1, $2, $3, $4, $5, $6, $7, 'borrador')`,
      [user.id, row.title, row.description, row.category, row.condition, row.priceCop, row.imei]
    );
  }

  revalidatePath("/tienda");
  return { error: "", created: parsed.rows.length, rowErrors: parsed.errors };
}
