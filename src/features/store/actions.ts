"use server";

import { revalidatePath } from "next/cache";
import { activeUser } from "@/lib/session";
import { query } from "@/lib/db";
import { listCategories } from "@/features/catalog/queries";
import { parseBulk, type RowError } from "./bulk";
import { getStore } from "./queries";

export type StoreResult = { error: string; rowErrors?: RowError[]; created?: number };

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
  if (!store) return { error: "La carga en lote es para empresas con el NIT confirmado." };

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
