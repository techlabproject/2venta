import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/session";
import { listConversations } from "@/features/chat/queries";
import { AppHeader } from "@/components/AppHeader";
import { Avatar } from "@/components/Avatar";
import { Vacio } from "@/components/Vacio";
import { mediaUrl } from "@/lib/media";
import { cuandoFue } from "@/lib/tiempo";

// La bandeja de conversaciones (S-35, D-90).
//
// Antes esto era la tercera sección de `/actividad`, debajo de compras y ventas,
// mientras la barra inferior decía «Chats» y llevaba justo ahí. El chat interno es
// lo que sostiene la D-19 —los pagos por fuera se bloquean— y no tenía dónde vivir.
export const dynamic = "force-dynamic";

export default async function Chats() {
  const user = await currentUser();
  if (!user) redirect("/ingresar");

  const conversations = await listConversations(user.id);
  const sinLeer = conversations.filter((c) => c.unread).length;

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-3xl px-5 py-6">
        <div className="flex items-baseline justify-between gap-3">
          <h1 className="font-title text-2xl font-semibold">Conversaciones</h1>
          {sinLeer > 0 && (
            <p
              data-testid="sin-leer"
              className="text-sm font-medium text-accent-text"
            >
              {sinLeer === 1 ? "1 sin leer" : `${sinLeer} sin leer`}
            </p>
          )}
        </div>

        {conversations.length === 0 ? (
          <div className="mt-5">
            <Vacio
              titulo="Todavía no has hablado con nadie"
              accion={{ href: "/", label: "Ver el catálogo" }}
            >
              Las conversaciones se abren desde el artículo, escribiéndole al
              vendedor. Preguntar antes de comprar es gratis y evita casi todos
              los reclamos.
            </Vacio>
          </div>
        ) : (
          <ul
            data-testid="chats"
            className="mt-5 overflow-hidden rounded-2xl bg-white shadow-xs ring-1 ring-line"
          >
            {conversations.map((c, i) => (
              <li key={c.id} className={i > 0 ? "border-t border-line" : ""}>
                <Link
                  href={`/chat/${c.id}`}
                  aria-label={`Conversación con ${c.counterpart_alias} sobre ${c.listing_title}`}
                  className="flex items-center gap-3 px-4 py-3.5 transition duration-200 ease-salida hover:bg-ph active:bg-ph"
                >
                  <Avatar
                    src={
                      c.counterpart_avatar_path
                        ? mediaUrl(c.counterpart_avatar_path)
                        : null
                    }
                    name={c.counterpart_alias}
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span
                        className={`truncate text-sm ${c.unread ? "font-semibold text-ink" : "font-medium text-ink2"}`}
                      >
                        {c.counterpart_alias}
                      </span>
                      <time className="shrink-0 text-xs text-muted">
                        {cuandoFue(c.last_at)}
                      </time>
                    </div>

                    <p className="truncate text-xs text-muted">
                      {c.listing_title}
                      {c.listing_status === "vendida" && " · ya se vendió"}
                    </p>

                    <p
                      className={`mt-0.5 truncate text-sm ${c.unread ? "font-medium text-ink" : "text-ink2"}`}
                    >
                      {c.last_message ? (
                        <>
                          {/* Quién habló de último. Sin esto, un renglón que
                              termina con tu propio mensaje parece que espera
                              respuesta tuya. */}
                          {c.last_was_mine && (
                            <span className="text-muted">Tú: </span>
                          )}
                          {c.last_message}
                        </>
                      ) : (
                        <span className="text-muted">
                          Sin mensajes todavía. Escríbele.
                        </span>
                      )}
                    </p>
                  </div>

                  {/* El punto va al final de la fila, donde el pulgar no lo tapa, y
                      el estado ya está dicho también con el peso del texto: el color
                      solo no basta. */}
                  {c.unread && (
                    <span
                      aria-label="Sin leer"
                      role="img"
                      className="h-2.5 w-2.5 shrink-0 rounded-full bg-accent ring-2 ring-accent/25"
                    />
                  )}

                  {/* La portada del artículo, al final: ayuda a reconocer de qué se
                      hablaba, pero no compite con la cara de la persona. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={mediaUrl(c.listing_poster_path)}
                    alt=""
                    aria-hidden
                    className="hidden h-11 w-11 shrink-0 rounded-lg bg-ph object-cover sm:block"
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
