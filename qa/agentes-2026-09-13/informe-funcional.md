# Informe de verificación funcional — 2026-09-13

**Agente:** funcional
**Commit probado:** `8a62344` — "QA: configuración de Playwright para las exploraciones de los agentes (e2e/qa)" (un commit por delante del `d9da162` que cita el brief común; el árbol estaba limpio salvo `qa/agentes-2026-09-13/BRIEF-COMUN.md`, que ya existía al empezar).
**Árbol limpio:** sí (no se hicieron cambios en `src/`, `db/`, `infra/` ni en las pruebas ya existentes).
**Servidor probado:** `QA_BASE_URL=http://localhost:3200` (imagen Docker `2venta-app`, con `2venta-worker`, `2venta-cola` (ElasticMQ) y `2venta-minio` corriendo aparte). `curl http://localhost:3200/api/salud` → `{"estado":"ok"}`.
**Qué pude ejecutar:** navegación real con Playwright contra el servidor ya levantado, más comprobaciones directas en Postgres y llamadas firmadas a los webhooks. Todo lo reportado como hallazgo se reprodujo **dos veces o más**; el archivo `qa/salidas/funcional-full-run2.txt` (y las corridas previas `funcional-full-run.txt`, `funcional-full-run-w1.txt`, `funcional-cruces-run*.txt`) tienen la salida cruda de cada corrida.

## Resumen

De las cinco promesas, **tres campos públicos quedan completamente sin el filtro anti-desvío**: el título y la descripción de una publicación, el alias del perfil, y la razón social de una tienda. Cualquiera de los tres deja publicar un número de teléfono visible para todo el mundo, sin tachar — es una manera fácil y de un solo paso de saltarse la promesa 5 ("los datos de contacto se ocultan"), y no depende de deletrear nada ni de trucos: basta con escribirlo tal cual. Esto va primero porque es justamente lo que la skill de Luna pide reportar de inmediato.

Aparte de eso, el filtro que **sí existe** (chat, preguntas) funciona bien contra puntos, número deletreado y enlaces de WhatsApp, pero se le escapa un teléfono con un emoji en medio, en un solo mensaje — un bypass fácil y de un paso, así que también se reporta pese a la brecha conocida sobre deletrear en varios mensajes.

El resto del producto —dinero (comisión del carrito, D-46, ofertas vencidas/rechazadas, liberación de pagos, precios raros), los webhooks firmados de KYC y pagos, y los ocho cruces de mayor riesgo entre funciones (carrito vendido por otro lado, oferta+retiro, destacar+retirar, reclamo+edición, reclamo el día 6 de 7, suspensión con pedido pagado, código de entrega presencial, alias con reseñas)— se comportó como dice la especificación, con evidencia observada dos veces cada uno.

## Batería automática

No se corrió `npm run verify`: el brief común lo prohíbe explícitamente para este agente ("No corras `npm run verify`... El servidor ya está levantado para ti"). Todo lo de este informe es navegación real por Playwright y lectura de la base, nunca solo lectura de código — excepto los dos puntos marcados así de forma explícita en "Lo que NO pude verificar".

## Hallazgos

### [CRÍTICO] El título y la descripción de una publicación no pasan por el filtro anti-desvío

**Qué esperaba:** que un número de teléfono en el título o la descripción de un artículo quedara oculto, igual que en el chat (D-22 dice "chat, preguntas e imágenes", pero la promesa 5 del producto — "los datos de contacto se ocultan" — no se limita a eso, y el propio brief pide probar exactamente estos dos campos).

**Qué pasó:** título y descripción se guardan tal cual el vendedor los escribió. `src/features/publish/actions.ts` (publicar) y `src/features/publish/edit.ts` (editar) solo pasan el texto por `moderateListing()` — un filtro de contenido prohibido (armas, drogas, animales, etc., ver `src/features/moderation/rules.ts`) que no tiene nada que ver con datos de contacto — y nunca por `redact()` (`src/features/chat/redact.ts`), que es el filtro que sí existe. El teléfono queda público, sin tachar, visible para cualquiera que abra la ficha.

