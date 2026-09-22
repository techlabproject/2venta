"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { registrar } from "@/lib/rastro";

/** Anota cada pantalla a la que se llega, para que «Volver» sepa a dónde ir. */
export function RastroDeNavegacion() {
  const pathname = usePathname();
  const busqueda = useSearchParams().toString();

  useEffect(() => {
    registrar(busqueda ? `${pathname}?${busqueda}` : pathname);
  }, [pathname, busqueda]);

  return null;
}
