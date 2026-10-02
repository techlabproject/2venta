"use client";

import { useEffect, useRef, useState } from "react";

/**
 * La foto de una tarjeta, con respaldo (D-130, decisión 5): si no carga, en vez del
 * ícono de imagen rota del navegador queda un recuadro neutro que dice «Sin foto».
 *
 * El error puede llegar antes de que React se conecte (la imagen viene en el HTML
 * del servidor), así que al montarse también se revisa si ya quedó rota.
 */
export function Portada({ src, className }: { src: string; className: string }) {
  const ref = useRef<HTMLImageElement>(null);
  const [rota, setRota] = useState(false);

  useEffect(() => {
    const img = ref.current;
    if (img && img.complete && img.naturalWidth === 0) setRota(true);
  }, []);

  if (rota) {
    return (
      <div className={`${className} flex flex-col items-center justify-center gap-1 text-muted`}>
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-7" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <circle cx="9" cy="10" r="1.6" />
          <path d="M21 16l-5-5-8 8" />
        </svg>
        <span className="text-xs font-medium">Sin foto</span>
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img ref={ref} src={src} alt="" className={className} onError={() => setRota(true)} />;
}
