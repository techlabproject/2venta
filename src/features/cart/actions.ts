"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { currentUser } from "@/lib/session";
import { query } from "@/lib/db";
import { getListing } from "@/features/catalog/queries";
import { listCart } from "./queries";

export type CartResult = { error: string; otherSeller?: string };

/**
 * Agrega un artículo al carrito.
 *
 * D-20: un vendedor por pedido. Si el carrito ya tiene artículos de otro vendedor,
 * se avisa y se ofrece vaciar en vez de mezclar. Agregarlo en silencio y que el
 * comprador lo descubra al pagar sería peor.
 */
export async function addToCart(
  _prev: CartResult | null,
  form: FormData
): Promise<CartResult> {
  const user = await currentUser();
  if (!user) redirect("/ingresar");

  const listing = await getListing(String(form.get("listingId") ?? ""));
  if (!listing || listing.status !== "activa") {
    return { error: "Ese artículo ya no está disponible." };
  }
  if (listing.seller_id === user.id) {
    return { error: "Es tu propio artículo." };
  }

  const current = await listCart(user.id);
  const other = current.find((i) => i.seller_id !== listing.seller_id);
  if (other) {
    return {
      error: `Tu carrito tiene cosas de ${other.seller_alias}. Un pedido es de un solo vendedor, para que sea un envío y una entrega.`,
      otherSeller: other.seller_alias,
    };
  }

  await query(
    `insert into cart_items (user_id, listing_id) values ($1, $2)
     on conflict do nothing`,
    [user.id, listing.id]
  );

  revalidatePath("/carrito");
  revalidatePath(`/producto/${listing.id}`);
  return { error: "" };
}

export async function removeFromCart(_prev: CartResult | null, form: FormData) {
  const user = await currentUser();
  if (!user) redirect("/ingresar");

  await query(`delete from cart_items where user_id = $1 and listing_id = $2`, [
    user.id,
    String(form.get("listingId") ?? ""),
  ]);

  revalidatePath("/carrito");
  return { error: "" };
}

export async function clearCart(): Promise<void> {
  const user = await currentUser();
  if (!user) redirect("/ingresar");
  await query(`delete from cart_items where user_id = $1`, [user.id]);
  revalidatePath("/carrito");
}