**Cómo reproducirlo:**
1. Con una cuenta vendedora verificada (celular + KYC), publicar (o, para no depender del video, insertar directo con los mismos campos que usaría `/publicar`) un artículo con `"Bicicleta Trek, contáctame al 3004128805"` como título y un teléfono también en la descripción.
2. Abrir `/producto/<id>` como cualquier persona, incluso sin sesión.
3. El teléfono aparece completo, sin ningún `•••••`.

**Evidencia:** `e2e/qa/funcional/promesas-filtro-contacto.spec.ts` (prueba "el título y la descripción..."), reproducido 2 veces (`qa/salidas/funcional-full-run-w1.txt` línea 20, y la corrida aislada previa). Captura: `qa/capturas/funcional-titulo-descripcion-sin-filtro.png`.

---

### [CRÍTICO] El alias público no pasa por el filtro anti-desvío

**Qué esperaba:** que el alias, que es el nombre público de cualquier cuenta (D-04: "alias elegido y zona aproximada" es lo único público del perfil), no pudiera ser literalmente un número de teléfono.

**Qué pasó:** `updateProfile` (`src/features/profile/actions.ts`) pasa la `bio` por `redact()` pero **no** el `alias`, que se guarda tal cual. El alias se muestra en la ficha del producto, en el perfil del vendedor, en las reseñas, en el carrito ajeno visible ("De <alias>")... en todas partes donde aparece el nombre del usuario.

**Cómo reproducirlo:**
1. Iniciar sesión, ir a `/cuenta/editar`.
2. Poner `3004128805` como alias y guardar.
3. El alias se guarda igual al número; visitar `/vendedor/<id>` lo muestra completo.

**Evidencia:** `e2e/qa/funcional/promesas-filtro-contacto.spec.ts` ("el alias público NO pasa..."), reproducido 2 veces. Captura: `qa/capturas/funcional-alias-telefono-sin-filtro.png`.

---

### [CRÍTICO] La razón social de una tienda no pasa por el filtro y reemplaza el alias en el perfil público

**Qué esperaba:** lo mismo que con el alias — es el nombre público de la cuenta cuando es una tienda (`src/app/vendedor/[id]/page.tsx`: `seller.is_store ? seller.legal_name : seller.alias`).

**Qué pasó:** `registerStore` (`src/features/store/actions.ts`) guarda `legalName` sin pasarlo por ningún filtro. Con identidad verificada y un NIT válido, cualquiera puede registrar una tienda cuya razón social sea, literalmente, un teléfono, y ese texto se muestra en el perfil público del vendedor en vez del alias.

**Cómo reproducirlo:**
1. Cuenta con KYC aprobado, ir a `/tienda`.
2. Razón social: `"Distribuidora 3004128805 SAS"`, NIT válido cualquiera.
3. Registrar; visitar `/vendedor/<id>`: el teléfono aparece completo donde antes iba el alias.

**Evidencia:** `e2e/qa/funcional/promesas-filtro-contacto.spec.ts` ("la razón social de una tienda..."), reproducido 2 veces. Captura: `qa/capturas/funcional-tienda-razonsocial-telefono.png`.

---

### [ALTO] El filtro del chat se salta con un emoji entre los dígitos, en un solo mensaje

**Qué esperaba:** que `mi cel es 300😀4128805 llámame ya` quedara oculto igual que las demás variantes (puntos, deletreado, enlace).

**Qué pasó:** `findPhoneSpans()` (`src/features/chat/redact.ts`) extiende un tramo de dígitos mientras encuentra dígitos, homoglifos (letras que parecen números) o hasta dos separadores como espacio/punto/guion seguidos; un emoji no es ninguna de esas tres cosas, así que corta el tramo ahí mismo. El número queda partido en `300` (3 dígitos) y `4128805` (7 dígitos), ninguno de los dos llega al umbral de 8 dígitos que activa el tachado, y el mensaje se guarda con el teléfono completo y visible.

Esto **no** es el caso ya conocido y aceptado ("quien deletree el número en varios mensajes va a poder"): aquí es un solo mensaje, un solo paso, sin ninguna sofisticación.

**Cómo reproducirlo:**
1. Abrir un chat con un vendedor.
2. Enviar `mi cel es 300😀4128805 llámame ya`.
3. El mensaje se guarda y se muestra con el número completo, sin `data-testid="aviso-filtro"` ni tachado.

