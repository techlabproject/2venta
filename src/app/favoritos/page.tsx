import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/session";
import { listFavorites } from "@/features/favorites/queries";
import { ListingCard } from "@/features/catalog/ListingCard";
import { AppHeader } from "@/components/AppHeader";
import { Vacio } from "@/components/Vacio";
import { Volver } from "@/components/Volver";

export const dynamic = "force-dynamic";

export default async function Favoritos() {
  const user = await currentUser();
  if (!user) redirect("/ingresar");

  const favorites = await listFavorites(user.id);
  const available = favorites.filter((f) => f.status === "activa");
  // Los vendidos y los retirados se muestran igual: hacerlos desaparecer en silencio
  // se siente como un error de la app, y al comprador le sirve saber que eso que le
  // gustaba ya se fue. En segunda mano cada cosa es única y dura poco.
  const gone = favorites.filter((f) => f.status !== "activa");

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-3xl px-5 py-6">
        <div className="mb-4">
          <Volver href="/" />
        </div>
        <h1 className="font-title text-2xl font-semibold">Guardados</h1>

        {favorites.length === 0 ? (
          <div className="mt-4">
            <Vacio
              titulo="Todavía no has guardado nada"
              accion={{ href: "/", label: "Ver el catálogo" }}
            >
              {/* Corrección 41 (Catalina; texto elegido por Nicolás): qué es esto y
                  en qué se diferencia de Avisos. */}
              Toca el ♡ en un artículo para tenerlo a mano aquí. ¿Buscas algo
              que todavía no está? Guarda la búsqueda y te avisamos en{" "}
              <Link href="/avisos" className="text-brand underline">
                Avisos
              </Link>{" "}
              cuando aparezca.
            </Vacio>
          </div>
        ) : (
          <>
            <p
              data-testid="guardados-explicacion"
              className="mt-1 text-sm text-muted"
            >
              Lo que marcaste con ♡. Si algo se vende o lo retiran, pasa a «Ya no están».
            </p>
            <ul data-testid="favoritos" className="mt-5 grid grid-cols-2 gap-3">
              {available.map((l) => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </ul>
          </>
        )}

        {gone.length > 0 && (
          <section className="mt-8">
            <h2 className="font-title text-lg font-semibold">Ya no están</h2>
            <p className="mt-1 text-sm text-muted">
              Se vendieron o los retiraron.
            </p>
            <ul
              data-testid="favoritos-vendidos"
              className="mt-3 grid grid-cols-2 gap-3 opacity-60"
            >
              {gone.map((l) => (
                <ListingCard
                  key={l.id}
                  listing={l}
                  sinEnlace={l.status === "retirada"}
                />
              ))}
            </ul>
          </section>
        )}
      </main>
    </>
  );
}
