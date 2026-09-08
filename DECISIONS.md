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

### D-27 — Biblioteca de autenticación
Better Auth, con su complemento de código por celular. No se implementa a mano el
manejo de contraseñas, tokens ni sesiones.
**Por qué.** Es lo que dice la lista de zonas sensibles del método: la fluidez con
la que un agente escribe su propia gestión de sesiones es justamente el riesgo.
Trae además ingreso con Google y Apple listo para activar cuando existan las
credenciales (D-01).
**Consecuencia, RESUELTA en la D-39.** Esta versión guardaba el código de
verificación en texto plano en la tabla `verification` y su complemento no ofrecía
opción de cifrarlo. Se dejó de usar ese complemento.

### D-28 — Registro solo por correo y contraseña
Se rechaza la creación automática de cuenta al verificar un celular.
**Por qué.** Esa opción de la biblioteca abre una segunda vía de registro, sin
contraseña, en la que pedir un código a cualquier número crea una cuenta. Una sola
puerta de entrada es más fácil de razonar y de defender.

### D-29 — Precio mínimo de publicación
$10.000 COP.
**Por qué.** Es consecuencia directa del piso de comisión de la D-09b, y nadie lo
había nombrado: sin un mínimo, un artículo de $3.000 pagaría el 83% de comisión.
En $10.000 el piso equivale al 25%, que sigue siendo alto pero es defendible para
el tramo más barato del catálogo.
**Estado.** Tomada al construir S-05. Pendiente de confirmación.
**Consecuencia.** Deja fuera el accesorio muy barato. Se mitiga igual que el
problema del piso: varios artículos del mismo vendedor en un pedido (D-20).

### D-30 — Proveedor de pagos de prueba mientras R-02 no tenga respuesta
Se construye contra una interfaz propia, igual que con mensajes e identidad.
**Consecuencia, y aquí la técnica tiene un límite distinto.** Con el envío de
mensajes, cambiar de implementación no altera nada más. Con pagos sí puede: si
resulta que la retención no se puede condicionar a un evento nuestro, cambia el
flujo del producto y no solo la integración. Lo que queda listo pase lo que pase es
el modelo de datos, la máquina de estados, la aritmética y el registro de
auditoría. Lo que puede tener que rehacerse es el momento exacto de la liberación.

### D-31 — El código de entrega se cifra, no se hashea
Se guarda con cifrado reversible (AES-256-GCM) y un secreto del servidor.
**Por qué.** La primera versión usaba un hash, que es más fuerte, y estaba mal: el
comprador necesita volver a ver su código cuando llega al encuentro, y de un hash
no se recupera nada. Un código que solo se puede ver una vez no sirve para lo que
existe.
**Qué se conserva.** La propiedad que importa aquí: quien tenga la base de datos
pero no el secreto del servidor no puede leer ningún código, y por lo tanto no
puede liberar pagos ajenos. Eso es exactamente lo que la D-27 no logra con el
código por SMS, y aquí sí, porque el código es nuestro.
**Consecuencia.** El secreto pasa a ser crítico: si se filtra, se filtran todos los
códigos vigentes. Rotarlo invalida los códigos en curso, así que hay que hacerlo
con la plataforma sin pedidos presenciales abiertos.

### D-32 — Modelo híbrido de moderación, según R-03
Ropa y niños salen directo al catálogo; electrónica queda en revisión humana.
**Por qué.** R-03 confirmó que no hay API pública para contrastar el IMEI contra la
base de equipos reportados. Reemplaza a la D-16 original, que decía moderación
automática al publicar y humana solo si alguien reporta.
**Consecuencia.** Un vendedor de electrónica espera antes de estar visible, y eso
cuesta. Se acepta porque publicar un equipo robado cuesta más. Cuando el contraste
sea automático, lo único que cambia es la función `initialStatus`.
**Además.** El IMEI se pide y se guarda desde ya aunque hoy no se pueda contrastar:
así se puede revisar el histórico cuando haya convenio, sin volver a molestar a
nadie, y pedirlo ahuyenta a una parte de quien vende robado.

