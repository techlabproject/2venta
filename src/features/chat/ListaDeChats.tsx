import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { mediaUrl } from "@/lib/media";
import { cuandoFue } from "@/lib/tiempo";
import type { ConversationSummary } from "./queries";

/**
 * Las filas de la bandeja de conversaciones (S-35). Las usan `/chats` y, con las
 * tres más recientes, «Compras y ventas» (corrección 27): la misma fila en los dos
 * sitios, para que se reconozca.
 *
 * Recibe lo que ya filtró `listConversations`, que es donde viven el control de
 * acceso y el bloqueo silencioso (corrección 22).
 */
export function ListaDeChats({
  conversations,
  testId = "chats",
}: {
  conversations: ConversationSummary[];
  testId?: string;
}) {
  return (
    <ul
      data-testid={testId}
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
  );
}
