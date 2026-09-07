import { parseCop } from "@/features/payments/money";
import { MIN_PRICE_COP } from "@/features/payments/money";
import { isValidImei, normalizeImei } from "@/features/moderation/imei";
import { moderateListing } from "@/features/moderation/rules";
import type { Condition } from "@/features/catalog/labels";

// Carga en lote para tiendas (S-13).
//
// Crea BORRADORES, no publicaciones. El video sigue grabándose desde el móvil, uno
// por uno: si una tienda pudiera cargar cincuenta artículos con sus videos desde un
// archivo, la garantía de la D-14 se cae. Lo que se ahorra es escribir, que es el
// trabajo que de verdad cuesta en volumen.

export const MAX_ROWS = 100;

export const COLUMNS = [
  "titulo",
  "categoria",
  "precio",
  "estado",
  "descripcion",
  "imei",
] as const;

const CONDITIONS: Record<string, Condition> = {
  nuevo: "nuevo",
  "usado bueno": "usado_bueno",
  usado_bueno: "usado_bueno",
  "usado regular": "usado_regular",
  usado_regular: "usado_regular",
};

export type DraftRow = {
  title: string;
  category: string;
  priceCop: number;
  condition: Condition;
  description: string;
  imei: string | null;
};

export type RowError = { line: number; message: string };

export type ParseResult =
  | { ok: false; error: string }
  | { ok: true; rows: DraftRow[]; errors: RowError[] };

/**
 * Lee un archivo separado por comas.
 *
 * Devuelve las filas buenas y los errores por separado a propósito: rechazar el
 * archivo entero por una fila mala obliga a la tienda a repetir el trabajo de las
 * otras noventa y nueve.
 */
export function parseBulk(text: string, validCategories: string[]): ParseResult {
  const lines = text.trim().split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) {
    return { ok: false, error: "El archivo está vacío o solo tiene el encabezado." };
  }

  const header = splitLine(lines[0]).map((h) => h.trim().toLowerCase());
  const missing = COLUMNS.filter((c) => c !== "imei" && !header.includes(c));
  if (missing.length) {
    return {
      ok: false,
      error: `Al archivo le faltan columnas: ${missing.join(", ")}. Deben llamarse ${COLUMNS.join(", ")}.`,
    };
  }

  const body = lines.slice(1);
  if (body.length > MAX_ROWS) {
    return {
      ok: false,
      error: `El archivo tiene ${body.length} filas y el máximo son ${MAX_ROWS}. Divídelo en varios.`,
    };
  }

  const index = (name: string) => header.indexOf(name);
  const rows: DraftRow[] = [];
  const errors: RowError[] = [];

  body.forEach((line, i) => {
    const cells = splitLine(line);
    const at = (name: string) => (cells[index(name)] ?? "").trim();
    const lineNumber = i + 2; // el encabezado es la línea 1

    const title = at("titulo");
    const description = at("descripcion");
    if (!title || !description) {
      errors.push({ line: lineNumber, message: "Falta el título o la descripción." });
      return;
    }

    const category = at("categoria").toLowerCase();
    if (!validCategories.includes(category)) {
      errors.push({
        line: lineNumber,
        message: `Categoría "${at("categoria")}" no existe. Usa: ${validCategories.join(", ")}.`,
      });
      return;
    }

    const priceCop = parseCop(at("precio"));
    if (priceCop === null) {
      errors.push({ line: lineNumber, message: `Precio "${at("precio")}" no es válido.` });
      return;
    }
    if (priceCop < MIN_PRICE_COP) {
      errors.push({
        line: lineNumber,
        message: `El precio mínimo es $${MIN_PRICE_COP.toLocaleString("es-CO")}.`,
      });
      return;
    }

    const condition = CONDITIONS[at("estado").toLowerCase()];
    if (!condition) {
      errors.push({
        line: lineNumber,
        message: `Estado "${at("estado")}" no existe. Usa: nuevo, usado bueno, usado regular.`,
      });
      return;
    }

    // El mismo filtro que la publicación de a uno: cargar en lote no es una puerta
    // trasera para lo que está prohibido.
    const verdict = moderateListing({ title, description });
    if (!verdict.allowed) {
      errors.push({ line: lineNumber, message: verdict.reason });
      return;
    }

    let imei: string | null = null;
    if (category === "tecnologia") {
      const raw = at("imei");
      if (!isValidImei(raw)) {
        errors.push({ line: lineNumber, message: `El IMEI "${raw}" no es válido.` });
        return;
      }
      imei = normalizeImei(raw);
    }

    rows.push({ title, category, priceCop, condition, description, imei });
  });

  return { ok: true, rows, errors };
}

/** Separa por comas respetando las comillas, que es donde vive la descripción. */
function splitLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      cells.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  cells.push(current);
  return cells;
}
