import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { releaseExpiredOrders } from "@/features/payments/release";

// D-11b: liberación automática a los siete días de la entrega registrada.
//
// Lo dispara un programador de tareas externo. La ruta va protegida con un secreto
// propio: sin él, cualquiera podría forzar la liberación de todos los pedidos que
// estén cerca del plazo.
export async function POST(request: Request) {
  const expected = process.env.CRON_SECRET ?? "";
  const given = request.headers.get("x-cron-secret") ?? "";

  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(given, "utf8");
  if (!expected || a.length !== b.length || !timingSafeEqual(a, b)) {
    return NextResponse.json({ error: "no autorizado" }, { status: 401 });
  }

  const released = await releaseExpiredOrders();
  return NextResponse.json({ liberados: released });
}
