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
          {listing.seller_verified && <VerifiedBadge className="mt-1.5" />}
        </div>
      </Link>
    </li>
  );
}
