# Rebanada S-24 — Dos huecos en los cruces entre funciones

Salieron de escribir el prompt de Luna: al listar qué cruces valía la pena atacar,
dos me parecieron sospechosos y los probé yo. Los dos eran reales.

## Hueco 1: una cuenta suspendida sigue pudiendo todo

**Qué pasaba.** Suspender ocultaba las publicaciones y cerraba las sesiones, pero
nada más. La cuenta podía volver a entrar con su contraseña, comprar, escribir por
el chat, hacer ofertas, publicar y reportar a otros.

Es un hueco del RF-41 completo: suspender no servía para nada más que esconder el
catálogo del suspendido.

**Qué se hace.** La comprobación va en un solo punto, `activeUser()`, que usan todas
las acciones que escriben. Una cuenta suspendida puede entrar a ver su cuenta y sus
pedidos —necesita poder seguir un reclamo abierto— pero no puede hacer nada nuevo.

Poder ver sus pedidos es deliberado: si tiene dinero retenido en una disputa,
dejarlo ciego sería quitarle la única forma de defenderse.

## Hueco 2: el precio del carrito se recalculaba al pagar

**Qué pasaba.** El comprador veía un total, y al confirmar se recalculaba con los
precios de ese momento. Si el vendedor subía el precio en el medio, se cobraba el
nuevo sin avisar.

No hace falta mala fe para que ocurra: basta que el vendedor esté ajustando precios
mientras alguien compra.

**Qué se hace.** La pantalla manda el total que el comprador vio. Si al confirmar no
coincide, no se cobra: se explica que cambió y se le muestra el nuevo para que
decida. Cobrar un precio distinto al que alguien aceptó no es un detalle técnico.

## Archivos que toca

- `src/lib/session.ts` — `activeUser()`
- `src/app/suspendida/page.tsx`
- Todas las acciones que escriben
- `src/features/payments/actions.ts` — comprobación del total
- `e2e/cruces.spec.ts`

## Prueba de punta a punta

1. Una cuenta suspendida no puede comprar, escribir, ofertar, publicar ni reportar.
2. Una cuenta suspendida sí puede ver su cuenta y sus pedidos.
3. Una cuenta suspendida no puede volver a entrar.
4. Si el precio cambia entre ver el carrito y pagar, no se cobra y se explica.

## Depende de

S-23.
