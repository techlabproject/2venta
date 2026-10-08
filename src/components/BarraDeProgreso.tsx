"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Una línea delgada arriba mientras llega la pantalla siguiente (D-132). Las
 * pantallas se arman en el servidor y en un celular con datos pasan un par de
 * segundos sin que nada cambie: la persona vuelve a tocar creyendo que no le hizo
 * caso. Mercado Libre y casi toda la web hacen esto.
 *
 * Arranca al tocar un enlace interno o enviar una búsqueda, y termina cuando cambia
 * la dirección. Si la dirección nunca cambia (un enlace a la misma pantalla, un
 * error), se apaga sola a los 10 s.
 */
export function BarraDeProgreso() {
  const ruta = usePathname();
  const params = useSearchParams();
  const actual = `${ruta}?${params.toString()}`;
  const [desde, setDesde] = useState<{ clave: string; vez: number } | null>(null);
  const cargando = desde !== null && desde.clave === actual;

  useEffect(() => {
    let reloj: ReturnType<typeof setTimeout> | undefined;
    const aqui = () => {
      const u = new URL(window.location.href);
      return `${u.pathname}?${u.searchParams.toString()}`;
    };
    const arrancar = (destino: URL) => {
      if (destino.origin !== window.location.origin) return;
      const clave = `${destino.pathname}?${destino.searchParams.toString()}`;
      const desdeAqui = aqui();
      if (clave === desdeAqui) return;
      setDesde((d) => ({ clave: desdeAqui, vez: (d?.vez ?? 0) + 1 }));
      clearTimeout(reloj);
      reloj = setTimeout(() => setDesde(null), 10_000);
    };
    const alTocar = (e: MouseEvent) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const destino = new URL(a.href, window.location.href);
      if (destino.hash && destino.pathname === window.location.pathname) return;
      arrancar(destino);
    };
    const alEnviar = (e: SubmitEvent) => {
      const f = e.target as HTMLFormElement;
      if ((f.method || "get").toLowerCase() !== "get" || typeof f.action !== "string") return;
      const destino = new URL(f.action, window.location.href);
      destino.search = new URLSearchParams(
        new FormData(f) as unknown as Record<string, string>,
      ).toString();
      arrancar(destino);
    };
    document.addEventListener("click", alTocar, true);
    document.addEventListener("submit", alEnviar, true);
    return () => {
      clearTimeout(reloj);
      document.removeEventListener("click", alTocar, true);
      document.removeEventListener("submit", alEnviar, true);
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[3px]">
      <div
        key={desde?.vez ?? 0}
        className={`h-full origin-left bg-accent-on-brand ${
          cargando ? "progreso-activo" : desde ? "progreso-fin" : "opacity-0"
        }`}
      />
    </div>
  );
}
