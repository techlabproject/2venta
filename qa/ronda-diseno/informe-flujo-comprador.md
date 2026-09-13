# Informe de flujo comprador — ronda de diseño 2026-09-13

Autor: flujo-comprador. Alcance: el ciclo de vida completo de quien compra, de
punta a punta, contra la nube (`https://d13g2bd9j8wj8k.cloudfront.net`).

## Nota metodológica: cómo se generó la evidencia

El navegador compartido de este entorno (`Claude_Browser`) resultó estar
contaminado por la sesión de otro agente que tiene un servidor local corriendo en
`localhost:3001`: al navegar a la nube, varias pestañas terminaron mostrando ese
servidor local (tráfico de Turbopack/HMR verificado con `read_network_requests`),
no la nube. Descarté esa vía por completo y me pasé a **pruebas de Playwright
propias**, en `e2e/qa/flujo-comprador/`, corridas siempre en primer plano contra
`QA_BASE_URL=https://d13g2bd9j8wj8k.cloudfront.net`. Son deliberadamente
exploratorias (con `console.log` y capturas en cada paso, no solo aserciones), y
crean sus propias cuentas y publicaciones para no depender de datos de
demostración que otros agentes de esta misma ronda pueden estar tocando a la vez.
Las capturas quedaron en `qa/ronda-diseno/evidencia-flujo-comprador/`.

También noté algo que vale la pena decir: al empezar la sesión, la nube
mostraba el catálogo sin la franja verde ni "Con video" (el estado anterior a
`071b1bb` que describe el brief). En algún momento durante la ronda —no sé si por
un despliegue nuevo o porque mis primeras capturas venían del navegador
contaminado— la nube empezó a servir el HEAD actual: confirmé con `curl` directo
(sin navegador, sin ambigüedad) que el HTML de la portada ya trae "Compra usado
sin miedo a que te tumben" y "Con video". Todo lo reportado aquí después de ese
punto refleja ese estado nuevo, y lo digo explícito porque cambia lo que hay que
verificar de la actualización del brief: los cinco arreglos que se dieron por
hechos **sí están en vivo**, no solo en el código.

Cada hallazgo dice si lo vi en vivo (con su captura) o si es lectura de código
sin confirmar en pantalla; sigo la regla de no reportar "pasó" si no lo observé.

---

## 1. Diagrama del flujo

| # | Paso | Pantalla | Cómo se llega | Estado |
|---|---|---|---|---|
| 1a | Portada sin cuenta | `/` | URL directa | ✅ |
| 1b | Buscar y filtrar | `/buscar?q=...`, `/buscar?categoria=...` | Buscador y chips de la portada | ✅ |
| 1c | Abrir una ficha | `/producto/[id]` | Tarjeta del feed o de resultados | ✅ |
| 1d | Ver perfil del vendedor | `/vendedor/[id]` | Enlace al alias desde la ficha | ✅ |
| 1e | Anónimo intenta comprar | `/comprar/[id]` → `/ingresar` | Botón "Comprar con pago protegido" | ⚠️ (hallazgo 1) |
| 1f | Anónimo intenta escribir | `/chat/...` → `/ingresar` | Botón "Escribirle al vendedor" | ⚠️ (hallazgo 1) |
| 1g | Anónimo intenta preguntar/guardar/agregar al carrito | — | No hay ni botón ni aviso: estas acciones simplemente no existen en el DOM para quien no tiene sesión | ⚠️ (hallazgo 1b) |
| 2 | Registro con celular verificado | `/registro` → `/verificar` | "Crear una" desde `/ingresar` | ✅ por código; NO VERIFICADO en vivo esta ronda (ver nota) |
| 3 | Evaluar el producto | `/producto/[id]` | — | ✅ |
| 4a | Preguntar en público | Sección "Preguntas" en la ficha | Formulario visible solo con sesión | ⚠️ (hallazgo 2) |
| 4b | Chat privado | `/chat/[id]` | "Escribirle al vendedor" | ✅ |
| 4c | Filtro anti-teléfono en chat | `/chat/[id]` | Mensaje con número | ✅ |
| 4d | Negociar precio en chat | `/chat/[id]` | Mensaje "¿me lo dejas en...?" | ✅ |
| 4e | Oferta formal | `/chat/[id]` | Formulario "Ofertar" | ✅ |
| 5a | Carrito de varios artículos, un vendedor | `/carrito` | "Agregar al carrito" desde dos fichas del mismo vendedor | ✅ |
| 5b | Comprar con envío | `/comprar/carrito` → `/dev/pago/[id]` → `/pedido/[id]` | "Ir a pagar" | ✅ |
| 5c | Comprar en persona | `/comprar/[id]` (opción "Nos vemos en persona") | Radio "presencial" | ✅ por código; NO VERIFICADO en vivo esta ronda |
| 6a | Seguimiento del pedido | `/pedido/[id]` | "Ver pedido" tras pagar | ✅ |
| 6b | Confirmar recepción y liberar pago | `/pedido/[id]` | Botón "Ya lo recibí, liberar pago" | ✅ |
| 6c | Dictar código en presencial | `/pedido/[id]` (comprador) + `RedeemForm` (vendedor) | Automático al pagar presencial | ✅ por código (el comprador ve el código); NO VERIFICADO el cobro del vendedor esta ronda |
| 7a | Abrir un reclamo | `/pedido/[id]` → `OpenClaimForm` | "Tengo un problema con el pedido" | ⚠️ (hallazgos 3 y 4) |
| 7b | Ver el estado de la disputa | `/pedido/[id]` | Automático tras abrir el reclamo | ⚠️ (hallazgo 4) |
| 8a | Calificar al vendedor | `/pedido/[id]` tras liberar el pago | `RateForm` | ✅ |
| 8b | Ver mis compras | `/actividad` | Enlace de la cabecera | ✅ |
| 8c | Favoritos | `/favoritos` | Corazón "Guardar" en la ficha | ✅ |
| 8d | Guardar una búsqueda | `/buscar` → `/avisos` | "Avísame cuando aparezca algo así" | ✅ |

