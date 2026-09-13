# Informe de verificación de usuario — 2026-09-13

**Agente:** usuario (cuatro perfiles de `SPEC.md`, recorridos de punta a punta)
**Entorno probado:** `https://d13g2bd9j8wj8k.cloudfront.net` (AWS, `APP_ENV=desarrollo`, proveedores de prueba)
**Commit local al momento de probar:** `8a62344` ("QA: configuración de Playwright para las exploraciones de los agentes")
**Árbol limpio:** **no**. Había cambios sin confirmar en 18 archivos (`git status --short`), varios con comentarios fechados "hallazgo de QA, 2026-09-13" — parece trabajo de arreglo en curso de otro agente, en paralelo a esta sesión. Como pruebo contra el entorno desplegado (no contra el árbol local), esos cambios locales no afectan lo que reporto salvo donde lo aclaro explícitamente (ver el hallazgo ALTO).
**Qué pude ejecutar:** navegación real contra el entorno de AWS con Playwright, cuatro especificaciones en `e2e/qa/usuario/` (una por perfil), con capturas de pantalla, lectura del código fuente local para entender el porqué de lo observado, y consulta a `CloudWatch Logs` para los códigos SMS.

## Resumen

Los cuatro recorridos completan lo esencial de su perfil (buscar, registrarse, publicar, ofertar, pagar, ver el pedido) y el diseño en general es limpio, con buen manejo del acento mostaza y buen formato de dinero y fechas. El hallazgo más importante es **ALTO**: un artículo de tecnología recién publicado (que debería quedar oculto hasta revisión humana, D-32) queda visible por su enlace directo con el botón de compra activo, aunque el pago termina fallando con un mensaje que no explica la causa real ("Alguien más se adelantó"). Lo reproduje limpiamente cuatro veces, con tres artículos distintos y dos perfiles distintos (1 y 4). También hay dos hallazgos **MEDIO**: la comisión nunca se le muestra al vendedor (ni antes ni después de publicar), y hay pantallas con dos acentos mostaza compitiendo. El resto son detalles de copy y de un widget nativo en inglés.

## Batería automática

No aplica a este frente. Mi encargo es la navegación de usuario contra el entorno de AWS ya desplegado; no corrí `npm run verify` (está fuera de lo que se me pidió, y además el brief prohíbe correr comandos que reinicien o toquen la base).

## Hallazgos

### [ALTO] Un artículo de tecnología sin aprobar por moderación queda visible y "comprable" por su enlace directo

**Qué esperaba:** según D-32/R-03 y `slices/10-imei-y-moderacion.md`, la electrónica recién publicada queda `en_revision` y no debería estar visible hasta que un administrador la apruebe desde `/admin`. La promesa 2 de `AGENTE-QA.md` ("el vendedor verifica su identidad... antes de publicar") y el espíritu de D-32 asumen que "en revisión" significa que nadie más puede verla ni comprarla todavía.

**Qué pasó:** publiqué un artículo de tecnología (con IMEI válido) como vendedor recién verificado. Sin que ningún administrador lo aprobara, el enlace directo `/producto/<id>` respondió HTTP 200 para un visitante anónimo, con el título, el precio, la descripción y el botón "Comprar con pago protegido" totalmente visibles y activos. Un comprador registrado pudo abrir el formulario de dirección, llenarlo completo (nombre, celular, dirección, zona) y ver el total con envío, y solo al pulsar "Ir a pagar" la compra falló con: *"Alguien más se adelantó: algo de tu pedido ya no está disponible."* — un mensaje que da a entender una coincidencia de mala suerte, no que el artículo nunca estuvo realmente disponible por seguir en revisión. Además, el propio vendedor, viendo su artículo ya "reservado" tras el intento fallido, seguía viendo el mismo botón "Comprar con pago protegido" en su propia publicación (ver `qa/capturas/usuario-prevenido-marcado-reservado-movil.png`).

Eso sí, el artículo queda correctamente oculto del catálogo y de la búsqueda (lo cubre `e2e/moderation.spec.ts`, que no toqué): el problema es específicamente el enlace directo y el botón de compra, que no están condicionados al estado de la publicación.

**Cómo reproducirlo:**
1. Registrarse como vendedor, verificar identidad con "Simular aprobación".
2. Publicar un artículo con categoría "Tecnología" e IMEI válido. Queda `en_revision`.
3. Sin acción de ningún administrador, abrir `/producto/<id>` en una ventana anónima o con otra cuenta: el título, el precio y "Comprar con pago protegido" se ven con normalidad.
4. Como comprador, hacer clic en "Comprar con pago protegido", llenar la dirección y pulsar "Ir a pagar".
5. Observar el mensaje "Alguien más se adelantó...".

