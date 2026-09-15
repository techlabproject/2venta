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
export function Vacio({
  titulo,
  children,
  accion,
}: {
  titulo: string;
  children: React.ReactNode;
  accion?: { href: string; label: string };
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-white p-6 text-center shadow-xs ring-1 ring-line sm:p-8">
      <Arco className="absolute -top-10 -right-10 h-32 w-32 text-brand/[0.07] sm:-top-12 sm:-right-12 sm:h-40 sm:w-40" />
      <div className="relative">
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
