# Rebanada S-05 — Comprar con pago retenido

**Zona sensible, la más delicada del proyecto.** Toca dinero de terceros.

## Qué hace

Un comprador con celular verificado paga un artículo. El dinero queda retenido en
el proveedor de pagos, no en 2venta. Cuando el comprador confirma que recibió, se
libera hacia el vendedor descontada la comisión. Si nunca confirma, se libera solo
a los siete días de la entrega registrada.

## Por qué va en este momento

Cierra el circuito. Con esta rebanada existe una transacción completa y el producto
se puede probar con personas de verdad, que es el objetivo de toda la Fase 1.

## El estado de R-02 y qué significa

R-02 sigue sin respuesta: no sabemos si Mercado Pago permite condicionar la
liberación a un evento nuestro o solo a su calendario. Se construye contra una
interfaz propia con una implementación de prueba, igual que se hizo con el envío de
mensajes y con la verificación de identidad.

Hay que ser honesto sobre el límite de esa técnica aquí. Con el proveedor de SMS,
cambiar de implementación no altera nada más. Con el de pagos sí puede alterarlo:
si resulta que la retención no se puede condicionar, cambia el flujo del producto,
no solo la integración. Lo que esta rebanada deja listo pase lo que pase es el
modelo de datos, la máquina de estados, la aritmética del dinero y el registro de
auditoría. Lo que puede tener que rehacerse es el momento exacto de la liberación.

## Reglas del dinero

- Enteros en pesos. Nunca decimales, nunca punto flotante.
- Comisión: 5% del subtotal, con piso de $2.500 y techo de $120.000 (D-09b).
- El redondeo es al entero más cercano y lo absorbe la comisión, no el vendedor.
- El proveedor es la fuente de verdad del estado. La base local guarda una copia
  para mostrar, y toda diferencia se resuelve a favor del proveedor.
- Toda transición de estado queda registrada con marca de tiempo y origen. Cuando
  haya una disputa, ese registro es la única evidencia que existe.

## Consecuencia del piso de comisión que nadie había nombrado

El piso de $2.500 implica un precio mínimo de publicación. Sin él, un artículo de
$3.000 pagaría el 83% de comisión. Se fija en $10.000, donde el piso equivale al
25%. Queda como D-29 y hay que confirmarla.

## Archivos que toca

- `db/schema.sql` — `orders`, `order_items`, `order_events`
- `src/features/payments/money.ts` — comisión y reparto, con pruebas unitarias
- `src/features/payments/provider.ts` — la interfaz y la implementación de prueba
- `src/features/payments/orders.ts` — máquina de estados
- `src/app/api/pagos/webhook/route.ts`
- `src/app/pedido/[id]/page.tsx` — seguimiento y liberación (pantalla 1j)
- `e2e/checkout.spec.ts`

## Explícitamente fuera

- El carrito con varios artículos. El modelo de datos ya lo soporta (`order_items`),
  pero la pantalla compra de a un artículo. La D-20 sigue vigente y no se contradice.
- Envío y guía. Es S-06. Mientras tanto el pedido queda listo para recibir la fecha
  de entrega que esa rebanada va a escribir.
- Entrega presencial con código. Es S-09.
- Reclamos y disputas. Es S-11.
- Retiro del dinero por parte del vendedor.

## Prueba de punta a punta

`npm run verify`, que ahora corre pruebas unitarias además de las de navegador.

1. Un comprador paga, el proveedor aprueba y el pedido queda pagado con el dinero
   retenido y el artículo marcado como vendido.
2. El comprador confirma recepción y el dinero se libera con la comisión correcta.
3. Con la entrega registrada hace ocho días y sin confirmación, la liberación
   automática ocurre.
4. La aritmética de la comisión, en muchos casos, incluidos los bordes del piso y
   del techo.

## Casos de fallo con prueba

- Pago rechazado: el pedido no queda pagado y el artículo sigue disponible.
- Webhook con firma inválida o sin firma: se rechaza.
- Webhook repetido: no cobra ni libera dos veces.
- Webhook que llega fuera de orden: no revierte un estado más avanzado.
- Webhook de un pedido que no existe: se rechaza.
- Confirmar recepción de un pedido ajeno: se rechaza.
- Confirmar recepción dos veces: no libera dos veces.
- Liberar un pedido que no está pagado: se rechaza.
- Comprar el propio artículo: se rechaza.
- Comprar un artículo ya vendido: se rechaza.
- Comprar sin celular verificado: se rechaza.
- Un artículo por debajo del precio mínimo no se puede publicar.

## Depende de

S-03 y S-04.