Lo reproduje cuatro veces: dos con la Persona 1 (celular Samsung, dos publicaciones distintas), una con un artículo de diagnóstico dedicado y sin ningún otro paso de por medio, y una con la Persona 4 (portátil de $4.500.000). Las cuatro veces, mismo resultado.

**Evidencia:**
- `qa/capturas/usuario-tecnologia-compra-bloqueada-en-revision-movil.png`
- `qa/capturas/usuario-premium-compra-bloqueada-en-revision-escritorio.png`
- `qa/capturas/usuario-prevenido-marcado-reservado-movil.png` (el vendedor ve "Comprar con pago protegido" en su propio artículo)
- `qa/salidas/usuario-p1-run3.txt`, `qa/salidas/usuario-p1-run4.txt`, `qa/salidas/usuario-p4-run1.txt`, `qa/salidas/usuario-diag.txt`

**Nota sobre el código (revisión de código, no verificado en el entorno probado):** en el árbol local, `src/app/producto/[id]/page.tsx` tiene ahora mismo un cambio sin confirmar (fechado "hallazgo de QA, 2026-09-13") que agrega exactamente el filtro de visibilidad que falta aquí. Es decir, parece que este problema ya se identificó y se está corrigiendo en paralelo a esta sesión, pero **el entorno desplegado que probé (`QA_BASE_URL`) todavía no lo tiene**, así que sigue siendo un hallazgo real y vigente contra lo que hoy está en producción de prueba. Ese mismo cambio local no toca `src/features/payments/BuyButton.tsx`, que es el componente que muestra el botón sin mirar `listing.status` — vale la pena confirmar que la corrección también cubra ese botón (y el caso del propio vendedor viéndolo en su publicación), no solo el acceso a la ficha.

### [MEDIO] Dos acentos mostaza compitiendo cuando hay una oferta activa en el chat

**Qué esperaba:** el acento mostaza reservado para una sola acción principal por pantalla (así lo pide `AGENTE-QA.md`, Parte 5).

**Qué pasó:** en el chat, cuando hay una oferta pendiente, "Aceptar" (aceptar la oferta) y "Enviar" (mandar un mensaje) aparecen los dos en mostaza al mismo tiempo, compitiendo por la atención. "Rechazar" sí está correctamente en blanco/contorno.

**Cómo reproducirlo:** como comprador, hacer una oferta desde el chat de un artículo. Como vendedor, abrir ese mismo chat: se ven "Aceptar" y "Enviar" los dos en mostaza.

**Evidencia:** `qa/capturas/usuario-prevenido-oferta-recibida-movil.png`

### [MEDIO] La comisión nunca se le muestra al vendedor, ni antes ni después de publicar

**Qué esperaba:** la Persona 3 (reacia a la comisión) necesita saber, antes de comprometerse, cuánto le va a quedar después del 5% que cobra 2venta (D-09/D-09b). `AGENTE-QA.md` pregunta directamente "¿se lo dicen antes de publicar?".

**Qué pasó:** recorrí la pantalla de publicar completa (con video y dos fotos), la ficha ya publicada, y `/vender/metricas` (sin ventas todavía). En ninguna de las tres aparece la palabra "comisión", un porcentaje, ni "lo que te queda" o equivalente. Lo único relacionado con precio es la sugerencia de rango basada en ventas reales (`data-testid="precio-sugerido"`), que no tiene que ver con la comisión. Confirmado en vivo (no solo leyendo el código): revisé el texto completo de las tres pantallas con el navegador real y no aparece en ninguna.

**Cómo reproducirlo:** publicar cualquier artículo como vendedor verificado y leer la pantalla de publicar, la ficha resultante, y `/vender/metricas`.

**Evidencia:** `qa/salidas/usuario-p3-run1.txt` (líneas con `[persona3] ¿la pantalla de publicar menciona la comisión? false` / `¿la ficha ya publicada menciona la comisión? false` y el texto completo de métricas), `qa/capturas/usuario-prevenido-publicar-antes-de-enviar-movil.png`, `qa/capturas/usuario-prevenido-ficha-propia-tras-publicar-movil.png`, `qa/capturas/usuario-prevenido-metricas-vendedor-movil.png`

### [MEDIO] "Crear una cuenta" desde el ingreso no lleva directo al formulario, y comprar sin cuenta no explica por qué

**Qué esperaba:** la Persona 1 hace clic en "Comprar con pago protegido" sin cuenta; lo natural es que quede claro que necesita entrar o crear una cuenta, y por qué.

