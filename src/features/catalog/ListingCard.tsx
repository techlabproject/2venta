import Link from "next/link";
import { mediaUrl } from "@/lib/media";
import type { Listing } from "./queries";
import { CONDITION_LABEL } from "./labels";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { Price } from "@/components/Price";
import { textoDeDistancia } from "@/features/ubicacion/zonas";

export function ListingCard({
  listing,
  sinEnlace = false,
}: {
  listing: Listing;
  /** Para lo que ya no tiene ficha pública (un guardado retirado): la tarjeta se ve, no lleva a un 404. */
  sinEnlace?: boolean;
}) {
  const clase =
    "flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-xs ring-1 ring-line";
  const contenido = (
    <>
      <div className="relative">
        {/* La portada sale del primer cuadro del video, así que siempre
              corresponde al artículo de verdad. */}
        <img
          src={mediaUrl(listing.poster_path)}
          alt=""
          className="aspect-[4/3] w-full bg-ph object-cover transition-transform duration-500 ease-salida group-hover:scale-[1.04]"
        />

        {/* D-14: todo artículo lleva un video grabado dentro de la app, y es la
              razón por la que alguien confía en comprarle a un desconocido. Antes
              no se veía en el feed: la tarjeta parecía la de cualquier
              clasificado. Ahora el video se anuncia donde más se mira. */}
        <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-ink/70 py-1 pr-2.5 pl-2 text-[11px] font-medium text-cream backdrop-blur-sm">
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="h-3 w-3 fill-current"
          >
            <path d="M8 5.14v13.72a1 1 0 0 0 1.54.84l10.3-6.86a1 1 0 0 0 0-1.68L9.54 4.3A1 1 0 0 0 8 5.14Z" />
          </svg>
          Con video
        </span>

        {/* D-10: el destacado se marca. Nadie tiene que adivinar por qué ese
              artículo está arriba. */}
        {listing.promoted && (
          <span className="absolute top-2 left-2 rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-on-accent shadow-sm">
            Destacado
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3">
        <Price cop={listing.price_cop} size="sm" />
        <h3 className="mt-1.5 line-clamp-2 text-sm leading-snug font-medium">
          {listing.title}
        </h3>
        <p className="mt-1 text-xs text-muted">
          {listing.category_label} · {CONDITION_LABEL[listing.condition]}
        </p>

        <span className="mt-auto flex flex-wrap items-center gap-x-2 gap-y-1 pt-2 text-xs text-muted">
          <span data-testid="lugar">
            {listing.seller_zone}
            {/* D-122: redondeada; sale de puntos en cuadrícula de ~1 km. */}
            {listing.distancia_km !== null && ` · ${textoDeDistancia(listing.distancia_km)}`}
          </span>
          {listing.seller_verified && <VerifiedBadge />}
          {listing.seller_is_store && (
            <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-medium text-brand">
              Tienda
            </span>
          )}
        </span>
      </div>
    </>
  );
  return (
    <li>
      {sinEnlace ? (
        <div className={clase}>{contenido}</div>
      ) : (
        <Link
          href={`/producto/${listing.id}`}
          className={`group ${clase} transition duration-200 ease-salida hover:-translate-y-1 hover:shadow-lg hover:ring-brand/30 active:translate-y-0 active:shadow-sm active:duration-75`}
        >
          {contenido}
        </Link>
      )}
    </li>
  );
}
