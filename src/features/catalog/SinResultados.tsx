import Link from "next/link";
import { ButtonLink } from "@/components/ui";
import { SaveSearchForm } from "@/features/alerts/Forms";
import { conVolver } from "@/lib/destino";

/**
 * Lo que se ve cuando una búsqueda o unos filtros no dan con nada (corrección 5).
 *
 * Antes era «No encontramos nada con eso.» y un enlace dentro del párrafo: seco, y
 * justo en el momento en que alguien decide si se va. Ahora nombra lo que se buscó,
 * dice por qué vale la pena volver —en segunda mano lo de mañana no es lo de hoy— y
 * da las salidas como botones. La tercera salida es el aviso: es la respuesta
 * honesta a «no hay», y antes quedaba arriba de la pantalla, lejos de aquí.
 *
 * Tono cálido y juguetón (D-103, decisión de Nicolás).
 */
export function SinResultados({
  q,
  conFiltros,
  quitarFiltros,
  verTodo,
  params,
  aquí,
  conSesion,
  equipo = false,
  sugerencia,
}: {
  q: string;
  conFiltros: boolean;
  /** Misma búsqueda sin filtros; solo se ofrece si además hay palabra. */
  quitarFiltros: string;
  verTodo: string;
  /** Los filtros actuales, para guardar la búsqueda. */
  params: string;
  /** La dirección actual, para volver después de entrar. */
  aquí: string;
  conSesion: boolean;
  /** Corrección 48: la cuenta del equipo no pide avisos (Luna). */
  equipo?: boolean;
  /** Nombre propuesto para el aviso: lo buscado y los filtros, en palabras. */
  sugerencia: string;
}) {
  const titulo = q
    ? `¡Uy! Por ahora no hay «${q}»${conFiltros ? " con esos filtros" : ""}`
    : "¡Uy! Esta combinación no dio con nada";

  return (
    <div
      data-testid="sin-resultados"
      className="mt-4 rounded-2xl bg-white p-6 shadow-xs ring-1 ring-line"
    >
      <p className="font-title text-lg font-semibold text-balance [overflow-wrap:anywhere]">
        {titulo}
      </p>
      <p className="mt-1.5 text-sm text-ink2">
        En segunda mano todo se mueve rápido: lo que hoy no está puede aparecer
        mañana. {conFiltros ? "Prueba quitando algún filtro" : "Prueba con otra palabra"}, o
        date una vuelta por todo lo publicado.
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <ButtonLink href={verTodo} variant="brand" size="inline">
          Ver todo lo publicado
        </ButtonLink>
        {q && conFiltros && (
          <ButtonLink href={quitarFiltros} variant="outline" size="inline">
            Quitar filtros
          </ButtonLink>
        )}
        {!conSesion && (
          <Link
            href={conVolver("/ingresar?motivo=avisos", aquí)}
            className="px-2 text-sm text-ink2 underline"
          >
            Entra y te avisamos cuando aparezca
          </Link>
        )}
      </div>

      {conSesion && !equipo && (
        <SaveSearchForm
          params={params}
          sugerencia={sugerencia || undefined}
          destacado
        />
      )}
    </div>
  );
}
