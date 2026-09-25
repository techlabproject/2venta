"use server";

import { revalidatePath } from "next/cache";
import { activeUser, clienteActivo } from "@/lib/session";
import { query } from "@/lib/db";

export type AlertResult = { error: string };

export async function saveSearch(
  _prev: AlertResult | null,
  form: FormData
): Promise<AlertResult> {
  const user = await clienteActivo();

  // D-122: la distancia depende de dónde está cada quien (su cookie), no se guarda
  // con el aviso: el aviso vale para toda Bogotá.
  const crudos = new URLSearchParams(String(form.get("params") ?? "").slice(0, 500));
  crudos.delete("radio");
  if (crudos.get("orden") === "cerca") crudos.delete("orden");
  const params = crudos.toString();
  const label = String(form.get("label") ?? "").trim().slice(0, 80);
  if (!label) return { error: "Ponle un nombre a la búsqueda." };

  await query(
    `insert into saved_searches (user_id, label, params) values ($1, $2, $3)
     on conflict (user_id, params) do update set label = excluded.label`,
    [user.id, label, params]
  );

  revalidatePath("/avisos");
  return { error: "" };
}

export async function deleteSearch(
  _prev: AlertResult | null,
  form: FormData
): Promise<AlertResult> {
  const user = await activeUser();

  // El identificador del dueño va en la consulta: sin eso, cualquiera borraría
  // búsquedas ajenas con solo tener el identificador.
  await query(`delete from saved_searches where id = $1 and user_id = $2`, [
    String(form.get("id") ?? ""),
    user.id,
  ]);

  revalidatePath("/avisos");
  return { error: "" };
}

export async function markAllRead(): Promise<void> {
  const user = await activeUser();
  await query(
    `update notifications set read_at = now() where user_id = $1 and read_at is null`,
    [user.id]
  );
  revalidatePath("/avisos");
}
