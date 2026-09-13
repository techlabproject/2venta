# Informe de dirección de arte — 2venta

Autor: arte (director de arte, ronda de diseño 2026-09-13)
Alcance: identidad visual únicamente. No toqué código de producto. Referencias de
captura: `e2e/visual/pantallas.spec.ts-snapshots/*.png`. Código leído para dar
soluciones implementables: `src/app/globals.css`, `src/components/ui.tsx`,
`src/components/VerifiedBadge.tsx`, `src/components/AppHeader.tsx`,
`src/components/Logo.tsx`, `src/features/catalog/ListingCard.tsx`,
`src/app/page.tsx`, `src/app/producto/[id]/page.tsx`, `src/app/cuenta/page.tsx`.

Nota: en `perfil-vendedor-*` y en `cuenta-*` y `pedido-compradora-*` aparecen barras
magenta sólidas. No es un bug visual: es el `mask` de Playwright que tapa fechas
relativas antes de comparar capturas (`e2e/visual/pantallas.spec.ts`, línea 12). No
lo incluyo como hallazgo.

---

## 1. Diagnóstico en tres frases

Todo en 2venta es la misma tarjeta: `bg-white rounded-2xl p-4` se repite en el
catálogo, el carrito, las sesiones de la cuenta, el pedido y el perfil del
vendedor, así que nada tiene una superficie propia y todo compite al mismo nivel.
El mostaza, que debería significar "esta es la acción de plata", se usa también en
el badge de tienda y se diluye; el verde, que es el color de marca, casi no sale de
la barra superior. Y lo más grave: el video obligatorio, el pago protegido y el
distintivo "Verificado" — las tres cosas que existen para que alguien confíe lo
suficiente como para pagarle a un desconocido — están tipografiados como
letra pequeña (`text-xs`, `text-sm`, `font-medium`), exactamente igual que un
aviso legal o una etiqueta de categoría, así que el ojo no tiene ninguna razón para
detenerse ahí primero.

---

## 2. Hallazgos con gravedad

### H1 — ALTO. El distintivo "Verificado" no tiene la fuerza que merece
**Pantalla:** `inicio-movil-darwin.png`, `ficha-movil-darwin.png`,
`perfil-vendedor-movil-darwin.png` (aparece en las 35 pantallas, siempre igual).
**Qué esperaba:** el elemento que sostiene toda la promesa de confianza (D-14,
D-23) debería ser el segundo elemento más visible de una tarjeta de producto,
después del precio.
**Qué encontré:** `src/components/VerifiedBadge.tsx` renderiza un círculo de
`14px` y texto `text-xs font-medium text-brand` — el mismo tamaño y peso que
"Chapinero" o "Usado, buen estado" al lado. En la ficha de producto
(`ficha-movil-darwin.png`) el badge junto al nombre del vendedor es indistinguible
a primera vista de una etiqueta de zona.
**Por qué importa:** es el detalle que "hace que un comprador se anime a pagarle a
alguien que no conoce" (así lo dice el propio código, `src/app/vender/page.tsx`).
Tratarlo como texto secundario contradice lo que el producto dice de sí mismo.
**Solución propuesta:** convertir el badge en una píldora con fondo sólido, no en
texto suelto con un ícono. Detalle exacto en la sección 4.

### H2 — ALTO. "Pago protegido" se ve igual que cualquier caja de FAQ
**Pantalla:** `ficha-movil-darwin.png`, `ficha-escritorio-darwin.png`.
**Qué esperaba:** la caja de pago protegido es, junto con el video, el corazón del
producto (BRIEF.md). Debería tener una superficie que no se confunda con nada más
en la pantalla.
**Qué encontré (`src/app/producto/[id]/page.tsx`, línea 115):**
`<div className="mt-6 rounded-2xl bg-white p-4 text-sm">` — exactamente la misma
receta que la sección "Preguntas" quince líneas más abajo, que la tarjeta de
"Tu publicación" del vendedor, y que cualquier tarjeta del catálogo. Un comprador
que hace scroll rápido no tiene ninguna señal visual de que acaba de pasar por la
parte más importante de la decisión de compra.
**Solución propuesta:** superficie propia en verde marca con ícono, ver sección 4.

