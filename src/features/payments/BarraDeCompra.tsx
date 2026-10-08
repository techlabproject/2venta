"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Price } from "@/components/Price";

/**
 * Barra fija de compra en la ficha, solo en el celular (D-132). Mercado Libre y
 * Vinted la tienen: en una ficha larga, el botón de comprar se queda arriba y quien
 * ya se decidió tiene que volver a buscarlo.
 *
 * Está mientras el botón principal no se ve —más abajo al entrar, o arriba después
 * de bajar a leer— y se esconde cuando aparece: nunca hay dos «Comprar» a la vista. Sin JavaScript se queda siempre visible, que
 * también sirve.
 */
export function BarraDeCompra({
  href,
  priceCop,
  title,
}: {
  href: string;
  priceCop: number;
  title: string;
}) {
  const [oculta, setOculta] = useState(false);

  useEffect(() => {
    const principal = document.getElementById("comprar-principal");
    if (!principal) return;
    const observador = new IntersectionObserver(
      ([e]) => setOculta(e.isIntersecting),
      { threshold: 0 },
    );
    observador.observe(principal);
    return () => observador.disconnect();
  }, []);

  return (
    <div
      data-barra-compra
      data-testid="barra-compra"
      aria-hidden={oculta || undefined}
      className={`fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-lg backdrop-blur transition-transform duration-300 ease-salida md:hidden ${
        oculta ? "pointer-events-none translate-y-full" : "translate-y-0"
      }`}
    >
      <div className="mx-auto flex max-w-lg items-center gap-3">
        <div className="min-w-0 flex-1">
          <Price cop={priceCop} size="sm" className="leading-tight" />
          <p className="truncate text-xs text-muted">{title}</p>
        </div>
        <Link
          href={href}
          tabIndex={oculta ? -1 : undefined}
          className="shrink-0 rounded-xl border border-accent-edge/50 bg-accent px-6 py-3 text-sm font-semibold text-on-accent shadow-sm transition duration-200 ease-salida active:scale-[0.97]"
        >
          Comprar
        </Link>
      </div>
    </div>
  );
}
