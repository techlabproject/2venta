import type { Metadata } from "next";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { Volver } from "@/components/Volver";
import { CORREO_AYUDA } from "@/lib/contacto";

export const metadata: Metadata = {
  title: "Ayuda · 2venta",
};

/**
 * Fila 81 de Catalina (D-133): dónde pedir ayuda. Solo correo por ahora; el número
 * que se propuso es de otra empresa (ver `src/lib/contacto.ts`).
 */
export default function Ayuda() {
  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-2xl px-5 py-6">
        <Volver href="/" />
        <h1 className="mt-4 font-title text-2xl font-semibold">¿Necesitas ayuda?</h1>
        <div className="mt-5 rounded-2xl bg-white p-6 shadow-xs ring-1 ring-line">
          <p className="text-ink2">Escríbenos y te respondemos por correo:</p>
          <a
            href={`mailto:${CORREO_AYUDA}`}
            className="mt-2 inline-block break-all font-title text-lg font-semibold text-brand underline"
          >
            {CORREO_AYUDA}
          </a>
          <p className="mt-4 text-sm text-muted">
            Cuéntanos qué pasó y, si es de una compra, el nombre del artículo.
          </p>
        </div>
        <div className="mt-4 rounded-2xl bg-white p-6 text-sm text-ink2 shadow-xs ring-1 ring-line">
          <p className="font-medium text-ink">Si es por una compra</p>
          <p className="mt-1">
            Tu plata sigue guardada hasta que confirmes que recibiste. Si algo no llegó o
            no es lo que esperabas, abre un reclamo desde el pedido en{" "}
            <Link href="/actividad" className="text-brand underline">
              Compras y ventas
            </Link>
            .
          </p>
        </div>
      </main>
    </>
  );
}
