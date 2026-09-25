import { EDADES, TALLAS_LETRA, TALLAS_NUMERO } from "@/features/catalog/atributos";
import type { OpcionesDeAtributos } from "@/features/configuracion/queries";

const SELECT =
  "rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none transition duration-200 ease-salida hover:border-brand/30 focus:border-brand focus:ring-3 focus:ring-brand/15";

/**
 * El campo propio de la categoría (corrección 38): talla en ropa, edad en artículos
 * para niños. Lo usan publicar y editar.
 */
export function CampoDeCategoria({
  campo,
  valor,
  opciones,
}: {
  campo: "talla" | "edad";
  valor?: string | null;
  /** Corrección 52 (D-128): las listas que gestiona el equipo. Sin ellas, las de siempre. */
  opciones?: OpcionesDeAtributos;
}) {
  const tallasLetra = opciones?.tallasLetra ?? TALLAS_LETRA;
  const tallasNumero = opciones?.tallasNumero ?? TALLAS_NUMERO;
  const edades = opciones?.edades ?? EDADES;
  // Luna (fila 52): si el equipo desactivó el valor que ya tiene la publicación, se
  // conserva y se dice. Sin esto el navegador elegía otro y al guardar cambiaba.
  const retirado =
    valor &&
    !(campo === "talla" ? [...tallasLetra, ...tallasNumero] : [...edades]).includes(valor)
      ? valor
      : null;
  if (campo === "talla") {
    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor="talla" className="text-sm font-medium">
          Talla
        </label>
        <select id="talla" name="talla" required defaultValue={valor ?? ""} className={SELECT}>
          <option value="" disabled>
            Elige la talla
          </option>
          {retirado && <option value={retirado}>{retirado} (ya no se ofrece)</option>}
          <optgroup label="Letras">
            {tallasLetra.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </optgroup>
          <optgroup label="Números">
            {tallasNumero.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </optgroup>
        </select>
        <p className="text-xs text-muted">
          {retirado
            ? `La talla ${retirado} ya no se ofrece a publicaciones nuevas; puedes dejarla o cambiarla.`
            : "La que dice la etiqueta. En calzado, el número."}
        </p>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor="edad" className="text-sm font-medium">
        Para qué edad
      </label>
      <select id="edad" name="edad" required defaultValue={valor ?? ""} className={SELECT}>
        <option value="" disabled>
          Elige la edad
        </option>
        {retirado && <option value={retirado}>{retirado} (ya no se ofrece)</option>}
        {edades.map((e) => (
          <option key={e} value={e}>
            {e}
          </option>
        ))}
      </select>
      {retirado && (
        <p className="text-xs text-muted">
          «{retirado}» ya no se ofrece a publicaciones nuevas; puedes dejarla o cambiarla.
        </p>
      )}
    </div>
  );
}
