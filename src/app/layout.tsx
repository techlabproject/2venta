import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "2venta",
  description: "Compra y vende de segunda mano con el pago protegido hasta que recibas.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-CO">
      <body className="mx-auto max-w-3xl px-5 py-10">{children}</body>
    </html>
  );
}