---

## 2. Hallazgos con gravedad

### Hallazgo 1 — ALTO: pedir cuenta en el momento de más intención de compra no explica por qué ni devuelve a donde estaba

**Esperaba**: que al pedirle cuenta a alguien que ya decidió comprar o escribir,
la app dijera por qué (aunque sea una frase) y, tras registrarse o entrar, lo
devolviera exactamente a la ficha o al chat que quería.

**Qué pasó**: clic en **"Comprar con pago protegido"** o en **"Escribirle al
vendedor"** siendo anónimo manda a `/ingresar` a secas — el mismo formulario
genérico que usaría alguien que solo quiere entrar a ver su cuenta, sin ningún
texto que diga "inicia sesión para escribirle a Andrés sobre este artículo".
Iniciar sesión desde ahí manda siempre a la portada (`/`), nunca de vuelta al
artículo. La persona pierde el hilo: tiene que volver a buscar lo que estaba
viendo.

**Por qué pasa (leído en el código)**: `activeUser()` en
`src/lib/session.ts:41` hace `redirect("/ingresar")` sin ningún parámetro de
retorno, y `LoginForm.tsx` hace `router.push("/")` fijo al terminar. Ninguna de
las dos rutas de entrada (`startConversation` en
`src/features/chat/actions.ts:16` y la página `/comprar/[id]`) le pasa un
destino a `/ingresar`.

**Reproducción** (dos veces, con Playwright contra la nube):
1. `e2e/qa/flujo-comprador/02-repro-callejones.spec.ts` — anónimo en una ficha,
   clic en "Comprar con pago protegido": termina en `/ingresar` sin contexto.
   Captura: `evidencia-flujo-comprador/08-repro-comprar-anonimo.png`.
2. `e2e/qa/flujo-comprador/02c-repro-post-login-destino.spec.ts` — anónimo entra
   por "Escribirle al vendedor", inicia sesión con `laura@2venta.demo`, y la URL
   final es `https://.../` (la portada), no la ficha de partida. Log:
   `URL final tras iniciar sesión: https://d13g2bd9j8wj8k.cloudfront.net/` /
   `¿Volvió a la ficha original?: false`.

   Nota aparte: en una primera corrida (`02-repro-callejones.spec.ts`, prueba B)
   el clic en "Escribirle al vendedor" pareció quedarse pegado en "Abriendo…"
   por más de un minuto. Lo cronometré de nuevo con
   `02b-repro-chat-timing.spec.ts` y en esa corrida limpia el redirect tardó
   2 segundos. Concluyo que fue lentitud de la nube bajo la carga de varios
   agentes probando a la vez, no un defecto de la función — lo dejo anotado
   como **DUDA de rendimiento bajo carga concurrente**, no como hallazgo de
   producto.

**Por qué importa**: son las dos acciones de más intención de todo el producto —
comprar y escribirle al vendedor — y son exactamente las que D-01 obliga a exigir
cuenta. Eso está bien. Lo que falta es la mitad que hace que pedir cuenta se
sienta razonable en vez de una pared: contexto y retorno.

