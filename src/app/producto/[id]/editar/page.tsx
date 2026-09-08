import { notFound } from "next/navigation";
import Link from "next/link";
import { activeUser } from "@/lib/session";
import { query } from "@/lib/db";
import { EditForm } from "@/features/publish/EditForms";
import { AppHeader } from "@/components/AppHeader";

// RF-16. Editar una publicación propia.
export const dynamic = "force-dynamic";

export default async function Editar({ params }: { params: Promise<{ id: string }> }) {
  // Una cuenta suspendida no llega a las pantallas que escriben.
  const user = await activeUser();

  const { id } = await params;
  const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
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
    [id, user.id]
  );
  const listing = rows[0];
  // Sin pantalla para quien no es el dueño, y sin pista de que exista.
  if (!listing) notFound();

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-md px-5 py-6">
        <Link href={`/producto/${id}`} className="text-sm text-ink2 underline">
          Volver al artículo
        </Link>
        <h1 className="mt-4 font-title text-xl font-semibold">Editar publicación</h1>
        <EditForm listing={listing} />
      </main>
    </>
  );
}
