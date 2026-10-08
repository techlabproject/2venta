import Link from "next/link";

/** Sin sesión se pasa por ingresar, diciendo para qué y a dónde volver. */
export function hrefDeCompra(listingId: string, signedIn: boolean): string {
  return signedIn
    ? `/comprar/${listingId}`
    : `/ingresar?motivo=comprar&volver=${encodeURIComponent(`/comprar/${listingId}`)}`;
}

// Comprar pasa primero por la dirección de entrega (S-06): el comprador tiene que
// ver el total con envío antes de que le cobren nada.
export function BuyButton({
  listingId,
  signedIn = true,
}: {
  listingId: string;
  signedIn?: boolean;
}) {
  const href = hrefDeCompra(listingId, signedIn);
  return (
    <Link
      href={href}
      id="comprar-principal"
      className="mt-4 inline-flex w-full items-center justify-center rounded-xl border border-accent-edge/50 bg-accent px-4 py-3 text-sm font-semibold text-on-accent shadow-sm transition duration-200 ease-salida hover:brightness-95 active:scale-[0.98]"
    >
      Comprar con pago protegido
    </Link>
  );
}
