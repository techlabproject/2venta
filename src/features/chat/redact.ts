// Filtro anti-desvío (D-22).
//
// Existe porque la comisión sobre el pago protegido es el ingreso de 2venta: si la
// conversación se va a WhatsApp, se pierde la venta y, peor, el comprador pierde la
// protección que es la razón de existir del producto.
//
// La postura es ocultar y avisar, no bloquear el mensaje. Un mensaje bloqueado sin
// explicación se lee como una falla de la app; uno con el dato tachado y una línea
// que dice por qué, educa. Es lo que muestra el mockup.
//
// Este filtro NO pretende ser infalible. Quien de verdad quiera salirse va a poder,
// deletreando el número en tres mensajes. Lo que sí hace es que salirse deje de ser
// lo cómodo, que es lo que mueve el comportamiento de la mayoría.

export type RedactionKind = "telefono" | "correo" | "enlace" | "billetera";

export type RedactionResult = {
  text: string;
  redactions: RedactionKind[];
};

const MASK = "•••••";

// Homoglifos que se usan para escribir números como letras: 3OO en vez de 300.
const HOMOGLYPHS: Record<string, string> = {
  o: "0", O: "0", l: "1", I: "1", i: "1", z: "2", Z: "2",
  e: "3", E: "3", a: "4", A: "4", s: "5", S: "5", b: "6",
  t: "7", T: "7", g: "9",
};

const NUMBER_WORDS: Record<string, string> = {
  cero: "0", uno: "1", dos: "2", tres: "3", cuatro: "4",
  cinco: "5", seis: "6", siete: "7", ocho: "8", nueve: "9",
};

const EMAIL = /[\w.+-]+\s*(?:@|\s+arroba\s+)\s*[\w-]+\s*(?:\.|\s+punto\s+)\s*[a-z]{2,}/gi;

const URL =
  /\b(?:https?:\/\/|www\.)\S+|\b[\w-]+\.(?:com|co|net|org|io|me|app|link)\b(?:\/\S*)?/gi;

// Nombres de billeteras y de otras plataformas. La lista es corta a propósito: no
// se trata de adivinar todas, sino de cubrir las que aparecen en la vida real aquí.
const WALLETS =
  /\b(nequi|daviplata|bancolombia|davivienda|bre-?b|whats?app|wasap|guasap|telegram|instagram|messenger)\b/gi;

const DIGIT = /\d/;
const SEPARATOR = /[\s.\-()+_,]/;
const HOMOGLYPH = /[oOlIizZeEaAsSbtTg]/;

/** Un monto en pesos: grupos de tres separados por punto o coma. */
const MONEY = /^\d{1,3}(?:[.,]\d{3})+$/;

/**
 * Cuántos dígitos hay si se leen los homoglifos como números.
 *
 * "3OO 4l2 88 O5" son diez, no seis.
 */
function digitCount(span: string): number {
  let n = 0;
  for (const ch of span) {
    if (DIGIT.test(ch) || HOMOGLYPH.test(ch)) n++;
  }
  return n;
}

/**
 * Encuentra números de contacto.
 *
 * Tres reglas que salieron de ver qué se rompía:
 *
 * 1. El tramo se recorta al primer y último dígito real. Sin esto, normalizar
 *    letras a números convierte palabras corrientes en dígitos ("es" es "35") y el
 *    filtro se come media frase: "mi celular es 3004128805" quedaba como
 *    "mi celular •••••".
 * 2. Un monto en pesos no es un teléfono. Sin esta excepción, "¿me lo dejas en
 *    1.700.000?" salía tachado, y negociar el precio es justamente para lo que
 *    existe el chat.
 * 3. El umbral es de ocho dígitos y no siete, para que un precio de siete cifras
 *    escrito sin puntos tampoco caiga.
 */
function findPhoneSpans(text: string): Array<[number, number]> {
  const spans: Array<[number, number]> = [];
  let i = 0;

  while (i < text.length) {
    if (!DIGIT.test(text[i])) {
      i++;
      continue;
    }

    // Extiende mientras haya dígitos, homoglifos o separadores cortos.
    let end = i;
    let gap = 0;
    let j = i;
    while (j < text.length) {
      const ch = text[j];
      if (DIGIT.test(ch)) {
        end = j;
        gap = 0;
      } else if (HOMOGLYPH.test(ch)) {
        gap = 0;
      } else if (SEPARATOR.test(ch) && gap < 2) {
        gap++;
      } else {
        break;
      }
      j++;
    }

    const span = text.slice(i, end + 1);
    if (digitCount(span) >= 8 && !MONEY.test(span.trim())) {
      spans.push([i, end + 1]);
    }
    i = Math.max(j, i + 1);
  }
  return spans;
}

/** Oculta datos de contacto y dice qué ocultó. */
export function redact(input: string): RedactionResult {
  const kinds = new Set<RedactionKind>();
  let text = input;

  text = text.replace(EMAIL, () => {
    kinds.add("correo");
    return MASK;
  });

  text = text.replace(URL, () => {
    kinds.add("enlace");
    return MASK;
  });

  // Un número deletreado en palabras se convierte antes, para que el detector lo
  // vea como lo que es.
  for (const [word, digit] of Object.entries(NUMBER_WORDS)) {
    text = text.replace(new RegExp(`\\b${word}\\b`, "gi"), digit);
  }

  // Los teléfonos se reemplazan de atrás hacia adelante para que las posiciones
  // encontradas sigan siendo válidas mientras se sustituye.
  const spans = findPhoneSpans(text);
  for (let i = spans.length - 1; i >= 0; i--) {
    const [from, to] = spans[i];
    kinds.add("telefono");
    text = text.slice(0, from) + MASK + text.slice(to);
  }

  text = text.replace(WALLETS, () => {
    kinds.add("billetera");
    return MASK;
  });

  return { text, redactions: [...kinds] };
}

export const REDACTION_NOTICE =
  "Ocultamos ese dato. Si pagas fuera de 2venta pierdes el pago protegido y no podemos ayudarte si algo sale mal.";
