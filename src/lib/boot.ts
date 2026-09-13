import { checkConfig, describeProblems } from "./config";

/**
 * Comprueba la configuración y, si falta algo, mata el proceso.
 *
 * Vive aparte de instrumentation.ts porque ese archivo se compila también para el
 * Edge Runtime, donde `process.exit` no existe y el compilador se queja. Aquí solo
 * llega el servidor de Node, por una importación dinámica detrás de la comprobación
 * de NEXT_RUNTIME.
 */
export function assertConfigOrExit(): void {
  const problems = checkConfig();
  if (problems.length === 0) return;
  console.error(`\n${describeProblems(problems)}\n`);
  process.exit(1);
}