**Evidencia:** `e2e/qa/funcional/promesas-filtro-contacto.spec.ts` ("un teléfono separado por un emoji..."), reproducido 2 veces. Texto capturado en consola: `"...mi cel es 300😀4128805 llámame ya..."`. Captura: `qa/capturas/funcional-chat-filtro-emoji-bypass.png`.

---

### [ALTO] Las publicaciones no activas (borrador sin video, retirada, vendida, en revisión) son visibles por enlace directo, con un botón "Comprar" funcional en apariencia

**Qué esperaba:** que `/producto/[id]` solo mostrara publicaciones visibles (D-14 dice que sin video no hay publicación; la carga en lote crea *borradores*, que según `slices/13-cuenta-de-tienda.md` "no aparece[n] en el catálogo hasta que se le graba el video").

**Qué pasó:** `getListing()` (`src/features/catalog/queries.ts`) no filtra por `status` en absoluto, y ni `/producto/[id]/page.tsx` ni `/comprar/[id]/page.tsx` comprueban el estado antes de renderizar. Un borrador de carga en lote (`status='borrador'`, sin `video_path` ni `poster_path` — exactamente lo que crea `uploadBulk` en `src/features/store/actions.ts` antes de que alguien grabe el video) es completamente visible por su enlace directo: título, precio, descripción, y el botón **"Comprar con pago protegido"**, que lleva hasta la pantalla de dirección de entrega con el total calculado. Lo mismo pasa con publicaciones retiradas o vendidas: la ficha las sigue mostrando como si se pudieran comprar.

**Lo que sí funciona:** no aparecen en la búsqueda (`search.ts` sí filtra `l.status = 'activa'`), y el pago real se bloquea al final — `buyListing` solo reserva artículos con `status = 'activa'`, así que no se llega a crear ningún pedido ni se cobra nada. El riesgo no es que se pueda comprar algo sin video: es que una publicación que nunca pasó por la garantía del video (o que ya se retiró/vendió) sigue teniendo una ficha pública, indexable por quien tenga el enlace, con una llamada a la acción de compra que parece real hasta el último paso.

**Cómo reproducirlo:**
1. Crear un borrador como lo haría la carga en lote (fila en `listings` con `status='borrador'`, sin `video_path`).
2. Visitar `/producto/<id>` con cualquier otra cuenta: la ficha se ve completa, con el botón de Comprar.
3. Buscar el mismo texto en `/buscar`: no aparece ningún resultado.
4. Pulsar "Comprar con pago protegido": la pantalla de dirección de entrega se muestra igual que para un artículo real.
5. Intentar pagar: no se crea ningún pedido (`order_items` queda en 0 filas para ese artículo).

**Evidencia:** `e2e/qa/funcional/promesas-borrador-visible.spec.ts`, reproducido 3 veces. Capturas: `qa/capturas/funcional-borrador-visible-por-enlace.png`, `qa/capturas/funcional-borrador-en-busqueda.png`, `qa/capturas/funcional-borrador-pantalla-checkout.png`.

---

### [MEDIO] La pantalla de editar no comprueba el estado de la publicación: se ve el formulario completo para algo vendido o retirado

**Qué esperaba:** que `/producto/[id]/editar` no mostrara un formulario de edición operable para algo que ya no se puede editar.

**Qué pasó:** la página (`src/app/producto/[id]/editar/page.tsx`) solo comprueba que la publicación sea del usuario (`seller_id = user.id`), no su `status`. El formulario con título, precio, descripción y el botón "Guardar cambios" se ve idéntico para una publicación **vendida** (incluso con un reclamo abierto encima) que para una activa. La protección real está en el servidor — `editListing` sí rechaza el guardado con "Una publicación vendida o retirada ya no se puede editar." y el título en la base no cambia — así que no hay pérdida de datos ni el arbitraje se ve afectado (el panel de disputas usa el título congelado en `order_items` y el video de la publicación, ninguno de los dos tocado por editar), pero un vendedor que llena el formulario y le da guardar recibe un error genérico después de haber "editado" algo que ya no existía como tal.

