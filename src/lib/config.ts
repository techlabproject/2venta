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
  // Los códigos salen por WhatsApp (D-117) o por SMS con Inalambria (D-124) o Twilio
  // (D-120). Cada canal
  // es opcional; en producción tiene que haber al menos uno completo (se comprueba
  // en `checkConfig`), o nadie podría registrarse.
  {
    name: "WHATSAPP_TOKEN",
    purpose: "token permanente del usuario de sistema de Meta para enviar los códigos por WhatsApp",
    optional: true,
  },
  {
    name: "WHATSAPP_PHONE_NUMBER_ID",
    purpose: "id del número de WhatsApp Business desde el que salen los códigos",
    optional: true,
  },
  {
    name: "WHATSAPP_APP_SECRET",
    purpose: "secreto de la app de Meta: firma de los avisos de entrega de WhatsApp",
    optional: true,
  },
  {
    name: "WHATSAPP_VERIFY_TOKEN",
    purpose: "clave con la que Meta verifica la dirección del webhook de WhatsApp",
    optional: true,
    check: secret,
  },
  {
    name: "INALAMBRIA_TOKEN",
    purpose: "clave de la API de Inalambria Express para enviar los códigos por SMS",
    optional: true,
  },
  {
    name: "CODIGOS_REALES_SOLO_A",
    purpose:
      "solo en desarrollo: celulares (+57…, separados por comas) a los que los códigos sí se mandan de verdad; al resto solo van al registro",
    optional: true,
  },
  {
    name: "TWILIO_ACCOUNT_SID",
    purpose: "cuenta de Twilio desde la que salen los códigos por SMS",
    optional: true,
    check: (v) => (/^AC[0-9a-f]{32}$/.test(v) ? null : "tiene que empezar por AC y tener 34 caracteres"),
  },
  {
    name: "TWILIO_AUTH_TOKEN",
    purpose: "clave de la cuenta de Twilio: envía los SMS y firma sus avisos de entrega",
    optional: true,
  },
  {
    name: "TWILIO_FROM",
    purpose: "número de Twilio desde el que salen los SMS, con + y código de país",
    optional: true,
    check: (v) => (/^\+\d{8,15}$/.test(v) ? null : "tiene que ser un número con + y código de país"),
  },
  {
    name: "TWILIO_VERIFY_SERVICE_SID",
    purpose: "servicio de Twilio Verify: Twilio genera y comprueba el código (sirve con la cuenta de prueba)",
    optional: true,
    check: (v) => (/^VA[0-9a-f]{32}$/.test(v) ? null : "tiene que empezar por VA y tener 34 caracteres"),
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

  // Un canal a medias es un canal que falla el día que se usa.
  const hay = (n: string) => Boolean(env[n]?.trim());
  // Twilio sirve con número propio (TWILIO_FROM) o con Verify
  // (TWILIO_VERIFY_SERVICE_SID); cualquiera de los dos completa el canal.
  const twilioSalida = hay("TWILIO_FROM") ? "TWILIO_FROM" : "TWILIO_VERIFY_SERVICE_SID";
  const canales = {
    WhatsApp: ["WHATSAPP_TOKEN", "WHATSAPP_PHONE_NUMBER_ID"],
    Twilio: ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", twilioSalida],
    Inalambria: ["INALAMBRIA_TOKEN"],
  };
  for (const [canal, nombres] of Object.entries(canales)) {
    const faltan = nombres.filter((n) => !hay(n));
    if (faltan.length > 0 && faltan.length < nombres.length) {
      problems.push({
        name: faltan.join(", "),
        purpose: `enviar los códigos por ${canal}`,
        problem: "el canal está a medias",
      });
    }
  }
  if (production && !Object.values(canales).some((ns) => ns.every(hay))) {
    problems.push({
      name: "INALAMBRIA_TOKEN, TWILIO_* o WHATSAPP_*",
      purpose: "enviar los códigos de verificación (SMS por Inalambria o Twilio, o WhatsApp)",
      problem: "falta al menos un canal completo",
    });
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
