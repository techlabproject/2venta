import Link from "next/link";
import type { Listing } from "./queries";
import { CATEGORY_LABEL, CONDITION_LABEL } from "./labels";
import { formatCop } from "@/lib/money";

// Nota deliberada: el mockup muestra un distintivo "Verificado" en cada tarjeta.
// Todavía no existe verificación de identidad (llega en S-02), y poner el
// distintivo ahora sería mentirle al comprador sobre lo único que diferencia a
// 2venta. Entra cuando el dato sea real.
export function ListingCard({ listing }: { listing: Listing }) {
  return (
    <li>
      <Link
        href={`/producto/${listing.id}`}
        className="group block overflow-hidden rounded-2xl bg-white transition hover:shadow-md"
      >
        <div className="flex aspect-[4/3] items-center justify-center bg-ph text-sm text-muted">
          Sin foto
        </div>
        <div className="p-3">
          <p className="font-title text-lg font-semibold">{formatCop(listing.price_cop)}</p>
          <h3 className="mt-0.5 line-clamp-2 text-sm leading-snug font-medium">
            {listing.title}
          </h3>
          <p className="mt-1 text-xs text-muted">
            {CATEGORY_LABEL[listing.category]} · {CONDITION_LABEL[listing.condition]}
          </p>
          <p className="text-xs text-muted">{listing.seller_zone}</p>
        </div>
      </Link>
    </li>
  );
}
