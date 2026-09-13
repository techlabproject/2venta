# Informe del ciclo de vida del vendedor — flujo-vendedor

Autor: flujo-vendedor (ronda de diseño 2026-09-13, revisión post-actualización 17:40)
Alcance: el ciclo completo de un vendedor, de punta a punta. No toqué código de
producto.

**Entorno de prueba.** Instrucción específica de esta tarea: local, no la nube.
Levanté `npm run dev` (puerto 3001, Turbopack) contra Postgres/MinIO/ElasticMQ ya
corriendo en Docker. La base local **no tenía cargados los datos de demostración**
pese a lo que decía el encargo — la tabla `user` no tenía ninguna cuenta
`*@2venta.demo`, solo cientos de cuentas residuales de corridas previas de
`npm run verify`. Corrí `node --env-file=.env.local --import tsx db/demo.mts`
(el mismo script idempotente que usa la nube) para cargarlas; no es un hallazgo
de producto, es un aviso de que el punto de partida de esta ronda no estaba como
se describió. A partir de ahí usé `camila@2venta.demo` (vendedora verificada, sin
tienda hasta que la registré yo en el paso 8), `laura@2venta.demo` (compradora) y
una cuenta nueva propia para recorrer el alta desde cero. Contraseña de todas:
`Demo2venta.2026`.

**Nota al margen, no es mi hallazgo pero hay que decirlo.** `git status` marca
`src/app/producto/[id]/page.tsx` y `src/features/catalog/ListingCard.tsx` como
modificados sin confirmar, y hay un `src/components/Price.tsx` nuevo sin
rastrear. Es el mismo patrón que ya reportó el agente de arte en su informe
(cambios reales, fuera de rebanada, sin prueba). Los usé tal como estaban — no
afectan nada de lo que reporto aquí, el precio se veía bien en todas las
pantallas — pero quedan pendientes de que alguien los confirme con su rebanada
o los descarte.

---

## 1. Diagrama del flujo, paso a paso

**Convención:** ✅ completo · ⚠️ incompleto (funciona pero con un hueco real) ·
❌ roto (no cumple lo que promete).

### 1. Convertirse en vendedor
| Paso | Pantalla | Cómo se llega | Estado |
|---|---|---|---|
| Descubrir que puede vender | Botón **Vender** en la cabecera | Visible siempre que hay sesión, en cualquier página | ✅ |
| Estado "sin empezar" | `/vender` → "Verifica tu identidad para vender" | Clic en Vender, cuenta sin KYC | ✅ explica el porqué (documento + selfie, nadie los guarda) y los 3 pasos. No dice cuánto va a tardar en esta pantalla — eso solo aparece un paso después |
| Estado "en revisión" | `/vender` → "Estamos revisando" | Tras "Empezar verificación" | ✅ "Suele tardar unos minutos... puedes seguir explorando mientras tanto" |
| Estado "rechazado" | `/vender` → "No pudimos verificarte" | El proveedor de prueba responde rechazo | ✅ da el motivo ("La foto de la cédula salió borrosa") y un botón "Volver a intentar" |
| Estado "aprobado" | `/vender` → "Tu espacio de vendedor" | El proveedor de prueba aprueba | ✅ panel con Publicar, Mis publicaciones, Mis ventas y conversaciones, y el enlace a tienda |

### 2. Publicar
| Paso | Pantalla | Cómo se llega | Estado |
|---|---|---|---|
| Video obligatorio | `/publicar` | "Publicar un artículo" desde `/vender` | ✅ explica por qué se graba en la app y no se sube ("es lo que le permite al comprador ver que el artículo existe") |
| Cuánto le pagan | `/publicar`, bajo el campo Precio | Al escribir un precio | ✅ se recalcula en vivo: "Te llegan $190.000 después de la comisión de 2venta ($10.000). El comprador paga $200.000 más el envío" |
| Precio sugerido | `/publicar` | Aparece si hay ≥5 ventas en esa categoría/estado | ✅ probado con la categoría Tecnología: "lo usado en buen estado se ha vendido entre $150.000 y $300.000. Es lo que dicen 9 ventas de 2venta, no una estimación" |
| Tecnología pide IMEI y avisa de la revisión | `/publicar`, categoría Tecnología | Al elegir la categoría | ✅ "La electrónica la revisa una persona antes de quedar visible. Suele tardar pocas horas y te avisamos" |
| Ropa y niños salen directo | `/publicar` | Al elegir esas categorías | ✅ (confirmado por el código y por `e2e/moderation.spec.ts`; no vuelvo a probarlo a mano porque ya está cubierto) |

