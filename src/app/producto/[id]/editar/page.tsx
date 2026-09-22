import { notFound } from "next/navigation";
import Link from "next/link";
import { activeUser } from "@/lib/session";
import { query } from "@/lib/db";
import { EditForm } from "@/features/publish/EditForms";
import { AppHeader } from "@/components/AppHeader";
import { Volver } from "@/components/Volver";

// RF-16. Editar una publicación propia.
export const dynamic = "force-dynamic";

export default async function Editar({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Una cuenta suspendida no llega a las pantallas que escriben.
  const user = await activeUser();

  const { id } = await params;
  const UUID =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID.test(id)) notFound();

  const rows = await query<{
    id: string;
    title: string;
    description: string;
    price_cop: number;
    condition: string;
    status: string;
  }>(
    `select id, title, description, price_cop, condition, status
       from listings where id = $1 and seller_id = $2`,
    [id, user.id],
  );
  const listing = rows[0];

  if (!listing) {
    // A quien no es el dueño se le decía «esto ya no está», y le bastaba un clic en
    // la ficha pública para comprobar que era mentira (ronda de usuario,
    // 2026-09-14). Se le dice la verdad, pero solo cuando la publicación ya es
    // pública: de una en revisión o rechazada no se confirma ni que exista, porque
    // ahí sí habría algo que filtrar.
    const ajena = await query<{ status: string }>(
      `select status from listings
        where id = $1 and status in ('activa','reservada','vendida')`,
      [id],
    );
    if (!ajena[0]) notFound();

    return (
      <>
        <AppHeader />
        <main className="mx-auto max-w-md px-5 py-10">
          <div className="mb-6">
            <Volver href={`/producto/${id}`} />
          </div>
          <h1 className="font-title text-2xl font-semibold">
            Esta publicación no es tuya
          </h1>
          <p className="mt-2 text-ink2">
            Solo quien publicó un artículo puede cambiarle el precio o el
            estado.
          </p>
          <p className="mt-6">
            <Link href={`/producto/${id}`} className="text-brand underline">
              Ver la publicación
            </Link>
          </p>
        </main>
      </>
    );
  }

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-md px-5 py-6">
        <Volver href={`/producto/${id}`} fijo>Volver al artículo</Volver>
        <h1 className="mt-4 font-title text-xl font-semibold">
          Editar publicación
        </h1>
        {["vendida", "retirada", "rechazada"].includes(listing.status) ? (
          // El servidor ya lo rechazaba; mostrar el formulario entero era
          // invitar a llenarlo para nada (hallazgo de QA, 2026-09-13).
          <p
            role="status"
            className="mt-4 rounded-xl bg-ph px-4 py-3 text-sm text-ink2"
          >
            Una publicación {listing.status} ya no se puede editar. Si quieres
            volver a ofrecerla, publícala de nuevo con un video actual.
          </p>
        ) : (
          <EditForm listing={listing} />
        )}
      </main>
    </>
  );
}
