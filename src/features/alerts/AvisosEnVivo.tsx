"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type Ultima = { id: string; title: string; href: string; hace_ms: number } | null;

const VISTOS = "avisos-vistos";

function leerVistos(): Set<string> {
  try {
    return new Set(JSON.parse(sessionStorage.getItem(VISTOS) ?? "[]") as string[]);
  } catch {
    return new Set();
  }
}

function guardarVistos(vistos: Set<string>) {
  try {
    sessionStorage.setItem(VISTOS, JSON.stringify([...vistos].slice(-50)));
  } catch {}
}

/**
 * Pone al día el encabezado, la barra y las listas cuando a la persona le llega algo
 * (fila 73 de la revisión 4, D-131), y lo anuncia con un aviso que lleva a donde
 * pasó. Antes había que recargar para enterarse de un mensaje nuevo.
 *
 * Escucha «algo cambió» y vuelve a pedir la pantalla: los contadores salen del
 * servidor como siempre. El aviso solo muestra lo que llegó con la pantalla
 * abierta, una sola vez, y no si ya se está en esa conversación.
 */
export function AvisosEnVivo() {
  const router = useRouter();
  const ruta = usePathname();
  const rutaActual = useRef(ruta);
  const [conectado, setConectado] = useState(false);
  const [aviso, setAviso] = useState<{ title: string; href: string } | null>(null);

  useEffect(() => {
    rutaActual.current = ruta;
  }, [ruta]);

  useEffect(() => {
    const abierto = Date.now();
    let espera: ReturnType<typeof setTimeout> | undefined;
    const fuente = new EventSource("/api/avisos/eventos");
    fuente.onopen = () => setConectado(true);
    fuente.onerror = () => setConectado(false);
    fuente.addEventListener("cambio", () => {
      // Varios avisos seguidos (mensaje + notificación) se atienden con una sola
      // vuelta al servidor.
      clearTimeout(espera);
      espera = setTimeout(async () => {
        router.refresh();
        try {
          const r = await fetch("/api/avisos/ultimo", { cache: "no-store" });
          if (!r.ok) return;
          const u = (await r.json()) as Ultima;
          const vistos = leerVistos();
          if (!u || vistos.has(u.id)) return;
          // Lo que ya estaba antes de abrir esta pantalla no se anuncia como nuevo.
          if (u.hace_ms > Date.now() - abierto + 5_000) return;
          vistos.add(u.id);
          guardarVistos(vistos);
          if (u.href === rutaActual.current) return;
          setAviso({ title: u.title, href: u.href });
        } catch {}
      }, 250);
    });
    // Al volver a la pestaña, por si algo llegó mientras dormía.
    const alVolver = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    document.addEventListener("visibilitychange", alVolver);
    return () => {
      clearTimeout(espera);
      fuente.close();
      document.removeEventListener("visibilitychange", alVolver);
    };
  }, [router]);

  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(null), 8_000);
    return () => clearTimeout(t);
  }, [aviso]);

  return (
    <div
      data-testid="avisos-en-vivo"
      data-conectado={conectado ? "si" : "no"}
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 top-[4.5rem] z-40 flex justify-end md:left-auto md:right-6 md:w-96"
    >
      {aviso && (
        <div
          data-testid="aviso-en-vivo"
          role="status"
          className="pointer-events-auto flex w-full animate-subir items-center gap-3 rounded-2xl bg-white p-4 text-sm shadow-lg ring-1 ring-line"
        >
          <p className="flex-1 text-ink">{aviso.title}</p>
          <Link
            href={aviso.href}
            onClick={() => setAviso(null)}
            className="font-semibold text-brand underline"
          >
            Ver
          </Link>
          <button
            type="button"
            aria-label="Cerrar el aviso"
            onClick={() => setAviso(null)}
            className="-mr-1 rounded-full px-2 text-lg leading-none text-muted transition hover:bg-ph hover:text-ink"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
