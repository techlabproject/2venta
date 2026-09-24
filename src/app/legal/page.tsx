import type { Metadata } from "next";
import { AppHeader } from "@/components/AppHeader";
import { Volver } from "@/components/Volver";
import { ContenidoLegal } from "@/features/legal/ContenidoLegal";

export const metadata: Metadata = {
  title: "Términos y política de datos · 2venta",
};

/**
 * El mismo texto del panel de términos, como página (corrección 11).
 *
 * La experiencia es el panel; esto existe porque la política de datos tiene que
 * poder consultarse siempre (Ley 1581; art. 50 lit. d de la Ley 1480: «fácilmente
 * accesibles y disponibles para su consulta, impresión y descarga»), sin JavaScript,
 * y para mandarle un enlace al abogado.
 */
export default function Legal() {
  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-2xl px-5 py-6">
        <Volver href="/" />
        <h1 className="mt-4 mb-6 font-title text-2xl font-semibold">
          Términos y política de datos
        </h1>
        <ContenidoLegal />
      </main>
    </>
  );
}
