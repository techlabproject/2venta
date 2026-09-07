import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { currentUser } from "@/lib/session";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";
import { RevokeButton } from "@/features/auth/SessionList";
import { AppHeader } from "@/components/AppHeader";

// RF-05: ver las sesiones abiertas por dispositivo y cerrarlas.
export const dynamic = "force-dynamic";

const fecha = new Intl.DateTimeFormat("es-CO", {
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "America/Bogota",
});

/** Un nombre legible del dispositivo. La cadena cruda no le dice nada a nadie. */
function describeDevice(userAgent: string | null): string {
  if (!userAgent) return "Dispositivo desconocido";
  const os = /iPhone|iPad/.test(userAgent)
    ? "iPhone o iPad"
    : /Android/.test(userAgent)
      ? "Android"
      : /Mac OS/.test(userAgent)
        ? "Mac"
        : /Windows/.test(userAgent)
          ? "Windows"
          : "Otro dispositivo";
  const browser = /Chrome/.test(userAgent)
    ? "Chrome"
    : /Firefox/.test(userAgent)
      ? "Firefox"
      : /Safari/.test(userAgent)
        ? "Safari"
        : "navegador";
  return `${os} · ${browser}`;
}

export default async function Cuenta() {
  const user = await currentUser();
  if (!user) redirect("/ingresar");

  const session = await auth.api.getSession({ headers: await headers() });
  const sessions = await query<{
    id: string;
    userAgent: string | null;
    createdAt: Date;
    expiresAt: Date;
  }>(
    `select id, "userAgent", "createdAt", "expiresAt" from session
      where "userId" = $1 and "expiresAt" > now() order by "createdAt" desc`,
    [user.id]
  );

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-md px-5 py-6">
        <h1 className="font-title text-2xl font-semibold">Tu cuenta</h1>
        <dl className="mt-5 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
          <dt className="text-muted">Nombre</dt>
          <dd>{user.name}</dd>
          <dt className="text-muted">Alias público</dt>
          <dd>{user.alias ?? user.name}</dd>
          <dt className="text-muted">Celular</dt>
          <dd>{user.phoneNumber ?? "Sin confirmar"}</dd>
        </dl>

        <h2 className="mt-8 font-title text-lg font-semibold">Sesiones abiertas</h2>
        <p className="mt-1 text-sm text-muted">
          Si ves una que no reconoces, ciérrala y cambia tu contraseña.
        </p>
        <ul data-testid="sesiones" className="mt-3 flex flex-col gap-2">
          {sessions.map((s) => {
            const actual = s.id === session?.session.id;
            return (
              <li key={s.id} className="flex items-center justify-between gap-3 rounded-2xl bg-white p-4 text-sm">
                <span>
                  <span className="font-medium">{describeDevice(s.userAgent)}</span>
                  <span className="block text-muted">
                    Desde el {fecha.format(s.createdAt)}
                    {actual && " · esta"}
                  </span>
                </span>
                {!actual && <RevokeButton sessionId={s.id} />}
              </li>
            );
          })}
        </ul>

        <p className="mt-8 text-sm">
          <Link href="/recuperar" className="text-brand underline">
            Cambiar mi contraseña
          </Link>
        </p>
      </main>
    </>
  );
}
