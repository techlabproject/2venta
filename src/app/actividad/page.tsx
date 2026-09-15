import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/session";
import {
  listPurchases,
  listSales,
  type OrderSummary,
} from "@/features/orders/queries";
import { listConversations } from "@/features/chat/queries";
import { AppHeader } from "@/components/AppHeader";
import { Vacio } from "@/components/Vacio";
import { formatCop } from "@/lib/money";
import { breakdown } from "@/features/payments/money";

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

  const [purchases, sales, conversations] = await Promise.all([
    listPurchases(user.id),
    listSales(user.id),
    listConversations(user.id),
  ]);

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-3xl px-5 py-6">
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

        <Section
          title="Conversaciones"
          testId="chats"
          vacio={
            <Vacio titulo="Ninguna conversación todavía">
              Se abren desde el artículo, escribiéndole al vendedor. Preguntar
              antes de comprar es gratis y evita casi todos los reclamos.
            </Vacio>
          }
        >
          {conversations.map((c) => (
            <li key={c.id}>
              <Link
                href={`/chat/${c.id}`}
                aria-label={`Abrir conversación sobre ${c.listing_title}`}
                className="block rounded-2xl bg-white shadow-xs p-4 text-sm ring-1 ring-line"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-medium">{c.listing_title}</span>
                  <span className="shrink-0 text-xs text-muted">
                    {fecha.format(c.last_at)}
                  </span>
                </div>
                <p className="mt-0.5 text-muted">
                  Con {c.counterpart_alias}
                  {c.listing_status === "vendida" && " · ya se vendió"}
                </p>
                {c.last_message && (
                  <p className="mt-1 line-clamp-1 text-ink2">
                    {c.last_message}
                  </p>
                )}
              </Link>
            </li>
          ))}
        </Section>
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
          <span className="font-medium">{order.title}</span>
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