### H3 — ALTO. El precio no tiene tratamiento de precio
**Pantalla:** `inicio-movil-darwin.png`, `busqueda-resultados-movil-darwin.png`,
`ficha-movil-darwin.png`.
**Qué esperaba:** en un marketplace, el precio es lo primero que mira un
comprador (así lo dice el propio brief). Debería tener el mayor contraste de la
tarjeta: color propio, peso propio, quizás cifras tabulares.
**Qué encontré:** en `ListingCard.tsx` el precio es
`font-title text-lg font-semibold` en `--color-ink` (`#17251F`) — el mismo color
de texto que el título del producto dos líneas abajo y que cualquier `h1`/`h2`/`h3`
de la aplicación. En la ficha (`producto/[id]/page.tsx` línea 92) sí sube a
`text-3xl`, lo cual está bien, pero sigue siendo el mismo `ink` que el resto del
texto: nada le dice al ojo "este número es distinto de los demás".
**Consecuencia visible:** en `inicio-movil-darwin.png`, con doce tarjetas en
pantalla, los doce precios y los doce títulos pesan exactamente igual — es una
pared de texto gris oscuro con fotos encima, no una vitrina de precios.
**Solución propuesta:** componente `Price` con color propio y cifras tabulares,
sección 4.

### H4 — MEDIO. Una sola superficie para treinta y cinco pantallas
**Pantalla:** todas — comparar `cuenta-movil-darwin.png`,
`carrito-con-cosas-movil-darwin.png`, `perfil-vendedor-movil-darwin.png` y
`pedido-vendedor-movil-darwin.png` lado a lado.
**Qué encontré:** `bg-white rounded-2xl` (a veces `p-4`, a veces `p-3`) es
literalmente el único tipo de superficie que existe en el sistema. La sesión
abierta del celular, el producto en el carrito, la publicación del vendedor y el
resumen del pedido usan la receta idéntica. No hay una segunda superficie —ni una
más plana para contenido secundario, ni una con textura o tinte para contenido
que merece más atención— así que no hay jerarquía posible entre "esto es
información" y "esto es la decisión que tienes que tomar".
**Solución propuesta:** definir en `globals.css` un segundo nivel de superficie
(`surface-tint`, fondo `--color-cream-2` o `bg-brand/5` con borde `border-brand/10`)
para todo lo que sea informativo-pero-no-accionable (sesiones, historial de
movimientos, metadatos), y reservar la tarjeta blanca sólida para lo que se puede
tocar o comprar. No es una tarjeta más: es una regla de cuándo usar cuál.

### H5 — MEDIO. El mostaza pierde significado por reuso
**Pantalla:** `inicio-movil-darwin.png` (chip "Buscar"), `ficha-movil-darwin.png`
("Comprar con pago protegido"), `tienda-movil-darwin.png`
("Registrar la tienda"), y el badge "Tienda" dentro de `ListingCard.tsx`.
**Qué encontré:** el comentario en `src/components/ui.tsx` línea 12 dice
literalmente *"El acento mostaza se reserva para la acción principal de cada
pantalla"* — es una regla consciente y buena. Pero en `ListingCard.tsx` líneas
39–42, el badge "Tienda" usa `bg-accent/20 text-accent-text`, el mismo color que
el botón de comprar, para una etiqueta que no es una acción. El comprador ve
mostaza en "Buscar", en "Comprar", en "Enviar" del chat y en una etiqueta pasiva
de "Tienda" — cuatro significados distintos con el mismo color.
**Solución propuesta:** el badge "Tienda" debería usar el verde marca (`bg-brand/10
text-brand`, el mismo tratamiento que ya usa el badge "Destacado" tres líneas
arriba en el mismo archivo) y dejar el mostaza exclusivamente para botones que
cobran o avanzan dinero.

