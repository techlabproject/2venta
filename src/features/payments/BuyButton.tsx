import Link from "next/link";

// Comprar pasa primero por la dirección de entrega (S-06): el comprador tiene que
// ver el total con envío antes de que le cobren nada.
export function BuyButton({ listingId }: { listingId: string }) {
  return (
    <Link
      href={`/comprar/${listingId}`}
      className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-accent px-4 py-3 text-sm font-medium text-on-accent hover:brightness-95"
    >
      Comprar con pago protegido
    </Link>
  );
}
