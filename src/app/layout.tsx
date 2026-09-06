import type { Metadata } from "next";
import { Poppins, Work_Sans } from "next/font/google";
import "./globals.css";

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-CO" className={`${poppins.variable} ${workSans.variable}`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
