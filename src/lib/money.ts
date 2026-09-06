// Los montos viven como enteros en pesos y solo se formatean al mostrarlos.
// Centralizado aquí para que ninguna pantalla invente su propio formato.
const formatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

export function formatCop(cents: number): string {
  return formatter.format(cents);
}
