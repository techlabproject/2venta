import { NextResponse } from "next/server";

// Lo consulta el balanceador o App Runner para saber si esta tarea recibe tráfico.
//
// Es un chequeo superficial a propósito: dice que el proceso está vivo y que pasó la
// comprobación de configuración al arrancar (instrumentation.ts), nada más. Si
// consultara la base de datos, una caída de Postgres haría que el balanceador
// reemplazara todas las tareas a la vez, y eso no arregla la base: solo agrega una
// segunda falla encima de la primera.
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ estado: "ok" });
}
