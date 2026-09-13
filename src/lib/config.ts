/**
 * Comprobación de la configuración al arrancar.
 *
 * Sin esto, una variable que falta se descubre tarde y mal. El secreto del código de
 * entrega revienta la primera vez que alguien compra en persona, no al arrancar. El
 * de los webhooks hace que ninguna firma valide, y el síntoma es que los pagos no se
 * confirman, sin ninguna pista de por qué.
 *
 * Eso muerde justo el día del despliegue, que es el peor día para descubrirlo.
 */

import { APP_ENVS, isProduction } from "./env";

type Requirement = {
  name: string;
  /** Para qué sirve, en una línea. Es lo que se le muestra a quien la tiene que poner. */
  purpose: string;
  /** Solo obligatoria en producción. */
  productionOnly?: boolean;
  /** Puede faltar; si está, se comprueba igual. */
  optional?: boolean;
  /** Comprobación extra sobre el valor, más allá de que exista. */
  check?: (value: string) => string | null;
};

const MIN_SECRET_LENGTH = 32;

/** Un secreto corto no protege nada; se comprueba el largo, no solo que exista. */
function secret(value: string): string | null {
  return value.length < MIN_SECRET_LENGTH
    ? `tiene ${value.length} caracteres y necesita al menos ${MIN_SECRET_LENGTH}`
    : null;
}

export const REQUIREMENTS: Requirement[] = [
  {
    name: "APP_ENV",
    purpose: "qué proveedores son reales y qué puentes de prueba existen",
    // Si falta se deduce de la compilación (ver env.ts); si está, tiene que ser válida.
    optional: true,
    check: (v) =>
      (APP_ENVS as readonly string[]).includes(v)
        ? null
        : `vale "${v}" y solo admite ${APP_ENVS.map((e) => `"${e}"`).join(" o ")}`,
  },
  {
    name: "DATABASE_URL",
    purpose: "conexión a Postgres",
    check: (v) => (v.startsWith("postgres") ? null : "no parece una URL de Postgres"),
  },
  { name: "BETTER_AUTH_SECRET", purpose: "firma de las sesiones", check: secret },
  {
    name: "BETTER_AUTH_URL",
    purpose: "dirección pública de la aplicación, para las redirecciones",
    productionOnly: true,
    check: (v) =>
      v.startsWith("https://") ? null : "en producción tiene que empezar por https://",
  },
  { name: "PHONE_CODE_SECRET", purpose: "cifrado del código de verificación por celular", check: secret },
  { name: "PICKUP_CODE_SECRET", purpose: "cifrado del código de entrega presencial", check: secret },
  { name: "KYC_WEBHOOK_SECRET", purpose: "firma de los avisos del proveedor de identidad", check: secret },
  { name: "PAYMENTS_WEBHOOK_SECRET", purpose: "firma de los avisos del proveedor de pagos", check: secret },
  { name: "SHIPPING_WEBHOOK_SECRET", purpose: "firma de los avisos de la transportadora", check: secret },
  { name: "CRON_SECRET", purpose: "autoriza la tarea de liberación automática de pagos" },
  { name: "AWS_REGION", purpose: "región del bucket de archivos" },
  { name: "S3_BUCKET", purpose: "bucket donde viven videos y fotos" },
  {
    name: "MEDIA_BASE_URL",
    purpose: "dirección pública desde la que se sirven videos y fotos",
    check: (v) => (/^https?:\/\//.test(v) ? null : "tiene que ser una URL completa"),
  },
  {
    name: "S3_ENDPOINT",
    purpose: "endpoint del bucket cuando no es S3 de verdad (MinIO en el portátil)",
    optional: true,
  },
  {
    name: "S3_PUBLIC_ENDPOINT",
    purpose: "el mismo endpoint como lo ve el navegador, para firmar las subidas",
    optional: true,
  },
  { name: "SQS_QUEUE_URL", purpose: "cola del trabajo en segundo plano (liberaciones, avisos)" },
  {
    name: "SQS_ENDPOINT",
    purpose: "endpoint de la cola cuando no es SQS de verdad (ElasticMQ en el portátil)",
    optional: true,
  },
  {
    name: "MEDIACONVERT_ROLE_ARN",
    purpose: "rol con el que MediaConvert lee y escribe el bucket; sin él, el video no se convierte",
    optional: true,
  },
  {
    name: "SMS_PROVIDER_TOKEN",
    purpose: "envío real de los códigos por SMS (en desarrollo salen por consola)",
    productionOnly: true,
  },
];

/** Un APP_ENV inválido lo reporta la lista, no una excepción antes de la lista. */
function productionSafely(env: Record<string, string | undefined>): boolean {
  try {
    return isProduction(env);
  } catch {
    return false;
  }
}

export type ConfigProblem = { name: string; purpose: string; problem: string };

/**
 * Devuelve TODOS los problemas, no el primero.
 *
 * Detenerse en el primero obliga a un ciclo de prueba y error: se agrega uno, se
 * reinicia, falla el siguiente.
 */
export function checkConfig(
  env: Record<string, string | undefined> = process.env,
  production = productionSafely(env)
): ConfigProblem[] {
  const problems: ConfigProblem[] = [];

  for (const req of REQUIREMENTS) {
    if (req.productionOnly && !production) continue;

    const value = env[req.name];
    if (!value || value.trim() === "") {
      if (!req.optional) {
        problems.push({ name: req.name, purpose: req.purpose, problem: "falta" });
      }
      continue;
    }

    const detail = req.check?.(value);
    if (detail) problems.push({ name: req.name, purpose: req.purpose, problem: detail });
  }

  return problems;
}

export function describeProblems(problems: ConfigProblem[]): string {
  const lines = problems.map((p) => `  ${p.name} — ${p.problem}. Sirve para: ${p.purpose}.`);
  return [
    `La configuración tiene ${problems.length === 1 ? "un problema" : `${problems.length} problemas`}:`,
    "",
    ...lines,
    "",
    "Se comprueban todas de una vez a propósito, para no tener que arreglarlas de a una.",
    "En desarrollo van en .env.local. Ver db/LEEME.md y GOOGLE.md.",
  ].join("\n");
}
