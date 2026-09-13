# Respuesta a la ronda de diseño y flujos — 2026-09-13

Escrita por el agente de desarrollo después de leer los tres informes
(`informe-arte.md`, `informe-flujo-vendedor.md`, `informe-flujo-comprador.md`).

## Lo que reportó Nicolás usando la aplicación: los dos, ciertos

**Un vendedor no podía ver sus propios productos.** Peor de lo que parecía: la
pantalla `/vender` de alguien ya verificado decía «Ya puedes publicar» y su único
enlace iba al catálogo. Sus publicaciones vivían en `/vender/metricas`, a la que
**no llegaba ningún enlace de toda la interfaz**: existía y no se podía encontrar.
Ahora `/vender` es su panel (publicar · mis publicaciones · mis ventas) y la
cabecera lleva ahí con un botón «Vender» (D-68).

**Desde el perfil del vendedor no salía el chat.** Cierto. El hilo es por
artículo —único por `(listing_id, buyer_id)`—, así que en vez de inventar un hilo
sin artículo, el perfil ahora dice dónde escribirle (D-69). **Queda pendiente de
tu confirmación**: si el diseño inicial preveía un chat directo desde el perfil,
es un cambio de modelo y conviene decidirlo juntos.

## Por qué se veía plano, y qué se hizo

El diagnóstico coincidió por tres vías distintas (el mío, el del agente de arte y
lo que tú viste):

| Lo que estaba mal | Qué se hizo |
|---|---|
| El escritorio era el móvil estirado: 2 columnas en 768 px, media pantalla vacía | Feed de 2/3/4 columnas en 1152 px; la ficha en dos columnas con la compra visible sin bajar (D-70) |
| El video —el diferenciador— era invisible en el feed | Cada tarjeta dice «Con video»; la ficha lo marca «Grabado por el vendedor» (D-71) |
| Todo era la misma tarjeta blanca, así que nada destacaba | El pago protegido tiene superficie verde propia con escudo; es el foco de la columna de compra |
| «Verificado» era texto del mismo tamaño que la zona | Píldora verde con el visto en mostaza: la única vez que los dos colores de marca se juntan |
| El precio pesaba casi igual que el título | Componente `Price` con el verde oscuro que estaba declarado y sin usar, y cifras tabulares |
| El mostaza se usaba hasta en el badge «Tienda» y perdía fuerza | Reservado para dinero; «Tienda» pasa a verde |
| La portada abría con un buscador suelto sobre crema | Franja de marca con la promesa del producto |
| El chat era una lista de burbujas sin contexto | Encabeza con la foto del artículo, el precio y «Hablas con…» |

## Hallazgos de los agentes, cerrados

- **[ALTO, vendedor] Ningún aviso de interés nuevo.** «Avisos» solo cubría
  búsquedas guardadas: llegaban mensajes, ofertas y preguntas y la pantalla decía
  «Nada nuevo». Ahora se avisa de los tres. Los mensajes de un mismo hilo se
  agrupan por minuto, para no convertir una conversación viva en veinte avisos.
- **[ALTO, vendedor] El dueño podía llenar el formulario de compra de su propio
  artículo** y solo al confirmar le decían que no. Ahora no se le ofrece; el
  servidor lo sigue rechazando, que es lo que de verdad protege.
- **[ALTO, vendedor] El plazo de cobro** se explicaba a medias y desaparecía tras
  despachar. Ahora está en todos los estados, y al liberarse se dice con
  honestidad que el retiro al banco todavía no existe en la app.
- **[ALTO, comprador] Comprar sin sesión** llevaba a `/ingresar` sin decir por qué
  y, al entrar, caía en la portada. Ahora se explica el motivo y se vuelve a donde
  iba.
- **[MEDIO] «Conversaciones: N»** en métricas no llevaba a ninguna parte.
- **[BAJO] El enlace de cada conversación** en Actividad no tenía nombre accesible.

## Lo que queda abierto, y por qué

- **[MEDIO-ALTO] No se puede subir una foto como evidencia de un reclamo**, aunque
  la D-13 dice que se arbitra con «la evidencia de ambas partes». Ya estaba en
  `NOTES.md`; ahora es barato (S-27 dejó `uploadBlob` y `claim`) y debería ser la
  próxima rebanada.
- **[MEDIO] Los plazos del reclamo** (48 h / 7 días) solo se ven antes de abrirlo.
- **[MEDIO] Una pregunta pública con teléfono se oculta pero no explica por qué**,
  a diferencia del chat.
- **De arte:** segunda superficie para contenido no accionable, el arco del logo
  como recurso gráfico, y personalidad en los estados vacíos. Son mejoras reales
  pero de menor retorno que lo ya hecho.

## Lecciones de la ronda

- **Seis agentes en paralelo agotaron la cuota de la sesión** y murieron todos
  recién arrancados. La segunda tanda fue de dos en dos y funcionó. Dos es el
  número.
- **Congela el árbol antes de lanzar agentes.** El agente de arte encontró
  cambios míos sin confirmar mientras trabajaba y tuvo que documentarlo. Es la
  misma lección que Luna nos dio en la primera ronda, y la volvimos a aprender.
- Dos agentes compartiendo la base local se pisan; el del comprador tuvo que
  abandonar el navegador compartido porque otro agente lo tenía en su servidor.
  Un entorno por agente, o uno en local y otro en la nube.
