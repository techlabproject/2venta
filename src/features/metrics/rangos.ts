/**
 * Las visitas se muestran en rangos y no exactas (corrección 32, decisión de
 * Nicolás con Catalina): el panel básico dice cuánto interés hay, y el detalle queda
 * para un panel más completo, posiblemente de pago, más adelante. Se siguen
 * contando exactas en la base (`listing_views`).
 */
const RANGOS: [hasta: number, texto: string][] = [
  [9, "Menos de 10"],
  [49, "10 a 50"],
  [99, "50 a 100"],
  [499, "100 a 500"],
];

export function rangoDeVisitas(visitas: number): string {
  for (const [hasta, texto] of RANGOS) if (visitas <= hasta) return texto;
  return "Más de 500";
}
