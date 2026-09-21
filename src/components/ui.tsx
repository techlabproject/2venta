import Link from "next/link";
import { Logo } from "./Logo";
import type { ComponentProps, ReactNode } from "react";

// Primitivas de interfaz con la marca ya aplicada. Existen para que ninguna
// pantalla vuelva a escribir colores ni radios sueltos: si algo del manual cambia,
// se cambia aquí.

// El botón responde al dedo antes de que el servidor conteste: se hunde al
// presionarlo (`active:scale`) y la sombra se acorta, que es lo que hace un objeto
// real al que empujas. Es la micro-interacción más barata del producto y la que
// más se nota, porque ocurre en cada toque.
const BASE =
  "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition duration-200 ease-salida active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100";

// El tamaño es una propiedad del botón, no algo que cada pantalla parchee por
// fuera. Pasar "w-auto text-xs" en className NO funciona: Tailwind resuelve el
// conflicto por el orden de la hoja de estilos, no por el del atributo, así que
// el "w-full text-sm" de aquí ganaba siempre y los botones compactos salían
// apilados y a todo el ancho (visto en la foto de /vender/metricas).
const SIZE = {
  /** El de siempre: ocupa la columna. */
  md: "w-full px-4 py-3 text-sm",
  /** Varios juntos en una fila, dentro de una tarjeta. */
  sm: "w-auto px-3 py-2 text-xs",
  /** Al lado de un campo de texto. */
  inline: "w-auto px-5 py-3 text-sm",
} as const;

const VARIANT = {
  // El acento coral se reserva para la acción principal de cada pantalla.
  // El borde no es decoración: el coral contra la crema da 2,57:1 y WCAG 1.4.11
  // pide 3:1 para el contorno de un control, así que sin él un botón principal no
  // tiene bordes visibles para quien ve poco contraste.
  primary:
    "border border-accent-edge/70 bg-accent text-on-accent shadow-sm hover:brightness-[0.97] hover:shadow-md active:shadow-xs",
  brand:
    "bg-brand text-cream shadow-sm hover:bg-brand-d hover:shadow-md active:shadow-xs",
  outline:
    "border border-line bg-white text-ink shadow-xs hover:border-brand/30 hover:bg-ph",
  ghost: "text-ink2 hover:bg-ph",
} as const;

type Variant = keyof typeof VARIANT;
type Size = keyof typeof SIZE;

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
  return (
    <button
      className={`${BASE} ${SIZE[size]} ${VARIANT[variant]} ${className}`}
      {...props}
    />
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return (
    <Link
      className={`${BASE} ${SIZE[size]} ${VARIANT[variant]} ${className}`}
      {...props}
    />
  );
}

export function Field({
  label,
  hint,
  id,
  ...props
}: ComponentProps<"input"> & { label: string; hint?: string; id: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        // El foco engorda el borde con una sombra en vez de con un ancho mayor:
        // cambiar el ancho mueve el campo un pixel y salta toda la columna.
        className="rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none transition duration-200 ease-salida placeholder:text-muted hover:border-brand/30 focus:border-brand focus:ring-3 focus:ring-brand/15"
        // Describir el campo por su pista es lo que hace que un lector de
        // pantalla la anuncie junto al campo, en vez de dejarla suelta.
        aria-describedby={hint ? `${id}-hint` : undefined}
        {...props}
      />
      {hint && (
        <p id={`${id}-hint`} className="text-xs text-muted">
          {hint}
        </p>
      )}
    </div>
  );
}

// Los mensajes de error se anuncian solos: quien navega con lector de pantalla no
// tiene por qué volver a recorrer el formulario para enterarse de que algo falló.
export function ErrorNote({ children }: { children: ReactNode }) {
  return (
    <p
      role="alert"
      className="rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger"
    >
      {children}
    </p>
  );
}

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 py-10">
      {/* El logo, y que además sea la salida.
          Las cuatro pantallas de entrada no tenían marca ni forma de volver al
          catálogo: se llegaba a ellas desde un botón y la única salida era el
          «atrás» del navegador. Quien cae aquí desde un enlace quedaba encerrado
          en un formulario sin saber de qué sitio es (ronda de diseño, Sol,
          2026-09-20). */}
      <Link
        href="/"
        aria-label="Volver al inicio de 2venta"
        className="mb-8 inline-flex w-fit rounded-lg text-brand transition duration-200 ease-salida hover:opacity-80"
      >
        <Logo className="h-8 w-auto" />
      </Link>
      <h1 className="font-title text-2xl font-semibold">{title}</h1>
      {subtitle && <p className="mt-2 text-sm text-ink2">{subtitle}</p>}
      <div className="mt-7 flex flex-col gap-4">{children}</div>
    </main>
  );
}
