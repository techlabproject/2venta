# Rebanada S-19 — Editar, retirar y marcar vendido

## Qué hace

El vendedor edita su publicación (título, precio, descripción, estado del
artículo), la marca como reservada o vendida, o la retira.

## Por qué

Son el RF-16 y el RF-17, los dos marcados como prioridad alta en tus requisitos, y
nunca se construyeron. Hoy una publicación con un error de dedo en el precio se
queda así para siempre, y un artículo que se vendió por fuera sigue apareciendo
como disponible.

## Las tres decisiones que hubo que tomar

**Qué se puede editar y qué no.** El título, el precio, la descripción y el estado
del artículo sí. La categoría y el IMEI no: cambiar la categoría saltaría la
revisión que ya pasó, y cambiar el IMEI convertiría una publicación aprobada en
otra cosa. Para eso se publica de nuevo.

**Editar el precio no reabre la revisión, pero editar el texto sí.** El filtro de
contenido se vuelve a aplicar sobre el título y la descripción, porque si no,
editar sería la puerta trasera obvia: publicar algo inocente y cambiarlo después.

**Retirar no borra.** La publicación pasa a un estado retirado y deja de verse,
pero sigue existiendo. Si tiene un pedido asociado, borrarla dejaría a un comprador
con un pedido que apunta a nada, y a una disputa sin el video contra el cual
compararse.

## Archivos que toca

- `db/migrations/0003_*.sql` — estado `retirada`
- `src/features/publish/edit.ts` — la acción
- `src/app/producto/[id]/editar/page.tsx`
- `e2e/edit.spec.ts`

## Explícitamente fuera

- Editar el video. Se graba de nuevo publicando otra vez.
- Historial de cambios de precio visible para el comprador.
- Recuperar una publicación retirada.

## Prueba de punta a punta

1. El vendedor edita título, precio y descripción, y el cambio se ve.
2. La marca como reservada y deja de aparecer en el catálogo.
3. La marca como vendida.
4. La retira y deja de verse, pero el pedido asociado sigue funcionando.

## Casos de fallo con prueba

- No se puede editar una publicación ajena, ni desde la pantalla ni llamando la
  acción.
- Un precio inválido al editar se rechaza.
- Un texto prohibido al editar se rechaza: editar no es la puerta trasera.
- No se puede editar una publicación vendida.
- Retirar una publicación con un pedido no rompe el pedido.

## Depende de

S-18.
