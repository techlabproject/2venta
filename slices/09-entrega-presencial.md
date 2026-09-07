# Rebanada S-09 — Entrega presencial con código

**Zona sensible.** El código libera dinero.

## Qué hace

Al comprar, el comprador elige entre envío a domicilio o encontrarse en persona. Si
elige encontrarse, paga igual por la app y no paga envío. En el encuentro revisa el
producto y, si está conforme, le dicta al vendedor un código de seis dígitos que
libera el pago en el momento.

Nunca hay efectivo.

## Por qué va en este momento

Es la D-19, y es lo que le habla al segmento que la investigación llamó el
prevenido: el que pidió pago contra entrega y es el más reacio a soltar la plata
antes de ver el producto. Con esto ve primero y suelta después, sin que 2venta
pierda la protección ni el ingreso.

Va después de S-08 porque el punto y la hora se acuerdan dentro del chat.

## La decisión sobre cómo se guarda el código

**El código se guarda cifrado con un secreto del servidor, nunca en claro.**

Esto es deliberado y corrige el problema de la D-27, donde la biblioteca de
autenticación guarda el código por SMS en texto plano y no ofrece alternativa. Aquí
el código es nuestro, así que se hace bien.

Un hash simple no bastaría: seis dígitos son un millón de combinaciones, y quien
tuviera la base podría probarlas todas fuera de línea en segundos. Con un secreto
que solo vive en el servidor, tener la base no alcanza.

La comparación es de tiempo constante, por la misma razón de siempre: comparar con
igualdad filtra cuántos caracteres del principio coinciden.

## Archivos que toca

- `db/schema.sql` — `pickup_codes`, y `delivery_method` con `meeting_zone` en
  `orders`
- `src/features/pickup/code.ts` — generar, cifrar y comparar, con pruebas unitarias
- `src/features/pickup/` — pantallas y acciones
- `src/app/comprar/[id]/page.tsx` — la elección de método
- `e2e/pickup.spec.ts`

## Explícitamente fuera

- Puntos de encuentro sugeridos por la app. Se acuerdan por chat.
- Que el vendedor pueda pedir un código nuevo si el comprador perdió el suyo. Sin
  una forma de comprobar quién pide, sería un camino para liberar sin entregar.
- Devolver el dinero si el encuentro no ocurre. Va con S-11.
- Entrega presencial combinada con envío en el mismo pedido.

## Prueba de punta a punta

1. El comprador elige encontrarse en persona, no paga envío, y el total es solo el
   producto.
2. Después de pagar, ve su código de seis dígitos. El vendedor no lo ve.
3. El vendedor escribe el código correcto y el pago se libera en el momento.

## Casos de fallo con prueba

- Código equivocado: se rechaza y deja reintentar.
- Código ya usado: no sirve una segunda vez.
- Código vencido: se rechaza.
- Cinco intentos fallidos: se bloquea y ya no acepta ni el correcto.
- El código de otro pedido no sirve.
- El comprador no puede liberar escribiendo el código (es del vendedor esa acción),
  aunque sí puede confirmar recepción por el camino normal.
- Una persona ajena no ve el código ni puede usarlo.
- El código no aparece en la base en claro.

## Depende de

S-08.
