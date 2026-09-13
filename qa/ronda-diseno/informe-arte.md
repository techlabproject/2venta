# Informe de dirección de arte — 2venta

Autor: arte (director de arte, ronda de diseño 2026-09-13, revisión post-actualización 17:40)
Alcance: identidad visual. No toqué código de producto. Evidencia principal:
`e2e/visual/pantallas.spec.ts-snapshots/*.png` (las 35 pantallas, móvil y
escritorio). Código leído solo para dar soluciones implementables: `src/app/globals.css`,
`src/components/ui.tsx`, `src/components/VerifiedBadge.tsx`, `src/components/AppHeader.tsx`,
`src/components/Logo.tsx`, `src/features/catalog/ListingCard.tsx`,
`src/app/producto/[id]/page.tsx`, `src/app/vendedor/[id]/page.tsx`, `src/lib/money.ts`.

Nota sobre las capturas: en `perfil-vendedor-*`, `cuenta-*` y `pedido-compradora-*`
aparecen barras magenta sólidas. No es un bug visual — es el `mask` de Playwright
que tapa fechas y el número de pedido antes de comparar (`pantallas.spec.ts`,
línea 78-83). No lo cuento como hallazgo.

---

## Aviso antes de leer el resto: el código ya no es el de las capturas en tres sitios

Al leer el código para escribir soluciones implementables encontré que
`git status` marca tres archivos como modificados **sin confirmar**:

```
 M src/app/producto/[id]/page.tsx
 M src/components/VerifiedBadge.tsx
 M src/features/catalog/ListingCard.tsx
```

