import Link from "next/link";
import { Logo } from "./Logo";

// Cabecera de la app. La ubicación es fija por ahora: la versión 1 es solo
// Bogotá (D-06) y la zona real del usuario llega con las cuentas, en S-01.
export function AppHeader({ zone = "Bogotá" }: { zone?: string }) {
  return (
    <header className="bg-brand text-cream">
      <div className="mx-auto flex max-w-3xl items-center gap-3 px-5 py-4">
        <Link href="/" aria-label="Ir al inicio de 2venta">
          <Logo className="h-8 w-auto" />
        </Link>
        <span className="ml-auto text-sm text-cream/80">{zone}</span>
      </div>
    </header>
  );
}
