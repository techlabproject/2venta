import { mediaUrl } from "@/lib/media";

// La tira de fotos que aportó una de las dos partes de un reclamo (S-39).
//
// Va aparte porque la usan tres pantallas que no se parecen: el pedido visto por
// quien compra, el mismo pedido visto por quien vende, y la cola de disputas.
//
// Las fotos se enseñan con su proporción intacta y no recortadas a un cuadrado:
// aquí el detalle ES el contenido —la rotura, la etiqueta, el empaque— y un recorte
// centrado esconde justo lo que alguien quiso demostrar.
export function Pruebas({
  fotos,
  de,
}: {
  fotos: { id: string; path: string }[];
  /** Quién las aportó, para que quien mira sepa de qué lado es cada prueba. */
  de: string;
}) {
  if (fotos.length === 0) return null;

  return (
    <figure className="mt-2">
      <figcaption className="text-xs text-muted">
        {fotos.length === 1 ? "Foto de " : `${fotos.length} fotos de `}
        {de}
      </figcaption>
      <ul className="mt-1.5 flex flex-wrap gap-2">
        {fotos.map((f) => (
          <li key={f.id}>
            {/* Se abre en su tamaño real: una prueba que solo se ve en miniatura
                no sirve para decidir nada. */}
            <a
              href={mediaUrl(f.path)}
              target="_blank"
              rel="noreferrer"
              className="block rounded-xl transition duration-200 ease-salida hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={mediaUrl(f.path)}
                alt={`Prueba que aportó ${de}`}
                className="h-24 w-24 rounded-xl bg-ph object-cover ring-1 ring-line"
              />
            </a>
          </li>
        ))}
      </ul>
    </figure>
  );
}
