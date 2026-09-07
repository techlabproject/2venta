"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { currentUser } from "@/lib/session";
import { query } from "@/lib/db";

/** Guarda o quita un favorito. El mismo botón hace las dos cosas. */
export async function toggleFavorite(_prev: unknown, form: FormData) {
  const user = await currentUser();
  if (!user) redirect("/ingresar");

  const listingId = String(form.get("listingId") ?? "");
  const removed = await query<{ listing_id: string }>(
    `delete from favorites where user_id = $1 and listing_id = $2 returning listing_id`,
    [user.id, listingId]
  );

  if (removed.length === 0) {
    // La clave primaria compuesta hace que guardar dos veces no duplique.
    await query(
      `insert into favorites (user_id, listing_id) values ($1, $2)
       on conflict do nothing`,
      [user.id, listingId]
    );
  }

  revalidatePath(`/producto/${listingId}`);
  revalidatePath("/favoritos");
  return { saved: removed.length === 0 };
}