**Solución propuesta**: agregar un parámetro `?next=` a `/ingresar` y `/registro`
(codificando la ruta de origen: la ficha o el borrador de conversación), y:
- En `/ingresar`, cuando venga `next`, mostrar una línea sobre el formulario:
  "Inicia sesión para continuar" o, mejor, algo específico como "Inicia sesión
  para escribirle a Andrés sobre «Bicicleta infantil rin 16»" (se puede armar
  con el mismo `getListing` que ya carga la página de comprar/chat).
- En `LoginForm.tsx` y en `VerifyForm.tsx` (que también hace `router.push("/")`
  tras verificar el celular), leer `next` de la URL con `useSearchParams` y usar
  `router.push(next ?? "/")`.
- En `activeUser()` y en `startConversation`, construir el redirect como
  `redirect(`/ingresar?next=${encodeURIComponent(currentPath)}`)`. La forma más
  simple sin tocar la firma de `activeUser()` en todos sus usos: que cada página
  que lo llama arme su propio `next` antes de redirigir, y que `startConversation`
  use `` `/ingresar?next=/producto/${listingId}` ``.

Esto es exactamente el tipo de fricción que un comprador desconfiado usa de
excusa para no volver: "me sacó de la nada, no sé ni qué estaba viendo".

---

### Hallazgo 1b — BAJO: agregar al carrito, guardar y preguntar simplemente no existen para quien no tiene sesión, sin decir por qué

**Esperaba**: si una acción requiere cuenta, verla igual (deshabilitada o con una
pista) y no que desaparezca del todo.

**Qué pasó**: en `src/app/producto/[id]/page.tsx`, `AddToCartButton`,
`FavoriteButton` y `AskForm` están condicionados a `{user && !isSeller}` — para
un visitante anónimo esas tres cosas no están en la página en absoluto, ni el
botón ni una nota. Confirmado en vivo: en la ficha anónima
(`evidencia-flujo-comprador/03-ficha-anonimo.png`) solo aparecen "Comprar con
pago protegido" y "Escribirle al vendedor"; nada de guardar, nada de carrito,
nada de preguntar.

**Por qué importa**: es menos grave que el hallazgo 1 porque comprar y escribir
sí están disponibles y sí piden cuenta (aunque mal explicado); pero un
comprador que solo quiere guardar algo para después mientras compara opciones
no tiene ninguna pista de que esa función existe, así que ni siquiera llega al
punto de que le pidan cuenta.

**Solución propuesta**: mostrar el botón de "Guardar" también sin sesión, y que
al hacer clic sea cuando se dispare el mismo `/ingresar?next=...` del hallazgo 1
(igual que hacen Comprar y Escribirle). Es coherente con lo que ya se decidió
para las otras dos acciones, y le muestra a un visitante que explorando gratis
sabe que existe una forma de no perder de vista lo que le gustó.

---

### Hallazgo 2 — MEDIO: la pregunta pública oculta el teléfono, pero no explica por qué (a diferencia del chat)

**Esperaba**: la misma cortesía que tiene el chat — ocultar el dato Y decir por
qué, para que no se lea como una falla de la aplicación.

**Qué pasó**: confirmado en vivo
(`evidencia-flujo-comprador/11-pregunta-publica-con-telefono.png`): la pregunta
"Hola, llámame al 3004128805 para verlo hoy" quedó publicada como "Hola,
llámame al ••••• para verlo hoy", sin ninguna nota debajo. En el chat, el mismo
tipo de mensaje sí trae la leyenda "Ocultamos ese dato. Si pagas fuera de 2venta
pierdes el pago protegido y no podemos ayudarte si algo sale mal." — comparar
`evidencia-flujo-comprador/12-chat-filtro-y-negociacion.png`.

**Por qué pasa**: `askQuestion` en `src/features/chat/actions.ts` sí llama a
`redact()` antes de guardar la pregunta, pero
`src/app/producto/[id]/page.tsx` solo pinta `{q.body}` (el texto ya filtrado) y
nunca `REDACTION_NOTICE`, que sí se usa en `src/app/chat/[id]/page.tsx`.

**Por qué importa**: quien ve su propia pregunta con "•••••" sin ninguna
explicación —o peor, quien lee la pregunta de otro comprador con eso en la
mitad— puede leerlo como un error de la plataforma ("se comió mi mensaje") en
vez de una protección a su favor. Es exactamente lo que el propio comentario de
`redact.ts` dice que hay que evitar: "un mensaje bloqueado sin explicación se
lee como una falla de la app".

