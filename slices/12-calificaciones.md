# Rebanada S-12 — Calificaciones mutuas

## Qué hace

Después de una venta completada, comprador y vendedor se califican con estrellas y
una reseña. La calificación promedio, el número de ventas y la tasa de disputa
aparecen en el perfil público del vendedor.

## Por qué va en este momento

Es la D-17, y cierra la Fase 2. La reputación es lo que hace que un vendedor
recurrente pueda vender más caro que uno nuevo, en vez de empezar de cero cada vez,
que era uno de los objetivos de usuario que escribiste.

Va después de S-11 porque la tasa de disputa sale de ahí, y mostrarla sin que
existan disputas habría sido inventar un número.

## El problema del vendedor nuevo, que la D-17 dejó abierto

La decisión reconoce la consecuencia: el vendedor nuevo arranca sin nada que
mostrar, justo cuando toda la plataforma son vendedores nuevos. Mostrar "0
calificaciones, 0 ventas" da impresión de mal desempeño cuando en realidad es
ausencia de datos.

Lo que se hace: el perfil sin ventas no muestra cifras en cero. Muestra desde
cuándo es miembro y que su identidad está verificada, que es lo único cierto que se
puede decir de él. Las cifras aparecen con la primera venta completada.

Es una decisión de producto, no un detalle: en una plataforma nueva, el diseño de
la ausencia de reputación importa más que el de la reputación.

## Archivos que toca

- `db/schema.sql` — tabla `ratings`
- `src/features/ratings/` — calificar y consultar
- `src/app/pedido/[id]/page.tsx` — el formulario tras completar
- `src/app/vendedor/[id]/page.tsx` — las cifras y las reseñas
- `e2e/ratings.spec.ts`

## Explícitamente fuera

- Responder a una reseña.
- Reportar una reseña injusta.
- Perfil público del comprador con sus calificaciones. Existen en la base, pero solo
  las ve el vendedor al decidir si le vende.
- Ponderar la calificación por antigüedad o por monto.

## Prueba de punta a punta

1. Con el pedido liberado, comprador y vendedor pueden calificarse.
2. La calificación aparece en el perfil público del vendedor.
3. El promedio se calcula sobre varias calificaciones.
4. La tasa de disputa sale de los reclamos resueltos.
5. Un vendedor sin ventas no muestra cifras en cero.

## Casos de fallo con prueba

- No se puede calificar un pedido que no está completado.
- No se puede calificar un pedido ajeno.
- No se puede calificar dos veces el mismo pedido.
- Una calificación fuera del rango de una a cinco estrellas se rechaza.
- El filtro anti-desvío se aplica también a las reseñas, que son públicas.

## Depende de

S-11.
