import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * WhatsApp Cloud (Meta) para los códigos de verificación (D-117).
 *
 * Solo lo que no depende de la base ni del proceso: armar el mensaje, llamar a la
 * API, comprobar la firma de los avisos y leerlos. `src/lib/sms.ts` decide cuándo se
 * usa; `src/app/api/whatsapp/webhook` recibe los avisos de entrega.
 *
 * IMPORTANT: el token y el secreto de la app viven en variables de entorno (en la
 * nube, en el secreto `<entorno>/whatsapp` de Secrets Manager). Nunca en el código
 * ni en el repositorio.
 */

const VERSION_API = process.env.WHATSAPP_API_VERSION ?? "v23.0";
/** La plantilla aprobada en Meta: categoría «Authentication», botón «Copiar código». */
const PLANTILLA = process.env.WHATSAPP_PLANTILLA ?? "codigo_verificacion";
const IDIOMA = process.env.WHATSAPP_IDIOMA ?? "es";

export function whatsappConfigurado(): boolean {
  return Boolean(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
}

/** `+573004128805` → `573004128805`: Meta los quiere en E.164 sin el «+». */
export function aDestinoMeta(celular: string): string {
  return celular.replace(/\D/g, "");
}

/**
 * El cuerpo del envío de una plantilla de autenticación con botón «Copiar código».
 * Meta pide el código dos veces: en el texto y en el botón.
 */
export function mensajeDeCodigo(celular: string, codigo: string) {
  return {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: aDestinoMeta(celular),
    type: "template",
    template: {
      name: PLANTILLA,
      language: { code: IDIOMA },
      components: [
        { type: "body", parameters: [{ type: "text", text: codigo }] },
        {
          type: "button",
          sub_type: "url",
          index: "0",
          parameters: [{ type: "text", text: codigo }],
        },
      ],
    },
  };
}

export class ErrorDeWhatsApp extends Error {
  constructor(
    message: string,
    readonly codigoMeta?: number,
  ) {
    super(message);
  }
}

/** Envía el código y devuelve el id del mensaje de Meta (`wamid…`). */
export async function enviarCodigoPorWhatsApp(celular: string, codigo: string): Promise<string> {
  const res = await fetch(
    `https://graph.facebook.com/${VERSION_API}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(mensajeDeCodigo(celular, codigo)),
      signal: AbortSignal.timeout(10_000),
    },
  );
  const cuerpo = (await res.json().catch(() => null)) as
    | { messages?: { id: string }[]; error?: { message?: string; code?: number } }
    | null;
  const id = cuerpo?.messages?.[0]?.id;
  if (!res.ok || !id) {
    // Sin el número ni el código: el registro no es lugar para datos de nadie.
    throw new ErrorDeWhatsApp(
      `WhatsApp rechazó el envío (${res.status}): ${cuerpo?.error?.message ?? "sin detalle"}`,
      cuerpo?.error?.code,
    );
  }
  return id;
}

/**
 * ¿El aviso viene de Meta? `X-Hub-Signature-256: sha256=<hex>` es el HMAC-SHA256
 * del cuerpo crudo con el secreto de la app. Se compara en tiempo constante.
 */
export function firmaValida(cuerpoCrudo: string, cabecera: string | null, secreto: string): boolean {
  if (!cabecera?.startsWith("sha256=") || !secreto) return false;
  const recibida = Buffer.from(cabecera.slice("sha256=".length), "hex");
  const esperada = createHmac("sha256", secreto).update(cuerpoCrudo, "utf8").digest();
  return recibida.length === esperada.length && timingSafeEqual(recibida, esperada);
}

export type EstadoDeEntrega = "sent" | "delivered" | "read" | "failed";

export type AvisoDeEstado = {
  wamid: string;
  estado: EstadoDeEntrega;
  /** Solo si falló: el código y el título que da Meta, sin datos de la persona. */
  error: string | null;
};

const ESTADOS: EstadoDeEntrega[] = ["sent", "delivered", "read", "failed"];

/** Los cambios de estado de mensajes que trae un aviso; lo demás se ignora. */
export function leerEstados(aviso: unknown): AvisoDeEstado[] {
  const salida: AvisoDeEstado[] = [];
  const entradas = (aviso as { entry?: unknown[] })?.entry;
  if (!Array.isArray(entradas)) return salida;
  for (const entrada of entradas) {
    const cambios = (entrada as { changes?: unknown[] })?.changes;
    if (!Array.isArray(cambios)) continue;
    for (const cambio of cambios) {
      const estados = (cambio as { value?: { statuses?: unknown[] } })?.value?.statuses;
      if (!Array.isArray(estados)) continue;
      for (const e of estados as {
        id?: unknown;
        status?: unknown;
        errors?: { code?: number; title?: string }[];
      }[]) {
        if (typeof e?.id !== "string" || !ESTADOS.includes(e.status as EstadoDeEntrega)) continue;
        const err = e.errors?.[0];
        salida.push({
          wamid: e.id,
          estado: e.status as EstadoDeEntrega,
          error: err ? `${err.code ?? "?"}: ${err.title ?? "sin título"}`.slice(0, 200) : null,
        });
      }
    }
  }
  return salida;
}
