"use client";

import { useEffect, useState } from "react";

/**
 * Cuenta hacia atrás los segundos que faltan para poder pedir otro código (30 entre
 * envíos, pedido de Nicolás). El servidor también lo exige; esto solo evita tocar un
 * botón que va a decir que no.
 */
export function useCuentaRegresiva(inicial: number): [number, (s: number) => void] {
  const [hasta, setHasta] = useState(() => Date.now() + inicial * 1000);
  const [ahora, setAhora] = useState(() => Date.now());
  useEffect(() => {
    if (hasta <= ahora) return;
    const t = setInterval(() => setAhora(Date.now()), 250);
    return () => clearInterval(t);
  }, [hasta, ahora]);
  return [
    Math.max(0, Math.ceil((hasta - ahora) / 1000)),
    (segundos) => {
      setAhora(Date.now());
      setHasta(Date.now() + segundos * 1000);
    },
  ];
}
