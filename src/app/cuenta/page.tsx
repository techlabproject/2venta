import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { currentUser } from "@/lib/session";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";
import { RevokeButton } from "@/features/auth/SessionList";
import { AppHeader } from "@/components/AppHeader";
import { Avatar } from "@/components/Avatar";
import { ButtonLink } from "@/components/ui";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { getVerification } from "@/features/kyc/queries";
import { mediaUrl } from "@/lib/media";

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

  const perfil = await query<{ avatar_path: string | null; zone: string | null; bio: string | null }>(
    `select avatar_path, zone, bio from "user" where id = $1`,
    [user.id]
  );
  const verificacion = await getVerification(user.id);
  const alias = user.alias ?? user.name;
  const foto = perfil[0]?.avatar_path ? mediaUrl(perfil[0].avatar_path) : null;

  return (
    <>
      <AppHeader />
      {/* Esta pantalla cabía en una columna de móvil y en un monitor dejaba dos
          tercios de pantalla en blanco. Lo que eres va a la izquierda; desde dónde
          entras, a la derecha (D-70). */}
      <main className="mx-auto max-w-5xl px-5 py-8">
        <h1 className="font-title text-2xl font-semibold">Tu cuenta</h1>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <section className="rounded-2xl bg-white p-6 ring-1 ring-line">
            <div className="flex items-center gap-4">
              <Avatar src={foto} name={alias} size="lg" />
              <div className="min-w-0">
                <p className="truncate font-title text-lg font-semibold">{alias}</p>
                <p className="text-sm text-muted">{perfil[0]?.zone ?? "Bogotá"}</p>
                {verificacion?.status === "aprobado" && (
                  <p className="mt-2">
                    <VerifiedBadge label="Identidad verificada" />
                  </p>
                )}
              </div>
            </div>

            {perfil[0]?.bio && <p className="mt-5 text-sm text-ink2">{perfil[0].bio}</p>}

            <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 border-t border-line pt-5 text-sm">
              <dt className="text-muted">Nombre</dt>
              <dd>{user.name}</dd>
              <dt className="text-muted">Alias público</dt>
              <dd>{alias}</dd>
              <dt className="text-muted">Celular</dt>
              <dd>{user.phoneNumber ?? "Sin confirmar"}</dd>
            </dl>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <ButtonLink href="/cuenta/editar" variant="outline" className="sm:w-auto">
                Editar tu perfil
              </ButtonLink>
              <ButtonLink href="/recuperar" variant="ghost" className="sm:w-auto">
                Cambiar tu contraseña
              </ButtonLink>
            </div>
          </section>

          <section>
            <h2 className="font-title text-lg font-semibold">Sesiones abiertas</h2>
            <p className="mt-1 text-sm text-muted">
              Si ves una que no reconoces, ciérrala y cambia tu contraseña.
            </p>
            <ul data-testid="sesiones" className="mt-3 flex flex-col gap-2">
              {sessions.map((s) => {
                const actual = s.id === session?.session.id;
                return (
                  <li
                    key={s.id}
                    className="flex items-center justify-between gap-3 rounded-2xl bg-white p-4 text-sm ring-1 ring-line"
                  >
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
          </section>
        </div>
      </main>
    </>
  );
}
