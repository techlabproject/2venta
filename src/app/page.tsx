import Link from "next/link";
import { listCategories } from "@/features/catalog/queries";
import { hrefDePagina, leerPagina, sinCamposVacios } from "@/features/catalog/paginas";
import { redirect } from "next/navigation";
import { VerMas } from "@/components/VerMas";
import { ListingCard } from "@/features/catalog/ListingCard";
import { AppHeader } from "@/components/AppHeader";
import { Arco } from "@/components/Arco";
import {
  countListings,
  conCategoriasConocidas,
  cuantosFiltros,
  describirFiltros,
  hayFiltros,
  parseFilters,
  searchListings,
  sinDistanciaSinPunto,
} from "@/features/catalog/search";
import { ZONAS } from "@/features/ubicacion/zonas";
import { puntoDelComprador } from "@/features/ubicacion/comprador";
import { BarraDeUbicacion } from "@/features/ubicacion/BarraDeUbicacion";
import { CamposDeFiltro } from "@/features/catalog/CamposDeFiltro";
import { PanelDeFiltros } from "@/features/catalog/PanelDeFiltros";
import { SinResultados } from "@/features/catalog/SinResultados";
import { currentUser } from "@/lib/session";

// Pantalla 1d del mockup. Renderizado en servidor y sin caché: la lista y la ficha
// tienen que existir como HTML para que un buscador las indexe (D-25).
export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // La portada filtra en su sitio (corrección 2): tocar «Ropa» ya no lleva a
  // otra pantalla con el formulario abierto, deja la portada mostrando solo ropa.
  // Los filtros viven en la dirección, así que se comparte igual que antes.
  const params = new URLSearchParams();
  for (const [clave, valor] of Object.entries(await searchParams)) {
    for (const v of Array.isArray(valor) ? valor : valor ? [valor] : []) {
      params.append(clave, v);
    }
  }
  // Sin `min=&max=&zona=` en la dirección: un formulario GET manda todo (Luna).
  const limpios = sinCamposVacios(params);
  if (limpios.toString() !== params.toString()) {
    redirect(limpios.size ? `/?${limpios}` : "/");
  }
  // La búsqueda por texto sigue siendo cosa de `/buscar`.
  params.delete("q");
  const [categories, user] = await Promise.all([listCategories(), currentUser()]);
  // D-122: dónde está quien mira, de su cookie. Sin punto, el radio y «Más cerca»
  // no aplican.
  const punto = await puntoDelComprador();
  const filtros = sinDistanciaSinPunto(conCategoriasConocidas(parseFilters(params), categories), punto);
  const filtrando = hayFiltros(filtros);
  // Correcciones 33 y 34: 24 por página. Antes la portada sin filtros cargaba
  // todas las publicaciones activas de una vez. Con y sin filtros es la misma
  // consulta: sin filtros son todos los activos, del más reciente al más viejo.
  const pagina = leerPagina(params.get("pagina"));
  // Fuera de la dirección de los filtros: cambiar de categoría o guardar la
  // búsqueda vuelve a la primera página.
  params.delete("pagina");
  const [listings, total] = await Promise.all([
    searchListings(filtros, pagina, punto),
    countListings(filtros, punto),
  ]);

  return (
    <>
      <AppHeader zone="Bogotá" />

      {/* La franja de marca continúa la cabecera en vez de cortarla. Antes el
          buscador flotaba sobre crema y la parte de arriba no decía nada: la
          promesa del producto, que es la razón de existir de 2venta, no tenía
          ninguna presencia visual.

          El degradado y el arco (D-85) están aquí porque un relleno plano de un
          solo color es exactamente lo que hace que un producto se vea sin
          terminar: no hay luz, no hay profundidad y no hay nada de la marca
          salvo el tono. X          petróleo abajo— y el arco va al 14 % de opacidad: se nota que está, no
          se nota que lo pusieron. */}
      <div className="relative overflow-hidden bg-gradient-to-b from-brand to-brand-d pb-8 text-cream">
        <Arco className="absolute -top-24 -right-20 h-72 w-72 text-accent-on-brand/15 sm:-top-28 sm:-right-24 sm:h-[26rem] sm:w-[26rem]" />
        <div className="relative mx-auto max-w-6xl px-5">
          <h1 className="max-w-xl font-title text-3xl leading-tight font-semibold text-balance sm:text-4xl">
            Compra usado sin miedo a que te tumben
          </h1>
          <p className="mt-2 max-w-lg text-sm text-cream/80">
            Cada artículo tiene video grabado por el vendedor y su identidad
            está verificada. Tu plata queda guardada hasta que confirmes que
            recibiste.
          </p>

          <form
            action="/buscar"
            method="get"
            className="mt-6 flex max-w-2xl gap-2"
          >
            <input
              type="search"
              name="q"
              aria-label="Buscar"
              placeholder="Busca celulares, ropa, coches…"
              className="flex-1 rounded-xl border border-transparent bg-cream px-4 py-3 text-sm text-ink shadow-md outline-none transition duration-200 ease-salida placeholder:text-muted focus:border-accent focus:ring-3 focus:ring-accent/30"
            />
            <button
              type="submit"
              className="rounded-xl border border-accent-edge/50 bg-accent px-5 text-sm font-medium text-on-accent shadow-md transition duration-200 ease-salida hover:brightness-[0.97] active:scale-[0.98]"
            >
              Buscar
            </button>
          </form>

          {/* Atajos del mockup. Son enlaces y no botones a propósito: cada uno es una
              dirección real que se puede compartir y que el buscador puede seguir.
              Se marcan y desmarcan, y se suman entre sí (decisión de Nicolás). */}
          <nav aria-label="Atajos" className="mt-4 flex flex-wrap gap-2">
            {/* «Filtros» encabeza la fila de etiquetas: en 375 px no cabía junto
                al buscador sin aplastarlo. */}
            <PanelDeFiltros
              accion="/"
              respaldo={`/buscar?${params}`}
              activos={cuantosFiltros(filtros)}
              total={total}
              limpiar="/"
            >
              {/* La llave rehace los campos al cambiar los filtros: son no
                  controlados, y sin esto el panel seguía mostrando los de antes
                  al tocar una etiqueta. */}
              <CamposDeFiltro
                key={params.toString()}
                filters={filtros}
                categories={categories}
                zones={ZONAS.map((z) => z.nombre)}
                conPunto={Boolean(punto)}
                prefijo="portada"
              />
            </PanelDeFiltros>
            <Chip
              href={alternar(params, "verificados", "1")}
              activo={filtros.verifiedOnly}
            >
              Verificados
            </Chip>
            {categories.map((c) => (
              <Chip
                key={c.slug}
                href={alternar(params, "categoria", c.slug)}
                activo={filtros.categories.includes(c.slug)}
              >
                {c.label}
              </Chip>
            ))}
          </nav>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-5 py-8">
        {filtrando ? (
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <div>
              <h2 data-testid="conteo" className="font-title text-xl font-semibold">
                {total === 1 ? "1 resultado" : `${total} resultados`}
              </h2>
            </div>
            <Link href="/" scroll={false} className="text-sm text-brand underline">
              Quitar filtros
            </Link>
          </div>
        ) : (
          <>
            <h2 className="font-title text-xl font-semibold">Cerca de ti</h2>
            <p className="mt-1 text-sm text-muted">
              Lo que se está vendiendo ahora mismo en Bogotá.
            </p>
          </>
        )}

        <BarraDeUbicacion punto={punto} volver={params.size ? `/?${params}` : "/"} />

        {filtrando && listings.length === 0 && (
          <SinResultados
            q=""
            conFiltros
            quitarFiltros="/"
            verTodo="/"
            params={params.toString()}
            aquí={`/?${params}`}
            conSesion={Boolean(user)}
            equipo={user?.role === "admin"}
            sugerencia={describirFiltros(filtros, categories)}
          />
        )}

        <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-4">
          {listings.map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </ul>
        <VerMas
          mostrados={listings.length}
          total={total}
          href={hrefDePagina("/", params, pagina + 1)}
        />
      </main>
    </>
  );
}

function Chip({
  href,
  activo,
  children,
}: {
  href: string;
  activo: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={activo ? "true" : undefined}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm transition duration-200 ease-salida active:scale-[0.97] ${
        activo
          ? "border-cream bg-cream font-medium text-brand hover:bg-cream/90"
          : "border-cream/30 text-cream hover:border-cream/60 hover:bg-cream/10"
      }`}
    >
      {activo && (
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12l5 5 9-10" />
        </svg>
      )}
      {children}
      {activo && <span className="sr-only"> (filtro puesto; tócalo para quitarlo)</span>}
    </Link>
  );
}

/** La dirección de la portada con ese filtro puesto si no estaba, o quitado si estaba. */
function alternar(params: URLSearchParams, clave: string, valor: string): string {
  const nuevos = new URLSearchParams(params);
  if (nuevos.getAll(clave).includes(valor)) {
    const resto = nuevos.getAll(clave).filter((v) => v !== valor);
    nuevos.delete(clave);
    for (const v of resto) nuevos.append(clave, v);
  } else {
    nuevos.append(clave, valor);
  }
  const qs = nuevos.toString();
  return qs ? `/?${qs}` : "/";
}
