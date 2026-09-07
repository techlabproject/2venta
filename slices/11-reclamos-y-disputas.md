# Rebanada S-11 — Reclamos y disputas

**Zona sensible.** Decide a quién se le da el dinero retenido.

## Qué hace

El comprador abre un reclamo cuando lo que llegó no coincide con lo publicado. Los
fondos se congelan y la liberación automática se detiene. El vendedor responde con
su versión. Alguien de 2venta compara ambas contra el video de la publicación y
decide: se libera al vendedor o se le devuelve al comprador.

## Por qué va en este momento

Es la D-13, y hoy es una promesa sin nada detrás. El pago protegido dice "si algo
no cuadra, abre un reclamo y el dinero no se mueve", y hasta ahora ese botón no
existía. Sin esto, el argumento central del producto tiene un hueco al final.

## Las dos ventanas de la D-12

- **48 horas** desde la entrega para reclamar por no coincidencia. Es corto a
  propósito: el comprador ya tuvo el producto en la mano.
- **7 días** para reclamar que nunca llegó. Una guía marcada como entregada no
  siempre significa que alguien recibió algo.

No cubre arrepentimiento. El video obligatorio de la publicación es la prueba
contra la cual se compara.

## La decisión que importa: qué pasa mientras se decide

El dinero **no se mueve**. Ni al vendedor ni de vuelta al comprador. Es lo que hace
que el reclamo sea creíble para ambos lados: el comprador sabe que no perdió su
plata, y el vendedor sabe que no se la pueden quitar sin que alguien mire.

Abrir un reclamo detiene la liberación automática. Sin eso, un reclamo del día seis
se resolvería solo al día siete, a favor del vendedor, por vencimiento.

## Archivos que toca

- `db/schema.sql` — tabla `claims`, estado `en_disputa` en `orders`
- `src/features/claims/` — abrir, responder, resolver
- `src/app/pedido/[id]/page.tsx` — el botón y el estado del reclamo
- `src/app/admin/disputas/page.tsx` — el panel de arbitraje
- `src/features/payments/release.ts` — la liberación automática respeta el reclamo
- `e2e/claims.spec.ts`

## Explícitamente fuera

- El reembolso real. El proveedor de pagos de prueba no mueve dinero; se llama a
  su método de devolución y se registra, igual que con la liberación.
- Quién paga el envío de retorno. La D-12 dice que lo paga la parte responsable,
  pero calcularlo y cobrarlo necesita la transportadora real.
- Subir fotos o video como evidencia del reclamo. Hoy es texto. Es lo primero que
  hay que agregar cuando haya almacenamiento de verdad.
- Apelar una decisión.
- Avisos por notificación.

## Prueba de punta a punta

1. El comprador abre un reclamo sobre un pedido entregado y el estado cambia.
2. La liberación automática no toca un pedido en disputa, ni pasado el plazo.
3. El vendedor ve el reclamo y responde.
4. Un administrador resuelve a favor del comprador y el pedido queda reembolsado.
5. Un administrador resuelve a favor del vendedor y el pago se libera.

## Casos de fallo con prueba

- Reclamar fuera de las 48 horas por no coincidencia: se rechaza.
- Reclamar por no entrega hasta el día 7 sí se acepta.
- Reclamar un pedido que no es tuyo: se rechaza.
- Reclamar dos veces el mismo pedido: no crea dos.
- Reclamar un pedido que ya se liberó: se rechaza.
- El vendedor no puede resolver su propio reclamo.
- Quien no es administrador no puede resolver, ni llamando la acción directamente.
- Resolver dos veces no mueve el dinero dos veces.

## Depende de

S-10.
