import Link from "next/link";

// El botón de devolverse era, en las trece pantallas que lo tienen, un
// `<Link className="text-sm text-ink2 underline">`. Texto subrayado y nada más:
// sin forma, sin contorno, sin dirección, del mismo peso visual que cualquier
// enlace dentro de un párrafo. Es el control que más se usa en un teléfono y era
// el único que no parecía un control.
//
// Aquí pasa a ser un objeto: cápsula blanca con el mismo anillo `line` que las
// tarjetas, para que se lea como una pieza de la interfaz y no como una palabra
// suelta. La flecha hace el trabajo que el subrayado no hacía —decir hacia dónde
// va— y al pasar el puntero se corre dos píxeles hacia la izquierda: es el único
// movimiento del componente y cumple la D-86, porque explica la dirección en vez
// de adornar.
export function Volver({
  href,
  children = "Volver",
}: {
  href: string;
  children?: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group inline-flex w-auto items-center gap-1.5 rounded-xl border border-line bg-white py-2 pr-3.5 pl-2.5 text-sm font-medium text-ink2 shadow-xs transition duration-200 ease-salida hover:border-brand/30 hover:bg-ph hover:text-ink active:scale-[0.98] active:shadow-none"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="size-4 shrink-0 transition-transform duration-200 ease-salida group-hover:-translate-x-0.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M15 5l-7 7 7 7" />
      </svg>
      {children}
    </Link>
  );
}
