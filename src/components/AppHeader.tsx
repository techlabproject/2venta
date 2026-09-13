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
      {/* En un celular los seis enlaces no caben en una fila junto al logo: la
          barra se desbordaba y la página quedaba más ancha que la pantalla
          (prueba visual, 2026-09-13). Se dejan bajar a una segunda fila. */}
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-2 px-5 py-4">
        <Link href="/" aria-label="Ir al inicio de 2venta">
          <Logo className="h-8 w-auto" />
        </Link>

        <div className="ml-auto flex w-full flex-wrap items-center gap-x-4 gap-y-1 text-sm sm:w-auto">
          {user ? (
            <>
              {/* «Vender» va primero y en mostaza: es la acción que hace crecer el
                  catálogo, y sin ella un vendedor no encontraba ni dónde publicar
                  ni sus propias publicaciones. */}
              <Link
                href="/vender"
                className="rounded-full bg-accent px-3 py-1 font-medium text-on-accent"
              >
                Vender
              </Link>
              <Link href="/carrito" className="text-cream/85 underline">
                Carrito
              </Link>
              <Link href="/actividad" className="text-cream/85 underline">
                Actividad
              </Link>
              <Link href="/favoritos" className="text-cream/85 underline">
                Guardados
              </Link>
              <Link href="/avisos" className="text-cream/85 underline">
                Avisos
              </Link>
              <Link href="/cuenta" data-testid="usuario" className="underline">
                {user.alias ?? user.name}
              </Link>
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
