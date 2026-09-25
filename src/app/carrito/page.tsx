import Link from "next/link";
import { activeUser } from "@/lib/session";
import { listCart } from "@/features/cart/queries";
import { ClearCartButton, RemoveFromCartButton } from "@/features/cart/Forms";
import { AppHeader } from "@/components/AppHeader";
import { formatCop } from "@/lib/money";
import { commissionCop } from "@/features/payments/money";
import { Volver } from "@/components/Volver";
import { noCompra } from "@/features/sellers/queries";
import { mensajeSinCompras } from "@/features/sellers/reglas";
import { ENVIO_FIJO_COP } from "@/features/shipping/tarifa";

// D-20: un vendedor por pedido. Un pedido es un envío, un escrow y una disputa.
export const dynamic = "force-dynamic";

export default async function Carrito() {
  // Una cuenta suspendida no llega a las pantallas que escriben.
  const user = await activeUser();

  const [items, empresa] = await Promise.all([listCart(user.id), noCompra(user)]);
  const subtotal = items.reduce((sum, i) => sum + i.price_cop, 0);
  const disponible = items.filter((i) => i.status === "activa");

  // El ahorro es lo que hace comprar más de una cosa, así que se dice antes de
  // pagar y no después. Es también la mitigación de la D-09c: el piso de comisión
  // se cobra una vez, no una por prenda.
  const sueltas = items.reduce((sum, i) => sum + commissionCop(i.price_cop), 0);
  const juntas = items.length > 0 ? commissionCop(subtotal) : 0;
  const ahorroComision = sueltas - juntas;
  const ahorroEnvio = Math.max(0, items.length - 1) * ENVIO_FIJO_COP;

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-md px-5 py-6">
        <div className="mb-4">
          <Volver href="/" />
        </div>
        <h1 className="font-title text-2xl font-semibold">Tu carrito</h1>

        {empresa ? (
          // Corrección 17: lo que haya quedado de antes no se puede pagar.
          <p
            role="status"
            data-testid={empresa === "equipo" ? "equipo-no-compra" : "empresa-no-compra"}
            className="mt-4 rounded-2xl bg-white shadow-xs p-4 text-sm text-ink2 ring-1 ring-line"
          >
            {mensajeSinCompras(empresa)}{" "}
            {empresa === "equipo" ? (
              <Link href="/admin" className="text-brand underline">
                Ir a administración
              </Link>
            ) : (
              <Link href="/vender" className="text-brand underline">
                Ir a vender
              </Link>
            )}
          </p>
        ) : items.length === 0 ? (
          <p className="mt-4 rounded-2xl bg-white shadow-xs p-4 text-sm text-ink2 ring-1 ring-line">
            Está vacío. Junta varias cosas del mismo vendedor y pagas un solo
            envío.{" "}
            <Link href="/" className="text-brand underline">
              Ver el catálogo
            </Link>
          </p>
        ) : (
          <>
            <p className="mt-1 text-sm text-muted">
              De {items[0].seller_alias}
            </p>

            <ul data-testid="carrito" className="mt-5 flex flex-col gap-2">
              {items.map((i) => (
                <li
                  key={i.listing_id}
                  className="flex items-center justify-between gap-3 rounded-2xl bg-white shadow-xs p-4 text-sm ring-1 ring-line"
                >
                  <span>
                    <Link
                      href={`/producto/${i.listing_id}`}
                      className="font-medium underline"
                    >
                      {i.title}
                    </Link>
                    <span className="block text-muted">
                      {formatCop(i.price_cop)}
                      {i.status !== "activa" && " · ya no está disponible"}
                    </span>
                  </span>
                  <RemoveFromCartButton listingId={i.listing_id} />
                </li>
              ))}
            </ul>

            {(ahorroEnvio > 0 || ahorroComision > 0) && (
              <p
                data-testid="ahorro"
                className="mt-4 rounded-2xl bg-brand/10 p-4 text-sm text-brand"
              >
                Comprando junto te ahorras{" "}
                {formatCop(ahorroEnvio + ahorroComision)}: un solo envío y una
                sola comisión en vez de {items.length}.
              </p>
            )}

            <p className="mt-4 flex justify-between text-sm font-medium">
              <span>Subtotal</span>
              <span data-testid="subtotal">{formatCop(subtotal)}</span>
            </p>

            {disponible.length === items.length ? (
              <Link
                href="/comprar/carrito"
                className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-accent px-4 py-3 text-sm font-medium text-on-accent"
              >
                Ir a pagar
              </Link>
            ) : (
              <p className="mt-5 rounded-xl bg-warn/10 px-4 py-3 text-sm text-warn">
                Quita lo que ya no está disponible para poder pagar.
              </p>
            )}

            <div className="mt-3">
              <ClearCartButton />
            </div>
          </>
        )}
      </main>
    </>
  );
}
