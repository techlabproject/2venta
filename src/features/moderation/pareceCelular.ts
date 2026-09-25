/**
 * ¿La publicación es de un celular? (corrección 40, decisión de Nicolás).
 *
 * El IMEI se pide solo a los celulares: un Xbox o un portátil no tienen, y pedirlo
 * no protegía nada. Quien publica responde «¿Es un celular?», y esto es la red para
 * quien contesta «No» por no buscar el IMEI: si el texto habla de un celular, el
 * servidor lo pide igual.
 *
 * Los accesorios no cuentan: «Forro para iPhone 13» no tiene IMEI.
 */

const CELULAR = [
  /\bcelular(es)?\b/,
  /\bsmart ?phones?\b/,
  /\btel[eé]fono m[oó]vil\b/,
  /\biphone\b/,
  /\bgalaxy (s|a|z|m|note)\s?\d*/,
  /\b(redmi|poco)\b/,
  /\bxiaomi (mi|\d)/,
  /\bmoto (g|e|edge|razr)\s?\d*\b/,
  /\bmotorola (moto|edge|razr)\b/,
  /\bhuawei (p|mate|nova|y)\s?\d/,
  /\b(oppo|realme|vivo|honor|tecno|infinix) [a-z]*\s?\d/,
  /\bpixel \d/,
];

const ACCESORIO = [
  /\b(forros?|estuches?|fundas?|cases?|carcasas?)\b/,
  /\b(cargador(es)?|cables?|adaptador(es)?|power ?banks?|bater[ií]as? externas?)\b/,
  /\b(vidrios? templados?|protector(es)? de pantalla|micas?)\b/,
  /\b(soportes?|tr[ií]pode?s?|selfie ?sticks?|holders?)\b/,
  /\b(aud[ií]fonos?|aud[ií]fono|auriculares?|airpods|buds)\b/,
];

/** Sin tildes ni mayúsculas, para comparar palabras. */
function plano(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export function pareceCelular(titulo: string, descripcion = ""): boolean {
  // El título manda: una descripción que menciona «viene con cargador» no vuelve
  // accesorio a un celular, y un forro cuya descripción dice «para celular» sigue
  // siendo un forro.
  const t = plano(titulo);
  if (ACCESORIO.some((re) => re.test(t))) return false;
  if (CELULAR.some((re) => re.test(t))) return true;
  const d = plano(descripcion);
  return !ACCESORIO.some((re) => re.test(t + " " + d)) && CELULAR.some((re) => re.test(d));
}