### 3. Gestionar lo publicado
| Paso | Pantalla | Cómo se llega | Estado |
|---|---|---|---|
| Ver mis publicaciones | `/vender/metricas` | "Mis publicaciones" desde `/vender` | ✅ lista con estado (Activa/Vendida), vistas, favoritos, conversaciones |
| Editar, reservar, vender, retirar, destacar | `/producto/[id]`, bloque "Tu publicación" | Clic en el título desde `/vender/metricas` | ✅ los cinco botones están ahí, con el neto a recibir explicado de nuevo |
| Ver conversaciones desde el panel de métricas | `/vender/metricas` | — | ⚠️ el número "Conversaciones: 1" es texto plano, no un enlace. Para llegar al hilo real hay que saber que existe `/actividad` |

### 4. Recibir interés
| Paso | Pantalla | Cómo se llega | Estado |
|---|---|---|---|
| Pregunta pública | `/producto/[id]` → "Preguntas" | Cualquiera, con o sin sesión, pregunta y el vendedor responde ahí mismo | ✅ funciona, con un pequeño retraso de caché la primera vez (ver hallazgo H6) |
| Chat | `/chat/[id]` | "Escribirle al vendedor" desde la ficha | ✅ encabeza con foto y precio del artículo y dice "Hablas con Camila V.", como prometió la actualización |
| Oferta | mismo chat | Campo "Cuánto ofreces" | ✅ el vendedor ve Aceptar/Rechazar en el mismo hilo |
| **Enterarse de que llegó algo nuevo** | — | — | ❌ **no existe.** Ver H1 |

### 5. Vender y entregar
| Paso | Pantalla | Cómo se llega | Estado |
|---|---|---|---|
| Envío: generar guía y despachar | `/pedido/[id]` | Tras el pago, botón "Generar guía y despachar" | ✅ deja "GUIA-XXXX" y cambia a "El vendedor despachó" |
| Presencial: cobrar con el código | `/pedido/[id]` | Campo "Código del comprador" + "Cobrar la venta" | ✅ pasa a "Pago liberado al vendedor" al instante, con reintentos y bloqueo tras 5 fallos (cubierto también por `e2e/pickup.spec.ts`, no repetí esos casos de borde) |

### 6. Cobrar
| Paso | Pantalla | Cómo se llega | Estado |
|---|---|---|---|
| Cuánto va a recibir | `/pedido/[id]` en cualquier estado pagado | — | ✅ siempre visible: Producto, Envío, Comisión 2venta, Recibes |
| Cuándo lo recibe (comprador) | `/pedido/[id]` del comprador | — | ✅ "El dinero llega al vendedor cuando confirmes que recibiste el producto, o solo a los siete días de la entrega si no confirmas" |
| Cuándo lo recibe (vendedor, con envío) | `/pedido/[id]` del vendedor | — | ⚠️/❌ Ver H3: antes de despachar solo dice "cuando el comprador confirme"; después de despachar **la frase desaparece por completo** |
| Qué pasa después de "liberado" | `/pedido/[id]`, estado final | — | ❌ pasa directo a pedir la calificación; no dice cómo ni cuándo esa plata llega a una cuenta bancaria real, ni que el retiro todavía no existe como función. Ver H3 |

### 7. Después
| Paso | Pantalla | Cómo se llega | Estado |
|---|---|---|---|
| Calificar al comprador | `/pedido/[id]` liberado | Aparece automáticamente | ✅ probado con 5 estrellas, confirma "Ya calificaste este pedido" |
| Responder un reclamo | `/pedido/[id]` en disputa | El vendedor entra al pedido | ✅ ve el texto del comprador y puede responder; el dinero queda congelado como promete D-13 |
| Enterarse de que hay un reclamo | — | — | ❌ mismo hueco de H1: solo aparece en `/actividad`, nunca en `/avisos` |

### 8. Cuenta de tienda
| Paso | Pantalla | Cómo se llega | Estado |
|---|---|---|---|
| Descubrir que existe | `/vender` | "¿Vendes con frecuencia? Registra tu tienda con NIT" | ✅ |
| Registrar | `/tienda` | — | ✅ acepta NIT con o sin dígito de verificación, confirma con la razón social |
| Cargar en lote | `/tienda` | — | ✅ explica de entrada la tensión con el video obligatorio ("se crean como borradores... el video se sigue grabando desde el celular") |

---

## 2. Hallazgos con gravedad

