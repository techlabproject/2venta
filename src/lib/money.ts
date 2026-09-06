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

// El mes lo formatea la aplicación y no Postgres: el contenedor de base de datos
// corre con configuración regional en inglés y devolvía "September 2026".
const monthYear = new Intl.DateTimeFormat("es-CO", {
  month: "long",
  year: "numeric",
  timeZone: "America/Bogota",
});

export function formatMonthYear(date: Date): string {
  return monthYear.format(date);
}
