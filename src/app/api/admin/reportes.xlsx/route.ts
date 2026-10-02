import { NextResponse } from "next/server";
import { currentAdmin } from "@/lib/session";
import { businessReport, parsePeriod } from "@/features/reports/queries";
import { reporteExcel } from "@/features/reports/excel";

// El archivo lleva la misma comprobación de rol que la pantalla: sin esto,
// cualquiera con la dirección se llevaría las cifras del negocio.
export async function GET(request: Request) {
  const admin = await currentAdmin();
  if (!admin) return new NextResponse("No encontrado", { status: 404 });

  const period = parsePeriod(new URL(request.url).searchParams);
  const archivo = await reporteExcel(await businessReport(period), period);

  return new NextResponse(new Uint8Array(archivo), {
    headers: {
      "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "content-disposition": `attachment; filename="2venta-reporte-${period.desde}-a-${period.hasta}.xlsx"`,
    },
  });
}
