import { notFound } from "next/navigation";
import { currentAdmin } from "@/lib/session";
import { AppHeader } from "@/components/AppHeader";
import { Volver } from "@/components/Volver";
import { ZONAS } from "@/features/ubicacion/zonas";
import { MOTIVOS_FIJOS } from "@/features/moderation/rules";
import {
  todasLasCategorias,
  todasLasPalabras,
  todosLosAtributos,
  todosLosLugares,
  ultimosCambios,
} from "@/features/configuracion/queries";
import {
  agregarAtributo,
  agregarLugar,
  agregarPalabra,
  alternarAtributo,
  alternarPalabra,
  guardarCategoria,
  guardarLugar,
} from "@/features/configuracion/acciones";

// Corrección 52 (D-128): lo que el equipo cambia sin un desarrollador. Privada: para
// quien no es del equipo responde 404, y cada acción lo vuelve a comprobar.
export const dynamic = "force-dynamic";

const ERRORES: Record<string, string> = {
  nombre: "El nombre es muy corto o trae un teléfono o un enlace.",
  orden: "El orden es un número entre 0 y 999.",
  "no-existe": "Eso ya no existe. Recarga la página.",
  ultima: "Tiene que quedar al menos una activa.",
  repetido: "Ya existe uno igual.",
  zona: "Elige una zona de la lista.",
  tipo: "Elige un tipo de la lista.",
  valor: "Escribe el valor, sin teléfonos ni enlaces.",
  frase: "La frase necesita al menos 3 letras.",
  motivo: "Explica el motivo en una frase: es lo que verá quien publica.",
  largo: "Es demasiado largo. Los nombres de categoría van hasta 40 letras; los de lugar, hasta 80; las tallas, hasta 30; las frases, hasta 60, y los motivos, hasta 200.",
};

const TIPOS_DE_LUGAR: Record<string, string> = {
  centro_comercial: "Centro comercial",
  biblioteca: "Biblioteca",
  parque: "Parque",
  museo: "Museo o centro cultural",
};

const CAMPO =
  "rounded-xl border border-line bg-white px-3 py-2 text-sm outline-none transition duration-200 ease-salida hover:border-brand/30 focus:border-brand focus:ring-3 focus:ring-brand/15";
const BOTON =
  "rounded-xl bg-brand px-3 py-2 text-sm font-medium text-cream transition duration-200 ease-salida hover:bg-brand-l";
const TARJETA = "rounded-2xl bg-white p-4 shadow-xs ring-1 ring-line";

// El historial en palabras (Luna, fila 52): antes eran objetos JSON.
const ENTIDADES: Record<string, string> = {
  categoria: "Categoría",
  lugar: "Lugar",
  talla: "Talla",
  edad: "Edad",
  palabra: "Palabra prohibida",
};
const CAMPOS: Record<string, string> = {
  label: "nombre",
  position: "orden",
  active: "activa",
  activo: "activo",
  confirmado: "confirmado",
  nombre: "nombre",
  tipo: "tipo",
  zona: "zona",
  valor: "valor",
  frase: "frase",
  motivo: "motivo",
};

function enPalabras(v: unknown): string {
  if (!v || typeof v !== "object") return "—";
  return Object.entries(v as Record<string, unknown>)
    .map(([k, x]) => {
      const valor =
        typeof x === "boolean" ? (x ? "sí" : "no") : k === "tipo" ? (TIPOS_DE_LUGAR[String(x)] ?? String(x)) : String(x);
      return `${CAMPOS[k] ?? k}: ${valor}`;
    })
    .join(" · ");
}

function queCambio(c: { entidad: string; clave: string; antes: unknown; despues: unknown }): string {
  const datos = { ...(c.antes as object), ...(c.despues as object) } as Record<string, unknown>;
  // Un lugar se reconoce por su nombre, no por su identificador.
  const nombre = c.entidad === "lugar" && typeof datos.nombre === "string" ? datos.nombre : c.clave;
  return `${ENTIDADES[c.entidad] ?? c.entidad}: ${nombre}`;
}

const fecha = new Intl.DateTimeFormat("es-CO", {
  timeZone: "America/Bogota",
  dateStyle: "medium",
  timeStyle: "short",
});