### H6 — MEDIO. Escritorio es el mismo móvil con más crema alrededor
**Pantalla:** `publicar-escritorio-darwin.png`, `admin-escritorio-darwin.png`.
**Qué encontré:** `src/app/page.tsx` línea 16 y `producto/[id]/page.tsx` línea 62
fijan `max-w-3xl` (768px) para todo, incluida la pantalla de escritorio de 1280px
de las capturas. En `publicar-escritorio-darwin.png` el formulario de publicar
—un solo bloque de campos apilados verticalmente— queda flotando en una columna
angosta con más de 400px de crema vacío a cada lado. En
`admin-escritorio-darwin.png` es todavía más notorio: un encabezado y una frase de
texto ocupan el 15% superior de una pantalla completamente vacía por debajo.
**Por qué importa para el diagnóstico de "plano":** el dueño ve la versión de
escritorio y percibe que nadie diseñó para esa pantalla — es la versión móvil
estirada, sin decisiones nuevas de layout. Eso lee como plantilla, no como
producto con dirección propia.
**Solución propuesta:** no es de las tres de mayor impacto por el esfuerzo que
pide (rehacer layouts, no solo tokens), pero el camino más barato es: en
`producto/[id]/page.tsx`, pasar a un grid de dos columnas desde `md:` — video y
fotos a la izquierda ocupando ~60%, precio/vendedor/pago protegido a la derecha en
una columna fija (`md:sticky md:top-6`) que acompañe el scroll. Es el cambio de
escritorio con mayor retorno porque es exactamente la pantalla donde se decide la
compra.

### H7 — MEDIO. El único elemento gráfico de marca vive solo en el logo
**Pantalla:** cualquier encabezado, por ejemplo `inicio-escritorio-darwin.png`.
**Qué encontré:** `src/components/Logo.tsx` tiene una idea real — un arco mostaza
incompleto (`strokeDasharray="198 266"`, "ciclo de reuso") alrededor del "2". Es lo
único parecido a un ícono propio en toda la aplicación. Pero se queda ahí: `h-8`
(32px) junto al wordmark, y no vuelve a aparecer en ningún otro lugar —ni como
marca de agua en el placeholder de video, ni como separador de sección, ni en el
estado vacío de "Avisos" o "Guardados" (`avisos-movil-darwin.png`,
`favoritos-movil-darwin.png`), que hoy son solo texto centrado sobre crema.
**Solución propuesta:** reusar el arco (no el "2", el arco solo) como recurso
gráfico secundario: como contorno decorativo detrás del número en las tarjetas de
métricas (`metricas-movil-darwin.png`), o como el marco del reproductor de video en
la ficha en vez de un `rounded-2xl` genérico compartido con las fotos.

### H8 — BAJO. Los estados vacíos no tienen personalidad
**Pantalla:** `avisos-movil-darwin.png`, `no-encontrado-movil-darwin.png`,
`busqueda-sin-resultados-movil-darwin.png`.
**Qué encontré:** "Nada nuevo. Guarda una búsqueda y te avisamos cuando aparezca
algo que coincida." — texto correcto y bien escrito, pero sin ningún acompañamiento
visual: ni un ícono, ni el arco del logo, ni una diferencia de color contra el
fondo crema. Es la oportunidad más barata de meter carácter porque son pantallas
sin datos reales que mostrar, así que todo lo que se vea ahí es 100% diseño.
**Solución propuesta:** un ícono de línea simple (una lupa con el arco mostaza
como "brillo", coherente con H7) de unos 48px arriba del texto en cada estado
vacío.

### H9 — DUDA. Las fotos de la demo no parecen fotos de segunda mano en Bogotá
**Pantalla:** `inicio-movil-darwin.png` (atrapasueños, guante de béisbol,
tornamesa Audio-Technica).
**Qué encontré:** son fotos de stock genéricas (luz dorada, composición
editorial) que no se parecen a una foto tomada por un vendedor colombiano con el
celular. No sé si esto es dato de siembra (`npm run db:seed`) reemplazable o si
influye en cómo se van a ver las fotos reales. Lo marco como duda y no como
hallazgo de diseño: el encuadre (`aspect-[4/3]`, `object-cover`, esquinas
`rounded-2xl` en `ListingCard.tsx`) sí es correcto y no hace falta tocarlo.

