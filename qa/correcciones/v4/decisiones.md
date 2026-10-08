# Revisión 4 — lo que falta decidir (2026-10-07)

Las filas 74–77 dicen «confirmar con Hey». No se cambió nada en la app; abajo está
cómo funciona hoy, las opciones y la recomendación del orquestador.

## Fila 74 — Paginación: ¿«siguiente» o scroll infinito?

Hoy: 24 artículos y un botón «Ver más» («Ves 24 de 40 artículos»). Funciona sin
JavaScript y los buscadores lo leen.

- **A. Dejar «Ver más» (recomendado).** Es lo que hace Mercado Libre en espíritu
  (páginas que uno controla); con el volumen de Bogotá no hace falta más.
- B. Scroll infinito (Facebook Marketplace). Más «adictivo», pero se pierde el lugar al
  volver de una ficha y el pie de página queda inalcanzable.
- C. Números de página (1, 2, 3…). Útil con miles de resultados; hoy son decenas.

## Fila 75 — Precio mínimo de un artículo

Hoy: **$10.000**. No puede ser cero: el pago protegido cobra una comisión mínima de
$2.500 y la pasarela tiene su propio mínimo. Con $10.000 al vendedor le llegan $7.500.

- **A. Dejar $10.000 (recomendado).** Al publicar ya se ve «Comisión de 2venta: $ 2.500
  … Te llegan $ 7.500», así que nadie se sorprende.
- B. Subir a $20.000: menos artículos baratos donde la comisión pesa un 25 %.
- C. Bajar a $5.000: la comisión sería la mitad del precio.

## Fila 76 — Comisión: valores mínimo y máximo

Hoy: **5 % del precio, mínimo $2.500, máximo $120.000**, la paga quien vende.
Referencias verificadas: GoTrendier Colombia 9,99 % + $3.999; Mercado Libre cobra por
categoría (más del 10 %). 2venta es la más barata para quien vende.

- **A. Dejarla igual (recomendado mientras no haya pasarela real).**
- B. Modelo Vinted: quien vende no paga; quien compra paga una «tarifa de protección»
  (p. ej. 5 % + cargo fijo). Más atractivo para vender, pero sube el precio que ve el
  comprador. Requiere cambiar textos, cálculo y términos.
- C. Subir el porcentaje (p. ej. 8 %) manteniendo mínimo y máximo.

La decisión es de negocio (Hey/Nicolás) y conviene validarla con el contador.

## Fila 77 — ¿Qué pasa si se borra una categoría principal?

Hoy **no se puede borrar una categoría que tenga artículos o pedidos**: el panel dice
«solo se puede desactivar». Desactivada, deja de aparecer al publicar y en los
filtros, pero los artículos que ya tenía **siguen publicados con su categoría**. Nunca
se borra un producto ni queda sin categoría. Además, no se puede desactivar la última
categoría activa.

- **A. Dejarlo así (recomendado).** Responde la preocupación de Catalina sin agregar
  reglas nuevas.
- B. Marcar las categorías base con (*) como fijas: ni borrar ni desactivar.
- C. Al desactivar, ofrecer mover sus artículos a otra categoría.

## Fila 73 (parte) — Notificación con la app cerrada

Ya está: los mensajes, contadores y avisos llegan **con 2venta abierta**, sin recargar.
Falta que llegue al teléfono o al computador **con 2venta cerrada**:

- **A. Web Push (recomendado, gratis).** Funciona en Android y en computadores; en
  iPhone solo si la persona agrega 2venta a la pantalla de inicio (iOS 16.4 o
  superior). Requiere un par de llaves VAPID que Nicolás genera y pega en los
  secretos de la nube. Se pide permiso después del primer mensaje, nunca al entrar.
- B. Correo (Amazon SES, unos USD 0,10 por cada 1.000) si la persona no entra en un
  rato. Llega a todos, pero tarde y se ignora fácil.
- C. WhatsApp con plantilla de servicio (alrededor de USD 0,0008 por mensaje en
  Colombia según la tabla de Meta). Es lo que más se lee en Colombia; requiere la
  plantilla aprobada por Meta.

## Ideas que salieron de la competencia (sin hacer, para decidir después)

- **Reputación visible antes de comprar** (Mercado Libre): ventas concretadas y tiempo
  de respuesta del vendedor en la ficha. Costo bajo; decidir qué datos se muestran.
- **Fotos de la demo**: los 40 artículos de prueba repiten las mismas 10 fotos y se ve
  falso. Conseguir fotos variadas con licencia.
- **Guía de envío prepagada** (GoTrendier con Servientrega): depende de la
  transportadora que se contrate.
