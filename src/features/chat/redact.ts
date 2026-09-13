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
const HOMOGLYPH = /[oOlIizZeEaAsSbtTg]/;
// Cualquier cosa que no sea letra ni dígito puede ir entre los dígitos de un
// número: espacio, punto, guion, paréntesis, y también un emoji o un símbolo.
// Antes la lista de separadores era cerrada y "3🙂0🙂0🙂4..." pasaba entero
// (hallazgo de QA, 2026-09-13).
const LETTER_OR_DIGIT = /[\p{L}\p{N}]/u;

/** Un monto en pesos: grupos de tres separados por punto o coma. */
const MONEY = /^\d{1,3}(?:[.,]\d{3})+$/;
/** Una fecha: 13/09/2026, 13-9-26, 2026-09-13. Ocho dígitos que no son un teléfono. */
const LEADING_DATE = /^(?:\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}|\d{4}[/.-]\d{1,2}[/.-]\d{1,2})(?!\d)/;

/**
 * Cuántos dígitos hay si se leen los homoglifos como números.
 *
 * "3OO 4l2 88 O5" son diez, no seis.
 */
function digitCount(chars: string[]): number {
  let n = 0;
  for (const ch of chars) {
    if (DIGIT.test(ch) || HOMOGLYPH.test(ch)) n++;
  }
  return n;
}

/**
 * Encuentra números de contacto. Devuelve posiciones en unidades de código de la
 * cadena original, para poder recortarla.
 *
 * Tres reglas que salieron de ver qué se rompía:
 *
 * 1. El tramo se recorta al primer y último dígito real. Sin esto, normalizar
 *    letras a números convierte palabras corrientes en dígitos ("es" es "35") y el
 *    filtro se come media frase: "mi celular es 3004128805" quedaba como
 *    "mi celular •••••".
 * 2. Un monto en pesos no es un teléfono, ni una fecha. Sin esas excepciones,
 *    "¿me lo dejas en 1.700.000?" y "nos vemos el 13/09/2026" salían tachados.
 * 3. El umbral es de ocho dígitos y no siete, para que un precio de siete cifras
 *    escrito sin puntos tampoco caiga.
 */
function findPhoneSpans(text: string): Array<[number, number]> {
  // Se trabaja por puntos de código: un emoji son dos unidades de código y
  // contarlo como dos separadores era justo el hueco.
  const chars = Array.from(text);
  const offsets: number[] = [];
  let acc = 0;
  for (const ch of chars) {
    offsets.push(acc);
    acc += ch.length;
  }
  offsets.push(acc);

  const spans: Array<[number, number]> = [];
  let i = 0;

  while (i < chars.length) {
    if (!DIGIT.test(chars[i])) {
      i++;
      continue;
    }

    // Extiende mientras haya dígitos, homoglifos o separadores cortos.
    let end = i;
    let gap = 0;
    let j = i;
    while (j < chars.length) {
      const ch = chars[j];
      if (DIGIT.test(ch)) {
        end = j;
        gap = 0;
      } else if (HOMOGLYPH.test(ch)) {
        gap = 0;
      } else if (!LETTER_OR_DIGIT.test(ch) && gap < 2) {
        gap++;
      } else {
        break;
      }
      j++;
    }

    const span = chars.slice(i, end + 1);
    const flat = span.join("").trim();

    // Una fecha al principio del tramo se salta entera y se sigue después: si
    // no, "13/09/2026 a las 3" se leía como un número de doce dígitos, porque
    // "a las" son homoglifos.
    const date = LEADING_DATE.exec(flat);
    if (date) {
      i += Array.from(date[0]).length;
      continue;
    }

    // Entre 8 y 12 dígitos: un celular son 10, con indicativo 12. De 13 en
    // adelante es un IMEI, un serial o un sello de tiempo, no un número al que
    // llamar.
    const n = digitCount(span);
    if (n >= 8 && n <= 12 && !MONEY.test(flat)) {
      spans.push([offsets[i], offsets[end + 1]]);
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

/**
 * Para los campos donde ocultar no tiene sentido y hay que rechazar: un título,
 * un alias o una razón social con "•••••" en la mitad no es un dato, es un hueco.
 * Son públicos y permanentes, así que el listón es el mismo que el del chat.
 */
export function hasContact(input: string): boolean {
  return redact(input).redactions.length > 0;
}

export const CONTACT_REJECTED =
  "No puede llevar números de teléfono, correos ni enlaces. Los contactos van por el chat de 2venta, que es lo que protege el pago.";
