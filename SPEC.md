# 2venta — Especificación de producto

Versión 1 · 2026-09-06 · Deriva del brief de producto y de las 24 decisiones
registradas en DECISIONS.md.

## El problema

Los compradores de segunda mano en Colombia no pueden verificar quién vende ni en
qué estado está el artículo, y deben elegir entre canales gratuitos sin garantía,
donde el fraude con comprobantes falsos de billeteras digitales es un riesgo
documentado, o plataformas de una sola categoría. El vendedor honesto paga el costo
de esa desconfianza: solo puede competir por precio.

## Para quién

**Segmento medio (la mitad de la muestra).** Compra sobre todo tecnología. Ninguno
dijo que no usaría la app. Su queja dominante es la desconfianza sobre el estado
real del producto, y lo que más pide es pago protegido.

**Estudiante (estrato alto, ingreso propio bajo).** Compra ropa y accesorios. Es el
más abierto a probar una app nueva. Su barrera no es la desconfianza sino la
fricción de coordinar la entrega.

**El prevenido (ingresos bajos).** Compra por necesidad económica, no por
sostenibilidad. Es el más reacio a pagar comisión y el único que pidió pago contra
entrega. Su equivalente en 2venta es la entrega presencial con código.

**El adulto de 35 a 55 que hoy no compra usado.** Demanda latente, ticket alto. Le
importa más la garantía que el descuento. Entra por el navegador, no por la tienda
de aplicaciones.

## Alcance de la versión 1

Bogotá. Tres categorías: tecnología, ropa y accesorios, hogar. Dieciséis rebanadas
descritas en `slices/`, agrupadas en tres fases:

1. El circuito mínimo de una transacción (S-00 a S-07)
2. Lo que la hace segura (S-08 a S-12)
3. Lo que hace crecer (S-13 a S-16)

## Explícitamente fuera de alcance

- Otras ciudades y otras categorías.
- Envíos internacionales.
- Pago en efectivo entre las partes. Toda transacción pasa por la app.
- Devolución por arrepentimiento. Solo procede por no coincidencia con lo publicado.
- Carrito con productos de varios vendedores.
- Publicidad de terceros. Solo promoción de productos que ya están en la plataforma.
- Contador de ahorro e impacto ambiental (queda en revisión, ver DECISIONS.md).
- Estrategia de arranque en frío: sin decidir, no se implementa nada que la asuma.

## Restricciones

- Una sola base de código para web y móvil, con funciones idénticas.
- 2venta nunca almacena datos de tarjeta ni documentos de identidad. Ambos se
  delegan al proveedor de pagos.
- Ley 1581 de 2012 (habeas data) y Estatuto del Consumidor, artículo sobre portales
  de contacto. Requiere revisión de abogado antes de lanzar, no después.
- Accesibilidad WCAG nivel AA como mínimo.

## Cómo sabemos que funciona

Una persona que nunca ha usado la app publica un producto con video, otra lo
encuentra buscando, lo paga, lo recibe y confirma, y el dinero llega al vendedor
descontada la comisión. Todo sin intervención manual de nadie del equipo.
