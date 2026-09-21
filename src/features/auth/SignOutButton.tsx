"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function SignOutButton({
  className = "text-sm text-cream/80 underline",
}: {
  className?: string;
}) {
  const router = useRouter();
  // Salir es una petición de red, y sin esto el botón aceptaba tres clics
  // seguidos mientras la primera todavía iba en camino.
  const [saliendo, setSaliendo] = useState(false);
  return (
    <button
      type="button"
      className={className}
      disabled={saliendo}
      aria-busy={saliendo}
      onClick={async () => {
        if (saliendo) return;
        setSaliendo(true);
        await authClient.signOut();
        // Invalidar antes de navegar: al revés, «/» podía servirse de la copia
        // en caché tomada CON sesión y dibujar a la persona como si siguiera
        // dentro justo después de salir.
        router.refresh();
        router.push("/");
      }}
    >
      {saliendo ? "Saliendo…" : "Salir"}
    </button>
  );
}
