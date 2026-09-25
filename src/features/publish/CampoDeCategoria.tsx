import { EDADES, TALLAS_LETRA, TALLAS_NUMERO } from "@/features/catalog/atributos";

const SELECT =
  "rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none transition duration-200 ease-salida hover:border-brand/30 focus:border-brand focus:ring-3 focus:ring-brand/15";

/**
 * El campo propio de la categoría (corrección 38): talla en ropa, edad en artículos
 * para niños. Lo usan publicar y editar.
 */
export function CampoDeCategoria({
  campo,
  valor,
}: {
  campo: "talla" | "edad";
  valor?: string | null;
}) {
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
          <optgroup label="Letras">
            {TALLAS_LETRA.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </optgroup>
          <optgroup label="Números">
            {TALLAS_NUMERO.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </optgroup>
        </select>
        <p className="text-xs text-muted">La que dice la etiqueta. En calzado, el número.</p>
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
        {EDADES.map((e) => (
          <option key={e} value={e}>
            {e}
          </option>
        ))}
      </select>
    </div>
  );
}