### H1 — ALTO. Ningún mensaje, oferta, pregunta o reclamo nuevo se avisa en ningún lado que un vendedor visite por reflejo

**Qué esperaba.** Que el ítem del menú literalmente llamado **Avisos** dijera algo
cuando alguien le escribe, le hace una oferta, le pregunta en público, o le abre
un reclamo.

**Qué pasó.** `/avisos` solo cubre las alertas de búsqueda guardada (S-15) y dice
siempre "Nada nuevo" sin importar cuánta actividad real haya. Lo único que
existe es `/actividad`, un ítem de menú distinto, sin ningún contador ni marca de
"sin leer" — hay que entrar y leer la lista entera para notar que algo cambió.

**Cómo lo reproduje (dos veces, dos escenarios distintos):**

1. Con una cuenta nueva como Laura, en `/producto/703f9ebb-...` (Triciclo rojo de
   Camila) mandé una pregunta pública, un mensaje de chat y una oferta de
   $95.000. Entré como Camila a `/avisos`: *"Nada nuevo. Guarda una búsqueda y te
   avisamos cuando aparezca algo que coincida."* Lo encontré solo en
   `/actividad` → Conversaciones, con el texto del último mensaje.
2. Como Laura compré "Gafas de sol estilo aviador" y abrí un reclamo
   ("Las gafas llegaron con el marco rayado..."). Entré como Camila a `/avisos`:
   otra vez *"Nada nuevo"*. El reclamo solo aparece en `/actividad` → Ventas,
   como "Con reclamo".

**Evidencia.** Capturas de pantalla y `get_page_text` de ambas corridas, con las
cuentas `camila@2venta.demo` / `laura@2venta.demo` en la base local (pedidos
`63f43c2c...` y `1aec96c5...`).

**Por qué le duele a un vendedor real.** Es el motivo número uno por el que
alguien abandona un marketplace: publica, y cree que "no le escribe nadie"
cuando en realidad sí le escribieron y nunca se enteró. Con el celular
verificado y sin correo de por medio (D-40, sin proveedor de correo todavía),
la única forma de enterarse es que la persona vuelva a abrir la app por su
cuenta y además sepa que tiene que mirar "Actividad" y no "Avisos".

**Solución propuesta.** Dos cambios, uno barato y uno correcto:

- *Barato, para esta semana:* renombrar `/avisos` a algo que no prometa lo que
  no cumple — "Alertas de búsqueda" — y ponerle a **Actividad** en la cabecera
  un contador numérico simple (total de conversaciones y ventas con movimiento
  desde la última visita). No hace falta "visto/no visto" por mensaje, basta con
  un número que hoy es siempre cero.
- *Correcto, para la siguiente rebanada:* fusionar avisos de búsqueda, mensajes
  nuevos, ofertas nuevas, preguntas nuevas y reclamos nuevos en un solo feed de
  notificaciones (un `notifications` genérico ya existe en el esquema de S-15,
  ampliarlo es más barato que crear uno nuevo). Guardar un `last_seen_at` por
  conversación y por pedido para poder marcar "nuevo" de verdad.

---

### H2 — ALTO. El vendedor llega hasta el final del formulario de compra de su propio artículo antes de que la app le diga que no puede comprarlo

**Qué esperaba.** Que en la ficha de un artículo propio no apareciera el botón
"Comprar con pago protegido", o que al menos `/comprar/[id]` avisara de
inmediato.

**Qué pasó.** El botón aparece igual que a cualquier comprador. Al hacer clic se
llega al formulario completo de envío (a quién, celular, dirección, zona). Solo
**al hacer clic en "Ir a pagar"**, con todo lleno, aparece: *"No puedes comprar
tu propio artículo."* y el formulario se vacía.

**Cómo lo reproduje (dos veces):**

1. Como Camila, en `/producto/703f9ebb-...` (su propio Triciclo), clic en
   "Comprar con pago protegido" → llegué a `/comprar/703f9ebb-...` con el
   formulario completo. Lo llené entero (Quién recibe, celular, dirección,
   zona Chapinero) y al hacer clic en "Ir a pagar" recién ahí salió el aviso.
2. Navegando directo a `http://localhost:3001/comprar/703f9ebb-...` (sin pasar
   por la ficha) el formulario completo se muestra igual, sin ningún aviso
   previo.

La comprobación del servidor en sí **funciona bien** — coincide con lo que
prueba `checkout.spec.ts` ("no se puede comprar el propio artículo"). El
problema es puramente de interfaz: no hay ninguna pista antes de llegar al
final.