**Qué pasó:** el clic manda a `/ingresar` sin ningún mensaje que explique el porqué (la pantalla de inicio de sesión no dice "necesitas una cuenta para comprar" ni nada similar; simplemente aparece el formulario de entrar). Y el enlace "¿No tienes cuenta? Crear una" no lleva directo al formulario de registro: primero pasa por `/bienvenida`, una pantalla adicional donde hay que volver a elegir "Quiero comprar" o "Quiero vender" — una decisión que la persona ya había tomado al hacer clic en "Comprar". No es un error grave, pero sí un paso de más sin explicación en el momento exacto en que alguien mostró intención de compra.

**Cómo reproducirlo:** sin sesión, abrir una ficha y hacer clic en "Comprar con pago protegido". Luego en "Crear una".

**Evidencia:** `qa/capturas/usuario-tecnologia-comprar-sin-cuenta-movil.png`, `qa/capturas/usuario-tecnologia-bienvenida-movil.png`, `qa/capturas/usuario-premium-bienvenida-escritorio.png`

### [BAJO] El buscador invita a buscar "coches", una categoría que no existe

**Qué esperaba:** el texto visible en español de Colombia y coherente con las tres categorías reales (D-05b: tecnología, ropa, niños).

**Qué pasó:** el campo de búsqueda tiene el placeholder "Busca celulares, ropa, coches…" en el inicio y en `/buscar`. "Coches" no es una categoría de 2venta (no se venden autos) y tampoco es la palabra que se usa en Colombia para carro/auto ("coche" es más de España). Es un detalle menor pero está en la pantalla más visitada de toda la aplicación.

**Evidencia:** `qa/capturas/usuario-tecnologia-inicio-movil.png`, `qa/capturas/usuario-estudiante-busqueda-guardada-movil.png`

### [BAJO] El selector de fotos muestra texto del navegador en inglés

**Qué esperaba:** nada de inglés visible, ni siquiera en controles del navegador (Parte 5 de `AGENTE-QA.md` lo pide explícitamente).

**Qué pasó:** el campo "Fotos" usa el input nativo de archivos del navegador, que en este entorno muestra "Choose Files" y luego "2 files" en vez de algo en español. Es un límite conocido de los inputs de archivo nativos (el texto lo pone el navegador, no la página), pero sigue siendo texto en inglés visible en una pantalla central del flujo de venta.

**Evidencia:** `qa/capturas/usuario-prevenido-publicar-antes-de-enviar-movil.png`

### [DUDA] La dirección incompleta se bloquea con la validación nativa del navegador, no con un mensaje propio de la aplicación

**Qué esperaba:** un mensaje visible y accesible cuando falta un campo obligatorio en el checkout.

**Qué pasó:** al dejar "Celular de quien recibe", "Dirección" y "Zona" vacíos y pulsar "Ir a pagar", no apareció ninguna alerta propia de la aplicación (`role="alert"`): el navegador simplemente enfocó el primer campo vacío con su propia validación nativa (borde resaltado). Funciona y es estándar, pero no pude confirmar si el mensaje nativo se anuncia igual de bien en todos los lectores de pantalla que un mensaje propio de la app, así que lo dejo como duda en vez de hallazgo.

**Evidencia:** `qa/capturas/usuario-premium-error-direccion-incompleta-escritorio.png`

## Lo que funcionó bien (vale la pena dejarlo anotado)

- El precio escrito con puntos de miles ("150.000", en contra del propio texto de ayuda que pide "sin puntos") se interpretó igual como $150.000, no como $150. Un detalle amable con la manera real en que la gente escribe plata en Colombia.
- Los mensajes de error de contraseña corta ("La contraseña necesita al menos ocho caracteres que no sean espacios.") y de código SMS equivocado ("Ese código no es. Te quedan 4 intentos.") son claros, específicos y en español, sin genéricos.
- El carrito de dos artículos del mismo vendedor explica el ahorro con una frase concreta ("Comprando junto te ahorras $ 12.750: un solo envío y una sola comisión en vez de 2"), y el pedido con entrega presencial explica con toda claridad cuándo hay que dictar el código ("Díctaselo al vendedor solo después de revisar el producto").
- Los montos que revisé están todos en formato colombiano correcto (`$ 862.000`, `$ 4.512.000`, etc.) y las fechas en español ("13 de sept, 8:02 a. m.").
- El modo oscuro del sistema no está implementado (brecha ya conocida), pero la aplicación se queda en su tema claro normal — no se vuelve ilegible en ningún punto que revisé.
- El foco de teclado fue visible y el orden lógico en las cuatro pantallas que recorrí solo con teclado (ficha, carrito, publicar, checkout).
- El total del checkout nunca incluye comisión para el comprador (confirmado con la Persona 4: $4.500.000 + $12.000 de envío = $4.512.000 exacto), consistente con D-09.

