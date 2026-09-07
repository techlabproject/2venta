import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/session";
import { getVerification } from "@/features/kyc/queries";
import { listCategories } from "@/features/catalog/queries";
import { PublishForm } from "@/features/publish/PublishForm";
import { AppHeader } from "@/components/AppHeader";

// Pantalla 1k del mockup.
export const dynamic = "force-dynamic";

export default async function Publicar() {
  const user = await currentUser();
  if (!user) redirect("/ingresar");
  if (!user.phoneNumberVerified) redirect("/verificar");

  // D-02: el vendedor verifica antes de publicar. Esta comprobación es de
  // comodidad; la que manda está dentro de la acción, en el servidor.
  const verification = await getVerification(user.id);
  if (verification?.status !== "aprobado") redirect("/vender");

  const categories = await listCategories();

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-md px-5 py-6">
        <Link href="/" className="text-sm text-ink2 underline">
          Cancelar
        </Link>
        <h1 className="mt-4 mb-6 font-title text-2xl font-semibold">Publicar artículo</h1>
        <PublishForm categories={categories} />
      </main>
    </>
  );
}