**Por qué le duele a un vendedor real.** Es fácil llegar aquí sin querer: un
vendedor que revisa cómo se ve su propia ficha, con la costumbre de clickear
"Comprar" para ver el flujo del comprador (algo que cualquiera con dos roles en
la misma cuenta va a hacer tarde o temprano, y D-03 dice explícitamente que
comprar y vender es la misma cuenta). Llenar una dirección entera para que te
digan que no se puede se lee como que la app no sabe quién sos.

**Solución propuesta.** En `/producto/[id]`, cuando `listing.sellerId ===
session.user.id`, no mostrar el bloque "Pago protegido / Comprar con pago
protegido" — ya existe el bloque alternativo "Tu publicación" con
Editar/Reservar/Vender/Retirar/Destacar, que es lo que un dueño necesita ver
ahí. Y en `/comprar/[id]`, como cinturón de seguridad para quien llegue por URL
directa, comprobar la propiedad al principio de la carga de la página y
redirigir a `/producto/[id]` con un mensaje corto, en vez de mostrar el
formulario y fallar al final.

---

### H3 — ALTO. El plazo de siete días para cobrar, que es una promesa central del producto, se le explica al comprador pero no al vendedor — y después de despachar desaparece del todo

**Qué esperaba.** Que el vendedor viera la misma explicación completa que ve el
comprador sobre cuándo llega el dinero, en todo momento mientras el pedido está
pagado y sin liberar.

**Qué pasó**, comparando las dos vistas del mismo pedido (Control DualShock 4,
comprado por Laura, envío a domicilio):

- **Comprador**, pedido recién pagado: *"El dinero llega al vendedor cuando
  confirmes que recibiste el producto, o solo a los siete días de la entrega si
  no confirmas."* — completo, con las dos vías.
- **Vendedor**, mismo pedido, antes de despachar: *"Te pagaron. Ya puedes
  despachar. [...] El dinero llega a tu cuenta cuando el comprador confirme
  que recibió."* — le falta la segunda mitad. Un vendedor que lea solo su
  propia pantalla no tiene cómo saber que existen los siete días.
- **Vendedor, después de despachar** (clic en "Generar guía y despachar"): la
  frase **desaparece por completo**. La pantalla pasa a mostrar la guía y el
  número de seguimiento, y no vuelve a mencionar el dinero hasta que se libera.

Y en ningún lugar de la aplicación — ni el pedido liberado, ni `/cuenta`, ni
`/vender` — se explica **cómo** esa plata "liberada" llega a una cuenta
bancaria de verdad. La pantalla pasa de "Pago liberado al vendedor / Recibes
$133.000" directo al formulario de calificación, sin una palabra sobre retiro,
sobre si queda en una billetera de Mercado Pago, o sobre que esa parte todavía
no existe como función.

**Reproducido dos veces** con dos pedidos distintos (Control DualShock por
envío, y Guante de béisbol por encuentro presencial — en el segundo caso el pago
se libera al toque con el código, así que ahí no aplica la ambigüedad de los 7
días, pero confirma el mismo patrón: cero mención de qué pasa con el dinero
después de "liberado").

**Por qué le duele a un vendedor real.** De las cinco cosas que sostienen la
confianza del producto (celular, identidad, video, pago retenido, chat en la
app), el pago retenido es la que más ansiedad genera del lado de quien vende:
es su plata la que está parada. Si el comprador nunca confirma — que va a pasar
todo el tiempo, es el caso más común, no el raro — el vendedor que solo mira su
propia pantalla no tiene ninguna razón para creer que eso se va a resolver
solo. Y aunque se resuelva, tampoco sabe qué hacer con la plata después.

**Solución propuesta.**

1. Cambiar el texto del vendedor para que diga lo mismo que el del comprador,
   en las dos vías: *"El dinero llega a tu cuenta cuando el comprador confirme
   que recibió, o automáticamente a los siete días de la entrega si no
   confirma."* Es un cambio de una línea en la plantilla que arma ese texto.
2. Mantener esa frase visible en **todos** los estados posteriores a pagado —
   pagado, despachado, entregado — no solo en el primero. Hoy se pierde justo
   cuando el pedido lleva más tiempo en curso, que es cuando más se necesita.
3. Agregar una línea fija en el estado "Pago liberado al vendedor" que cierre
   el círculo, aunque sea con lo mínimo honesto: algo como *"Esta plata ya es
   tuya, retenida por Mercado Pago a tu nombre. Retirarla a tu cuenta bancaria
   es una función que todavía no existe en la app — mientras tanto queda en tu
   cuenta de Mercado Pago."* (o lo que corresponda una vez que R-02 tenga
   respuesta). Es preferible decir "esto todavía no existe" a no decir nada:
   D-11/D-26 ya asumen que el dinero vive en el proveedor, así que hay una
   frase honesta disponible sin inventar nada.