---

## 3. Propuesta de dirección visual — ordenada por impacto

1. **Rehacer el distintivo "Verificado" como píldora sólida** (H1). Es el cambio
   de mayor impacto por costo: un componente, usado en toda la aplicación.
2. **Dar a "Pago protegido" una superficie propia, verde marca, con ícono** (H2).
   Segundo cambio de mayor impacto: convierte el bloque que vende la promesa del
   producto en el punto focal real de la ficha.
3. **Tratamiento de precio propio, con color de marca y cifras tabulares** (H3).
   Se toca un solo componente (`Price`) y se usa en cuatro sitios: catálogo,
   ficha, carrito, resumen de pedido.
4. **Reservar el mostaza para dinero, mover el badge "Tienda" a verde** (H5).
   Es literalmente cambiar dos clases de Tailwind en `ListingCard.tsx`.
5. **Segunda superficie para contenido informativo** (H4): un tono
   `bg-brand/5 border border-brand/10` para todo lo que no sea accionable —
   sesiones, movimientos del pedido, metadatos — dejando la tarjeta blanca para
   lo que se compra o se toca.
6. **Grid de dos columnas en la ficha de producto para escritorio** (H6), con la
   columna de compra fija (`sticky`) al lado del video.
7. **Extender el arco del logo como recurso gráfico** en estados vacíos, marcos de
   video y tarjetas de métricas (H7, H8).

**Qué NO tocar:**
- La paleta base. Verde bosque + mostaza + crema no es el problema —el problema es
  que el mostaza se usa para todo y el verde casi no se usa para nada fuera de la
  barra superior. No hace falta un color nuevo, hace falta usar mejor los tres que
  ya existen.
- El patrón de tokens centralizados en `globals.css` (el comentario del archivo lo
  dice bien: "cualquier color nuevo se agrega aquí, nunca suelto en un
  componente"). Es exactamente la disciplina correcta; lo que falta son más
  tokens, no menos disciplina.
- `:focus-visible` con contorno verde marca de 2px — está bien y no hay que
  perderlo al rediseñar componentes.
- Las pantallas de autenticación (`bienvenida-movil-darwin.png`,
  `registro-movil-darwin.png`) están bien resueltas para lo que son: simples,
  directas, con jerarquía clara entre "Quiero comprar" y "Quiero vender". No
  necesitan más adorno.
- La pareja tipográfica Poppins/Work Sans. Es una elección segura, sí, pero
  cambiarla no resuelve nada de lo diagnosticado aquí: el problema no es qué
  fuente se usa, es que se usa siempre al mismo peso y al mismo color. Antes de
  gastar presupuesto en una fuente con más carácter, hay que sacarle el contraste
  que la pareja actual ya permite (Poppins llega hasta 700 y casi no se usa a 700
  fuera de los `h1`).

---

## 4. Los tres cambios de mayor impacto, listos para copiar

### 4.1 — Distintivo "Verificado" (reemplaza `src/components/VerifiedBadge.tsx` completo)

```tsx
// El distintivo solo se pinta cuando hay una verificación aprobada por el
// proveedor externo. Mostrarlo sin dato real detrás le mentiría al comprador sobre
// lo único que diferencia a 2venta de un grupo de compraventa cualquiera.
export function VerifiedBadge({
  className = "",
  label = "Verificado",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full bg-brand px-2.5 py-1 text-xs font-semibold text-cream ${className}`}
    >
      <svg viewBox="0 0 16 16" className="h-4 w-4 shrink-0" aria-hidden="true">
        <circle cx="8" cy="8" r="8" fill="#E8A94C" />
        <path
          d="M4.5 8.2l2.3 2.3 4.7-4.7"
          fill="none"
          stroke="#17251F"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {label}
    </span>
  );
}
```

Por qué esta combinación puntual: la píldora verde con el círculo mostaza adentro
es la única vez que los dos colores de marca aparecen juntos en un mismo
elemento. Repetido treinta y cinco veces por la aplicación, se vuelve
reconocible por sí solo — que es exactamente lo que le falta a la marca según el
diagnóstico de la sección 1.

### 4.2 — Caja "Pago protegido" (reemplaza el bloque en
`src/app/producto/[id]/page.tsx`, líneas 115–142)

```tsx
<div className="mt-6 overflow-hidden rounded-2xl bg-brand text-cream shadow-sm">
  <div className="flex items-start gap-3 p-5">
    <svg viewBox="0 0 24 24" className="mt-0.5 h-7 w-7 shrink-0 text-accent" aria-hidden="true">
      <path
        d="M12 2 4 5v6c0 5 3.4 8.7 8 10 4.6-1.3 8-5 8-10V5l-8-3Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M8.5 12.2l2.3 2.3 4.7-4.7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
    <div>
      <p className="font-title text-lg font-semibold">Pago protegido</p>
      <p className="mt-1 text-sm text-cream/85">
        Guardamos tu plata hasta que confirmes que recibiste el producto.
      </p>
    </div>
  </div>

  <div className="flex flex-col gap-2 bg-cream p-4 text-ink">
    {listing.status === "activa" ? (
      <BuyButton listingId={listing.id} />
    ) : (
      <p role="status" className="rounded-xl bg-ph px-4 py-3 text-sm text-ink2">
        {listing.status === "vendida"
          ? "Este artículo ya se vendió."
          : listing.status === "reservada"
            ? "Este artículo está reservado para otra persona."
            : "Este artículo no está disponible."}
      </p>
    )}
    {user && !isSeller && listing.status === "activa" && (
      <AddToCartButton listingId={listing.id} inCart={inCart} />
    )}
    {!isSeller && <ChatButton listingId={listing.id} />}
    {user && !isSeller && (
      <div className="mt-1">
        <FavoriteButton listingId={listing.id} saved={favorited} />
      </div>
    )}
  </div>
