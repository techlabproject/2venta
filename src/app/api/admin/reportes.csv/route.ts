import { NextResponse } from "next/server";
import { currentAdmin } from "@/lib/session";
import { businessReport, parsePeriod, toCsv } from "@/features/reports/queries";

// El archivo lleva la misma comprobación de rol que la pantalla: sin esto,
// cualquiera con la dirección se llevaría las cifras del negocio.
export async function GET(request: Request) {
  const admin = await currentAdmin();
  if (!admin) return new NextResponse("No encontrado", { status: 404 });

  const params = new URL(request.url).searchParams;
  const period = parsePeriod(params);
  const report = await businessReport(period);

  return new NextResponse(toCsv(report, period), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="2venta-${period.from
        .toISOString()
        .slice(0, 10)}.csv"`,
    },
  });
}
