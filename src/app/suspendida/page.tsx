import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/session";
import { query } from "@/lib/db";
import { AppHeader } from "@/components/AppHeader";
import { Volver } from "@/components/Volver";

// Una cuenta suspendida ve esto en vez de las pantallas que escriben. Sigue
// pudiendo entrar a su cuenta y a sus pedidos: si tiene dinero retenido en una
// disputa, dejarla ciega sería quitarle la única forma de defenderse.
export const dynamic = "force-dynamic";

export default async function Suspendida() {
  const user = await currentUser();
  if (!user) redirect("/ingresar");
  if (!user.suspendedAt) redirect("/");

  const rows = await query<{ suspended_reason: string | null }>(
    `select suspended_reason from "user" where id = $1`,
    [user.id],
  );

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-md px-5 py-10">
        <div className="mb-4">
          <Volver href="/" />
        </div>
        <h1 className="font-title text-2xl font-semibold">
          Tu cuenta está suspendida
        </h1>
        <p className="mt-3 text-ink2">
          No puedes publicar, comprar ni escribirle a nadie. Sí puedes ver tus
          pedidos y seguir cualquier reclamo abierto, porque si tienes dinero
          retenido necesitas poder defenderte.
        </p>

        {rows[0]?.suspended_reason && (
          <p className="mt-5 rounded-2xl bg-warn/10 p-4 text-sm text-warn">
            Motivo: {rows[0].suspended_reason}
          </p>
        )}

        <p className="mt-6 text-sm text-ink2">
          Si crees que es un error, escríbenos y lo revisamos.
        </p>

        <div className="mt-7 flex flex-col gap-3">
          <Link
            href="/actividad"
            className="inline-flex w-full items-center justify-center rounded-xl border border-brand/25 bg-white px-4 py-3 text-sm font-medium"
          >
            Ver mis pedidos
          </Link>
          <Link
            href="/cuenta"
            className="inline-flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm text-ink2"
          >
            Mi cuenta
          </Link>
        </div>
      </main>
    </>
  );
}
