# Rebanada S-06 — Envío y guía

**Zona sensible.** La dirección de entrega es dato personal.

## Qué hace

El comprador escribe a dónde quiere que llegue el producto, ve cuánto cuesta el
envío antes de pagar, y paga producto más envío. El vendedor genera la guía desde
la plataforma. La transportadora reporta el avance, y cuando reporta la entrega
queda escrita la fecha que la liberación automática ya está esperando.

## Por qué va en este momento

Cierra la Fase 1. La D-11b dice que el pago se libera solo a los siete días de la
entrega registrada, y hasta ahora nadie escribía esa fecha: el plazo existía en el
código pero no se podía disparar con datos reales.

## Decisión sobre la dirección

La dirección exacta la ven tres partes y nadie más: quien compra, la transportadora,
y quien vende solo dentro de la guía que genera para despachar. No aparece en el
perfil público, ni en la ficha, ni en la búsqueda, ni en ninguna dirección web.

Esto es más estricto que lo que la mayoría de plataformas hace, y es coherente con
la D-04: en un producto cuya promesa es la confianza, filtrar la dirección de
alguien que vende un celular caro es exactamente el daño que no se puede permitir.

## Archivos que toca

- `db/schema.sql` — `shipping_addresses`, columnas de envío en `orders`, estado
  `despachado`
- `src/features/shipping/provider.ts` — la interfaz y la implementación de prueba
- `src/features/shipping/` — dirección, cotización, guía
- `src/app/comprar/[id]/page.tsx` — la dirección y el resumen antes de pagar
- `src/app/api/envios/webhook/route.ts`
- `e2e/shipping.spec.ts`

## Explícitamente fuera

- La transportadora real. R-04 tiene respuesta propuesta (un agregador logístico)
  pero no hay contrato. Se construye contra una interfaz, igual que pagos.
- Elegir entre varias transportadoras. La interfaz devuelve una sola cotización.
- Entrega presencial con código. Es S-09.
- Devoluciones y quién paga el retorno. Es S-11.
- Direcciones guardadas para volver a usarlas.

## Prueba de punta a punta

1. El comprador escribe la dirección, ve el costo del envío y el total, y paga.
2. El total cobrado es producto más envío, y la comisión se calcula solo sobre el
   producto.
3. El vendedor genera la guía y el pedido queda despachado.
4. La transportadora reporta la entrega y queda escrita la fecha.
5. Siete días después de esa fecha, la liberación automática ocurre.

## Casos de fallo con prueba

- No se puede pagar sin dirección.
- Una dirección incompleta se rechaza.
- Un webhook de la transportadora con firma inválida se rechaza.
- Un webhook repetido no adelanta el estado dos veces.
- Un webhook de entrega sobre un pedido no pagado no hace nada.
- El vendedor no puede generar guía de un pedido que no es suyo.
- La dirección no aparece en el perfil público del comprador ni en ninguna
  respuesta pública.
- Una persona ajena no puede ver la dirección de un pedido.

## Depende de

S-05.
