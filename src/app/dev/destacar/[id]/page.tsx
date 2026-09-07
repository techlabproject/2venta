import { notFound } from "next/navigation";
import { query } from "@/lib/db";
import { DevDestacarControls } from "@/features/promotions/DevControls";
import { formatCop } from "@/lib/money";
import { PROMOTION_DAYS } from "@/features/promotions/config";

// Pantalla del proveedor de pagos de prueba para el destacado. No existe en
// producción.
export const dynamic = "force-dynamic";

export default async function DevDestacar({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (process.env.NODE_ENV === "production") notFound();
  const { id } = await params;

  const rows = await query<{ price_cop: number; provider_ref: string; listing_id: string }>(
    `select price_cop, provider_ref, listing_id from promotions where id = $1`,
    [id]
  );
  const promotion = rows[0];
  if (!promotion) notFound();

  return (
    <main className="mx-auto max-w-md px-5 py-10">
      <p className="rounded-xl bg-warn/10 px-4 py-3 text-sm text-warn">
        Proveedor de pagos de prueba. No existe en producción.
      </p>
      <h1 className="mt-6 font-title text-2xl font-semibold">Destacar publicación</h1>
      <p className="mt-2 text-sm text-ink2">
        {formatCop(promotion.price_cop)} por {PROMOTION_DAYS} días.
      </p>
      <DevDestacarControls
        reference={promotion.provider_ref}
        listingId={promotion.listing_id}
      />
    </main>
  );
}
