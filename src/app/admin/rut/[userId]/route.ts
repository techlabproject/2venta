import { currentAdmin } from "@/lib/session";
import { query } from "@/lib/db";

/**
 * El RUT de una persona jurídica, solo para el equipo (corrección 15).
 *
 * Vive en la base y no en el almacenamiento de fotos, que es de lectura pública:
 * trae NIT, dirección y datos del representante. Quien no es administrador recibe
 * un 404, igual que si no existiera.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ userId: string }> }) {
  const admin = await currentAdmin();
  if (!admin) return new Response("No encontrado", { status: 404 });
  const { userId } = await params;
  const rows = await query<{ rut_pdf: Buffer | null }>(
    `select rut_pdf from stores where user_id = $1`,
    [userId],
  );
  const pdf = rows[0]?.rut_pdf;
  if (!pdf) return new Response("No encontrado", { status: 404 });
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "inline; filename=rut.pdf",
      "Cache-Control": "private, no-store",
    },
  });
}