export default async function Configuracion({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; listo?: string }>;
}) {
  const admin = await currentAdmin();
  if (!admin) notFound();
  const { error, listo } = await searchParams;

  const [categorias, lugares, atributos, palabras, cambios] = await Promise.all([
    todasLasCategorias(),
    todosLosLugares(),
    todosLosAtributos(),
    todasLasPalabras(),
    ultimosCambios(),
  ]);
  const porConfirmar = lugares.filter((l) => l.activo && !l.confirmado).length;

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-6xl px-5 py-6">
        <Volver href="/admin" />
        <h1 className="mt-4 font-title text-2xl font-semibold">Configuración</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          Lo que el equipo puede cambiar sin un desarrollador. Cada cambio queda en el
          historial, al final, con quién lo hizo y qué había antes.
        </p>

        {error && ERRORES[error] && (
          <p role="alert" className="mt-4 rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">
            {ERRORES[error]}
          </p>
        )}
        {listo && !error && (
          <p role="status" className="mt-4 rounded-xl bg-brand/10 px-4 py-3 text-sm text-brand">
            Guardado.
          </p>
        )}

        <nav aria-label="Secciones" className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm">
          <a href="#categorias" className="text-brand underline">Categorías</a>
          <a href="#lugares" className="text-brand underline">Lugares de encuentro</a>
          <a href="#atributos" className="text-brand underline">Tallas y edades</a>
          <a href="#palabras" className="text-brand underline">Palabras prohibidas</a>
          <a href="#historial" className="text-brand underline">Historial</a>
        </nav>

        {/* ---- Categorías ---- */}
        <section id="categorias" className="mt-8 scroll-mt-4">
          <h2 className="font-title text-lg font-semibold">Categorías</h2>
          <p className="mt-1 text-sm text-muted">
            El nombre y el orden se ven en la portada y al publicar. La dirección (por
            ejemplo <code>?categoria=ninos</code>) no cambia, para no romper enlaces
            compartidos. Una categoría inactiva no recibe publicaciones nuevas.
          </p>
          <ul className="mt-3 grid gap-3 md:grid-cols-2">
            {categorias.map((c) => (
              <li key={c.slug} className={TARJETA}>
                <form action={guardarCategoria} className="flex flex-wrap items-end gap-3">
                  <input type="hidden" name="slug" value={c.slug} />
                  <div className="flex min-w-40 flex-1 flex-col gap-1">
                    <label htmlFor={`cat-${c.slug}`} className="text-xs text-muted">
                      Nombre ({c.slug})
                    </label>
                    <input id={`cat-${c.slug}`} name="label" defaultValue={c.label} required maxLength={40} className={CAMPO} />
                  </div>
                  <div className="flex w-20 flex-col gap-1">
                    <label htmlFor={`pos-${c.slug}`} className="text-xs text-muted">
                      Orden
                    </label>
                    <input
                      id={`pos-${c.slug}`}
                      name="position"
                      type="number"
                      min={0}
                      max={999}
                      defaultValue={c.position}
                      className={CAMPO}
                    />
                  </div>
                  <label className="flex items-center gap-2 pb-2 text-sm">
                    <input type="checkbox" name="active" defaultChecked={c.active} className="size-4 accent-brand" />
                    Activa
                  </label>
                  <button type="submit" className={BOTON}>
                    Guardar
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </section>

        {/* ---- Lugares ---- */}
        <section id="lugares" className="mt-10 scroll-mt-4">
          <h2 className="font-title text-lg font-semibold">Lugares de encuentro</h2>
          <p className="mt-1 text-sm text-muted">
            Lugares públicos y concurridos para «Nos vemos en persona» (corrección 46).
            {porConfirmar > 0 &&
              ` ${porConfirmar} están por confirmar: revisa que existan y que queden en esa zona.`}{" "}
            Uno inactivo deja de ofrecerse; los pedidos que ya lo eligieron lo conservan.
          </p>

          <form action={agregarLugar} className={`mt-3 flex flex-wrap items-end gap-3 ${TARJETA}`}>
            <div className="flex flex-col gap-1">
              <label htmlFor="nuevo-lugar-zona" className="text-xs text-muted">
                Zona
              </label>
              <select id="nuevo-lugar-zona" name="zona" required defaultValue="" className={CAMPO}>
                <option value="" disabled>
                  Elige
                </option>
                {ZONAS.map((z) => (
                  <option key={z.nombre} value={z.nombre}>
                    {z.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex min-w-48 flex-1 flex-col gap-1">
              <label htmlFor="nuevo-lugar-nombre" className="text-xs text-muted">
                Nombre del lugar
              </label>
              <input id="nuevo-lugar-nombre" name="nombre" required maxLength={80} className={CAMPO} />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="nuevo-lugar-tipo" className="text-xs text-muted">
                Tipo
              </label>
              <select id="nuevo-lugar-tipo" name="tipo" defaultValue="centro_comercial" className={CAMPO}>
                {Object.entries(TIPOS_DE_LUGAR).map(([v, t]) => (
                  <option key={v} value={v}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className={BOTON}>
              Agregar lugar
            </button>
          </form>

          <ul className="mt-3 grid gap-3 md:grid-cols-2" data-testid="lugares">
            {lugares.map((l) => (
              <li key={l.id} className={TARJETA}>
                <p className="text-xs text-muted">
                  {l.zona}
                  {!l.confirmado && <span className="ml-2 font-medium text-warn">Por confirmar</span>}
                </p>
                <form action={guardarLugar} className="mt-2 flex flex-wrap items-end gap-3">
                  <input type="hidden" name="id" value={l.id} />
                  <div className="flex min-w-40 flex-1 flex-col gap-1">
                    <label htmlFor={`lugar-${l.id}`} className="sr-only">
                      Nombre de {l.nombre}
                    </label>
                    <input id={`lugar-${l.id}`} name="nombre" defaultValue={l.nombre} required maxLength={80} className={CAMPO} />
                  </div>
                  <select name="tipo" defaultValue={l.tipo} aria-label={`Tipo de ${l.nombre}`} className={CAMPO}>
                    {Object.entries(TIPOS_DE_LUGAR).map(([v, t]) => (
                      <option key={v} value={v}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="confirmado" defaultChecked={l.confirmado} className="size-4 accent-brand" />
                    Confirmado
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="activo" defaultChecked={l.activo} className="size-4 accent-brand" />
                    Activo
                  </label>
                  <button type="submit" className={BOTON} aria-label={`Guardar ${l.nombre}`}>
                    Guardar
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </section>

        {/* ---- Tallas y edades ---- */}
        <section id="atributos" className="mt-10 scroll-mt-4">
          <h2 className="font-title text-lg font-semibold">Tallas y edades</h2>
          <p className="mt-1 text-sm text-muted">
            Las opciones al publicar ropa (talla) y artículos para niños (edad). No se
            renombran: las publicaciones guardan el texto. Para cambiar una, desactívala
            y agrega la nueva.
          </p>
          <form action={agregarAtributo} className={`mt-3 flex flex-wrap items-end gap-3 ${TARJETA}`}>
            <div className="flex flex-col gap-1">
              <label htmlFor="nuevo-atributo-tipo" className="text-xs text-muted">
                Lista
              </label>
              <select id="nuevo-atributo-tipo" name="tipo" defaultValue="talla" className={CAMPO}>
                <option value="talla">Talla</option>
                <option value="edad">Edad</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="nuevo-atributo-valor" className="text-xs text-muted">
                Valor (como se verá)
              </label>
              <input id="nuevo-atributo-valor" name="valor" required maxLength={30} className={CAMPO} />
            </div>
            <button type="submit" className={BOTON}>
              Agregar
            </button>
          </form>
          {(["talla", "edad"] as const).map((tipo) => (
            <div key={tipo} className="mt-4">
              <h3 className="text-sm font-medium">{tipo === "talla" ? "Tallas" : "Edades"}</h3>
              <ul className="mt-2 flex flex-wrap gap-2" data-testid={`atributos-${tipo}`}>
                {atributos
                  .filter((a) => a.tipo === tipo)
                  .map((a) => (
                    <li key={a.valor}>
                      <form action={alternarAtributo}>
                        <input type="hidden" name="tipo" value={tipo} />
                        <input type="hidden" name="valor" value={a.valor} />
                        <input type="hidden" name="activo" value={a.activo ? "0" : "1"} />
                        <button
                          type="submit"
                          aria-label={`${a.activo ? "Desactivar" : "Activar"} ${a.valor}`}
                          className={`rounded-full px-3 py-1 text-sm ring-1 transition ${
                            a.activo
                              ? "bg-brand/10 text-brand ring-brand/30 hover:bg-brand/20"
                              : "bg-ph text-muted line-through ring-line hover:bg-line"
                          }`}
                        >
                          {a.valor}
                        </button>
                      </form>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
          <p className="mt-2 text-xs text-muted">Toca una opción para activarla o desactivarla.</p>
        </section>

        {/* ---- Palabras prohibidas ---- */}
        <section id="palabras" className="mt-10 scroll-mt-4">
          <h2 className="font-title text-lg font-semibold">Palabras prohibidas</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Una publicación que tenga una de estas frases no se publica, y quien publica
            ve el motivo. Se comparan sin tildes ni mayúsculas y por palabra completa:
            «arma» no rechaza «armario».
          </p>
          <form action={agregarPalabra} className={`mt-3 flex flex-wrap items-end gap-3 ${TARJETA}`}>
            <div className="flex flex-col gap-1">
              <label htmlFor="nueva-frase" className="text-xs text-muted">
                Frase
              </label>
              <input id="nueva-frase" name="frase" required maxLength={60} className={CAMPO} />
            </div>
            <div className="flex min-w-60 flex-1 flex-col gap-1">
              <label htmlFor="nuevo-motivo" className="text-xs text-muted">
                Motivo (lo ve quien publica)
              </label>
              <input id="nuevo-motivo" name="motivo" required maxLength={200} className={CAMPO} />
            </div>
            <button type="submit" className={BOTON}>
              Agregar
            </button>
          </form>
          {palabras.length > 0 && (
            <ul className="mt-3 flex flex-col gap-2" data-testid="palabras">
              {palabras.map((p) => (
                <li key={p.id} className={`flex flex-wrap items-center justify-between gap-3 ${TARJETA}`}>
                  <span className={p.activo ? "" : "text-muted line-through"}>
                    <span className="font-medium">{p.frase}</span>
                    <span className="block text-xs text-muted">{p.motivo}</span>
                  </span>
                  <form action={alternarPalabra}>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="activo" value={p.activo ? "0" : "1"} />
                    <button type="submit" className="text-sm text-brand underline">
                      {p.activo ? "Desactivar" : "Activar"}
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
          <details className="mt-3 text-sm">
            <summary className="cursor-pointer text-ink2">
              Reglas fijas (están en el código y siempre aplican)
            </summary>
            <ul className="mt-2 list-disc pl-5 text-muted">
              {MOTIVOS_FIJOS.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </details>
        </section>

        {/* ---- Historial ---- */}
        <section id="historial" className="mt-10 scroll-mt-4">
          <h2 className="font-title text-lg font-semibold">Historial</h2>
          {cambios.length === 0 ? (
            <p className="mt-1 text-sm text-muted">Todavía no hay cambios.</p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[40rem] text-left text-sm" data-testid="historial">
                <thead className="text-xs text-muted">
                  <tr>
                    <th className="py-2 pr-3 font-medium">Cuándo</th>
                    <th className="py-2 pr-3 font-medium">Quién</th>
                    <th className="py-2 pr-3 font-medium">Qué</th>
                    <th className="py-2 pr-3 font-medium">Antes</th>
                    <th className="py-2 font-medium">Después</th>
                  </tr>
                </thead>
                <tbody>
                  {cambios.map((c, i) => (
                    <tr key={i} className="border-t border-line align-top">
                      <td className="py-2 pr-3 whitespace-nowrap">{fecha.format(c.creado)}</td>
                      <td className="py-2 pr-3">{c.quien}</td>
                      <td className="py-2 pr-3">{queCambio(c)}</td>
                      <td className="py-2 pr-3 text-muted">{c.antes ? enPalabras(c.antes) : "Nuevo"}</td>
                      <td className="py-2">{enPalabras(c.despues)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </>
  );
}
