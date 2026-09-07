import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { currentUser } from "@/lib/session";
import { query } from "@/lib/db";
import { DraftVideoForm } from "@/features/publish/DraftVideoForm";
import { AppHeader } from "@/components/AppHeader";
import { formatCop } from "@/lib/money";

// Graba el video de un borrador de carga en lote (S-13). Todo lo demás ya está
// escrito; lo único que falta es lo que no se puede subir de un archivo.
export const dynamic = "force-dynamic";

export default async function PublicarBorrador({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect("/ingresar");

  const { id } = await params;
  const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID.test(id)) notFound();

  const rows = await query<{ title: string; price_cop: number; label: string }>(
    `select l.title, l.price_cop, c.label
       from listings l join categories c on c.slug = l.category
      where l.id = $1 and l.seller_id = $2 and l.status = 'borrador'`,
    [id, user.id]
  );
  const draft = rows[0];
  if (!draft) notFound();

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-md px-5 py-6">
        <Link href="/tienda" className="text-sm text-ink2 underline">
          Volver a la tienda
        </Link>
        <h1 className="mt-4 font-title text-xl font-semibold">{draft.title}</h1>
        <p className="mt-1 text-sm text-muted">
          {formatCop(draft.price_cop)} · {draft.label}
        </p>
        <p className="mt-4 text-sm text-ink2">
          Solo falta el video. Es lo que le permite al comprador ver que el artículo
          existe y en qué estado está, y por eso se graba aquí y no se sube.
        </p>
        <DraftVideoForm draftId={id} />
      </main>
    </>
  );
}