## Revisión visual

| Pantalla | Nota | Captura |
|---|---|---|
| Inicio (Persona 1, móvil) | Limpio, un solo mostaza en "Buscar", placeholder con "coches" (ver hallazgo BAJO) | `usuario-tecnologia-inicio-movil.png` |
| Inicio (Persona 4, escritorio) | Igual de limpio en escritorio | `usuario-premium-inicio-escritorio.png` |
| Bienvenida (Persona 4, escritorio) | "Quiero comprar" mostaza + "Quiero vender" blanco: un solo acento, correcto | `usuario-premium-bienvenida-escritorio.png` |
| Búsqueda con filtros (Persona 1, móvil y escritorio) | El panel "Filtros" viene cerrado por omisión salvo que la URL ya traiga categoría; una vez abierto, todo claro | `usuario-tecnologia-busqueda-filtros-movil.png` / `-escritorio.png` |
| Búsqueda guardada (Persona 2, móvil) | "Guardada. Te avisamos..." claro; 9 resultados con precios bien formateados | `usuario-estudiante-busqueda-guardada-movil.png` |
| Ficha con video (Persona 1 y 4) | "Pago protegido" siempre visible junto al precio; un solo mostaza | `usuario-tecnologia-ficha-movil.png`, `usuario-premium-ficha-escritorio.png` |
| Comprar sin cuenta (Persona 1, móvil) | Manda a `/ingresar` sin explicar el porqué (hallazgo MEDIO) | `usuario-tecnologia-comprar-sin-cuenta-movil.png` |
| Registro (Persona 1, móvil) | Formulario claro, mínimo de contraseña explicado de entrada | `usuario-tecnologia-registro-movil.png` |
| Verificar celular / código equivocado (Persona 1, móvil) | Mensaje de error específico ("Te quedan 4 intentos") | `usuario-tecnologia-codigo-equivocado-movil.png` |
| Pregunta pública (Persona 1, móvil) | Se ve sin cuenta, tal como promete la promesa 5 | `usuario-tecnologia-pregunta-publica-movil.png` |
| Oferta en el chat (Persona 1 propia, y Persona 3 recibida) | Un mostaza en la propia; dos mostaza compitiendo en la recibida (hallazgo MEDIO) | `usuario-tecnologia-oferta-chat-movil.png`, `usuario-prevenido-oferta-recibida-movil.png` |
| Checkout con dirección (Persona 1, 2 y 4) | Total con envío siempre desglosado y correcto; sin comisión para el comprador | `usuario-tecnologia-checkout-direccion-movil.png`, `usuario-premium-checkout-total-escritorio.png` |
| Entrega presencial (Persona 2, móvil) | Radio "Nos vemos en persona" quita el envío al instante, bien explicado | `usuario-estudiante-entrega-presencial-movil.png` |
| Compra bloqueada por revisión pendiente (Persona 1 y 4) | Mensaje "Alguien más se adelantó" engañoso (hallazgo ALTO) | `usuario-tecnologia-compra-bloqueada-en-revision-movil.png`, `usuario-premium-compra-bloqueada-en-revision-escritorio.png` |
| Pedido con código de entrega (Persona 2, móvil y escritorio) | El mejor texto explicativo de todo el recorrido: dice exactamente cuándo dictar el código | `usuario-estudiante-pedido-codigo-movil.png`, `-escritorio.png` |
| Verificación de identidad, tres estados (Persona 3, móvil y escritorio) | Deja claro que el proveedor es de prueba y no existe en producción | `usuario-prevenido-verificar-identidad-sin-empezar-movil.png`, `-pendiente-movil.png`, `-aprobada-movil.png` |
| Publicar con video y fotos (Persona 3, móvil y escritorio) | Sin mención de comisión (hallazgo MEDIO); botón "Choose Files" en inglés (hallazgo BAJO) | `usuario-prevenido-publicar-antes-de-enviar-movil.png` |
| Ficha propia y "Marcar como reservada" (Persona 3) | El vendedor sigue viendo "Comprar con pago protegido" en su propio artículo (parte del hallazgo ALTO) | `usuario-prevenido-marcado-reservado-movil.png`, `-escritorio.png` |
| Métricas del vendedor (Persona 3, móvil) | Vistas/Favoritos/Conversaciones, sin nada de plata ni comisión | `usuario-prevenido-metricas-vendedor-movil.png` |
| Perfil del vendedor (Persona 4, escritorio) | Sin nombre completo ni datos personales; "Miembro desde septiembre de 2026" en español | `usuario-premium-perfil-vendedor-escritorio.png` |
| Error: dirección incompleta (Persona 4, escritorio) | Validación nativa del navegador, no un mensaje propio (ver DUDA) | `usuario-premium-error-direccion-incompleta-escritorio.png` |
| Error: contraseña de 7 caracteres (Persona 2, móvil) | Mensaje específico, no genérico | `usuario-estudiante-error-contrasena-corta-movil.png` |
| Error: precio con puntos "150.000" (Persona 3, móvil) | Se interpretó correctamente como $150.000 (nota positiva) | `usuario-prevenido-error-precio-con-puntos-movil.png` |
| Accesibilidad: zoom 200% y modo oscuro (las cuatro personas) | Legible en ambos casos, sin texto cortado ni encimado en lo que revisé | `usuario-tecnologia-a11y-zoom200-movil.png`, `usuario-tecnologia-a11y-modo-oscuro-movil.png`, `usuario-premium-a11y-zoom200-escritorio.png`, `usuario-premium-a11y-modo-oscuro-escritorio.png` |
| Accesibilidad: foco de teclado (ficha, carrito, publicar, checkout) | Orden lógico y foco siempre visible en las cuatro pantallas que recorrí | `usuario-tecnologia-a11y-foco-ficha-movil.png`, `usuario-estudiante-a11y-foco-carrito-movil.png`, `usuario-prevenido-a11y-foco-publicar-movil.png`, `usuario-premium-a11y-foco-checkout-escritorio.png` |

