import type { Metadata } from "next";
import { Suspense } from "react";
import { Poppins, Work_Sans } from "next/font/google";
import "./globals.css";
import { RastroDeNavegacion } from "@/components/RastroDeNavegacion";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-poppins",
});

const workSans = Work_Sans({
  subsets: ["latin"],
  variable: "--font-work-sans",
});

export const metadata: Metadata = {
  title: "2venta · Segunda mano, primera confianza",
  description:
    "Compra y vende usado en Bogotá con el pago guardado hasta que el producto llegue.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es-CO" className={`${poppins.variable} ${workSans.variable}`}>
      <body className="min-h-dvh">
        {children}
        {/* No dibuja nada: solo anota el recorrido para «Volver» (D-99). El
            `Suspense` lo pide `useSearchParams` y no le quita HTML a la página
            (D-87): lo único que queda dentro es este componente vacío. */}
        <Suspense fallback={null}>
          <RastroDeNavegacion />
        </Suspense>
      </body>
    </html>
  );
}