Comparé el diff con lo que iba a recomendar en la sección 2 y **son, casi al
carácter, las mismas tres correcciones**: el distintivo "Verificado" convertido
en píldora sólida verde con el visto en mostaza, la caja "Pago protegido" con
encabezado verde marca en vez de tarjeta blanca genérica, y el badge "Tienda"
movido de mostaza a verde. Los comentarios que alguien dejó en el código incluso
narran el cambio ("Antes era texto pequeño del mismo tamaño que la zona...",
"Tenía la misma tarjeta blanca que las preguntas de más abajo... ahora lleva el
verde de marca").

Esto no debería estar aquí todavía por dos razones, y se lo digo a Nicolás
directamente y no a quien lo escribió, porque no sé quién fue:

1. **Las capturas no se regeneraron.** Las 35 imágenes que este informe usa como
   evidencia y que el brief dice "recién regeneradas" siguen mostrando la versión
   *anterior* de estos tres archivos (verifiqué las fechas: las capturas son de
   las 17:23, estos archivos se tocaron a las 17:41). Si alguien corre
   `npm run test:visual` ahora mismo, esas tres pruebas van a fallar por un
   cambio real, no por ruido.
2. **No pasó por una rebanada ni por la disciplina que el propio `CLAUDE.md`
   pide** (rebanada con su prueba de punta a punta, decisión anotada en
   `DECISIONS.md`). Es exactamente el atajo que existe para evitar: un cambio
   visual bueno, hecho fuera del proceso, sin prueba que lo respalde.

No deshice nada — mi encargo es reportar, no reparar, y deshacer un cambio sin
confirmar tampoco es mi lugar. Pero en las tres secciones de abajo donde esto
aplica lo marco como **"ya escrito, sin confirmar"** en vez de pedir un cambio
nuevo, y recomiendo un solo paso siguiente: alguien del equipo debe correr
`npm run verify` (o al menos `test:visual` con el servidor de desarrollo apagado,
por el gotcha ya documentado), mirar el diff visual con sus propios ojos, y si
queda bien, confirmarlo como commit con su rebanada y su prueba. El resto de este
informe evalúa el producto **tal como se ve hoy en las capturas**, que es el
encargo que me dieron.

---

## 1. Diagnóstico en tres frases

Todo en 2venta es la misma tarjeta — `bg-white rounded-2xl` se repite en el
catálogo, el carrito, las sesiones de la cuenta, el pedido y el perfil del
vendedor — así que nada tiene una superficie propia y todo compite al mismo
nivel visual. El verde de marca casi no sale de la barra superior y el mostaza
aparece en botones, en insignias y en chips por igual, así que ninguno de los
dos colores termina significando algo específico. Y las dos pantallas que
deberían generar más confianza que cualquier otra — la ficha con el video, y el
"Pago protegido" — hoy están (en lo que muestran las capturas) tratadas con el
mismo blanco y el mismo texto pequeño que una sección de preguntas frecuentes,
así que el ojo no tiene ninguna razón para detenerse ahí primero.

---

## 2. Hallazgos con gravedad

### H1 — ALTO (ya escrito, sin confirmar). El distintivo "Verificado" no tiene la fuerza que merece
**Pantalla:** `inicio-movil-darwin.png`, `ficha-movil-darwin.png`,
`perfil-vendedor-movil-darwin.png` (aparece en las 35 pantallas, siempre igual
en las capturas actuales).
**Qué esperaba:** el elemento que sostiene toda la promesa de confianza (video +
identidad verificada + pago retenido) debería ser el segundo elemento más
visible de una tarjeta, después del precio.
**Qué muestran las capturas:** un círculo de check de 14px y texto
`text-xs font-medium` del mismo tamaño y peso que "Chapinero" o "Usado, buen
estado" al lado. En `ficha-movil-darwin.png`, junto al nombre de la vendedora,
es indistinguible a primera vista de un metadato cualquiera.
**Estado en el código:** `src/components/VerifiedBadge.tsx` ya tiene, sin
confirmar, la solución (píldora `bg-brand` con visto mostaza, ver diff arriba).
Falta correr la prueba visual y confirmar el commit.

### H2 — ALTO (ya escrito, sin confirmar). "Pago protegido" se ve igual que una caja de FAQ
**Pantalla:** `ficha-movil-darwin.png`, `ficha-escritorio-darwin.png`.
**Qué esperaba:** junto con el video, es el corazón del producto (BRIEF.md).
Necesita una superficie que no se confunda con nada más en la pantalla.
**Qué muestran las capturas:** `rounded-2xl bg-white p-4` — la misma receta que
la sección "Preguntas" quince líneas más abajo en la misma pantalla, y que
cualquier tarjeta del catálogo. Alguien que hace scroll rápido no tiene ninguna
señal de que acaba de pasar por la parte más importante de la decisión de
compra.
**Estado en el código:** `src/app/producto/[id]/page.tsx` ya tiene, sin
confirmar, un encabezado `bg-brand text-cream` con ícono de escudo antes de los
botones de acción (ver diff arriba). Misma recomendación: probar y confirmar.

### H3 — ALTO. El precio no tiene tratamiento de precio
**Pantalla:** `inicio-movil-darwin.png`, `busqueda-resultados-movil-darwin.png`,
`ficha-movil-darwin.png`. **Este no tiene cambio pendiente en el código; sigue
abierto.**
**Qué esperaba:** en un marketplace el precio es lo primero que mira un
comprador (lo dice el propio brief). Debería tener el mayor contraste de la
tarjeta.
**Qué encontré:** en `ListingCard.tsx` el precio es
`font-title text-xl font-semibold tracking-tight tabular-nums` en `--color-ink`
(`#17251F`) — el mismo color que el título del artículo dos líneas abajo y que
cualquier encabezado de la aplicación. En la ficha (`producto/[id]/page.tsx`)
sube a `text-3xl`, que está bien, pero sigue siendo el mismo `ink` que todo el
resto del texto: nada le dice al ojo "este número es distinto".
**Consecuencia visible:** en `inicio-movil-darwin.png`, con doce tarjetas en
pantalla, los doce precios y los doce títulos pesan visualmente igual — es una
pared de texto oscuro con fotos encima, no una vitrina de precios.
**Solución propuesta:** componente `Price` con color propio. Detalle en la
sección 4.

### H4 — ALTO. El video, el diferenciador del negocio, se anuncia con la misma píldora que cualquier plataforma
**Pantalla:** las 35 pantallas que muestran una tarjeta de artículo; también
`ficha-escritorio-darwin.png` ("Grabado por el vendedor").
**Qué esperaba:** el video grabado dentro de la app es la razón por la que
alguien le paga a un desconocido (BRIEF.md, D-14 en `DECISIONS.md`). Es el dato
que más debería distinguir a 2venta de Marketplace o Mercado Libre en el propio
feed.
**Qué encontré:** `ListingCard.tsx` línea 28 y `producto/[id]/page.tsx` usan
`bg-ink/70` — un pill gris oscuro semitransparente con ícono de play, idéntico
al que pondría cualquier reproductor de video genérico. No lleva ningún color de
marca. Es exactamente el mismo tratamiento visual que usaría YouTube, Vimeo o
cualquier feed de anuncios clasificados sin nada que ver con 2venta.
**Por qué importa:** aparece en cada una de las doce tarjetas del feed, en cada
resultado de búsqueda, en el perfil del vendedor y en la ficha — es de lejos el
elemento más repetido de toda la aplicación después del botón "Verificado", y
hoy no lleva ni una gota de identidad.
**Solución propuesta:** insignia con marca propia. Detalle en la sección 4.

### H5 — MEDIO. Una sola superficie para treinta y cinco pantallas
**Pantalla:** todas — comparar `cuenta-escritorio-darwin.png`,
`carrito-con-cosas-escritorio-darwin.png`, `favoritos-escritorio-darwin.png` y
`busqueda-sin-resultados-escritorio-darwin.png` lado a lado.
**Qué encontré:** `bg-white rounded-2xl` (a veces `p-3`, a veces `p-4`) es
literalmente el único tipo de superficie que existe. La sesión abierta del
celular, el producto guardado, el mensaje de "carrito vacío" y el resumen del
pedido usan la receta idéntica. No hay una segunda superficie —ni una más plana
para contenido informativo, ni una con tinte para lo que merece más atención—
así que no hay jerarquía posible entre "esto es información" y "esto es una
decisión".
**Solución propuesta:** un segundo nivel de superficie en `globals.css`
(`bg-brand/5` con `border border-brand/10`) para todo lo informativo-pero-no-
accionable — sesiones, movimientos del pedido, mensajes de estado vacío —
dejando la tarjeta blanca sólida reservada para lo que se puede tocar o
comprar. No es una tarjeta más: es una regla de cuándo usar cuál.

### H6 — MEDIO. Las pantallas de entrada no llevan marca
**Pantalla:** `ingresar-escritorio-darwin.png`, `registro-escritorio-darwin.png`,
`recuperar-escritorio-darwin.png`.
**Qué esperaba:** son la primera pantalla real que ve alguien que ya decidió
entrar. Deberían sentirse inequívocamente de 2venta, igual que `bienvenida`, que
sí lleva el isotipo arriba del título.
**Qué encontré:** `AuthShell` en `src/components/ui.tsx` (línea 75) no renderiza
el logo — solo un `<h1>` con el título de la pantalla flotando solo sobre crema.
En `ingresar-escritorio-darwin.png` la pantalla completa es: título, dos campos,
un botón mostaza, dos enlaces. Ningún color verde, ningún isotipo, nada que diga
"2venta" en toda la pantalla. Comparado con `bienvenida`, un paso antes en el
mismo flujo, es un salto brusco de identidad a formulario genérico.
**Por qué importa para el diagnóstico de "plano":** es literalmente la pantalla
que cualquier plantilla de SaaS produciría sin cambiar una línea. Si alguien
tomara una captura de `ingresar` sin el dominio visible, no hay ninguna pista de
qué producto es.
**Solución propuesta:** agregar el isotipo a `AuthShell`. Detalle en la
sección 4.

### H7 — MEDIO (ya escrito, sin confirmar). El mostaza pierde significado por reuso
**Pantalla:** `inicio-movil-darwin.png` (chip "Buscar"), `ficha-movil-darwin.png`
("Comprar con pago protegido"), `tienda-movil-darwin.png` ("Registrar la
tienda"), y el badge "Tienda" dentro de `ListingCard.tsx`.
**Qué muestran las capturas:** el comentario en `src/components/ui.tsx` línea 12
dice *"El acento mostaza se reserva para la acción principal de cada pantalla"*
— una regla consciente y buena. Pero en las capturas actuales el badge "Tienda"
en `perfil-vendedor-escritorio-darwin.png` y `tienda-escritorio-darwin.png"`
todavía usa `bg-accent/20 text-accent-text`, el mismo color que "Comprar", para
una etiqueta que no es una acción. El comprador ve mostaza en "Buscar", en
"Comprar", en "Enviar" del chat y en una etiqueta pasiva de "Tienda" — cuatro
significados distintos con el mismo color.
**Estado en el código:** `ListingCard.tsx` ya tiene, sin confirmar, el cambio a
`bg-brand/10 text-brand` (el mismo tratamiento que ya usa el badge "Destacado"
tres líneas arriba). Falta probar y confirmar, igual que H1 y H2.

### H8 — MEDIO. La escala tipográfica casi no tiene contraste
**Pantalla:** `inicio-movil-darwin.png`, cualquier pantalla con un `<h1>`.
**Qué encontré:** en `globals.css` no hay una escala declarada más allá de
Tailwind por defecto, y en la práctica el rango que usa el producto va de
`text-xs` (12px) a `text-3xl` (30px, solo en el precio de la ficha) con
`font-semibold` como el peso más fuerte que aparece — Poppins llega hasta 700
mientras el sistema casi nunca pasa de 600. Los `h1` de pantalla (`Tu carrito`,
`Buscar`, `Moderación`) son `text-2xl font-semibold`, un paso apenas por encima
del cuerpo. No hay ningún momento tipográfico realmente grande en todo el
producto — ni siquiera en `bienvenida`, la pantalla que más se acerca a una
portada.
**Solución propuesta:** reservar `font-bold` (700) y un salto de escala real
(`text-4xl`/`text-5xl` en escritorio) para máximo dos lugares: el titular de
`bienvenida`/franja verde de `inicio`, y el precio en la ficha de producto
(ver `Price` en la sección 4, variante `lg`). No hace falta tocar el resto de
los `h1` de pantalla — esos pueden seguir discretos; el contraste debe
concentrarse donde hay una decisión real que tomar.

### H9 — BAJO. Los estados vacíos no tienen personalidad
**Pantalla:** `busqueda-sin-resultados-escritorio-darwin.png`,
`carrito-vacio-escritorio-darwin.png`, `favoritos-escritorio-darwin.png` (cuando
no hay guardados).
**Qué encontré:** "No encontramos nada con eso" o "Está vacío" — texto correcto
y bien escrito, pero sin ningún acompañamiento visual: ni un ícono, ni el arco
del logo, ni una diferencia de color contra el fondo crema. Es la oportunidad
más barata de meter carácter porque son pantallas sin datos reales que mostrar,
así que todo lo que se vea ahí es 100% diseño.
**Solución propuesta:** reusar el arco mostaza incompleto de `Logo.tsx` (ver H10)
como un ícono de 40-48px sobre el texto en cada estado vacío, en vez de agregar
una librería de ilustración nueva.

### H10 — BAJO. El único elemento gráfico de marca vive solo en el logo, y en 32px
**Pantalla:** cualquier encabezado, por ejemplo `inicio-escritorio-darwin.png`.
**Qué encontré:** `src/components/Logo.tsx` tiene una idea real — un arco
mostaza incompleto (`strokeDasharray="198 266"`, pensado como "ciclo de reuso")
alrededor del número "2". Es lo único parecido a un ícono propio en toda la
aplicación. Pero se queda en `h-8` (32px) junto al wordmark y no vuelve a
aparecer en ningún otro lugar: ni como marco del reproductor de video, ni como
separador de sección, ni en los estados vacíos (H9), ni en las tarjetas de
métricas del vendedor (`metricas-escritorio-darwin.png`, donde "0" y "2" son
solo números negros sobre blanco).
**Solución propuesta:** no diseñar un ícono nuevo — extender el que ya existe.
El arco (sin el "2") como contorno decorativo detrás de los números grandes en
`metricas`, y como esquina del marco de video en la ficha en vez de un
`rounded-2xl` genérico compartido con las fotos.

### H11 — DUDA. Las fotos de la demostración no parecen fotos de segunda mano en Bogotá
**Pantalla:** `inicio-movil-darwin.png` (atrapasueños, guante de béisbol,
tornamesa Audio-Technica, mujer con gafas de sol en un campo dorado).
**Qué encontré:** son fotos de stock editorial (luz dorada, composición de
revista) que no se parecen a una foto tomada por un vendedor colombiano con el
celular en su casa. No sé si es dato de siembra (`npm run db:seed`)
reemplazable antes de producción o si va a influir en cómo se ven las fotos
reales. Lo marco como duda, no como hallazgo: el encuadre (`aspect-[4/3]`,
`object-cover`, esquinas redondeadas) sí es correcto y no hace falta tocarlo.
Lo que sí digo con seguridad: si las fotos reales de Bogotá van a verse más
"caseras" que esto, vale la pena decidirlo ahora — una demo con fotos
aspiracionales que no se parecen al producto real genera una expectativa que
después decepciona.

---

## 3. Propuesta de dirección visual — ordenada por impacto

1. **Confirmar (probar y comitear) los tres cambios que ya están escritos**: el
   distintivo "Verificado" en píldora (H1), la caja "Pago protegido" en verde
   marca (H2) y el badge "Tienda" en verde (H7). Es impacto alto a costo cero de
   diseño — el trabajo de diseño ya está hecho, falta el trabajo de ingeniería
   (probar, confirmar) para que exista de verdad.
2. **Insignia "Con video" con identidad propia** (H4): es el elemento más
   repetido de toda la aplicación y hoy no tiene ni un color de marca.
3. **Tratamiento de precio propio** (H3): un componente, usado en cuatro sitios
   (catálogo, ficha, carrito, pedido).
4. **Isotipo en las pantallas de entrada** (H6): `AuthShell` es un solo
   componente; el cambio se propaga a cuatro pantallas (ingresar, registro,
   recuperar, verificar) de una vez.
5. **Segunda superficie para contenido informativo** (H5): un tono
   `bg-brand/5 border border-brand/10` para lo que no es accionable, dejando la
   tarjeta blanca para lo que se compra o se toca.
6. **Concentrar el contraste tipográfico en dos lugares** (H8): el titular de
   `bienvenida`/franja verde, y el precio grande de la ficha. No tocar el resto
   de los títulos de pantalla.
7. **Extender el arco del logo** a estados vacíos y tarjetas de métricas (H9,
   H10).

**Qué NO tocar:**
- **La paleta base.** Verde bosque + mostaza + crema no es el problema — el
  problema es que el mostaza se usa para todo y el verde casi no se usa para
  nada fuera de la barra superior. No hace falta un color nuevo, hace falta
  usar mejor los tres que ya existen. (Esto también responde la pregunta de si
  faltan tonos intermedios: no faltan colores, `--color-brand-d` y
  `--color-accent-on-brand` ya existen en `globals.css` y casi no se usan fuera
  de un componente cada uno — antes de pedir un tono nuevo, hay que gastar los
  que ya están declarados.)
- **El patrón de tokens centralizados en `globals.css`.** El comentario del
  archivo lo dice bien: "cualquier color nuevo se agrega aquí, nunca suelto en
  un componente". Es la disciplina correcta; lo que falta son más usos, no
  menos reglas.
- **La pareja tipográfica Poppins/Work Sans.** Es una elección segura, sí, pero
  cambiarla no resuelve nada de lo diagnosticado: el problema no es qué fuente
  se usa, es que se usa siempre al mismo peso y color. Poppins llega hasta 700
  y el producto casi no pasa de 600 en ningún sitio.
- **La franja verde de `inicio` y el grid de cuatro columnas en escritorio.**
  Los cambios de la actualización del brief están bien resueltos: el mensaje de
  confianza queda arriba de todo, y el feed en escritorio ya no es dos columnas
  angostas flotando en 768px de un monitor de 1280px. No hace falta más ajuste
  ahí.
- **`:focus-visible` con contorno verde marca de 2px.** Está bien y no hay que
  perderlo al tocar cualquiera de los componentes de arriba.

---

## 4. Los tres cambios de mayor impacto, listos para copiar

Elegí los tres que **no** están ya resueltos sin confirmar en el árbol de
trabajo (para no duplicar lo que solo falta probar): insignia de video,
tratamiento de precio, e isotipo en pantallas de entrada.

### 4.1 — Insignia "Con video" con identidad propia

Hoy, tanto en `ListingCard.tsx` (línea 28) como en `producto/[id]/page.tsx`
(el pill "Grabado por el vendedor"), la insignia es:

```tsx
<span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-ink/70 py-1 pr-2.5 pl-2 text-[11px] font-medium text-cream backdrop-blur-sm">
  {/* ícono de play */}
  Con video
</span>
```

Reemplazo — mismo tamaño y posición, color de marca en vez de gris genérico, y
el ícono de play cambia por un círculo sólido mostaza para que se note incluso
en miniatura:

```tsx
<span className="absolute bottom-2 left-2 inline-flex items-center gap-1.5 rounded-full bg-brand py-1 pr-2.5 pl-1.5 text-[11px] font-semibold text-cream shadow-sm">
  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-accent">
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-2.5 w-2.5 fill-on-accent">
      <path d="M8 5.14v13.72a1 1 0 0 0 1.54.84l10.3-6.86a1 1 0 0 0 0-1.68L9.54 4.3A1 1 0 0 0 8 5.14Z" />
    </svg>
  </span>
  Con video
</span>
```

En `producto/[id]/page.tsx`, el pill "Grabado por el vendedor" (que hoy también
es `bg-ink/70`) usa la misma receta pero con el texto más largo:

```tsx
<span className="pointer-events-none absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-brand px-2.5 py-1 text-[11px] font-semibold text-cream shadow-sm">
  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-accent">
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-2.5 w-2.5 fill-on-accent">
      <path d="M8 5.14v13.72a1 1 0 0 0 1.54.84l10.3-6.86a1 1 0 0 0 0-1.68L9.54 4.3A1 1 0 0 0 8 5.14Z" />
    </svg>
  </span>
  Grabado por el vendedor
</span>
```

Por qué el círculo mostaza y no solo cambiar el fondo a verde: el punto de un
video en un feed es que el ojo lo distinga rápido entre fotos fijas. Un pill
verde sólido se funde con la barra superior y con cualquier otro elemento de
marca; el círculo mostaza dentro es la señal de "hay algo reproducible aquí" y
usa el color que `ui.tsx` ya reserva para acción — ver un video es, en cierto
modo, la primera acción que un comprador hace en el artículo.

### 4.2 — Tratamiento de precio (componente nuevo + tres usos)

Nuevo archivo `src/components/Price.tsx`:

```tsx
import { formatCop } from "@/lib/money";

const SIZE = {
  sm: "text-xl",
  md: "text-2xl",
  lg: "text-[2.5rem] leading-none",
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
    <p className={`font-title ${SIZE[size]} font-bold text-brand-d tabular-nums ${className}`}>
      {formatCop(cop)}
    </p>
  );
}
```

Uso en `src/features/catalog/ListingCard.tsx` (reemplaza la línea 45-47):

```tsx
// antes:
// <p className="font-title text-xl leading-none font-semibold tracking-tight tabular-nums">
//   {formatCop(listing.price_cop)}
// </p>
<Price cop={listing.price_cop} size="sm" />
```

Uso en `src/app/producto/[id]/page.tsx` (reemplaza la línea del precio, cerca
de la línea 119):

```tsx
// antes:
// <p className="font-title text-3xl font-semibold tabular-nums">{formatCop(listing.price_cop)}</p>
<Price cop={listing.price_cop} size="lg" />
```

`--color-brand-d` (`#244a35`, ya declarado en `globals.css`, hoy casi sin uso)
separa el precio del `ink` (`#17251F`) que usa todo lo demás — sutil pero
constante en las cuatro pantallas donde aparece un precio, y `font-bold` (700)
es el primer sitio del producto que realmente usa el peso más fuerte que
Poppins ofrece.

### 4.3 — Isotipo en las pantallas de entrada (`AuthShell`)

Reemplaza `src/components/ui.tsx`, función `AuthShell` (línea 75):

```tsx
import { Logo } from "./Logo";

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 py-10">
      <Link href="/" aria-label="Ir al inicio de 2venta" className="text-brand">
        <Logo className="h-7 w-auto" />
      </Link>
      <h1 className="mt-6 font-title text-2xl font-semibold">{title}</h1>
      {subtitle && <p className="mt-2 text-sm text-ink2">{subtitle}</p>}
      <div className="mt-7 flex flex-col gap-4">{children}</div>
    </main>
  );
}
```

Un solo componente, cuatro pantallas resueltas de una vez (`ingresar`,
`registro`, `recuperar`, `verificar`). El logo ya es un `<Link>` a `/` en
`AppHeader.tsx`, así que este cambio también le da a alguien que llegó a
`ingresar` por una URL directa una forma de volver al catálogo sin usar el
botón "Atrás" del navegador — un beneficio de paso, no el objetivo, pero vale
mencionarlo.
