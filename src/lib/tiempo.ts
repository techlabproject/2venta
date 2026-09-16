// Hora relativa para listas: «hace 5 min», «ayer», «12 sept».
//
// Una bandeja de conversaciones no se lee con fechas completas: lo que importa no
// es el día exacto sino si fue hace un rato o hace semanas. La fecha exacta sigue
// estando dentro de la conversación.

const HORA = new Intl.DateTimeFormat("es-CO", {
  hour: "numeric",
  minute: "2-digit",
  timeZone: "America/Bogota",
});

const DIA = new Intl.DateTimeFormat("es-CO", {
  day: "numeric",
  month: "short",
  timeZone: "America/Bogota",
});

const DIA_CON_ANIO = new Intl.DateTimeFormat("es-CO", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "America/Bogota",
});

const MINUTO = 60_000;
const HORA_MS = 60 * MINUTO;
const DIA_MS = 24 * HORA_MS;

export function cuandoFue(fecha: Date, ahora: Date = new Date()): string {
  const transcurrido = ahora.getTime() - fecha.getTime();

  // Un reloj desfasado o una fecha del futuro no pueden producir «hace -3 min».
  if (transcurrido < MINUTO) return "ahora";
  if (transcurrido < HORA_MS)
    return `hace ${Math.floor(transcurrido / MINUTO)} min`;
  // A partir de aquí manda el día de CALENDARIO en Bogotá, no el tiempo
  // transcurrido. A las 9 de la mañana, algo de anoche a las 11 lleva 10 horas
  // —menos de un día— y aun así es de ayer. Compararlo contra 24 horas lo mostraba
  // como una hora suelta, «11:00 p. m.», sin decir de qué día era.
  const dias = diasDeDiferencia(fecha, ahora);
  if (dias <= 0) return HORA.format(fecha);
  if (dias === 1) return "ayer";
  if (dias < 365) return DIA.format(fecha);
  return DIA_CON_ANIO.format(fecha);
}

/** Días de calendario entre dos instantes, en la zona de Bogotá. */
function diasDeDiferencia(antes: Date, despues: Date): number {
  const clave = (d: Date) =>
    new Intl.DateTimeFormat("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: "America/Bogota",
    }).format(d);
  const a = Date.parse(`${clave(antes)}T00:00:00Z`);
  const b = Date.parse(`${clave(despues)}T00:00:00Z`);
  return Math.round((b - a) / DIA_MS);
}
