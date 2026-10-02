import ExcelJS from "exceljs";
import type { BusinessReport, Period } from "./queries";

/**
 * El reporte de negocio como Excel (fila 54, D-129). Antes era un CSV separado por
 * comas: el Excel en español espera punto y coma, así que todo quedaba en una sola
 * columna y las tildes salían dañadas. Ahora son dos hojas con encabezados en
 * negrita, montos como números con formato de pesos (se pueden sumar) y columnas
 * anchas. La fecha va en el nombre del archivo y arriba del resumen.
 */
const PESOS = '"$" #,##0';
const ENCABEZADO: Partial<ExcelJS.Style> = {
  font: { bold: true, color: { argb: "FFF2F5F3" } },
  fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F4C4A" } },
};

// El periodo son días de Bogotá (`desde` y `hasta`, incluidos): se escriben tal cual,
// sin volver a pasarlos por una zona horaria.
const dia = (aaaammdd: string) =>
  new Intl.DateTimeFormat("es-CO", { timeZone: "UTC", day: "numeric", month: "long", year: "numeric" }).format(
    new Date(`${aaaammdd}T12:00:00Z`),
  );

export async function reporteExcel(report: BusinessReport, period: Period): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "2venta";

  const resumen = wb.addWorksheet("Resumen");
  resumen.columns = [{ width: 30 }, { width: 22 }];
  resumen.addRow(["Reporte de negocio de 2venta"]).font = { bold: true, size: 14 };
  resumen.addRow([`Del ${dia(period.desde)} al ${dia(period.hasta)}`]);
  resumen.addRow([]);
  const cabeza = resumen.addRow(["Métrica", "Valor"]);
  cabeza.eachCell((c) => Object.assign(c, { style: { ...c.style, ...ENCABEZADO } }));

  const filas: Array<[string, number | null, string?]> = [
    // Lo mismo que la pantalla («12 de 14»): ventas que terminaron en venta y, aparte,
    // todos los pedidos cerrados, reembolsos incluidos (Luna, fila 54).
    ["Ventas completadas", report.settled],
    ["Pedidos cerrados (con reembolsos)", report.sales],
    ["Volumen transado", report.gmvCop, PESOS],
    ["Comisiones cobradas", report.commissionCop, PESOS],
    ["Ticket promedio", report.averageTicketCop, PESOS],
    ["Reembolsos", report.refunded],
    ["Disputas", report.disputes],
    ["Tasa de disputa", report.disputeRate === null ? null : report.disputeRate / 100, "0.0%"],
  ];
  for (const [nombre, valor, formato] of filas) {
    const fila = resumen.addRow([nombre, valor]);
    if (formato) fila.getCell(2).numFmt = formato;
  }

  const categorias = wb.addWorksheet("Por categoría");
  categorias.columns = [
    { header: "Categoría", width: 26 },
    { header: "Ventas", width: 12 },
    { header: "Volumen", width: 18, style: { numFmt: PESOS } },
    { header: "Comisiones", width: 18, style: { numFmt: PESOS } },
  ];
  categorias.getRow(1).eachCell((c) => Object.assign(c, { style: { ...c.style, ...ENCABEZADO } }));
  for (const c of report.byCategory) categorias.addRow([c.label, c.sales, c.gmvCop, c.commissionCop]);
  categorias.views = [{ state: "frozen", ySplit: 1 }];

  return Buffer.from(await wb.xlsx.writeBuffer());
}
