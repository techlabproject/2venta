"use client";

import { useEffect, useRef, useState } from "react";

/**
 * La foto de una tarjeta, con respaldo (D-130, decisión 5): si no carga, en vez del
 * ícono de imagen rota del navegador queda un recuadro neutro que dice «Sin foto».
 *
 * Mientras llega se ve un brillo que corre, y al llegar aparece con un fundido
 * (D-132). Lo que ya estaba en caché se dibuja quieto: animar una foto que ya se
 * ve sería un parpadeo. Sin JavaScript queda el fondo gris de siempre.
 *
 * El error y la carga pueden llegar antes de que React se conecte (la imagen viene
 * en el HTML del servidor), así que al montarse se revisa en qué quedó.
 */
export function Portada({ src, className }: { src: string; className: string }) {
  const ref = useRef<HTMLImageElement>(null);
  const [estado, setEstado] = useState<"servidor" | "cargando" | "lista" | "rota">("servidor");

  useEffect(() => {
    const img = ref.current;
    if (!img) return;
    if (img.complete) {
      if (img.naturalWidth === 0) setEstado("rota");
    } else {
      setEstado("cargando");
    }
  }, []);

  if (estado === "rota") {
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
  const extra = estado === "cargando" ? " foto-cargando" : estado === "lista" ? " foto-lista" : "";
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={ref}
      src={src}
      alt=""
      loading="lazy"
      decoding="async"
      className={className + extra}
      onLoad={() => setEstado((e) => (e === "cargando" ? "lista" : e))}
      onError={() => setEstado("rota")}
    />
  );
}
