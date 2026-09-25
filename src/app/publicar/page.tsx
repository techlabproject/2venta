import { redirect } from "next/navigation";
import { clienteActivo } from "@/lib/session";
import { getVerification } from "@/features/kyc/queries";
import { listCategories } from "@/features/catalog/queries";
import { suggestAll } from "@/features/pricing/suggest";
import { PublishForm } from "@/features/publish/PublishForm";
import { AppHeader } from "@/components/AppHeader";
import { Volver } from "@/components/Volver";
import { opcionesDeAtributos } from "@/features/configuracion/queries";

// Pantalla 1k del mockup.
export const dynamic = "force-dynamic";

export default async function Publicar() {
  // Una cuenta suspendida no llega a las pantallas que escriben.
  const user = await clienteActivo();
  if (!user.phoneNumberVerified) redirect("/verificar");

  // D-02: el vendedor verifica antes de publicar. Esta comprobación es de
  // comodidad; la que manda está dentro de la acción, en el servidor.
  const verification = await getVerification(user.id);
  if (verification?.status !== "aprobado") redirect("/vender");

  const categories = await listCategories();
  // D-24: el rango sale de ventas reales de 2venta, no de un modelo. Si no hay
  // suficientes, no se muestra nada: un promedio de dos ventas es ruido
  // presentado como consejo.
  const suggestions = await suggestAll(categories.map((c) => c.slug));

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-md px-5 py-6">
        <Volver href="/vender">Cancelar</Volver>
        <h1 className="mt-4 mb-6 font-title text-2xl font-semibold">
          Publicar artículo
        </h1>
        <PublishForm
          categories={categories}
          suggestions={suggestions}
          opciones={await opcionesDeAtributos()}
        />
      </main>
    </>
  );
}
