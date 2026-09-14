import Link from "next/link";
import { Logo } from "./Logo";
import { Avatar } from "./Avatar";
import { currentUser } from "@/lib/session";
import { query } from "@/lib/db";
import { mediaUrl } from "@/lib/media";
import { SignOutButton } from "@/features/auth/SignOutButton";

// Cabecera de la app. La ubicación es fija por ahora: la versión 1 es solo
// Bogotá (D-06) y la zona real del usuario llega cuando haya perfil editable.
//
// Antes era una fila de seis enlaces subrayados, todos con el mismo peso, que en un
// celular se partía en dos renglones. Ahora son tres grupos —la marca, lo de cada
// día y quién eres— y en pantalla angosta los dos últimos caben detrás de un solo
// botón (D-72). El desplegable es un <details> y no un componente de cliente a
// propósito: funciona sin JavaScript y se cierra solo al navegar.

const ENLACES = [
  { href: "/", label: "Explorar" },
  { href: "/carrito", label: "Carrito" },
  { href: "/favoritos", label: "Guardados" },
  { href: "/avisos", label: "Avisos" },
];

const DEL_MENU = [
  { href: "/cuenta", label: "Tu cuenta" },
  { href: "/vender/metricas", label: "Tus publicaciones" },
  { href: "/actividad", label: "Ventas y conversaciones" },
  { href: "/cuenta/editar", label: "Editar tu perfil" },
];

const PILL =
  "rounded-full px-3 py-1.5 text-sm text-cream/85 transition hover:bg-cream/15 hover:text-cream";

const ITEM = "block rounded-lg px-3 py-2 text-sm text-ink transition hover:bg-ph";

export async function AppHeader({ zone = "Bogotá" }: { zone?: string }) {
  const user = await currentUser();

  const rows = user
    ? await query<{ avatar_path: string | null }>(
        `select avatar_path from "user" where id = $1`,
        [user.id]
      )
    : [];
  const avatar = rows[0]?.avatar_path ? mediaUrl(rows[0].avatar_path) : null;
  const alias = user?.alias ?? user?.name ?? "";

  return (
    <header className="bg-brand text-cream shadow-[0_1px_0_rgba(0,0,0,0.18)]">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-5">
        <Link href="/" aria-label="Ir al inicio de 2venta" className="shrink-0">
          <Logo className="h-8 w-auto" />
        </Link>

        {user ? (
          <>
            {/* En escritorio la navegación se ve entera: para eso hay ancho. */}
            <nav aria-label="Principal" className="ml-5 hidden items-center gap-1 md:flex">
              {ENLACES.map((e) => (
                <Link key={e.href} href={e.href} className={PILL}>
                  {e.label}
                </Link>
              ))}
            </nav>

            <div className="ml-auto flex items-center gap-2">
              {/* «Vender» hace crecer el catálogo y es lo único en mostaza aquí. */}
              <Link
                href="/vender"
                className="rounded-full bg-accent px-4 py-1.5 text-sm font-semibold text-on-accent transition hover:brightness-95"
              >
                Vender
              </Link>

              <details className="group relative">
                <summary
                  data-testid="usuario"
                  aria-label={`Menú de ${alias}`}
                  className="flex cursor-pointer list-none items-center gap-2 rounded-full py-1 pl-1 pr-2 transition hover:bg-cream/15 [&::-webkit-details-marker]:hidden"
                >
                  <Avatar src={avatar} name={alias} size="sm" />
                  {/* El alias no cabe en 390 px junto al logo y a «Vender», así que
                      en pantalla angosta manda la foto; el nombre sigue anunciado
                      por el aria-label del propio botón. */}
                  <span className="hidden max-w-28 truncate text-sm sm:inline">{alias}</span>
                  <Chevron />
                  <Hamburguesa />
                </summary>

                <div className="absolute right-0 top-full z-20 mt-2 w-64 rounded-2xl border border-line bg-white p-2 text-ink shadow-xl">
                  <p className="truncate px-3 pb-2 pt-1 text-xs text-muted">
                    Estás como {alias}
                  </p>
                  <div className="md:hidden">
                    {ENLACES.map((e) => (
                      <Link key={e.href} href={e.href} className={ITEM}>
                        {e.label}
                      </Link>
                    ))}
                    <hr className="my-2 border-line" />
                  </div>
                  {DEL_MENU.map((e) => (
                    <Link key={e.href} href={e.href} className={ITEM}>
                      {e.label}
                    </Link>
                  ))}
                  <hr className="my-2 border-line" />
                  <div className="px-3 py-1">
                    <SignOutButton className="text-sm text-danger underline" />
                  </div>
                </div>
              </details>
            </div>
          </>
        ) : (
          <div className="ml-auto flex items-center gap-4">
            <span className="hidden text-sm text-cream/80 sm:inline">{zone}</span>
            <Link
              href="/bienvenida"
              className="rounded-full bg-accent px-4 py-1.5 text-sm font-semibold text-on-accent transition hover:brightness-95"
            >
              Entrar
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}

function Chevron() {
  return (
    <svg
      viewBox="0 0 12 8"
      className="hidden h-2 w-3 transition group-open:rotate-180 sm:block"
      aria-hidden
    >
      <path d="M1 1l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function Hamburguesa() {
  return (
    <svg viewBox="0 0 20 14" className="mx-1 h-3.5 w-5 sm:hidden" aria-hidden>
      <path
        d="M1 1h18M1 7h18M1 13h18"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
