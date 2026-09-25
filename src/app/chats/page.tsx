import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/session";
import { listConversations } from "@/features/chat/queries";
import { AppHeader } from "@/components/AppHeader";
import { Vacio } from "@/components/Vacio";
import { Volver } from "@/components/Volver";
import { ListaDeChats } from "@/features/chat/ListaDeChats";

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
        <div className="mb-4">
          <Volver href="/" />
        </div>
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
          <ListaDeChats conversations={conversations} />
        )}
      </main>
    </>
  );
}