**Cómo reproducirlo:**
1. Pagar un pedido (la publicación pasa a `vendida`), abrir un reclamo.
2. Como vendedor, ir a `/producto/<id>/editar`: el formulario se ve completo y editable.
3. Cambiar el título y guardar: aparece el error del servidor y el título en la base sigue siendo el original.

**Evidencia:** `e2e/qa/funcional/cruces.spec.ts` (Cruce 4), reproducido 3 veces. Captura: `qa/capturas/funcional-cruce-reclamo-editar-vendida-formulario.png` y `...-rechazado.png`.

---

### [MEDIO] El alias no es único: dos cuentas pueden tener exactamente el mismo alias

**Qué esperaba:** algún tipo de comprobación de unicidad, dado que el alias es el único identificador público de una cuenta (D-04).

**Qué pasó:** no hay restricción única en la columna `alias` (revisado en `db/migrations/*.sql`) ni comprobación en `updateProfile`. Dos cuentas distintas pueden guardar el mismo alias sin ningún aviso.

**Cómo reproducirlo:**
1. Cuenta A cambia su alias a `"Vendedor QA 123"`.
2. Cuenta B, sin relación con A, cambia el suyo al mismo texto.
3. Ambas quedan guardadas: `select count(*) from "user" where alias = '...'` da 2.

**Evidencia:** `e2e/qa/funcional/cruces.spec.ts` (Cruce 8), reproducido 2 veces.

**Nota:** el resto del Cruce 8 sí funciona bien — cambiar el alias deja el anterior en `alias_history` (D-43), confirmado en las mismas dos corridas.

---

### [DUDA] Destacar una publicación y luego retirarla no cambia el estado del destacado ni dice qué pasa con lo pagado

**Qué esperaba:** no tengo una expectativa firme — ni `DECISIONS.md` ni `slices/14-destacar-publicaciones.md` dicen qué debería pasar con un destacado pagado cuando el vendedor retira la publicación. Lo reporto como duda, no como hallazgo cerrado.

**Qué pasó:** al retirar una publicación con un destacado activo, la fila en `promotions` sigue con `status='activa'` y su `ends_at` original, sin ningún cambio ni reembolso. El vendedor pagó por siete días de mayor visibilidad; al retirar, ese destacado deja de tener efecto (la publicación retirada no aparece en el catálogo) pero nada en pantalla se lo explica ni el dinero se le devuelve ni se le avisa que "perdió" el resto del período.

**Cómo reproducirlo:**
1. Publicar, destacar (`/dev/destacar/<id>` → "Simular pago aprobado").
2. Retirar la publicación desde su ficha.
3. `select status, ends_at from promotions where listing_id = ...` sigue en `activa` con la fecha original; no hay mensaje al vendedor sobre el destacado en la pantalla de retirar.

**Evidencia:** `e2e/qa/funcional/cruces.spec.ts` (Cruce 3), reproducido 2 veces. Captura: `qa/capturas/funcional-cruce-destacar-retirar.png`.

---

### [DUDA] La nota de la dirección de entrega y el detalle de un reporte tampoco pasan por el filtro anti-desvío

**Esto es lectura de código, no observación en vivo** (ver "Lo que NO pude verificar"). `saveAddress` (`src/features/shipping/queries.ts`) guarda `notes` tal cual, y `reportUser` (`src/features/profile/actions.ts`) guarda `detail` tal cual — ninguno de los dos pasa por `redact()`. Lo marco como duda y no como hallazgo con la misma gravedad que los de arriba porque su alcance es mucho menor: la nota de entrega solo la ve el vendedor de ESE pedido, que en ese punto ya tiene el teléfono real de contacto del comprador por el campo legítimo de la dirección (`address.phone`), y el detalle del reporte solo lo ve un administrador. No es una vía nueva para salirse de la app, pero sí es inconsistente con que el resto de campos de contacto con el vendedor sí estén cubiertos.

## Revisión de lo que sí funciona (PASA, observado dos veces)

