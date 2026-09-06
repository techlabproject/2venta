# Decisiones

Registro append-only. Si una decisión cambia, se escribe una nueva que la reemplaza
y la anterior se marca como superada. Todas las de este archivo se tomaron el
2026-09-06 y están vigentes salvo que se indique.

## Identidad y cuentas

### D-01 — Registro del comprador
Cuenta obligatoria, con teléfono verificado por código. No basta el correo.
**Por qué.** El número verificado es lo que impide crear cuentas desechables para
estafar y volver a entrar. No se le pide documento al comprador.
**Consecuencia.** Un costo por SMS en cada registro, y un endpoint que necesita
límite de intentos desde el día uno o se vuelve una factura abierta.

### D-02 — Verificación del vendedor
KYC obligatorio antes de publicar, no antes de cobrar.
**Por qué.** Es lo que pidió la investigación de usuarios: verificación de identidad
del que vende. Es más estricto que los requisitos originales.
**Consecuencia.** Invalida el RF-19 y obliga a reescribir RF-02, RF-06 y RF-14. Sube
la fricción de entrada del vendedor, que es el lado escaso al inicio.

### D-03 — Modelo de cuenta
Una sola cuenta con dos modos. Activar el modo vendedor dispara el KYC.
**Por qué.** La mitad del segmento medio dijo que compraría y vendería. Con cuentas
separadas tendrían dos reputaciones. Además el KYC aparece con contexto: el usuario
entiende por qué le piden documento justo en ese momento.

### D-04 — Qué es público del perfil
Alias elegido y zona aproximada. Nunca la dirección exacta, que solo recibe la
transportadora al generar la guía.
**Por qué.** Protege a quien vende artículos de valor sin quitarle al comprador el
dato de cercanía.

## Alcance

### D-05 — Categorías
Tecnología, ropa y accesorios, y hogar.

### D-06 — Ciudad
Bogotá únicamente.
**Por qué.** La densidad geográfica es lo que hace viable la entrega presencial.
Concentrar evita el error que mató a OLX: estar en todas partes sin liquidez.

### D-07 — Vendedores profesionales
Sí, con cuenta de tienda y NIT, insignia propia y publicación en lote.
**Consecuencia.** Introduce la distinción persona natural / tienda, que además tiene
efectos tributarios en la retención sobre los pagos.

### D-08 — Web y móvil
Una sola base de código, funciones idénticas en ambas.
**Consecuencia.** Descarta escribir dos aplicaciones. Ver D-25 para cómo se ejecuta.

## Dinero

### D-09 — Quién paga la comisión
El vendedor, descontada del pago. El comprador paga el precio publicado.

### D-09b — Cuánto es la comisión
5% del precio, con piso de $2.500 COP y techo de $120.000 COP. El techo aplica desde
$2.400.000.
**Por qué.** Mercado Libre en Colombia cobra del orden del 12% al 16% más un fijo.
El techo evita que un artículo de $3.500.000 pague $175.000 y se vaya de la
plataforma. El piso existe porque en $30.000 el 5% no cubre lo que cobra el
proveedor de pagos.
**Consecuencia.** En ropa barata el piso equivale a más del 8%, justo con el
segmento más reacio a la comisión. Se mitiga con D-20, no bajando el piso.

### D-10 — Segunda fuente de ingreso
Destacar y renovar publicaciones, pago del vendedor. Sin publicidad de terceros.

### D-11 — Retención del pago
Escrow delegado en el proveedor. El dinero nunca lo toca 2venta.
**Consecuencia.** Depende de R-02. Si el proveedor no permite retención
condicionada, la alternativa de custodiar en cuenta propia cambia el perfil
regulatorio del negocio y necesita concepto legal antes de considerarse.

### D-11b — Plazo de liberación automática
7 días desde la entrega registrada. Inmediata si el comprador confirma o si se dicta
el código en entrega presencial.
**Por qué.** El reclamo por no coincidencia cierra a las 48 horas, así que los cinco
días extra cubren un caso distinto: la guía marcada como entregada sin que llegara
nada.

### D-12 — Política de devolución
48 horas desde la entrega, solo por no coincidencia con lo publicado. No cubre
arrepentimiento. Segunda ventana hasta el día 7 por producto no entregado. El
retorno lo paga la parte responsable.

### D-13 — Disputas
2venta arbitra con la evidencia de ambas partes, comparada contra el video de la
publicación.
**Consecuencia.** Exige personal de soporte desde el lanzamiento y un panel interno.
Sin ese panel esta decisión es una promesa que nadie puede cumplir.

