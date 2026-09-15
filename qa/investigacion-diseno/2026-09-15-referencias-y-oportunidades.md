# Investigación de diseño: qué hacen las apps del sector y qué nos falta

**Fecha:** 2026-09-15 · **Encargo:** Nicolás — «cómo se ven otras apps similares,
qué mejoras de diseño y qué animaciones podemos implementar, qué flujos podemos
mejorar, y cómo llevar esto a un producto con personalidad y flujos de empresa
grande».

Lo construido de esta investigación está en `slices/34-petroleo-y-coral.md` y en
D-84 … D-88. Este documento es lo **no** construido: el mapa de por dónde seguir.

---

## 1. Qué hacen los tres referentes, y cuál nos sirve

No son tres versiones de lo mismo. Cada uno resolvió un problema distinto, y solo
uno se parece al nuestro.

| | Qué es | Su apuesta | Qué nos sirve |
|---|---|---|---|
| **Depop** | Instagram con precio | El vendedor **es** el producto. La publicación se lee como un post, no como una ficha | La persona antes que el objeto |
| **Vinted** | Eficiencia | Publicar rápido, sin comisión al comprador, envío resuelto | El camino corto a publicar |
| **Wallapop** | Clasificados con mapa | Todo cabe, y la cercanía es el filtro | La cercanía como argumento |
| **Mercado Libre** | Infraestructura | La confianza la da **la plataforma**, no el vendedor | **Este es el nuestro** |

**La conclusión que importa:** 2venta no compite en catálogo ni en estética. Compite
en *«no te van a tumbar»*. Mercado Libre resolvió eso metiendo su propio sistema de
pagos —igual que nosotros con el pago protegido— y hoy media Latinoamérica le compra
a desconocidos por eso. Nuestra ventaja no es parecernos a Depop; es que el video
grabado dentro de la app y la identidad verificada son señales que Mercado Libre **no
tiene**.

Eso ordena todo lo demás: cada peso de diseño se gasta en hacer visible la confianza.
Lo bonito que no construya confianza es decoración.

---

## 2. Lo que dice la investigación sobre movimiento

- **Menos de 300 ms**, o deja de sentirse como respuesta y empieza a sentirse como
  espera. Gartner proyecta que en 2026 el 75 % de las aplicaciones de cara al público
  llevan micro-interacciones como práctica estándar: dejaron de ser un lujo.
- **Toda animación resuelve un problema o no entra.** La tendencia de 2026 va hacia
  movimiento mínimo y funcional, en contra de lo vistoso.
- **Un solo vocabulario de movimiento** en todo el producto. Es lo que hace que se
  sienta hecho por un equipo y no por cinco personas.
- **Continuidad espacial:** cuando una miniatura se abre a pantalla completa, el
  movimiento explica de dónde salió en vez de reemplazar la pantalla de golpe.
- **`prefers-reduced-motion` es obligatorio**, no una cortesía.

De aquí salieron D-86 y la decisión —deliberada— de **no** animar la entrada del
catálogo.

---

## 3. Lo que dice la investigación sobre confianza y pago retenido

Esto es lo más valioso que encontré, porque contradice lo que veníamos haciendo.

> El pago retenido suele operar **en silencio**; muchas plataformas no lo destacan, y
> el usuario solo se entera de que existe cuando algo sale mal.

Y el contraejemplo que funciona: Turo puso el seguro **al frente** en el pago, en vez
de enterrarlo en letra chica.

**Aplicado a nosotros:** ya mostramos «Pago protegido» en la ficha, pero el mensaje
aparece una vez y no vuelve. La confianza no se construye con un cartel: se construye
repitiendo la misma promesa en cada momento de duda.

Dato de referencia de una plataforma P2P global que rehízo su verificación con
**verificación progresiva**, estado en tiempo real y explicación del beneficio:
**+20 % de transacciones completadas y −35 % de disputas**.

---

## 4. Lo que dice la investigación sobre el flujo de publicar

- **Cada campo obligatorio de más en el alta de un vendedor cuesta entre 5 % y 15 %
  de finalización.**
- Pedir lo mínimo para la primera publicación; el resto del perfil, después.
- **Disparar la verificación pesada (KYC, datos de cobro) solo en el momento de alta
  intención** — publicar algo caro, o retirar plata. Esto ya lo teníamos decidido en
  la D-76 sin saber que era la práctica del sector.
- El problema de la hoja en blanco se resuelve con ejemplos y texto de ayuda, no con
  más campos.

---

## 5. Las ocho oportunidades, ordenadas por lo que rinden

### A. Repetir la promesa en cada momento de duda `alto valor · bajo costo`
Hoy «tu plata está guardada» aparece en la ficha y en el pedido. **No** aparece en el
carrito, ni en la pasarela, ni en el chat con el vendedor —que es donde más gente se
echa para atrás—. Es la lección de Turo, y es texto, no ingeniería.

