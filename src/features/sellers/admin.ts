"use server";

import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { currentAdmin } from "@/lib/session";
import { query } from "@/lib/db";

/**
 * El equipo revisó el RUT y confirma el NIT (corrección 15). Hasta entonces la
 * empresa vende como cualquiera, sin la insignia ni la carga en lote: no hay
 * proveedor que valide el NIT contra la DIAN.
 */
export async function confirmarNit(form: FormData): Promise<void> {
  const admin = await currentAdmin();
  if (!admin) notFound();
  await query(
    `update stores set nit_confirmado_at = now()
      where user_id = $1 and archivada_at is null and rut_pdf is not null`,
    [String(form.get("userId") ?? "")],
  );
  revalidatePath("/admin");
}
