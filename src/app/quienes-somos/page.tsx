import type { Metadata } from "next";
import { AppHeader } from "@/components/AppHeader";
import { Volver } from "@/components/Volver";
import { CORREO_AYUDA } from "@/lib/contacto";

export const metadata: Metadata = {
  title: "Quiénes somos · 2venta",
};

/**
 * Fila 80 de Catalina (D-133). El texto lo eligió Nicolás: habla como tienda en
 * línea, no como «un grupo de jóvenes».
 */
export default function QuienesSomos() {
  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-2xl px-5 py-6">
        <Volver href="/" />
        <h1 className="mt-4 font-title text-2xl font-semibold">Quiénes somos</h1>
        <div className="mt-5 flex flex-col gap-4 rounded-2xl bg-white p-6 text-ink2 shadow-xs ring-1 ring-line">
          <p>2venta es una tienda en línea de artículos usados en Bogotá.</p>
          <p>
            Aquí compras y vendes sin miedo a que te tumben: cada artículo tiene un video
            grabado por quien lo vende, y tu plata queda guardada hasta que confirmes que
            te llegó.
          </p>
          <p>
            Por ahora atendemos Bogotá y los municipios vecinos, con ropa, artículos para
            niños y tecnología.
          </p>
          <p>
            ¿Tienes una duda o algo salió mal? Escríbenos a{" "}
            <a href={`mailto:${CORREO_AYUDA}`} className="font-medium text-brand underline">
              {CORREO_AYUDA}
            </a>
            .
          </p>
        </div>
      </main>
    </>
  );
}
