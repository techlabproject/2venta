import { query } from "@/lib/db";

export type ShippingAddress = {
  recipient: string;
  phone: string;
  line1: string;
  details: string | null;
  city: string;
  zone: string;
  notes: string | null;
};

export function saveAddress(orderId: string, a: ShippingAddress): Promise<unknown[]> {
  return query(
    `insert into shipping_addresses (order_id, recipient, phone, line1, details, city, zone, notes)
     values ($1, $2, $3, $4, $5, $6, $7, $8)
     on conflict (order_id) do update set
       recipient = excluded.recipient, phone = excluded.phone, line1 = excluded.line1,
       details = excluded.details, city = excluded.city, zone = excluded.zone,
       notes = excluded.notes`,
    [orderId, a.recipient, a.phone, a.line1, a.details, a.city, a.zone, a.notes]
  );
}

/**
 * Trae la dirección de un pedido.
 *
 * Vive en su propia tabla y no en `orders` para que ninguna consulta de pedidos la
 * arrastre por descuido: hay que pedirla a propósito, y quien la pide tiene que
 * haber comprobado antes que quien pregunta puede verla.
 */
export async function getAddress(orderId: string): Promise<ShippingAddress | null> {
  const rows = await query<ShippingAddress>(
    `select recipient, phone, line1, details, city, zone, notes
       from shipping_addresses where order_id = $1`,
    [orderId]
  );
  return rows[0] ?? null;
}