## Confianza en el producto

### D-14 — Prueba de existencia
Video obligatorio grabado dentro de la app, en toda categoría. No se admite carga
desde galería.

### D-15 — Verificación de serial
IMEI o serial solo en electrónica. En ropa y hogar no se pide.

### D-16 — Moderación
Automática al publicar, humana solo si alguien reporta.
**Estado.** Modificada por R-03: mientras no haya acceso automatizado a la base de
IMEI, la electrónica pasa por revisión humana asistida.

### D-17 — Reputación
Estrellas y reseñas mutuas tras cada venta.
**Consecuencia.** El vendedor nuevo arranca sin nada que mostrar, justo cuando toda
la plataforma son vendedores nuevos. Pendiente decidir qué se le muestra mientras
acumula sus primeras ventas.

## Entrega

### D-18 — Envío
Pagado dentro de la app, guía generada desde la plataforma.

### D-19 — Entrega presencial
Permitida, con pago previo en la app y código de un solo uso que el comprador dicta
durante el encuentro. Nunca hay efectivo.

### D-20 — Carrito
Un vendedor por pedido. Varios productos del mismo vendedor sí.
**Por qué.** Un pedido es un envío, un escrow y una disputa. Mezclar vendedores
multiplica la complejidad sin resolver una necesidad real. Además es lo que hace
viable la economía de la categoría ropa (ver D-09b).

## Conversación y marca

### D-21 — Comunicación
Chat privado, oferta formal con vencimiento, y preguntas públicas en la ficha.

### D-22 — Filtro anti-desvío
Bloqueo de datos de contacto en chat, preguntas e imágenes. Debe cubrir números
escritos con letras, correos disfrazados, enlaces y menciones de billeteras.

### D-23 — Marca
Verde y consciente, economía circular al frente.
**Consecuencia.** El segmento de ingresos bajos compra por necesidad, no por
convicción ambiental. El mensaje verde debe traducirse siempre a plata ahorrada.

### D-24 — Funciones que suben a la versión 1
Alertas de búsqueda guardada, panel de métricas del vendedor y precio sugerido.
El contador de ahorro e impacto queda fuera, en tensión con D-23.

## Tecnología

### D-25 — Cómo llega React a las tiendas
React web renderizado en servidor, envuelto en una cápsula nativa para Android e
iOS. Descartado React Native con Expo.
**Por qué.** Un marketplace vive del descubrimiento orgánico, y la versión web de
React Native se arma en el navegador del visitante, lo que indexa mal. Las fichas de
producto en buscadores son el canal de adquisición más barato que existe.
**Qué se descartó.** Expo con react-native-web, que desde 2026 es de calidad de
producción y gana claramente en sensación nativa.
**Consecuencia.** La app se va a sentir como una muy buena aplicación web, no como
una app nativa. Transiciones, gestos y desplazamiento no van a igualar a una app de
la tienda. Es el precio de aparecer en Google.

### D-26 — Proveedor de pagos
Mercado Pago en modo marketplace. Descartado Wompi.
**Por qué.** La API de pagos a terceros de Wompi es dispersión por lotes, no
división de pagos, y su documentación no menciona retención condicional ni
onboarding de verificación de vendedores. Mercado Pago vincula al vendedor por
autorización delegada, con lo cual la verificación de identidad la hace el proveedor.
**Consecuencia.** El proveedor de pagos del competidor más grande queda dentro de la
operación. Es además la decisión técnica más cara de revertir, porque arrastra la
verificación de todos los vendedores ya registrados.

### D-05b — Categorías de la versión 1, corregidas
Tecnología, ropa y niños. Reemplaza a D-05, que decía hogar en vez de niños.
**Por qué.** Los mockups del proyecto de diseño son el artefacto más reciente y
dicen "tecnología, ropa y cosas de niños". Coincide además con la oportunidad que
la investigación había detectado explícitamente ("incluir segunda mano de juguetes
de niños, y cosas de niño en general"), mientras que hogar es una categoría que los
competidores ya cubren bien.
**Estado.** Tomada de forma autónoma para no bloquear la construcción. Pendiente de
confirmación. Es de las que conviene revisar.
**Consecuencia.** Para que revertirla no cueste una migración, las categorías dejan
de ser un tipo fijo de Postgres y pasan a una tabla `categories` sembrada. Cambiar
el conjunto es editar filas.