**Solución propuesta**: en `src/features/chat/queries.ts`, hacer que
`listQuestions` devuelva también si la pregunta (o la respuesta) tuvo
redacciones — la tabla `questions` necesitaría guardar ese arreglo igual que
`messages.redactions` ya lo hace, o recalcularlo con `hasContact(q.body)` como
aproximación rápida sin migración. Y en la página, debajo de `{q.body}`, repetir
la misma línea `REDACTION_NOTICE` cuando corresponda — es literalmente
reutilizar el componente que ya existe en el chat.

---

### Hallazgo 3 — MEDIO-ALTO: no hay forma de subir evidencia a un reclamo

**Esperaba**: dado que D-13 dice que 2venta "arbitra con la evidencia de ambas
partes", y que el brief pregunta explícitamente "¿puede subir evidencia?",
esperaba al menos poder adjuntar una foto al reclamo de "no coincide con lo
publicado" — es el caso donde una foto del artículo real vale más que cualquier
descripción.

**Qué pasó**: confirmado en vivo y en código.
`OpenClaimForm` (`src/features/claims/Forms.tsx`) solo tiene un radio ("qué
pasó") y un `<textarea>`; no hay ningún `<input type="file">`. Lo comprobé
también por Playwright al abrir un reclamo real:
`¿Hay un campo para subir evidencia (foto) en el reclamo?: false`. Captura:
`evidencia-flujo-comprador/20-pedido-reclamo-abierto.png`.

**Por qué importa**: el "arbitraje" de D-13 compara la versión de las dos
partes contra el video de la publicación — pero si lo que llegó es distinto de
lo que muestra el video, la prueba más directa es una foto de lo que de verdad
llegó, y hoy esa prueba no tiene dónde ir salvo que el comprador la mande por
fuera de la app (lo cual choca de frente con la promesa de "la conversación no
se sale de la app"). Un comprador desconfiado que ya tuvo un problema real y no
puede mostrarlo va a sentir que el reclamo es una formalidad, no una protección
de verdad.

**Solución propuesta**: reutilizar la infraestructura de fotos que ya existe
para publicar (`src/features/publish/photo-queries.ts` y el input
`type="file" accept="image/*" multiple` de `PublishForm.tsx`) para agregar de 1
a 3 fotos opcionales al `OpenClaimForm` y a `ReplyClaimForm`, guardadas en una
tabla `claim_evidence` o reusando el mismo patrón de `listing_photos` con una
referencia al reclamo. Mostrar las miniaturas en la sección "Reclamo" de
`/pedido/[id]` para ambas partes, igual que las fotos del artículo se muestran
en la ficha.

---

### Hallazgo 4 — MEDIO: el plazo del reclamo (48 horas / 7 días) desaparece justo cuando más hace falta

**Esperaba**: que mientras un reclamo está abierto, la pantalla de seguimiento
siga diciendo cuánto tiempo hay o para cuándo se espera una respuesta —
mencionado explícitamente en el brief ("los plazos: 48 horas y 7 días").

**Qué pasó**: el plazo solo aparece **antes** de abrir el reclamo, como una
frase chica bajo cada opción del radio ("Tienes 48 horas desde la entrega" /
"Tienes 7 días desde la entrega"). Confirmado en vivo: una vez el reclamo queda
abierto, `/pedido/[id]` muestra el estado ("Con un reclamo abierto"), el mensaje
de que el dinero no se mueve, la versión del comprador y "El vendedor todavía
no ha respondido." — pero ningún número de días ni fecha límite. Log de la
prueba: `¿Menciona el plazo de 48 horas en algún lado visible?: false`. Captura:
`evidencia-flujo-comprador/20-pedido-reclamo-abierto.png`.

**Por qué importa**: un comprador que abrió un reclamo hace tres días y vuelve a
mirar el pedido no tiene manera de saber si sigue dentro del plazo normal o si
ya se está demorando más de la cuenta. Es justo el tipo de ambigüedad que
alimenta la desconfianza que el producto trata de evitar.

**Solución propuesta**: en la sección `claim` de `src/app/pedido/[id]/page.tsx`,
calcular y mostrar la fecha límite de respuesta a partir de `claim.created_at` y
`claim.kind` (48h para `no_coincide`, aplicando la ventana de 7 días desde la
entrega para `no_llego`, tal como ya las define D-12), con una frase del tipo
"Estamos revisando. Si no se resuelve antes del 15 de septiembre, escríbenos."
No hace falta nueva lógica de negocio, solo exponer un dato que el sistema ya
tiene (D-11b y D-12 ya definen esas ventanas) en la pantalla donde el comprador
efectivamente está mirando.

---

### Hallazgo 5 — DUDA (leído en código, no verificado en vivo): un vendedor sin publicaciones activas vuelve a esconder el chat

**Esperaba** que el arreglo de D-69 ("¿Quieres escribirle? Abre el artículo que
te interesa...") cubriera el perfil del vendedor en cualquier estado.

**Qué vi en el código**: en `src/app/vendedor/[id]/page.tsx`, esa frase solo se
muestra `{listings.length > 0 ? (...) : (<p>No tiene nada publicado en este
momento.</p>)}`. Si un vendedor no tiene nada activo en este momento (por
ejemplo, se le vendió todo, o retiró sus publicaciones temporalmente), su
perfil vuelve a ser exactamente el callejón sin salida original que Nicolás
reportó: no dice dónde escribirle, y además no hay nada que abrir para llegar
al chat.

**No lo verifiqué en vivo** esta ronda por tiempo — todos los vendedores que usé
o encontré tenían publicaciones activas. Lo marco como duda porque es una
lectura de código, no una observación en pantalla.

**Solución propuesta, si se confirma**: cuando `listings.length === 0`, agregar
una frase adicional del tipo "Si ya le compraste antes, puedes escribirle desde
el pedido en tu actividad." (que si es cierto según `src/app/actividad/page.tsx`
ya lista las conversaciones), o al menos no dejar la explicación en blanco.

---

## 3. Dónde abandonaría un comprador desconfiado, en orden

1. **Le pidieron cuenta sin avisar y sin devolverlo** (hallazgo 1). Es el primero
   en la lista porque pasa en el momento de mayor intención — justo cuando
   decidió comprar o preguntar — y porque después de iniciar sesión pierde el
   hilo completo y tiene que volver a buscar el artículo. Arreglo: `next` +
   mensaje contextual en `/ingresar`, devolver ahí después de entrar.

2. **Abrió un reclamo real y no puede probarlo con una foto** (hallazgo 3). Si
   de verdad le llegó algo distinto, su única defensa es escribir un párrafo
   contra la palabra del vendedor. Para alguien que ya está desconfiado porque
   algo salió mal, no poder mostrar la prueba más directa es el momento exacto
   en que decide que "esto no protege a nadie" y no vuelve a comprar.

3. **El reclamo abierto no dice cuánto falta** (hallazgo 4). Menos grave que el
   anterior porque no bloquea nada, pero alimenta la misma ansiedad: dinero
   retenido, sin saber cuándo se resuelve.

4. **La pregunta pública se ve rota sin explicación** (hallazgo 2). Es el de
   menor gravedad de los cuatro porque no bloquea ninguna acción — pero es el
   tipo de detalle pequeño que, sumado a los anteriores, refuerza la sensación
   de "esta app tiene huecos".

Lo que **no** aparece en esta lista, a propósito, porque funcionó bien y vale la
pena decirlo: el carrito con varios artículos del mismo vendedor explica el
ahorro antes de cobrar (`Comprando junto te ahorras $12.250: un solo envío y una
sola comisión en vez de 2`), el total se ve completo antes de pagar, la pantalla
de seguimiento del pedido es explícita sobre que la plata está retenida y sobre
qué la libera, el filtro de teléfonos en el chat explica por qué oculta el dato,
y una negociación de precio real ("¿me lo dejas en 130.000?") no se toca. Esa
parte del circuito de confianza está sólida.

---

## Archivos

- Pruebas: `e2e/qa/flujo-comprador/01-descubrir-y-cuenta.spec.ts`,
  `02-repro-callejones.spec.ts`, `02b-repro-chat-timing.spec.ts`,
  `02c-repro-post-login-destino.spec.ts`, `03-comprar-seguir-despues.spec.ts`.
- Evidencia: `qa/ronda-diseno/evidencia-flujo-comprador/*.png` (23 capturas).
- Código leído: `src/lib/session.ts`, `src/features/auth/LoginForm.tsx`,
  `src/features/auth/VerifyForm.tsx`, `src/features/chat/actions.ts`,
  `src/features/chat/redact.ts`, `src/features/chat/QuestionForms.tsx`,
  `src/features/chat/ChatForms.tsx`, `src/features/claims/Forms.tsx`,
  `src/app/producto/[id]/page.tsx`, `src/app/vendedor/[id]/page.tsx`,
  `src/app/chat/[id]/page.tsx`, `src/app/pedido/[id]/page.tsx`,
  `src/app/carrito/page.tsx`, `src/features/shipping/AddressForm.tsx`,
  `DECISIONS.md`.
