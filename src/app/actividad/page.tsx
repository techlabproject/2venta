import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/session";
import {
  listPurchases,
  listSales,
  type OrderSummary,
} from "@/features/orders/queries";
import { AppHeader } from "@/components/AppHeader";
import { Vacio } from "@/components/Vacio";
import { formatCop } from "@/lib/money";
import { breakdown } from "@/features/payments/money";
import { Volver } from "@/components/Volver";

// S-18. No es una función nueva: hasta ahora la única forma de volver a un pedido
// era tener su dirección guardada. Se pagaba, se cerraba la pestaña, y no se
// encontraba nunca más.
export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  pagado: "Pago guardado",
  despachado: "Despachado",
  entregado: "Entregado",
  en_disputa: "Con reclamo",
  liberado: "Completado",
  cancelado: "Cancelado",
  reembolsado: "Reembolsado",
};

const fecha = new Intl.DateTimeFormat("es-CO", {
  day: "numeric",
  month: "short",
  timeZone: "America/Bogota",
});

export default async function Actividad() {
  const user = await currentUser();
  if (!user) redirect("/ingresar");

  const [purchases, sales] = await Promise.all([
    listPurchases(user.id),
    listSales(user.id),
  ]);

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-3xl px-5 py-6">
        <div className="mb-4">
          <Volver href="/" />
        </div>
        <h1 className="font-title text-2xl font-semibold">Tu actividad</h1>

        <Section
          title="Compras"
          testId="compras"
          vacio={
            <Vacio
              titulo="Aquí van tus compras"
              accion={{ href: "/", label: "Ver qué hay" }}
            >
              Cuando le compres a alguien, el pedido queda aquí con su
              seguimiento, hasta que confirmes que recibiste.
            </Vacio>
          }
        >
          {purchases.map((o) => (
            <OrderRow key={o.id} order={o} role="compraste a" />
          ))}
        </Section>

        <Section
          title="Ventas"
          testId="ventas"
          vacio={
            <Vacio
              titulo="Aquí van tus ventas"
              accion={{ href: "/publicar", label: "Publicar un artículo" }}
            >
              Lo primero que vende es el video: treinta segundos mostrando el
              artículo de verdad valen más que diez fotos perfectas.
            </Vacio>
          }
        >
          {sales.map((o) => (
            <OrderRow key={o.id} order={o} role="vendiste a" />
          ))}
        </Section>

        {/* Las conversaciones se fueron a `/chats` (D-90). Esta pantalla es la de
            pedidos; tener la misma lista en dos sitios es lo que hacía que ninguno
            de los dos se sintiera el sitio. Queda el camino, no la copia. */}
        <section className="mt-8">
          <h2 className="font-title text-lg font-semibold">Conversaciones</h2>
          <p className="mt-2 text-sm text-ink2">
            Tus chats con compradores y vendedores tienen pantalla propia.{" "}
            <Link href="/chats" className="text-brand underline">
              Ver conversaciones
            </Link>
          </p>
        </section>
      </main>
    </>
  );
}

function Section({
  title,
  testId,
  vacio,
  children,
}: {
  title: string;
  testId: string;
  vacio: React.ReactNode;
  children: React.ReactNode[];
}) {
  return (
    <section className="mt-8">
      <h2 className="font-title text-lg font-semibold">{title}</h2>
      {children.length === 0 ? (
        <div className="mt-3">{vacio}</div>
      ) : (
        <ul data-testid={testId} className="mt-3 flex flex-col gap-2">
          {children}
        </ul>
      )}
    </section>
  );
}

function OrderRow({ order, role }: { order: OrderSummary; role: string }) {
  const money = breakdown(order.subtotal_cop, order.shipping_cop);
  return (
    <li>
      <Link
        href={`/pedido/${order.id}`}
        className="block rounded-2xl bg-white shadow-xs p-4 text-sm ring-1 ring-line"
      >
        <div className="flex items-baseline justify-between gap-3">
          <span className="font-medium">
            {order.title}
            {order.item_count > 1 && (
              // El importe es el del pedido entero, así que el renglón tiene que
              // decir que el pedido trae más de una cosa. Si no, la cifra parece
              // el precio de lo único que se nombra.
              <span className="font-normal text-muted">
                {" "}
                y {order.item_count - 1}{" "}
                {order.item_count === 2 ? "artículo más" : "artículos más"}
              </span>
            )}
          </span>
          <span className="shrink-0">{formatCop(money.buyerTotalCop)}</span>
        </div>
        <p className="mt-0.5 text-muted">
          {STATUS_LABEL[order.status] ?? order.status} · {role}{" "}
          {order.counterpart_alias} · {fecha.format(order.created_at)}
        </p>
      </Link>
    </li>
  );
}
