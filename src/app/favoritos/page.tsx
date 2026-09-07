import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/session";
import { listFavorites } from "@/features/favorites/queries";
import { ListingCard } from "@/features/catalog/ListingCard";
import { AppHeader } from "@/components/AppHeader";

export const dynamic = "force-dynamic";

export default async function Favoritos() {
  const user = await currentUser();
  if (!user) redirect("/ingresar");

  const favorites = await listFavorites(user.id);
  const available = favorites.filter((f) => f.status === "activa");
  // Los vendidos se muestran igual: hacerlos desaparecer en silencio se siente como
  // un error de la app, y al comprador le sirve saber que eso que le gustaba ya se
  // fue. En segunda mano cada cosa es única y dura poco.
  const gone = favorites.filter((f) => f.status !== "activa");

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-3xl px-5 py-6">
        <h1 className="font-title text-2xl font-semibold">Guardados</h1>

        {favorites.length === 0 ? (
          <p className="mt-4 rounded-2xl bg-white p-4 text-sm text-ink2">
            Todavía no has guardado nada. El corazón de cada artículo lo guarda aquí
            para verlo después.{" "}
            <Link href="/" className="text-brand underline">
              Ver el catálogo
            </Link>
          </p>
        ) : (
          <ul data-testid="favoritos" className="mt-5 grid grid-cols-2 gap-3">
            {available.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </ul>
        )}

        {gone.length > 0 && (
          <section className="mt-8">
            <h2 className="font-title text-lg font-semibold">Ya no están</h2>
            <p className="mt-1 text-sm text-muted">
              En segunda mano cada cosa es única y dura poco.
            </p>
            <ul data-testid="favoritos-vendidos" className="mt-3 grid grid-cols-2 gap-3 opacity-60">
              {gone.map((l) => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </ul>
          </section>
        )}
      </main>
    </>
  );
}
