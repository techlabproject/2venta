import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/session";
import {
  listSellerMetrics,
  type ListingMetrics,
} from "@/features/metrics/queries";
import { AppHeader } from "@/components/AppHeader";
import { Price } from "@/components/Price";
import { ButtonLink } from "@/components/ui";
import { StatusButton } from "@/features/publish/EditForms";
import { mediaUrl } from "@/lib/media";
import { Volver } from "@/components/Volver";

// D-24: métricas del vendedor. Vistas, favoritos y conversaciones por publicación.
//
// D-73: y también la gestión. Antes esto era un tablero de cifras y nada más: para
// reservar, retirar o corregir el precio de algo había que salir de aquí, buscar la
// publicación en el catálogo público y entrar por su ficha. La cifra y la acción
// que esa cifra sugiere viven ahora en la misma tarjeta.
export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  activa: "Activa",
  en_revision: "En revisión",
  rechazada: "Rechazada",
  reservada: "Reservada",
  vendida: "Vendida",
  retirada: "Retirada",
};

const STATUS_STYLE: Record<string, string> = {
  activa: "bg-brand text-cream",
  en_revision: "bg-warn/15 text-warn",
  rechazada: "bg-danger/12 text-danger",
  reservada: "bg-accent/25 text-accent-text",
  vendida: "bg-brand/12 text-brand",
  retirada: "bg-ph text-muted",
};

/** Qué puede hacer el vendedor desde aquí, según el estado (RF-17). */
const ACCIONES: Record<
  string,
  ("reservada" | "activa" | "vendida" | "retirada")[]
> = {
  activa: ["reservada", "vendida", "retirada"],
  reservada: ["activa", "vendida", "retirada"],
  en_revision: ["retirada"],
};

const EDITABLE = ["activa", "en_revision", "reservada"];

export default async function Metricas() {
  const user = await currentUser();
  if (!user) redirect("/ingresar");

  const metrics = await listSellerMetrics(user.id);
  const activas = metrics.filter((m) => m.status === "activa").length;
  const vistas = metrics.reduce((t, m) => t + m.views, 0);
  const guardados = metrics.reduce((t, m) => t + m.favorites, 0);

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-6xl px-5 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Volver href="/vender" fijo>Volver a tu espacio de vendedor</Volver>
            <h1 className="mt-2 font-title text-2xl font-semibold">
              Tus publicaciones
            </h1>
          </div>
          <ButtonLink href="/publicar" className="sm:w-auto">
            Publicar un artículo
          </ButtonLink>
        </div>

        {metrics.length === 0 ? (
          <div className="mt-8 rounded-2xl bg-white shadow-xs p-8 text-center ring-1 ring-line">
            <p className="font-title text-lg font-semibold">
              Todavía no has publicado nada
            </p>
            <p className="mx-auto mt-2 max-w-md text-sm text-ink2">
              Lo primero que vende es el video: treinta segundos mostrando el
              artículo de verdad valen más que diez fotos perfectas.
            </p>
            <div className="mt-5 flex justify-center">
              <ButtonLink href="/publicar" className="sm:w-auto">
                Publicar el primero
              </ButtonLink>
            </div>
          </div>
        ) : (
          <>
            {/* Una sola tira y no tres tarjetas: en escritorio cada tarjeta medía
                370 px de ancho para sostener una palabra y un número, y el hueco
                vacío pesaba más que el dato. Tres cifras de resumen son una
                línea, no tres objetos. */}
            <dl className="mt-6 flex divide-x divide-line overflow-hidden rounded-2xl bg-white shadow-xs ring-1 ring-line">
              <Resumen label="Activas" value={activas} />
              <Resumen label="Visitas" value={vistas} />
              <Resumen label="Guardados" value={guardados} />
            </dl>

            <ul
              data-testid="metricas"
              className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
            >
              {metrics.map((m) => (
                <Tarjeta key={m.listing_id} m={m} />
              ))}
            </ul>
          </>
        )}
      </main>
    </>
  );
}

function Resumen({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex-1 px-4 py-3">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="font-title text-2xl font-semibold tabular-nums">
        {value}
      </dd>
    </div>
  );
}

function Tarjeta({ m }: { m: ListingMetrics }) {
  const acciones = ACCIONES[m.status] ?? [];

  return (
    <li className="flex flex-col rounded-2xl bg-white shadow-xs p-4 ring-1 ring-line">
      <div className="flex gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={mediaUrl(m.poster_path)}
          alt=""
          aria-hidden
          className="h-20 w-20 shrink-0 rounded-xl bg-ph object-cover"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <Link
              href={`/producto/${m.listing_id}`}
              className="line-clamp-2 font-medium leading-snug hover:underline"
            >
              {m.title}
            </Link>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                STATUS_STYLE[m.status] ?? "bg-ph text-muted"
              }`}
            >
              {STATUS_LABEL[m.status] ?? m.status}
            </span>
          </div>
          <Price cop={m.price_cop} size="sm" className="mt-1" />
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-cream px-3 py-2.5 text-center text-sm">
        <div>
          <dt className="text-xs text-muted">Visitas</dt>
          <dd
            data-testid={`vistas-${m.listing_id}`}
            className="font-title font-semibold tabular-nums"
          >
            {m.views}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Guardados</dt>
          <dd className="font-title font-semibold tabular-nums">
            {m.favorites}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Chats</dt>
          {/* La cifra era un número muerto: quien veía «3» no tenía cómo llegar a
              esas tres conversaciones. */}
          <dd className="font-title font-semibold tabular-nums">
            {m.messages > 0 ? (
              <Link href="/actividad" className="underline">
                {m.messages}
              </Link>
            ) : (
              m.messages
            )}
          </dd>
        </div>
      </dl>

      {(acciones.length > 0 || EDITABLE.includes(m.status)) && (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
          {EDITABLE.includes(m.status) && (
            <ButtonLink
              href={`/producto/${m.listing_id}/editar`}
              variant="outline"
              size="sm"
            >
              Editar
            </ButtonLink>
          )}
          {acciones.map((a) => (
            <StatusButton
              key={a}
              listingId={m.listing_id}
              status={a}
              variant="ghost"
              compact
            />
          ))}
        </div>
      )}
    </li>
  );
}