### D-33 — Precio mínimo del filtro de contenido
La lista de términos prohibidos es corta y específica, no amplia y difusa.
**Por qué.** Rechazar una publicación legítima pierde un vendedor. Salió construyendo
un caso concreto: "perico" estaba en la lista de sustancias, y en Colombia son
huevos revueltos y también un loro. Detectar droga por jerga es una carrera que no
se gana; ese trabajo le toca a la cola de reportes.

### D-34 — Un vendedor sin ventas no muestra cifras en cero
El perfil de quien no ha vendido nada muestra desde cuándo es miembro y que su
identidad está verificada, y nada más. Las cifras aparecen con la primera venta.
**Por qué.** La D-17 dejó el problema abierto: el vendedor nuevo arranca sin nada
que mostrar, justo cuando toda la plataforma son vendedores nuevos. "0 ventas, 0
estrellas" se lee como mal desempeño cuando en realidad es ausencia de datos.
**Consecuencia.** El comprador tiene menos información sobre un vendedor nuevo, y
eso es correcto: la que había era falsa. Lo que sostiene la confianza mientras tanto
es la verificación de identidad y el pago retenido, que es exactamente para lo que
existen.

### D-35 — La carga en lote crea borradores, no publicaciones
Una tienda carga título, categoría, precio, estado, descripción e IMEI de varios
artículos a la vez, pero el video de cada uno se sigue grabando desde el móvil.
**Por qué.** Choca de frente con la D-14: si una tienda pudiera cargar cincuenta
artículos con sus videos desde un archivo, la garantía se cae, y la garantía es el
producto. Lo que se ahorra es escribir, que es el trabajo que de verdad cuesta en
volumen.
**Consecuencia.** Es más lento de lo que pediría una tienda con cincuenta equipos, y
es a propósito. Si el volumen resulta ser la barrera real para traer casas de
empeño, la conversación no es relajar el video sino ayudarles a grabarlo.

### D-36 — Cuánto puede alterar el orden un destacado
Los destacados van primero pero marcados, con tope de tres por página, y sin
saltarse los filtros del comprador.
**Por qué.** Un destacado que empuje demasiado convierte el catálogo en un tablón de
quien más paga, y eso destruye la razón por la que alguien vuelve.
**La regla que más importa** es la tercera: el destacado se aplica sobre el conjunto
que el comprador ya filtró. Uno que ignora el filtro es publicidad disfrazada de
resultado, y el comprador lo nota una vez y ya no confía en el orden nunca más.
**Consecuencia.** El destacado vale menos de lo que valdría sin tope, y por lo tanto
se puede cobrar menos. Es el precio de que el catálogo siga siendo creíble.

### D-37 — Precio del destacado
$8.000 COP por siete días.
**Estado.** Número de partida, no una decisión con fundamento: no hay datos de
cuánto vale un clic aquí. Revisar con tráfico real.

### D-38 — El precio sugerido no es un modelo
El rango sale de lo que se ha vendido de verdad en 2venta en esa categoría y ese
estado, y no se muestra nada si hay menos de cinco ventas.
**Por qué.** La D-24 habla de un modelo predictivo. No hay con qué entrenarlo: la
plataforma no tiene histórico. Un promedio de dos ventas es ruido presentado como
consejo, y quien fija su precio por un dato inventado se lleva la peor parte.
**Consecuencia.** Al principio no se sugiere nada, que es correcto. Cuando haya
volumen, este es el lugar donde entra un modelo de verdad.


### D-39 — El código por celular deja de delegarse
Se retira el complemento de celular de la biblioteca de autenticación. El código se
genera, cifra, guarda y comprueba en `src/features/auth/otp.ts`, con AES-256-GCM y
un secreto del servidor.
**Por qué.** Cierra la D-27, que arrastraba desde S-01: quien tuviera lectura de la
base podía tomar el control de cualquier cuenta durante los cinco minutos que el
código vive. En S-09 ya se había demostrado que el problema desaparece cuando el
código es nuestro.
**Qué NO cambia.** La biblioteca sigue manejando contraseñas, sesiones y tokens.
Eso sí no se implementa a mano. Lo que se dejó de delegar es un código de seis
dígitos con vencimiento, que es lógica de aplicación, no criptografía.
**Consecuencia.** El secreto del servidor pasa a ser crítico, como el del código de
entrega. Y se pierde el inicio de sesión por celular que traía el complemento, que
no se usaba.

