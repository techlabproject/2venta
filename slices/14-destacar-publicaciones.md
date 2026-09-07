# Rebanada S-14 — Destacar y renovar publicaciones

**Zona sensible.** Toca dinero.

## Qué hace

Un vendedor paga para que su publicación aparezca primero en el catálogo y en las
búsquedas durante un periodo. Al vencer, vuelve a su lugar por fecha.

## Por qué va en este momento

Es la D-10, la segunda fuente de ingreso, y la única de la Fase 3 que produce plata
en vez de mejorar la experiencia.

## Lo que la D-10 dejó dicho y hay que respetar

Tu comentario al margen de los requisitos fue explícito: **solo anuncios propios a
productos de vendedores con un fee adicional, no anuncios externos.** Aquí no se
vende espacio a terceros; un vendedor paga por su propio artículo.

## La decisión sobre cuánto se puede alterar el orden

Un destacado que empuje demasiado convierte el catálogo en un tablón de quien más
paga, y eso destruye la razón por la que alguien vuelve. Lo que se hace:

- Los destacados aparecen primero, pero **marcados como destacados**. Nadie tiene
  que adivinar por qué ese artículo está arriba.
- **Un máximo de tres por página de resultados.** El resto del listado sigue el
  orden que pidió el comprador.
- El destacado **no altera los filtros**: si el comprador filtró por precio o por
  categoría, un destacado que no cumpla no se cuela.

Esa última es la que importa. Un destacado que ignora el filtro es publicidad
disfrazada de resultado, y el comprador lo nota una vez y ya no vuelve a confiar en
el orden.

## Precio

$8.000 COP por siete días. Es un número de partida, no una decisión con
fundamento: no hay datos de cuánto vale un clic aquí. Queda anotado para revisar
con datos reales.

## Archivos que toca

- `db/schema.sql` — tabla `promotions`
- `src/features/promotions/` — comprar, cobrar, consultar
- `src/features/catalog/` — el orden y el distintivo
- `e2e/promotions.spec.ts`

## Explícitamente fuera

- Renovar automáticamente al vencer.
- Precios distintos por categoría o por posición.
- Destacar en la búsqueda por palabra clave con puja. Aquí el destacado es por
  tiempo, no por término.
- Métricas de rendimiento del destacado. Van con S-15.

## Prueba de punta a punta

1. Un vendedor paga y su publicación aparece primero, marcada.
2. Al vencer, vuelve a su lugar por fecha.
3. Un destacado que no cumple el filtro del comprador no aparece.
4. Como máximo tres destacados por página.

## Casos de fallo con prueba

- No se puede destacar una publicación ajena.
- No se puede destacar una publicación que no está activa.
- Un pago rechazado no destaca nada.
- Destacar dos veces la misma publicación extiende el periodo, no crea dos.
- El webhook del destacado exige firma, igual que el de la compra.

## Depende de

S-13.
