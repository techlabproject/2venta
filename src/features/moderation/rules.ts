import { CONTACT_REJECTED, hasContact } from "@/features/chat/redact";
// Moderación automática al publicar (D-16).
//
// Es un filtro de primera línea, no un juez. Su trabajo es que lo evidentemente
// prohibido no llegue nunca a estar visible, y dejar el resto a la revisión humana
// cuando alguien reporte.
//
// Igual que el filtro anti-desvío, el costo de equivocarse tiene dos caras: dejar
// pasar algo ilegal es un problema legal, y rechazar una publicación legítima es
// perder un vendedor. Por eso la lista es corta y específica en vez de amplia y
// difusa: "arma" sola rechazaría "armario" y "armado".

export type ModerationVerdict =
  | { allowed: true }
  | { allowed: false; reason: string };

/**
 * Categorías prohibidas por ley o por política.
 *
 * Cada entrada lleva la explicación que se le muestra a quien publica: un rechazo
 * que solo dice "no se puede" convierte a un vendedor honesto en un ticket de
 * soporte.
 */
const FORBIDDEN: Array<{ pattern: RegExp; reason: string }> = [
  {
    pattern: /\b(arma de fuego|armas de fuego|pistola|revolver|revólver|fusil|municion(es)?|silenciador)\b/i,
    reason: "No se pueden publicar armas de fuego ni municiones.",
  },
  {
    // "perico" quedó fuera a propósito: en Colombia son huevos revueltos y también
    // un loro. Detectar droga por jerga es una carrera que no se gana, y ese
    // trabajo le toca a la cola de reportes, no al filtro automático.
    pattern: /\b(cocaina|cocaína|marihuana|tusi|extasis|éxtasis|lsd|estupefaciente)\b/i,
    reason: "No se pueden publicar sustancias prohibidas.",
  },
  {
    pattern: /\b(replica|réplica|imitacion|imitación|clon|aaa|triple a)\s+(de\s+)?(rolex|nike|adidas|gucci|louis|apple|iphone|samsung)\b/i,
    reason: "No se pueden publicar imitaciones de marcas.",
  },
  {
    pattern: /\b(documento|cedula|cédula|pasaporte|licencia)\s+(falso|falsa|falsificad[oa])\b/i,
    reason: "No se pueden publicar documentos falsificados.",
  },
  {
    pattern: /\b(animal|perro|gato|cachorro|loro|tortuga)\s+(en venta|vendo)\b|\bvendo\s+(cachorros?|gatos?|loros?)\b/i,
    reason: "No se pueden vender animales en 2venta.",
  },
  {
    pattern: /\b(medicamento|antibiotico|antibiótico|receta medica|receta médica)\b/i,
    reason: "No se pueden publicar medicamentos.",
  },
  {
    pattern: /\b(robado|robada|hurtado|sin papeles|de dudosa procedencia)\b/i,
    reason: "La publicación sugiere que el artículo no es de procedencia legítima.",
  },
];

export function moderateListing(input: {
  title: string;
  description: string;
}): ModerationVerdict {
  const text = `${input.title} ${input.description}`;
  for (const rule of FORBIDDEN) {
    if (rule.pattern.test(text)) return { allowed: false, reason: rule.reason };
  }
  // D-22 también aplica a la ficha: es pública y permanente, y un teléfono en el
  // título es la forma más cómoda de salirse del pago protegido (hallazgo de
  // QA, 2026-09-13). Aquí se rechaza en vez de ocultar: una publicación con
  // "•••••" en el título no dice qué vende.
  if (hasContact(text)) return { allowed: false, reason: CONTACT_REJECTED };
  return { allowed: true };
}

/**
 * Qué estado le corresponde a una publicación recién creada.
 *
 * R-03: sin acceso automatizado a la base de equipos reportados, la electrónica
 * pasa por revisión humana antes de estar visible. Ropa y niños salen directo.
 * Cuando el contraste sea automático, esta función es lo único que cambia.
 */
export function initialStatus(category: string): "activa" | "en_revision" {
  return category === "tecnologia" ? "en_revision" : "activa";
}