### D-40 — La recuperación de contraseña va por celular, no por correo
El RF-04 decía "correo o SMS". Se hace solo por celular.
**Por qué.** El celular está verificado y el correo no. Mandar la recuperación a un
correo que nadie comprobó convierte ese correo en la llave real de la cuenta, y
cualquiera que se registre con un correo ajeno se queda con la puerta abierta.
Recuperar por el canal verificado es lo coherente con la D-01.
**Además:** ya existe toda la maquinaria del código por celular de S-17, cifrada y
con límite de intentos, y no hay proveedor de correo conectado.
**Consecuencia.** Quien pierde el acceso a su celular pierde la cuenta hasta que
haya un procedimiento con soporte humano. Es un caso real y no tiene solución de
pantalla: recuperar sin el canal verificado sería exactamente el agujero que esto
evita.

### D-41 — Cambiar la contraseña cierra las demás sesiones
**Por qué.** Si alguien entró a la cuenta, recuperar la contraseña tiene que
echarlo. No hacerlo dejaría al intruso adentro mientras el dueño cree que ya lo
resolvió, que es el peor de los dos mundos.

### D-42 — Suspender una cuenta no borra nada
La cuenta deja de poder entrar y sus publicaciones dejan de verse, pero sus pedidos,
conversaciones y calificaciones siguen existiendo.
**Por qué.** Al otro lado de cada pedido hay alguien que no hizo nada malo. Si
suspender borrara, suspender a un estafador dejaría a sus víctimas sin evidencia
justo cuando más la necesitan. Es el mismo razonamiento que retirar una publicación
en vez de borrarla.
**Consecuencia.** Los pedidos en curso de una cuenta suspendida quedan intactos,
incluidos los que tienen dinero retenido. Ese dinero se resuelve por la vía normal:
reclamo y arbitraje.

### D-43 — El alias se puede cambiar, pero queda el anterior
**Por qué.** Un vendedor que acumula malas reseñas no puede limpiar su rastro
cambiándose el nombre, que es lo primero que intentaría.

### D-44 — Las fotos sí se pueden subir de la galería; el video no
**Por qué no es una inconsistencia.** Son dos cosas distintas. El video prueba que
el artículo existe y está en manos del vendedor, y por eso se graba en vivo. Las
fotos son presentación: una foto buena, con luz y desde el ángulo que muestra el
detalle, sirve para vender, y exigir que se tomen dentro de la app solo las haría
peores sin agregar ninguna garantía.
**El razonamiento completo:** si alguien pone fotos de un producto que no tiene, el
video lo delata. Y si el video coincide, las fotos no engañan a nadie.

### D-45 — Una cuenta suspendida puede leer, no escribir
No puede comprar, escribir, ofertar, publicar, reportar ni volver a entrar. Sí puede
ver su cuenta y sus pedidos.
**Por qué la mitad de lectura.** Si tiene dinero retenido en una disputa, dejarla
ciega sería quitarle la única forma de defenderse. Suspender es una medida contra lo
que alguien puede hacer, no contra lo que puede saber de lo suyo.
**Cómo.** La comprobación vive en un solo punto, `activeUser()`, que usan todas las
acciones y todas las pantallas que escriben. Antes no existía y suspender no servía
para nada más que esconder el catálogo del suspendido.

### D-46 — No se cobra un precio distinto al que el comprador vio
La pantalla manda el total que se mostró. Si al confirmar no coincide, no se cobra:
se explica el cambio y se le muestra el nuevo.
**Por qué.** Antes se recalculaba en silencio con los precios del momento de
confirmar. No hace falta mala fe para que ocurra: basta que el vendedor esté
ajustando precios mientras alguien compra. Cobrar un precio distinto al que alguien
aceptó no es un detalle técnico.