**Las cinco promesas:**
- Comprar, escribir por chat, hacer una pregunta pública y publicar exigen celular confirmado; sin él, todo redirige a `/verificar`, comprobado en el servidor (no solo escondiendo el botón).
- Publicar exige identidad verificada (KYC aprobado); sin ella, `/publicar` redirige a `/vender`.
- Publicar exige video incluso forzando el envío del formulario saltándose el botón deshabilitado (`form.requestSubmit()` sin haber grabado nada): no se crea ninguna publicación.
- Nadie puede marcarse verificado ni marcar un pago sin que el proveedor lo firme: `/api/kyc/webhook` y `/api/pagos/webhook` devuelven 401 sin firma y con firma mala, y no cambian ningún estado; con la firma correcta sí; el mismo evento de pago repetido (mismo `eventId`) no se vuelve a aplicar ni duplica el registro de auditoría.
- El chat sí oculta el teléfono en las variantes con puntos, deletreado en palabras, y como enlace `wa.me`.

**Dinero:**
- Con tres artículos del mismo vendedor en el carrito, la comisión se cobra **una sola vez** sobre el total (no la suma de comisiones por artículo), el envío no paga comisión, y comisión + lo que recibe el vendedor = subtotal, siempre en enteros.
- D-46: si el vendedor sube el precio de un artículo del carrito mientras el comprador está en la pantalla de pago, no se cobra el precio nuevo; se explica el cambio y no se crea ningún pedido.
- Pagar con el id de una oferta rechazada no usa el precio de la oferta: se cobra (o se muestra) el precio real de la publicación.
- Liberar un pedido ajeno no es posible (ni por un tercero ni por el propio comprador antes de pagar): el botón de confirmar recepción no aparece.
- Precios inválidos (`0`, `-10000`, `10000.50`, `abc`, un número gigante, notación científica) se rechazan al editar, con el precio anterior intacto en la base; un precio con puntos de miles (`70.000`) se acepta correctamente como `70000`.

**Cruces:**
- Un artículo se marca "ya no está disponible" en el carrito de otra persona en cuanto alguien más lo compra, y bloquea "Ir a pagar".
- Si el vendedor retira una publicación después de aceptar una oferta, no se crea ningún pedido con esa oferta.
- Un pedido con un reclamo abierto **no** se libera automáticamente aunque hayan pasado los siete días (probado preparando `delivered_at` y encolando + corriendo el trabajo `liberar`); un pedido sin reclamo, en las mismas condiciones, sí se libera (control).
- Al suspender la cuenta del vendedor de un pedido ya pagado: el vendedor suspendido sigue viendo el pedido (lectura), pero no puede escribir en el chat (queda redirigido a `/suspendida`); el comprador puede abrir un reclamo con normalidad.
- El código de entrega presencial de un pedido no sirve para liberar otro pedido, y un código vencido se rechaza con el mensaje correcto ("Ese código venció...").

## Lo que NO pude verificar

- **Publicar sin identidad verificada o sin video "por fuera de la pantalla":** no logré reconstruir una llamada HTTP cruda a la Server Action `publishListing` sin pasar por el navegador (Next.js firma sus Server Actions con un id interno que no se puede fabricar desde afuera sin antes observarlo en una llamada legítima). Lo que sí hice fue: (a) confirmar por **lectura de código** que `publishListing` repite las comprobaciones de celular y KYC de forma independiente a la pantalla, y (b) reproducir en vivo, dos veces, que saltarse el botón deshabilitado del cliente con `form.requestSubmit()` sin haber grabado video tampoco crea la publicación.
- **Reutilizar el mismo código de entrega dos veces en el mismo pedido:** el formulario para cobrarlo desaparece de la pantalla en cuanto el pedido pasa a `liberado`, así que no pude forzar un segundo envío por la interfaz. La protección (`pickup_codes.used_at`, comprobada antes de aceptar cualquier código) se confirmó solo por **lectura de código** (`src/features/pickup/queries.ts`).
- **Precios raros al publicar** (en vez de editar): usan la misma función `parseCop`/`MIN_PRICE_COP` que ya se probó exhaustivamente al editar; no repetí la batería completa en la pantalla de publicar por presupuesto de tiempo.
- **Partes 4 (datos personales fuera del chat/perfil) y 5 (revisión visual y accesibilidad) del AGENTE-QA.md:** quedan fuera de "mi frente" según la tarea asignada; asumo que las cubre otro agente de esta ronda.
- **La nota de dirección de entrega y el detalle de reporte sin filtro:** confirmado solo por lectura de código (ver el hallazgo DUDA correspondiente), no observado en vivo.
