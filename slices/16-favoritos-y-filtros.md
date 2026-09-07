# Rebanada S-16 — Favoritos y filtros avanzados

## Qué hace

El comprador guarda artículos como favoritos y los ve en una lista. Los filtros de
búsqueda ganan el orden por cercanía y el filtro de solo destacados.

## Por qué va al final

Es la D-24 y el RF-23. Mejora la experiencia y no habilita nada: si el calendario
se aprieta, esta es la que se corta sin discusión. Está escrito así en el plan
desde el principio.

## Archivos que toca

- `src/features/favorites/` — guardar, quitar, listar
- `src/app/favoritos/page.tsx`
- `src/features/catalog/` — el corazón en la tarjeta y en la ficha
- `e2e/favorites.spec.ts`

## Explícitamente fuera

- Avisar cuando baja el precio de un favorito.
- Carpetas o listas de favoritos.
- Favoritos sin cuenta.

## Prueba de punta a punta

1. Un comprador guarda un favorito y lo ve en su lista.
2. Lo quita y desaparece.
3. El favorito cuenta en las métricas del vendedor.

## Casos de fallo con prueba

- Sin sesión no se puede guardar.
- Guardar dos veces no duplica.
- Un artículo vendido sigue en la lista, marcado como no disponible.
- Los favoritos de otro no se ven.

## Depende de

S-15.