## Lo que NO pude verificar

- **La pantalla de reclamo y el texto "48 horas" con una compra real de tecnología.** El hallazgo ALTO impidió que la Persona 1 y la Persona 4 llegaran a `/pedido/<id>` con una compra de tecnología pagada de verdad, así que no pude confirmar en vivo, para ese camino específico, si el pedido explica con claridad qué pasa cuando el producto no es lo prometido. Sí confirmé, leyendo el código (`src/features/claims/Forms.tsx`), que el texto "Tienes 48 horas desde la entrega" existe y se muestra dentro del formulario de reclamo — pero eso es revisión de código, no observación en el entorno probado. Con la Persona 2 (ropa, entrega presencial) sí llegué a un pedido pagado de verdad y el seguimiento se ve claro (ver "Revisión visual"), aunque no abrí un reclamo sobre ese pedido.
- **Una pantalla dedicada "cómo funciona el pago protegido".** No existe: solo hay una caja fija en la ficha ("Pago protegido: Guardamos tu plata hasta que confirmes que recibiste el producto."). No es necesariamente un defecto — la Persona 4 sí encuentra esa explicación, solo que no en una pantalla aparte — pero lo anoto porque el recorrido esperado la buscaba explícitamente.
- **Contraste de color exacto (WCAG AA medido con herramienta).** Revisé visualmente que el texto se lea con claridad en todas las capturas, pero no corrí un medidor de contraste automático; no puedo certificar el nivel AA con números.
- **El catálogo/búsqueda para electrónica en revisión**, específicamente. Confié en que `e2e/moderation.spec.ts` (que leí, no corrí) ya lo cubre y no lo repetí para no duplicar cobertura ya probada; mi aporte fue el enlace directo, que esa prueba no toca.
- **Recorrido completo de "Mis compras"/"Mis ventas"/"Mis chats"** como pantallas dedicadas de actividad: no formaban parte de los cuatro guiones de persona tal como se pidieron, así que no las visité a propósito.

## Resumen por gravedad

- **CRÍTICO:** ninguno.
- **ALTO:** 1 — un artículo de tecnología en revisión queda visible y con el botón de compra activo por su enlace directo, y el vendedor lo sigue viendo en su propia publicación reservada. (Nota: ya hay un cambio sin confirmar en el árbol local que atiende parte de esto, pero el entorno desplegado que probé todavía no lo tiene.)
- **MEDIO:** 3 — dos acentos mostaza compitiendo en el chat con oferta activa; la comisión nunca se le muestra al vendedor; "Crear una cuenta" pasa por un paso extra sin explicar por qué se pidió iniciar sesión.
- **BAJO:** 2 — el placeholder de búsqueda invita a buscar "coches" (categoría inexistente); el selector de fotos muestra texto de navegador en inglés.
- **DUDA:** 1 — la dirección incompleta se bloquea con validación nativa del navegador en vez de un mensaje propio de la app.
