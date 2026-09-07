import Link from "next/link";
import type { Listing } from "./queries";
import { CONDITION_LABEL } from "./labels";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { formatCop } from "@/lib/money";

export function ListingCard({ listing }: { listing: Listing }) {
  return (
    <li>
      <Link
        href={`/producto/${listing.id}`}
        className="group block overflow-hidden rounded-2xl bg-white transition hover:shadow-md"
      >
        {/* La portada sale del primer cuadro del video, así que siempre
            corresponde al artículo de verdad. */}
        <img
          src={`/api/media/${listing.poster_path}`}
          alt=""
          className="aspect-[4/3] w-full bg-ph object-cover"
        />
        <div className="p-3">
          <p className="font-title text-lg font-semibold">{formatCop(listing.price_cop)}</p>
          <h3 className="mt-0.5 line-clamp-2 text-sm leading-snug font-medium">
            {listing.title}
          </h3>
          <p className="mt-1 text-xs text-muted">
            {listing.category_label} · {CONDITION_LABEL[listing.condition]}
          </p>
          <p className="text-xs text-muted">{listing.seller_zone}</p>
          <span className="mt-1.5 flex flex-wrap items-center gap-2">
            {/* D-10: el destacado se marca. Nadie tiene que adivinar por qué ese
                artículo está arriba. */}
            {listing.promoted && (
              <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-medium text-brand">
                Destacado
              </span>
            )}
            {listing.seller_verified && <VerifiedBadge />}
            {listing.seller_is_store && (
              <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-medium text-accent-text">
                Tienda
              </span>
            )}
          </span>
        </div>
      </Link>
    </li>
  );
}
