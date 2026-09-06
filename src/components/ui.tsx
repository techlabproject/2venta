import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

// Primitivas de interfaz con la marca ya aplicada. Existen para que ninguna
// pantalla vuelva a escribir colores ni radios sueltos: si algo del manual cambia,
// se cambia aquí.

const BASE =
  "inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60";

const VARIANT = {
  // El acento mostaza se reserva para la acción principal de cada pantalla.
  primary: "bg-accent text-on-accent hover:brightness-95",
  brand: "bg-brand text-cream hover:bg-brand-d",
  outline: "border border-brand/25 bg-white text-ink hover:bg-ph",
  ghost: "text-ink2 hover:bg-ph",
} as const;

type Variant = keyof typeof VARIANT;

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ComponentProps<"button"> & { variant?: Variant }) {
  return <button className={`${BASE} ${VARIANT[variant]} ${className}`} {...props} />;
}

export function ButtonLink({
  variant = "primary",
  className = "",
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={`${BASE} ${VARIANT[variant]} ${className}`} {...props} />;
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
        className="rounded-xl border border-brand/20 bg-white px-4 py-3 text-sm outline-none placeholder:text-muted focus:border-brand"
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
    <p role="alert" className="rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">
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
      <h1 className="font-title text-2xl font-semibold">{title}</h1>
      {subtitle && <p className="mt-2 text-sm text-ink2">{subtitle}</p>}
      <div className="mt-7 flex flex-col gap-4">{children}</div>
    </main>
  );
}
