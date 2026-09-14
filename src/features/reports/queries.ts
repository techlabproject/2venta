import { query } from "@/lib/db";

export type Period = { from: Date; to: Date };

export type BusinessReport = {
  sales: number;
  gmvCop: number;
  commissionCop: number;
  averageTicketCop: number;
  disputes: number;
  /** Porcentaje de ventas que terminaron en reclamo. Es la cifra que importa. */
  disputeRate: number | null;
  refunded: number;
  byCategory: Array<{ label: string; sales: number; gmvCop: number; commissionCop: number }>;
};

/**
 * Las cifras del negocio en un periodo (RF-42).
 *
 * De todas, la tasa de disputa es la única que dice si el producto está
 * funcionando. El objetivo escrito es menos del 5%: si sube, significa que la
 * verificación previa no está sirviendo, que es la apuesta entera del negocio.
 */
export async function businessReport(period: Period): Promise<BusinessReport> {
  const rows = await query<{
    sales: string;
    gmv: string | null;
    commission: string | null;
    disputes: string;
    refunded: string;
  }>(
    `select
       count(*) filter (where o.status in ('liberado','reembolsado'))::text as sales,
       coalesce(sum(o.subtotal_cop) filter (where o.status = 'liberado'), 0)::text as gmv,
       coalesce(sum(o.commission_cop) filter (where o.status = 'liberado'), 0)::text as commission,
       count(*) filter (where exists (select 1 from claims c where c.order_id = o.id))::text as disputes,
       count(*) filter (where o.status = 'reembolsado')::text as refunded
     from orders o
    where o.created_at >= $1 and o.created_at < $2`,
    [period.from, period.to]
  );

  const byCategory = await query<{
    label: string;
    sales: string;
    gmv: string;
    commission: string;
  }>(
    // La comisión es del PEDIDO, no de la línea, y aquí hay una fila por línea:
    // sumarla tal cual la multiplicaba por el número de artículos. Un pedido de
    // dos cosas reportaba el doble de comisión que el resumen de arriba, que sí
    // suma por pedido (hallazgo de la ronda de usuario, 2026-09-14).
    //
    // Se reparte a prorrata del precio de cada línea: es lo único que hace que la
    // suma de las categorías vuelva a dar la comisión del pedido cuando un pedido
    // cruza dos categorías.
    `select c.label,
            count(distinct o.id)::text as sales,
            coalesce(sum(i.price_cop), 0)::text as gmv,
            coalesce(
              round(sum(o.commission_cop::numeric * i.price_cop / o.subtotal_cop)), 0
            )::text as commission
       from orders o
       join order_items i on i.order_id = o.id
       join listings l    on l.id = i.listing_id
       join categories c  on c.slug = l.category
      where o.status = 'liberado'
        and o.created_at >= $1 and o.created_at < $2
      group by c.label, c.position
      order by c.position`,
    [period.from, period.to]
  );

  const r = rows[0];
  const sales = Number(r.sales);
  const gmvCop = Number(r.gmv ?? 0);
  const disputes = Number(r.disputes);

  return {
    sales,
    gmvCop,
    commissionCop: Number(r.commission ?? 0),
    // Sin ventas no hay promedio. Dividir por cero daría un número inventado.
    averageTicketCop: sales === 0 ? 0 : Math.round(gmvCop / sales),
    disputes,
    disputeRate: sales === 0 ? null : Math.round((disputes / sales) * 1000) / 10,
    refunded: Number(r.refunded),
    byCategory: byCategory.map((c) => ({
      label: c.label,
      sales: Number(c.sales),
      gmvCop: Number(c.gmv),
      commissionCop: Number(c.commission),
    })),
  };
}

/** Lee el periodo de la dirección; por defecto, los últimos 30 días. */
export function parsePeriod(params: URLSearchParams): Period {
  const parse = (raw: string | null): Date | null => {
    if (!raw) return null;
    const d = new Date(`${raw}T00:00:00-05:00`);
    return Number.isNaN(d.getTime()) ? null : d;
  };

  const to = parse(params.get("hasta")) ?? new Date();
  const from = parse(params.get("desde")) ?? new Date(to.getTime() - 30 * 86_400_000);

  // Fechas al revés se ordenan solas en vez de devolver un periodo vacío.
  return from <= to ? { from, to } : { from: to, to: from };
}

export function toCsv(report: BusinessReport, period: Period): string {
  const f = (d: Date) => d.toISOString().slice(0, 10);
  const lines = [
    `2venta — reporte de negocio`,
    `Desde,${f(period.from)}`,
    `Hasta,${f(period.to)}`,
    "",
    "Métrica,Valor",
    `Ventas completadas,${report.sales}`,
    `Volumen transado (COP),${report.gmvCop}`,
    `Comisiones cobradas (COP),${report.commissionCop}`,
    `Ticket promedio (COP),${report.averageTicketCop}`,
    `Reembolsos,${report.refunded}`,
    `Disputas,${report.disputes}`,
    `Tasa de disputa (%),${report.disputeRate ?? ""}`,
    "",
    "Categoría,Ventas,Volumen (COP),Comisiones (COP)",
    ...report.byCategory.map(
      (c) => `${c.label},${c.sales},${c.gmvCop},${c.commissionCop}`
    ),
  ];
  return lines.join("\n");
}