---

### H4 — MEDIO. "Conversaciones: N" en el panel de métricas no lleva a ninguna parte

**Qué esperaba.** Que el número de conversaciones de cada publicación en
`/vender/metricas` fuera un enlace al hilo.

**Qué pasó.** Es texto plano (confirmado leyendo el DOM: solo el título de la
publicación es `<a href="/producto/...">`, el bloque de Vistas/Favoritos/
Conversaciones no tiene ningún enlace). Para llegar a la conversación hay que
saber que existe `/actividad` y buscarla ahí por separado.

**Reproducido dos veces**: una vez leyendo el HTML con JavaScript
(`document.querySelectorAll('a')` no devuelve nada para ese bloque), y otra
haciendo clic directamente sobre el número en la pantalla sin que pasara nada.

**Por qué le duele.** Es el lugar más natural para que un vendedor entre a
revisar cómo le está yendo a una publicación específica, y justo ahí, donde ve
"tienes 1 conversación", no hay manera de abrirla sin irse a buscar en otro
menú.

**Solución propuesta.** Envolver el número (o toda la fila "Conversaciones") en
un enlace a la conversación correspondiente — si hay una sola, directo a
`/chat/[id]`; si hay varias, a una vista filtrada de `/actividad` por esa
publicación.

---

### H5 — BAJO. El enlace que envuelve cada fila de conversación en `/actividad` no tiene nombre accesible

**Qué pasó.** El `<a href="/chat/...">` que envuelve la tarjeta entera de una
conversación en `/actividad` no tiene texto propio ni `aria-label` — un lector
de pantalla lo anuncia como "enlace" sin decir a qué lleva. Funciona bien con
mouse (confirmado, navega correctamente), es puramente un problema de quien usa
teclado o lector de pantalla.

**Solución propuesta.** Agregar `aria-label={\`Abrir conversación sobre
${listing.title}\`}` al enlace que envuelve la tarjeta.

---

### H6 — DUDA. La primera pantalla de `/vender` explica el porqué de la verificación pero no el cuánto tarda

**Qué pasó.** "Verifica tu identidad para vender" dice por qué (foto de cédula,
selfie, nadie las guarda) pero no dice cuánto tiempo toma. Ese dato aparece un
paso después, ya dentro del trámite ("Suele tardar unos minutos"). No es un
hallazgo firme porque el usuario lo ve enseguida, con un clic de diferencia — lo
dejo como duda por si vale la pena adelantarlo, ya que "cuánto tarda" es
justamente lo que el brief pide comprobar en este paso.

**Solución propuesta, si se decide actuar.** Agregar una frase corta en la
primera pantalla también: *"Normalmente toma unos minutos."* Un renglón, sin
tocar el resto del contenido.

---

## 3. Huecos ordenados por lo que más le duele a un vendedor real

1. **H1 — no se entera de que le escribieron, ofertaron o reclamaron.** Es el
   hueco que más plata cuesta: interés real que se pierde en silencio.
   *Solución:* contador en Actividad esta semana; feed de notificaciones
   unificado como siguiente rebanada.
2. **H3 — no sabe cuándo ni cómo va a ver esa plata en una cuenta de verdad,**
   sobre todo después de despachar, que es cuando el pedido lleva más tiempo
   abierto y más ansiedad genera. *Solución:* pareja el texto del vendedor con
   el del comprador, en todos los estados, y cierra el círculo con una frase
   honesta en "liberado".
3. **H2 — pierde el tiempo llenando el checkout de su propio artículo** antes
   de que la app le diga que no puede. Molesto pero de una sola vez por
   publicación, no recurrente como los dos anteriores. *Solución:* ocultar el
   botón de compra al dueño y redirigir temprano en `/comprar/[id]`.
4. **H4 — el contador de conversaciones en el panel que sí mira todos los días
   no lo lleva a la conversación.** Fricción menor pero en la pantalla que más
   usa. *Solución:* convertir el número en enlace.
5. **H5 — accesibilidad del enlace sin nombre en Actividad.** No bloquea a
   nadie que use mouse, pero es barato de arreglar de paso.
6. **H6 — falta "cuánto tarda" en la primera pantalla de `/vender`.** El más
   chico de todos; lo dejo para el final porque se resuelve solo un paso
   después.
