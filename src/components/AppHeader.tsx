import Link from "next/link";
import { Logo } from "./Logo";
import { currentUser } from "@/lib/session";
import { SignOutButton } from "@/features/auth/SignOutButton";

// Cabecera de la app. La ubicación es fija por ahora: la versión 1 es solo
// Bogotá (D-06) y la zona real del usuario llega cuando haya perfil editable.
export async function AppHeader({ zone = "Bogotá" }: { zone?: string }) {
  const user = await currentUser();

  return (
    <header className="bg-brand text-cream">
      <div className="mx-auto flex max-w-3xl items-center gap-3 px-5 py-4">
        <Link href="/" aria-label="Ir al inicio de 2venta">
          <Logo className="h-8 w-auto" />
        </Link>

        <div className="ml-auto flex items-center gap-4 text-sm">
          {user ? (
            <>
              <Link href="/actividad" className="text-cream/85 underline">
                Actividad
              </Link>
              <Link href="/favoritos" className="text-cream/85 underline">
                Guardados
              </Link>
              <Link href="/avisos" className="text-cream/85 underline">
                Avisos
              </Link>
              <span data-testid="usuario">{user.alias ?? user.name}</span>
              <SignOutButton />
            </>
          ) : (
            <>
              <span className="text-cream/80">{zone}</span>
              <Link href="/bienvenida" className="font-medium underline">
                Entrar
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
