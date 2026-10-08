import { ButtonLink } from "./ui";
import { Arco } from "./Arco";

// Estado vacío (D-88).
//
// Un renglón gris diciendo «Todavía no has comprado nada» es cierto y es inútil:
// describe el problema y no ofrece la salida. Y es justo la pantalla que más gente
// ve al empezar, cuando todavía no ha decidido si el producto es para ella.
//
// Tres piezas, siempre las mismas: el arco de la marca para que el hueco se vea
// intencionado, una frase que diga qué va a aparecer aquí, y el camino para que
// aparezca. Sin dibujitos de cajas vacías ni «¡Vaya!».
//
// D-132: un ícono de trazo, del mismo juego que la barra inferior, dice de un
// vistazo de qué pantalla es el hueco, y flota despacio para que la pantalla no se
// vea muerta. No es un dibujo: es la misma señal que la persona ya tocó para llegar.
const ICONOS = {
  carrito: "M3 4h2l2.4 11.2a1 1 0 0 0 1 .8h8.9a1 1 0 0 0 1-.8L20 8H6.2M9 20.5h.01M17 20.5h.01",
  campana: "M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0",
  chat: "M21 11.5a8.4 8.4 0 0 1-12.2 7.5L3 21l2-5.6A8.4 8.4 0 1 1 21 11.5z",
  corazon: "M12 21s-7.5-4.7-9.3-9A5.2 5.2 0 0 1 12 6.7 5.2 5.2 0 0 1 21.3 12c-1.8 4.3-9.3 9-9.3 9z",
  bolsa: "M5 8h14l-1 12H6L5 8zM9 8V6a3 3 0 0 1 6 0v2",
} as const;

export function Vacio({
  titulo,
  children,
  accion,
  icono,
}: {
  titulo: string;
  children: React.ReactNode;
  accion?: { href: string; label: string };
  icono?: keyof typeof ICONOS;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-white p-6 text-center shadow-xs ring-1 ring-line sm:p-8">
      <Arco className="absolute -top-10 -right-10 h-32 w-32 text-brand/[0.07] sm:-top-12 sm:-right-12 sm:h-40 sm:w-40" />
      <div className="relative">
        {icono && (
          <span className="flotar mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-brand/10 text-brand">
            <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d={ICONOS[icono]} />
            </svg>
          </span>
        )}
        <p className="font-title font-semibold">{titulo}</p>
        <p className="mx-auto mt-1.5 max-w-sm text-sm text-ink2">{children}</p>
        {accion && (
          <div className="mt-5 flex justify-center">
            <ButtonLink href={accion.href} variant="outline" size="inline">
              {accion.label}
            </ButtonLink>
          </div>
        )}
      </div>
    </div>
  );
}