</div>
```

El encabezado verde con ícono queda como la "promesa" (lo que se lee al pasar el
ojo rápido) y los botones se quedan sobre crema, sin necesitar retocar `Button` en
`ui.tsx` — el contraste del mostaza sobre crema ya es el que está probado en el
resto de la aplicación.

### 4.3 — Tratamiento de precio (componente nuevo + un cambio de uso)

Nuevo archivo `src/components/Price.tsx`:

```tsx
import { formatCop } from "@/lib/money";

const SIZE = {
  sm: "text-lg",
  md: "text-2xl",
  lg: "text-[2.25rem] leading-none",
} as const;

export function Price({
  cop,
  size = "md",
  className = "",
}: {
  cop: number;
  size?: keyof typeof SIZE;
  className?: string;
}) {
  return (
    <p
      className={`font-title ${SIZE[size]} font-bold text-brand-d tabular-nums ${className}`}
    >
      {formatCop(cop)}
    </p>
  );
}
```

Uso en `src/features/catalog/ListingCard.tsx` (reemplaza la línea del precio):

```tsx
// antes: <p className="font-title text-lg font-semibold">{formatCop(listing.price_cop)}</p>
<Price cop={listing.price_cop} size="sm" />
```

Uso en `src/app/producto/[id]/page.tsx` (reemplaza la línea 92–94):

```tsx
// antes:
// <p className="mt-5 font-title text-3xl font-semibold">{formatCop(listing.price_cop)}</p>
<Price cop={listing.price_cop} size="lg" className="mt-5" />
```

`text-brand-d` (`#244a35`, ya existe en `globals.css`) separa el precio del
`ink` (`#17251F`) que usa todo lo demás — es sutil pero constante, y
`tabular-nums` evita que los dígitos "bailen" de ancho entre tarjetas contiguas en
el grid de dos columnas del catálogo, algo que hoy se nota en
`inicio-movil-darwin.png` al comparar $35.000 con $1.650.000 uno al lado del otro.