### B. El vendedor como persona, no como línea de metadatos `alto · medio`
Depop vive de esto. Tenemos foto de perfil, identidad verificada, zona y reputación,
repartidos en tres sitios distintos. Un bloque de vendedor de verdad —foto, desde
cuándo vende, cuánto tarda en responder, sus últimas reseñas— es lo que convierte
«un desconocido» en «alguien».
*Depende de:* tiempo de respuesta, que es un dato que no calculamos.

### C. Continuidad espacial al abrir un artículo `medio · medio`
Que la portada de la tarjeta se convierta en el video de la ficha, en vez de saltar.
Es el ejemplo canónico de la investigación de movimiento. Next 16 trae
`ViewTransition`; hay que comprobar antes que no rompa la D-25.

### D. Estado de envío de verdad `alto · bloqueado`
El paso «En reparto» del mockup sigue sin poderse construir: nuestra transportadora
de prueba tiene dos estados. Bloqueado en R-04.

### E. Publicar con menos fricción `alto · medio`
Medir primero cuántos empiezan a publicar y cuántos terminan. Sin ese número,
cualquier cambio al formulario es opinión. La instrumentación va antes que el
rediseño.

### F. Esqueletos de carga en pantallas privadas `medio · bajo`
Construidos y retirados por la D-87. En actividad, guardados y panel del vendedor no
hay indexación que perder. Es trabajo pendiente, no un problema abierto.

### G. Búsquedas recientes y guardadas más visibles `medio · bajo`
Ya existen las alertas de búsqueda, pero se descubren de casualidad.

### H. Modo oscuro `bajo · alto`
Nadie lo ha pedido y dobla la superficie a mantener. Va al final a propósito.

---

## 6. Lo que decidí NO hacer, y por qué

- **Entrada escalonada de las tarjetas del catálogo.** Retrasa lo que la persona vino
  a ver y es el gesto que más delata una interfaz decorada en vez de diseñada.
- **Esqueletos en catálogo y búsqueda.** Rompen la D-25. Un catálogo indexable vale
  más que una animación de carga.
- **Ilustraciones en los estados vacíos.** Envejecen mal, no son nuestras y no dicen
  nada. El arco de la marca sí es nuestro.
- **Parecernos a Depop.** Su apuesta es la estética del vendedor. La nuestra es que
  no te tumben. Copiar la de ellos nos dejaría sin la nuestra.

---

## Fuentes

- [Micro-Interactions & Motion Design in 2026 — Acodez](https://acodez.in/micro-interactions-motion-design/)
- [UI/UX Evolution 2026: Micro-Interactions & Motion — Primotech](https://primotech.com/ui-ux-evolution-2026-why-micro-interactions-and-motion-matter-more-than-ever/)
- [Motion Design & Micro-Interactions: What Users Expect in 2026 — Techqware](https://www.techqware.com/blog/motion-design-micro-interactions-what-users-expect)
- [Skeleton Screens 101 — Nielsen Norman Group](https://www.nngroup.com/articles/skeleton-screens/)
- [Skeleton Screens vs Loading Spinners — Onething Design](https://www.onething.design/post/skeleton-screens-vs-loading-spinners)
- [How to build trust on your marketplace — Sharetribe](https://www.sharetribe.com/academy/build-trust-marketplace/)
- [How to Build a Peer-to-Peer Marketplace — Journey](https://www.journeyh.io/blog/how-to-build-a-peer-to-peer-marketplace)
- [UX, trust and safety in P2P marketplace apps — Zigpoll](https://www.zigpoll.com/content/how-can-a-ux-designer-help-improve-user-trust-and-safety-features-in-a-peertopeer-marketplace-app)
- [Marketplace seller onboarding — Journey](https://www.journeyh.io/blog/marketplace-onboarding-marketplace-seller)
- [Marketplace UI/UX Design Best Practices — Lowcode Agency](https://www.lowcode.agency/blog/marketplace-ui-ux-design-best-practices-full-guide)
- [Reviews, trust, and customer experience in online marketplaces: Mercado Libre Colombia — Frontiers in Communication](https://www.frontiersin.org/journals/communication/articles/10.3389/fcomm.2024.1460321/full)
- [Mercado Libre: The Digital Backbone of Latin America — Quartr](https://quartr.com/insights/edge/mercado-libre-the-digital-backbone-of-latin-america)
- [How Mercado Libre Scales Design Across Latin America — Figma](https://www.figma.com/customers/mercado-libre-scales-design-across-latin-america/)
- [Vinted vs Wallapop: The Complete 2026 Comparison — Ruit](https://ruit.es/en/blog/wallapop-vs-vinted/)
- [Vinted vs Depop: Which Platform is Best for 2026? — CLOSO](https://closo.co/blogs/platform-specific-guides/vinted-vs-depop-2)
