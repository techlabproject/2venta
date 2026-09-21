"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Barra de navegación inferior (D-77, pantalla 1d del mockup).
//
// Solo en móvil: en el escritorio la navegación vive en la cabecera, que tiene
// ancho de sobra. Aquí abajo porque en un teléfono el pulgar llega abajo y no
// arriba, y la D-08 dice que el móvil manda.
//
// Es componente de cliente por una sola razón —saber en qué pantalla estás para
// marcarla— así que no importa nada que llegue a la base de datos.

const DESTINOS = [
  { href: "/", label: "Inicio", icono: Casa },
  { href: "/buscar", label: "Buscar", icono: Lupa },
  { href: "/publicar", label: "Publicar", icono: Mas, centro: true },
  { href: "/chats", label: "Chats", icono: Globo },
  { href: "/cuenta", label: "Perfil", icono: Persona },
] as const;

export function BottomNav({ sinLeer = 0 }: { sinLeer?: number }) {
  const ruta = usePathname();

  // Dentro de una conversación no hay barra (D-91). Es lo que hace cualquier app
  // de chat: ahí abajo el pulgar quiere el campo de escribir, no navegar a otra
  // parte. Y al no estar en el árbol, el hueco que reserva `globals.css` con
  // `body:has(...)` desaparece solo y el compositor llega hasta el borde.
  if (ruta.startsWith("/chat/")) return null;

  const activo = (href: string) =>
    href === "/" ? ruta === "/" : ruta === href || ruta.startsWith(`${href}/`);

  // El hueco que evita que la barra tape el final de la página lo reserva
  // globals.css con `body:has(...)`: la cabecera se dibuja antes del contenido, así
  // que un separador puesto aquí sobraría arriba en vez de faltar abajo.
  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-around px-2">
        {DESTINOS.map(({ href, label, icono: Icono, ...resto }) => {
          const aqui = activo(href);
          const centro = "centro" in resto && resto.centro;

          if (centro) {
            return (
              <li key={href} className="flex items-center">
                <Link
                  href={href}
                  aria-label="Publicar un artículo"
                  className="-mt-4 flex h-12 w-12 items-center justify-center rounded-full border border-accent-edge/50 bg-accent text-on-accent shadow-lg transition duration-200 ease-salida hover:brightness-[0.97] active:scale-90 active:shadow-md"
                >
                  <Icono />
                </Link>
              </li>
            );
          }

          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={aqui ? "page" : undefined}
                className={`relative flex flex-col items-center gap-1 rounded-lg py-2.5 text-[11px] transition duration-200 ease-salida active:scale-90 ${
                  aqui
                    ? "font-semibold text-brand"
                    : "text-muted hover:text-ink2"
                }`}
              >
                {/* El color solo no basta para decir dónde estás: quien no
                    distingue el petróleo del gris se queda sin la señal. La
                    barrita lo dice con forma además de con color. */}
                {aqui && (
                  <span
                    aria-hidden
                    className="absolute inset-x-3 top-0 h-0.5 rounded-full bg-accent"
                  />
                )}
                <span className="relative">
                  <Icono />
                  {/* El contador solo sobre «Chats», y solo si hay algo. Un cero
                      dibujado es ruido con forma de alerta. */}
                  {href === "/chats" && sinLeer > 0 && (
                    <span
                      aria-hidden
                      className="absolute -top-1 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-on-accent ring-2 ring-white"
                    >
                      {sinLeer > 9 ? "9+" : sinLeer}
                    </span>
                  )}
                </span>
                {label}
                {href === "/chats" && sinLeer > 0 && (
                  // El número de arriba es un dibujo; esto es lo que oye un lector
                  // de pantalla, y por eso dice de qué es la cifra.
                  <span className="sr-only">
                    {sinLeer === 1
                      ? "1 conversación sin leer"
                      : `${sinLeer} conversaciones sin leer`}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

// Los iconos van en trazo y heredan el color, para que marcar el destino activo
// sea un solo cambio de clase y no dos juegos de imágenes.
const TRAZO = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

function Casa() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
      <path d="M3 10.5L12 3l9 7.5" {...TRAZO} />
      <path d="M5.5 9.5V20h13V9.5" {...TRAZO} />
    </svg>
  );
}

function Lupa() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
      <circle cx="11" cy="11" r="6.5" {...TRAZO} />
      <path d="M16 16l4.5 4.5" {...TRAZO} />
    </svg>
  );
}

function Mas() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
      <path d="M12 5v14M5 12h14" {...TRAZO} strokeWidth={2.2} />
    </svg>
  );
}

function Globo() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
      <path
        d="M20.5 11.5a7.5 7.5 0 01-10.9 6.7L4 19.5l1.4-4.3A7.5 7.5 0 1120.5 11.5z"
        {...TRAZO}
      />
    </svg>
  );
}

function Persona() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
      <circle cx="12" cy="8" r="3.6" {...TRAZO} />
      <path d="M4.8 20c.9-3.5 3.7-5.4 7.2-5.4s6.3 1.9 7.2 5.4" {...TRAZO} />
    </svg>
  );
}
