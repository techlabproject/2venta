# Rebanada S-04 — Buscar y filtrar

## Qué hace

Un comprador busca por palabra clave y filtra por categoría, rango de precio,
estado del artículo, zona y si el vendedor tiene identidad verificada. Puede
ordenar por más recientes, menor precio o mayor precio. El feed gana los atajos de
categoría que muestra el mockup.

## Por qué va en este momento

Cierra la Fase 1 del lado del comprador: sin búsqueda, un catálogo con más de
veinte artículos deja de servir. Es además la primera rebanada que produce páginas
públicas con contenido variable, así que la forma de las rutas se define aquí y las
siguientes la copian.

## Decisión de diseño: el estado vive en la URL

Los filtros no se guardan en memoria del navegador sino en la dirección. Tres
razones concretas:

- La página se sigue renderizando en el servidor, que es de lo que depende la D-25.
- Un resultado se puede compartir por chat, que es como la gente manda cosas aquí.
- El botón de atrás del navegador funciona como la gente espera.

## Archivos que toca

- `src/features/catalog/search.ts` — la consulta con filtros
- `src/features/catalog/SearchFilters.tsx` — el formulario
- `src/app/buscar/page.tsx`
- `src/app/page.tsx` — los atajos de categoría
- `db/schema.sql` — índice de texto completo en español
- `e2e/search.spec.ts`

## Explícitamente fuera

- Distancia en kilómetros. El mockup la muestra ("hasta 8 km de Chapinero") pero no
  hay coordenadas de nada: los artículos solo tienen zona. Se filtra por zona y la
  distancia entra cuando exista el dato.
- Búsquedas guardadas con alerta. Es S-15.
- Favoritos. Es S-16.
- Sugerencias mientras se escribe.

## Prueba de punta a punta

`npm run verify`. Comprueba:

1. Buscar una palabra que está en el título devuelve ese artículo y no los otros.
2. Buscar una palabra que está solo en la descripción también lo encuentra.
3. La búsqueda ignora tildes y mayúsculas.
4. Filtrar por categoría, por rango de precio, por estado y por vendedor verificado
   devuelve exactamente lo que corresponde.
5. Los filtros se combinan entre sí.
6. Ordenar por menor y por mayor precio cambia el orden.
7. La dirección con filtros se puede abrir directamente y muestra lo mismo, sin
   JavaScript del cliente.

## Casos de fallo con prueba

- Una búsqueda sin resultados muestra un mensaje útil, no una lista vacía muda.
- Un precio mínimo mayor que el máximo no rompe nada.
- Parámetros con basura (texto donde va un número, una categoría inventada) se
  ignoran en vez de tumbar la página.
- Una comilla simple o un punto y coma en la búsqueda no alteran la consulta.

## Depende de

S-03.
