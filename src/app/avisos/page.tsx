import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/session";
import {
  listNotifications,
  listSavedSearches,
} from "@/features/alerts/queries";
import { markAllRead } from "@/features/alerts/actions";
import { DeleteSearchButton } from "@/features/alerts/Forms";
import { AppHeader } from "@/components/AppHeader";
import { SubmitButton } from "@/components/SubmitButton";

// S-15. Las alertas se generan y se guardan; no hay canal de salida conectado.
// Una alerta que hay que entrar a ver no sirve para lo que existe, que es traer a
// la persona de vuelta, pero conectar correo o push es escribir la función de
// envío, igual que con los SMS.
export const dynamic = "force-dynamic";

export default async function Avisos() {
  const user = await currentUser();
  if (!user) redirect("/ingresar");

  const [notifications, searches] = await Promise.all([
    listNotifications(user.id),
    listSavedSearches(user.id),
  ]);

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-md px-5 py-6">
        <h1 className="font-title text-2xl font-semibold">Avisos</h1>

        {notifications.length === 0 ? (
          <p className="mt-4 rounded-2xl bg-white shadow-xs p-4 text-sm text-ink2 ring-1 ring-line">
            Nada nuevo. Guarda una búsqueda y te avisamos cuando aparezca algo
            que coincida.
          </p>
        ) : (
          <>
            <ul data-testid="avisos" className="mt-4 flex flex-col gap-2">
              {notifications.map((n) => (
                <li key={n.id}>
                  <Link
                    href={n.href}
                    className={`block rounded-2xl p-4 text-sm ${
                      n.read_at
                        ? "bg-white text-ink2"
                        : "bg-brand/10 font-medium text-brand"
                    }`}
                  >
                    {n.title}
                  </Link>
                </li>
              ))}
            </ul>
            <form action={markAllRead} className="mt-3">
              <SubmitButton variant="ghost" pendingLabel="Marcando…">
                Marcar todo como visto
              </SubmitButton>
            </form>
          </>
        )}

        <h2 className="mt-8 font-title text-lg font-semibold">
          Búsquedas guardadas
        </h2>
        {searches.length === 0 ? (
          <p className="mt-2 text-sm text-muted">
            Ninguna todavía. Se guardan desde la pantalla de búsqueda.
          </p>
        ) : (
          <ul data-testid="busquedas" className="mt-3 flex flex-col gap-2">
            {searches.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between gap-3 rounded-2xl bg-white shadow-xs p-4 text-sm ring-1 ring-line"
              >
                <Link
                  href={`/buscar?${s.params}`}
                  className="font-medium underline"
                >
                  {s.label}
                </Link>
                <DeleteSearchButton id={s.id} />
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
