# Rebanada S-22 — Carrito de un solo vendedor

## Qué hace

El comprador junta varios artículos del mismo vendedor y los paga en un solo pedido:
una comisión, un envío, una entrega.

## Por qué

Es el RF-26 y, sobre todo, es lo que prometí dos veces como mitigación de la D-09c.
El piso de comisión de $2.500 equivale a más del 8% en una camiseta de $30.000, y la
salida no era bajar el piso sino que varias prendas del mismo vendedor viajaran como
un pedido.

Sin esto, la categoría ropa no tiene economía.

## La regla que no se toca

**Un vendedor por pedido** (D-20). Un pedido es un envío, un escrow y una disputa;
mezclar vendedores multiplicaría la complejidad sin resolver una necesidad real.

De ahí sale la decisión de interfaz: si el carrito tiene artículos de un vendedor y
se agrega uno de otro, se avisa y se ofrece vaciar. Agregarlo en silencio y
descubrirlo al pagar sería peor.

## Cuánto se ahorra, dicho en la pantalla

Con tres camisetas de $30.000 de a una: tres comisiones de $2.500 y tres envíos de
$12.000. Juntas: una comisión de $4.500 y un envío. El comprador ve el ahorro del
envío antes de pagar, porque es lo que lo hace comprar más.

## Archivos que toca

- `db/migrations/0006_*.sql` — tabla `cart_items`
- `src/features/cart/` — agregar, quitar, vaciar, consultar
- `src/app/carrito/page.tsx`
- `src/features/payments/actions.ts` — pagar el carrito completo
- `e2e/cart.spec.ts`

## Explícitamente fuera

- Cantidades por artículo. En segunda mano cada cosa es única.
- Guardar el carrito entre dispositivos más allá de la cuenta.
- Carrito sin cuenta.

## Prueba de punta a punta

1. Se agregan tres artículos del mismo vendedor y se pagan en un pedido.
2. La comisión se cobra una vez sobre el total, no tres veces.
3. El envío se cobra una vez.
4. El pedido muestra los tres artículos.

## Casos de fallo con prueba

- Agregar un artículo de otro vendedor avisa en vez de mezclar.
- Un artículo que se vende mientras está en el carrito no se puede pagar.
- No se puede agregar el propio artículo.
- El carrito de otro no se ve.
- Pagar un carrito vacío se rechaza.

## Depende de

S-21.
