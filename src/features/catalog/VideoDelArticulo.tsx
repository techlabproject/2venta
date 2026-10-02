"use client";

import { useEffect, useRef, useState } from "react";

/**
 * El video de la ficha (D-14). Si no carga, lo dice (D-130, decisión 5): antes el
 * reproductor se quedaba en «0:00» con el distintivo «Grabado por el vendedor», y
 * parecía que la app estaba rota. Como con la foto, el error puede llegar antes de
 * que React se conecte; al montarse se revisa si ya falló.
 */
export function VideoDelArticulo({ src, poster }: { src: string; poster: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [fallo, setFallo] = useState(false);

  useEffect(() => {
    const v = ref.current;
    // Solo `error`: `networkState` pasa por «sin fuente» un instante mientras el
    // navegador empieza a cargar, y marcaba como rotos videos que sí cargaban.
    if (v?.error) setFallo(true);
  }, []);

  if (fallo) {
    return (
      <div className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 rounded-2xl bg-ph px-6 text-center text-muted">
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-8" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="6" width="13" height="12" rx="2" />
          <path d="M16 10l5-3v10l-5-3" />
        </svg>
        <p data-testid="video-no-cargo" className="text-sm font-medium">
          El video no cargó. Intenta de nuevo más tarde.
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      <video
        ref={ref}
        data-testid="video-articulo"
        className="aspect-[4/3] w-full rounded-2xl bg-ph object-cover"
        controls
        playsInline
        preload="metadata"
        poster={poster}
        src={src}
        onError={() => setFallo(true)}
      />
      <span className="pointer-events-none absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-ink/70 px-2.5 py-1 text-[11px] font-medium text-cream backdrop-blur-sm">
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3 w-3 fill-current">
          <path d="M8 5.14v13.72a1 1 0 0 0 1.54.84l10.3-6.86a1 1 0 0 0 0-1.68L9.54 4.3A1 1 0 0 0 8 5.14Z" />
        </svg>
        Grabado por el vendedor
      </span>
    </div>
  );
}
