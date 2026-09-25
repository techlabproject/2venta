# Facturación, impuestos y costo del envío

Corrección 47 de Catalina: «No hay temas de facturación ni impuestos. ¿Debería incluir
algún impuesto? Definir temas legales.» Y en la versión 2: «Sumar al resumen de pago la
tarifa de envío según la ciudad (Bogotá: rango de $10.000). A largo plazo, alianza con
una mensajería.»

> Esto no reemplaza a un contador. Son las preguntas que hay que llevarle, con lo que
> hoy hace la app.

## Cómo está hoy

- **Resumen de pago:** producto + envío ($12.000 fijos, proveedor simulado) = total. La
  **comisión de 2venta** (5 %, con piso y techo, D-09) la paga el vendedor: se le
  descuenta al liberar el pago y el comprador no la ve.
- **No hay factura** de nada, ni IVA, ni retenciones.

## Lo que hay que definir con un contador

1. **La comisión es un servicio que 2venta le presta al vendedor.** Si la empresa que
   opera 2venta es responsable de IVA, la comisión lleva **IVA (19 %)** y hay que
   emitirle **factura electrónica** (DIAN) al vendedor por cada comisión, o una
   mensual. ¿Se cobra el IVA encima de la comisión o se incluye dentro del 5 %?
2. **La venta del artículo es entre el vendedor y el comprador**, no de 2venta. Una
   persona natural que vende sus cosas usadas de vez en cuando normalmente no factura
   ni cobra IVA; **una empresa (persona jurídica, fila 15) sí** tiene que facturarle al
   comprador. ¿2venta le pide a la empresa la factura, o solo le recuerda que la emita?
3. **Retenciones** (retefuente, reteIVA, reteICA) que 2venta tendría que practicar a las
   empresas vendedoras según su régimen.
4. **El envío:** si 2venta lo cobra y lo paga a la transportadora, ¿es ingreso de
   2venta (y lleva IVA) o un pago por cuenta de terceros?
5. **El retracto de 15 días** (Ley 2439 de 2024) aplica a las empresas vendedoras;
   quién devuelve la plata si ya se liberó.

## Envío por ciudad (lo concreto de Catalina)

- Mientras la app sea solo Bogotá (D-06), el resumen ya muestra el envío; se puede
  cambiar a un **rango** («$10.000 a $12.000 según la zona») o a una tarifa por zona.
- Con varias ciudades (ver ubicación): tarifa por origen y destino, que da la
  transportadora (Coordinadora, Servientrega, Interrapidísimo y Envía tienen API).
- **Recomendación:** cotizar 2 o 3 transportadoras con API ya, y dejar la alianza para
  cuando haya volumen.

## Preguntas para Nicolás

1. ¿Quién es el contador o el asesor tributario?
2. ¿El envío se muestra como rango o por zona mientras sea solo Bogotá?
