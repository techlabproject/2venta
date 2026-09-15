# S-34 — Petróleo y coral: identidad, profundidad y movimiento

## Qué hace

Cambia la paleta de la aplicación entera a «petróleo y coral» y ataca la razón por
la que Nicolás seguía viendo el producto plano después de S-31, S-32 y S-33: no era
el tono, era que no había ni luz ni movimiento ni un idioma común de superficie.

Cuatro frentes:

1. **Paleta** (D-84). Petróleo `#0F4C4A` y coral `#FF6B4A`, con el contraste medido
   antes de escribirla, no después.
2. **Profundidad.** Sombras teñidas de petróleo en dos capas —contacto y difusión—
   en vez de las de negro neutro de fábrica, y una superficie única para toda
   tarjeta blanca: `rounded-2xl bg-white shadow-xs ring-1 ring-line`.
3. **Movimiento** (D-86). Un vocabulario de tres curvas en `@theme`, micro-interacciones
   donde confirman algo, y `prefers-reduced-motion` que lo apaga todo.
4. **Personalidad** (D-85, D-88). El arco del logo como recurso gráfico y estados
   vacíos que ofrecen la salida en vez de describir el vacío.

## Archivos que toca

- `src/app/globals.css` — paleta, elevación, curvas y fotogramas, `prefers-reduced-motion`.
- `src/components/ui.tsx` — botón con hundimiento al tocar y borde de definición en el acento; campo con anillo de foco.
- `src/components/Arco.tsx` — **nuevo**, el arco del isotipo como gráfico.
- `src/components/Vacio.tsx` — **nuevo**, el estado vacío de tres piezas.
- `src/components/Logo.tsx`, `src/components/VerifiedBadge.tsx` — dejan de clavar el hex a mano.
- `src/app/page.tsx` — franja con degradado y arco; buscador con sombra y foco coral.
- `src/features/catalog/ListingCard.tsx` — se levanta al pasar por encima, se hunde al tocar, la portada se acerca.
- `src/features/favorites/FavoriteButton.tsx` — el corazón brinca al guardar.
- `src/features/payments/OrderTimeline.tsx` — el punto del paso en curso late.
- `src/components/BottomNav.tsx` — el destino activo se marca con barra, no solo con color.
- `src/app/vender/metricas/page.tsx` — las tres cifras de resumen pasan de tres tarjetas a una tira.
- `src/app/actividad/page.tsx`, `src/app/favoritos/page.tsx` — estados vacíos con salida.
- 20 archivos más, solo normalización de superficie (42 tarjetas).
- `e2e/catalog.spec.ts` — el color de marca clavado pasa a `rgb(15, 76, 74)`.
- `e2e/actividad.spec.ts` — la aserción del vacío sigue al texto nuevo.

## Qué queda explícitamente fuera

- **Esqueletos de carga** (D-87). Construidos, probados, retirados: rompen la
  garantía de HTML sin JavaScript de la D-25. Pendientes solo para pantallas
  privadas, donde no hay indexación que perder.
- **Entrada escalonada del catálogo** (D-86). Decidido que no.
- **Modo oscuro.** No estaba pedido y dobla la superficie a mantener.
- El hueco de las tarjetas de publicación vendida en `/vender/metricas`.

## Prueba de punta a punta

`e2e/catalog.spec.ts` › «la marca aplica la tipografía y el color del manual» clava
el petróleo en la cabecera. Es la prueba que hace fallar un cambio de paleta a
medias —la mitad de la app en un color y la otra mitad en otro— en vez de dejarlo
llegar a producción.

El resto lo sostienen las 50 comparaciones visuales: toda la paleta pasa por las 70
referencias de 35 pantallas en móvil y escritorio.

## Comprobación de accesibilidad

`contraste.mjs` mide 17 pares de la paleta contra WCAG antes de escribirla. El único
que fallaba —el coral como superficie sobre crema, 2,57:1 contra el 3:1 que pide
WCAG 1.4.11— se resolvió con el borde `accent-edge`. La mostaza vieja daba 1,88:1 en
ese mismo par y nadie lo había medido nunca.
