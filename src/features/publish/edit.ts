"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { activeUser } from "@/lib/session";
import { query } from "@/lib/db";
import { parseCop, MIN_PRICE_COP } from "@/features/payments/money";
import { moderateListing } from "@/features/moderation/rules";
import { CONDITION_LABEL } from "@/features/catalog/labels";
import { CAMPO_DE_CATEGORIA, EDADES, TALLAS } from "@/features/catalog/atributos";

export type EditResult = { error: string };

/** Estados desde los que todavía se puede editar o cambiar de estado. */
const EDITABLE = ["activa", "en_revision", "reservada"];

/**
 * RF-16. Se puede cambiar el título, el precio, la descripción y el estado del
 * artículo.
 *
 * La categoría y el IMEI no se tocan: cambiar la categoría saltaría la revisión que
 * la publicación ya pasó, y cambiar el IMEI convertiría una publicación aprobada en
 * otra cosa. Para eso se publica de nuevo.
 */
export async function editListing(
  _prev: EditResult | null,
  form: FormData
): Promise<EditResult> {
  const user = await activeUser();

  const id = String(form.get("listingId") ?? "");
  const owned = await query<{ status: string }>(
    `select status from listings where id = $1 and seller_id = $2`,
    [id, user.id]
  );
  if (owned.length === 0) return { error: "Esa publicación no es tuya." };
  if (!EDITABLE.includes(owned[0].status)) {
    return { error: "Una publicación vendida o retirada ya no se puede editar." };
  }

  const title = String(form.get("title") ?? "").trim();
  const description = String(form.get("description") ?? "").trim();
  if (!title || !description) return { error: "Falta el título o la descripción." };

  const price = parseCop(String(form.get("price") ?? ""));
  if (price === null) {
    return { error: "El precio tiene que ser un número mayor que cero, sin centavos." };
  }
  if (price < MIN_PRICE_COP) {
    return { error: `El precio mínimo es de $${MIN_PRICE_COP.toLocaleString("es-CO")}.` };
  }

  const condition = String(form.get("condition") ?? "");
  if (!(condition in CONDITION_LABEL)) return { error: "Elige el estado del artículo." };

  // Corrección 38: la talla o la edad, de la lista cerrada de su categoría.
  const categoria = await query<{ category: string }>(`select category from listings where id = $1`, [id]);
  const campo = CAMPO_DE_CATEGORIA[categoria[0]?.category ?? ""];
  const talla = campo === "talla" ? String(form.get("talla") ?? "") : null;
  const edad = campo === "edad" ? String(form.get("edad") ?? "") : null;
  if (talla !== null && !TALLAS.includes(talla)) return { error: "Elige la talla." };
  if (edad !== null && !(EDADES as readonly string[]).includes(edad)) {
    return { error: "Elige para qué edad es." };
  }

  // Editar no es la puerta trasera: si no se volviera a filtrar, bastaría publicar
  // algo inocente y cambiarlo después.
  const verdict = moderateListing({ title, description });
  if (!verdict.allowed) return { error: verdict.reason };

  await query(
    `update listings set title = $2, description = $3, price_cop = $4, condition = $5,
            talla = coalesce($7, talla), edad = coalesce($8, edad)
      where id = $1 and seller_id = $6`,
    [id, title, description, price, condition, user.id, talla, edad]
  );

  revalidatePath(`/producto/${id}`);
  revalidatePath("/");
  redirect(`/producto/${id}`);
}

/**
 * Desde qué estados se llega a cada uno, a mano.
 *
 * «Vendida» ya no está (corrección 29, decisión de Nicolás): un artículo queda
 * vendido solo cuando la compra se completa en 2venta. Quien vendió por fuera lo
 * retira. Y lo retirado se puede volver a publicar (corrección 31).
 */
const TRANSITIONS: Record<string, string[]> = {
  reservada: ["activa"],
  activa: ["reservada", "retirada"],
  retirada: ["activa", "en_revision", "reservada"],
};

/**
 * Un pedido que todavía puede terminar en entrega: con uno así, el artículo no
 * vuelve al catálogo, porque se vendería dos veces.
 */
const PEDIDO_VIVO = `exists (
  select 1 from order_items oi join orders o on o.id = oi.order_id
   where oi.listing_id = listings.id
     and o.status not in ('cancelado', 'reembolsado'))`;

/** RF-17. Reservar, volver a publicar o retirar. */
export async function setListingStatus(
  _prev: EditResult | null,
  form: FormData
): Promise<EditResult> {
  const user = await activeUser();

  const id = String(form.get("listingId") ?? "");
  const to = String(form.get("status") ?? "");
  const allowedFrom = TRANSITIONS[to];
  if (!allowedFrom) return { error: "Ese estado no existe." };

  // Volver a publicar algo retirado pasa otra vez por la moderación: las reglas
  // pudieron cambiar desde que se publicó.
  if (to === "activa") {
    const actual = await query<{ status: string; title: string; description: string }>(
      `select status, title, description from listings where id = $1 and seller_id = $2`,
      [id, user.id]
    );
    if (actual[0]?.status === "retirada") {
      const verdict = moderateListing(actual[0]);
      if (!verdict.allowed) return { error: verdict.reason };
    }
  }

  // La comprobación de dueño, de estado de origen y de pedidos vivos va en la misma
  // consulta: sin ventana entre comprobar y escribir.
  //
  // - Al retirar se guarda de dónde venía (`retirada_desde`).
  // - Al volver, lo que estaba en revisión vuelve a revisión, no al catálogo: si no,
  //   retirar y republicar sería la forma de saltarse la revisión.
  // - Nada con un pedido vivo vuelve al catálogo (reservado por un pago en curso,
  //   por ejemplo): se vendería dos veces.
  const rows = await query<{ id: string; status: string }>(
    `update listings
        set status = case
              when $3 = 'activa' and status = 'retirada' and retirada_desde = 'en_revision'
                then 'en_revision'
              else $3 end,
            retirada_desde = case when $3 = 'retirada' then status else null end
      where id = $1 and seller_id = $2 and status = any($4)
        and ($3 <> 'activa' or not ${PEDIDO_VIVO})
      returning id, status`,
    [id, user.id, to, allowedFrom]
  );
  if (rows.length === 0) {
    const vivo = await query<{ n: number }>(
      `select 1 as n from listings where id = $1 and seller_id = $2 and ${PEDIDO_VIVO}`,
      [id, user.id]
    );
    if (to === "activa" && vivo.length > 0) {
      return { error: "Tiene un pedido en curso: no puede volver al catálogo mientras tanto." };
    }
    return { error: "Esa publicación no es tuya o ya no está en ese estado." };
  }

  // D-65: al retirar, el destacado termina y no se devuelve. Nadie lo va a ver, y
  // era el vendedor quien decidió sacarla.
  if (to === "retirada") {
    await query(
      `update promotions set ends_at = now()
        where listing_id = $1 and status = 'activa' and ends_at > now()`,
      [id]
    );
  }

  revalidatePath(`/producto/${id}`);
  revalidatePath("/");
  revalidatePath("/vender/metricas");
  // Al retirar se vuelve a «Tus publicaciones», que es donde queda y desde donde
  // se recupera (corrección 26).
  if (to === "retirada") redirect(`/vender/metricas?retirada=${encodeURIComponent(id)}`);
  return { error: "" };
}
