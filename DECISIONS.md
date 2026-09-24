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

### D-47 — La configuración se comprueba entera al arrancar
Si falta una variable de entorno, la aplicación se detiene diciendo cuáles faltan y
para qué sirve cada una. Todas de una vez, no la primera.
**Por qué.** Sin esto, una variable que falta se descubre tarde y mal:
`PICKUP_CODE_SECRET` revienta la primera vez que alguien compra en persona, y un
secreto de webhook ausente hace que ninguna firma valide, con el síntoma de que los
pagos no se confirman y ninguna pista de por qué. Eso muerde el día del despliegue,
que es el peor día para descubrirlo.
**Por qué todas de una vez.** Detenerse en la primera obliga a un ciclo de prueba y
error: se agrega una, se reinicia, falla la siguiente.
**Consecuencia.** La lista de obligatorias depende del entorno: en desarrollo no se
exige el proveedor de SMS ni el dominio, porque exigirlos ahí haría imposible
trabajar.

### D-48 — Monolito modular, no microservicios
Un solo servicio en contenedor, Postgres administrado y un worker aparte para el
trabajo en segundo plano. El detalle completo está en `ARQUITECTURA.md`.
**Por qué.** `transition()` mueve el estado de un pedido dentro de una transacción
con `for update` sobre la fila, y eso es lo que impide que dos avisos simultáneos
del proveedor de pagos liberen el mismo dinero dos veces. Separar pagos, pedidos y
envíos convierte esa transacción en una saga distribuida con compensaciones: se
cambia un problema que la base ya resolvió por uno nuevo, y el modo de falla es
plata de un comprador real.
**El otro motivo.** Los microservicios resuelven un problema de organización,
equipos que necesitan desplegar sin coordinarse. Aquí no hay dos equipos.
**Cuándo se revisa.** No cuando crezca el tráfico, sino cuando haya dos equipos que
se pisen al desplegar. El primer candidato a salir sería medios, que ya vive detrás
de `storage.ts`. Nunca el dinero: `payments`, `orders` y `claims` se quedan juntos.

### D-49 — Contenedor, no funciones sin servidor
ECS Fargate detrás de un balanceador, no Lambda por ruta.
**Por qué.** `src/lib/db.ts` abre una piscina con `max: 10` por proceso. En un
modelo por función, cada invocación fría abre la suya y las conexiones se
multiplican hasta tumbar Postgres. Se podría poner un intermediario de conexiones
delante, pero su modo transacción pelea con los bloqueos de sesión que usa
`transition()`.
**Consecuencia.** App Runner es una forma válida de arrancar mientras no haya
tráfico; es el mismo contenedor con menos piezas. Migrar después es recrear
infraestructura, no cambiar código.

### D-50 — Los archivos se suben directo al almacenamiento, no a través de la aplicación
El navegador sube a S3 con una URL prefirmada que firma el servidor.
**Por qué.** Un video puede pesar hasta 60 MB (`MAX_BYTES`). Atravesar el
contenedor ocupa memoria y tiempo de una tarea que debería estar atendiendo
peticiones, y no aporta nada: el archivo no se inspecciona al pasar.
**Qué se conserva.** La validación de tipo que hoy hace `isAllowedType` se hace al
firmar, del lado del servidor. El `content-type` que declara el cliente no es
prueba de nada.
**Consecuencia.** `src/app/api/media/[...path]` deja de existir en producción; los
archivos los sirve la red de distribución directamente desde el almacenamiento.

### D-51 — La liberación automática se encola, no se llama por HTTP
Un programador pone un mensaje en la cola cada hora y el worker llama
`releaseExpiredOrders()` directamente.
**Por qué.** La ruta `POST /api/tareas/liberar` con `CRON_SECRET` funciona, pero
deja un secreto y una llamada pública en el camino crítico del dinero. Encolar lo
quita de la superficie expuesta.
**Qué se conserva.** La ruta sigue existiendo como palanca manual de emergencia.
**Consecuencia.** Un temporizador dentro de la aplicación no sirve: con dos tareas
corriendo, se dispara dos veces.

### D-52 — Dos secretos no se rotan como los demás
`PHONE_CODE_SECRET` y `PICKUP_CODE_SECRET` cifran datos que están guardados en la
base (D-31). Rotar uno sin descifrar y volver a cifrar deja códigos de entrega
ilegibles, y un código ilegible es una entrega presencial que no se puede
completar.
**Los que sí rotan libremente:** `BETTER_AUTH_SECRET`, que solo cierra sesiones;
los tres de webhook, coordinando con el proveedor; y `CRON_SECRET`.

### D-53 — Una sola cuenta de AWS, entornos separados por prefijo
`dev` y `prod` viven en la misma cuenta, cada uno con sus propios recursos
nombrados `2venta-dev-*` y `2venta-prod-*`, definidos desde la misma
infraestructura como código con distinta variable de entorno.
**Por qué.** Es un MVP de una sola persona. Dos cuentas bajo una Organization son
la frontera correcta cuando haya plata real retenida, pero hoy duplican la
operación (facturación, permisos, perfiles) sin proteger nada que exista.
**Cuándo se revisa.** Antes del primer pedido con dinero real. Mover `prod` a su
propia cuenta en ese momento es recrear infraestructura con la misma definición,
no cambiar código.

### D-54 — El entorno lo declara `APP_ENV`, no `NODE_ENV`
`APP_ENV` vale `desarrollo` o `produccion` y decide qué proveedores son reales y
qué puentes de prueba existen. `NODE_ENV` sigue diciendo cómo se compiló.
**Por qué.** `NODE_ENV` lo fija `next build`: toda imagen de Docker corre en
`production`, aunque se despliegue en el entorno de desarrollo de la nube. Sin
esta separación, en `dev` no habría proveedor de pagos de prueba ni puentes
`/api/dev/*`, y no se podría probar una compra completa sin Mercado Pago real.
**El valor por defecto.** Si `APP_ENV` falta dentro de una imagen compilada, se
asume `produccion`. El error seguro es el que apaga los puentes de prueba, no el
que los deja abiertos. Bajo `next dev` se asume `desarrollo`.
**Lo que se queda con `NODE_ENV`.** La caché de la piscina de conexiones en
`db.ts`: lo suyo es la recarga en caliente, no el producto.

### D-55 — Sin dominio por ahora: App Runner da la dirección con HTTPS
Mientras no haya dominio, los dos entornos corren en App Runner y usan la
dirección `*.awsapprunner.com` que entrega, con certificado incluido.
**Por qué.** Una IP pública pelada solo da HTTP, y sobre HTTP fallan las cookies de
sesión, el webhook de Mercado Pago y el ingreso con Google. `BETTER_AUTH_URL`
exige `https://` en producción a propósito (D-47).
**Consecuencia.** Es la "alternativa más barata para arrancar" de D-49. Cuando
haya dominio se le asocia encima sin recrear nada. Pasar a Fargate + ALB es
recrear infraestructura, no cambiar código.

### D-56 — La comprobación de configuración mata el proceso, no lanza
`src/instrumentation.ts` imprime la lista de problemas y hace `process.exit(1)`.
**Por qué.** Next atrapa la excepción del hook de arranque y deja el servidor vivo
respondiendo 500. Para quien despliega eso pasa por "arrancó". Un proceso que
muere hace que App Runner o ECS reviertan el despliegue solos.
**Lo que se encontró al hacerlo.** `instrumentation.ts` estaba en la raíz y Next,
cuando el proyecto usa `src/`, solo lo busca en `src/`. Nunca había corrido, ni en
desarrollo. La validación de D-47 se probaba en unitarias pero no en el arranque
real; la prueba de la imagen fue lo que lo destapó.

### D-57 — La clave que manda el cliente se comprueba contra S3, no contra el cliente
Al publicar, cada clave pasa por `claim()`: forma exacta, el objeto existe, su
metadato `owner` es quien publica, y tipo y tamaño se leen de lo que S3 registró.
**Por qué.** Con la subida directa (D-50) el servidor deja de ver los bytes, y el
cliente pasa a mandar una clave que él obtuvo. Sin esta comprobación, podría
publicar con el video de otro vendedor o con un objeto que nunca subió.
**Cómo se ata el dueño.** La firma de subida incluye `x-amz-meta-owner`,
`content-type` y `content-length`: cambiar cualquiera hace que el bucket rechace
el PUT. Así lo que `claim` lee es lo que se firmó.
**Consecuencia.** No hay camino de disco local. En el portátil el bucket lo da
MinIO; el código que se prueba es el que se despliega.

### D-58 — Si encolar falla, lo que ya pasó sigue adelante
La acción de publicar encola el aviso con `enqueueOrLog`: si la cola no responde,
la publicación sale igual y el error queda en el registro.
**Por qué.** El aviso es consecuencia de algo que ya ocurrió. Un aviso que no se
manda es peor que nada, pero una publicación que no sale porque la cola estaba
caída es peor que eso.
**Dónde no aplica.** A lo que es causa y no consecuencia. La liberación no la
encola la aplicación sino el programador; si ese mensaje no llega, lo detecta la
alarma de "no corrió en 2 horas" (ARQUITECTURA.md 5.7), no un registro.

### D-59 — El worker se ejecuta desde un solo archivo empaquetado
`esbuild` junta `src/worker/index.ts` y todo lo que importa en `dist/worker.cjs`, y
la imagen lo corre con `node worker.cjs`.
**Por qué.** La salida `standalone` de Next solo lleva lo que las rutas usan; el
worker importa `src/features/*` por alias de TypeScript, que Node no resuelve, y
meter `tsx` en la imagen de producción es llevar un compilador a donde no hace
falta. Un archivo empaquetado no depende de nada de eso.
**Consecuencia.** El worker no puede importar nada que llegue a `next/*`
(`session.ts`, acciones de servidor). Hoy no lo hace; si lo hiciera, el paquete
crecería hasta incluir Next y sería la señal de que algo está en el sitio
equivocado.

### D-60 — CloudFront delante de un ALB, en vez de App Runner
Los dos entornos corren en ECS Fargate detrás de un ALB, con CloudFront delante.
Reemplaza a la D-55 en lo que a App Runner se refiere.
**Por qué.** App Runner siguió en `SubscriptionRequired` en la cuenta nueva
sin fecha para activarse. Y lo que App Runner iba a resolver, el HTTPS sin
dominio, CloudFront lo resuelve igual: certificado propio en `*.cloudfront.net`.
**Lo que se gana.** Es el destino que la D-49 ya fijaba; se salta la escala
intermedia y la migración posterior que traía. CloudFront además es donde va
el WAF y donde se asociará el dominio cuando exista.
**Cómo se protege el balanceador.** Solo acepta tráfico desde la lista de
prefijos administrada de CloudFront, y solo por HTTP: el cifrado con el usuario
lo hace CloudFront. Una petición directa al DNS del ALB no llega ni al puerto.
**Un detalle que muerde.** CloudFront reenvía la cabecera `Host` tal cual
(política `AllViewer`). Next compara `Origin` con `Host` en las acciones de
servidor; con el DNS del balanceador en `Host` las rechazaría todas.

### D-61 — En `dev` las tareas tienen IP pública; en `prod` no
En `dev`, las tareas de ECS corren en subredes públicas con IP pública y sin NAT.
En `prod`, en privadas con NAT y endpoints de VPC (ARQUITECTURA.md 5.6).
**Por qué.** Un NAT cuesta ~33 USD/mes y los cinco endpoints de interfaz que lo
reemplazan, ~36. Para un entorno de desarrollo es más que todo lo demás junto.
**Qué lo hace aceptable.** Los grupos de seguridad no admiten nada de entrada
salvo el ALB hacia la web en el puerto 3000; el worker no admite nada. RDS está
en subredes privadas en los dos entornos y no es accesible desde fuera de la VPC.
**Dónde no aplica.** Nunca en `prod`: ahí hay dinero y datos personales reales.

### D-62 — El estado de Terraform contiene los secretos, y se sabe
Los secretos de firma y cifrado y la contraseña de RDS los genera Terraform y
quedan en el estado, en un bucket privado, versionado y cifrado, con bloqueo.
**Por qué.** Es lo que permite que `terraform apply` sea el único camino a la
infraestructura, sin pasos a mano. Es aceptable para un MVP con una persona.
**Consecuencia.** Quien lea el bucket de estado lee los secretos. No se amplía
el acceso al bucket sin pensarlo, y cuando haya equipo se mueve la generación
fuera del estado (Secrets Manager con rotación propia).

### D-63 — `prod` se define, no se aplica
`infra/envs/prod` existe con Multi-AZ, NAT, WAF y dos tareas, y no se aplica.
**Por qué.** Sin proveedor de SMS la aplicación se niega a arrancar en
`produccion` (D-47): serían ~170 USD/mes por un servicio que no puede recibir a
nadie. Se aplica cuando R-02 tenga respuesta y exista `SMS_PROVIDER_TOKEN`.

### D-64 — La transcodificación va por el worker, sin Lambda
La acción de publicar encola `transcodificar`; el worker crea el trabajo de
MediaConvert; al terminar, EventBridge encola `video_listo` y el worker actualiza
la publicación. No hay función Lambda en el camino.
**Por qué.** La forma obvia (S3 → Lambda → CreateJob) mete un segundo runtime
con su propio despliegue, sus registros y su versión del SDK para veinte líneas.
El worker ya existe, ya tiene rol, registros y reintentos.
**Quién dispara.** La acción de publicar, no un evento del bucket: al bucket
también llegan portadas y fotos, y quien sabe que hay un video nuevo es quien
lo acaba de publicar. Funciona igual en el portátil con el proveedor de prueba.
**Qué se sirve mientras tanto.** El original. Quien tenga el mismo tipo de
teléfono que el vendedor lo ve igual que antes; el resto, en pocos minutos.

### D-65 — Al retirar o vender, el destacado termina y no se devuelve
`setListingStatus` cierra los destacados activos al pasar a `retirada` o `vendida`.
**Por qué.** Nadie va a ver un destacado de algo que ya no se ofrece, y fue el
vendedor quien la sacó. Devolver una parte proporcional exige contabilidad que no
existe y un proveedor de pagos real.
**Origen.** Duda de la ronda de QA del 2026-09-13.

### D-66 — La D-22 aplica a todo lo público, y en los campos de identidad se rechaza
Título, descripción, alias y razón social pasan por el mismo detector que el
chat. En ellos no se oculta con "•••••": se rechaza con explicación.
**Por qué.** Un teléfono en el título es la forma más cómoda de salirse del pago
protegido, más que el chat. Y un título o un alias con un hueco no dicen nada.
**Qué no cubre.** La nota de dirección (la ven las dos partes; el celular de quien
recibe es legítimo) y el detalle de un reporte (lo lee un administrador).
**Origen.** Tres hallazgos críticos de la ronda de QA del 2026-09-13.

### D-67 — El alias elegido no puede ser el de otra persona; el derivado sí puede repetirse
Al cambiar el alias se comprueba que no lo use nadie más (sin distinguir
mayúsculas). No hay índice único.
**Por qué.** El alias inicial se deriva del nombre ("Catalina R.", D-04) y dos
personas con el mismo nombre son inevitables; un índice único rompía el registro.
Lo que importa cerrar es hacerse pasar a propósito por alguien concreto.

### D-68 — `/vender` es el panel del vendedor, no una pantalla de estado
Para un vendedor con identidad aprobada, `/vender` deja de ser un mensaje de
confirmación y pasa a ser su punto de entrada: publicar, sus publicaciones y sus
ventas. La cabecera lleva ahí con un botón «Vender».
**Por qué.** Decía «ya puedes publicar» y su único enlace iba al catálogo. Sus
publicaciones vivían en `/vender/metricas`, a la que no llegaba ningún enlace de
la interfaz: existía y no se podía encontrar. Lo reportó Nicolás usando la app.
**Consecuencia.** El título pasa de «Identidad verificada» a «Tu espacio de
vendedor»; el distintivo de verificación sigue visible dentro.

### D-69 — Desde el perfil del vendedor se explica dónde está el chat, no se abre uno
El perfil dice que la conversación va por artículo y que hay que abrir el que
interesa. No se crea un hilo sin artículo.
**Por qué.** Un hilo sin artículo obligaría a cambiar el modelo (la conversación
es única por `(listing_id, buyer_id)`) y dejaría conversaciones sin contexto: ni
el vendedor sabría de qué producto le hablan. El hueco real era que nadie decía
dónde estaba el chat.
**Pendiente de confirmar con Nicolás**, que esperaba encontrarlo en el perfil.

### D-70 — El escritorio deja de ser el móvil estirado
El feed y la ficha usan un contenedor de 1152 px; el feed va de 2 a 4 columnas
según el ancho, y la ficha se parte en dos columnas con la compra a la derecha.
**Por qué.** Todo el producto se dibujaba en 768 px con dos columnas fijas: en un
monitor quedaban dos tiras estrechas centradas, media pantalla vacía y una página
interminable. Y en la ficha, el botón de comprar caía fuera de la pantalla.
**Qué no cambia.** Las pantallas de lectura y de formulario siguen angostas: una
línea de texto de 1152 px no se lee.

### D-71 — El video se anuncia donde se mira
Cada tarjeta del feed lleva un distintivo «Con video», y la ficha marca el video
como «Grabado por el vendedor».
**Por qué.** D-14 hace del video la prueba de que el artículo existe y es lo que
justifica la comisión y el pago protegido. En el feed no se veía: la tarjeta era
la de cualquier clasificado, con una foto fija. El diferenciador del negocio era
invisible en la pantalla más vista.

### D-72 — La cabecera es navegación, no una fila de enlaces
Tres grupos: la marca, lo de cada día (`Explorar`, `Carrito`, `Guardados`,
`Avisos`) y quién eres (foto, alias y un desplegable con la cuenta, las
publicaciones, la actividad y salir). «Vender» queda aparte, en mostaza. En pantalla
angosta todo lo que no es la marca cabe detrás de un solo botón.
**Por qué.** Eran seis enlaces subrayados del mismo tamaño y el mismo color: nada
decía cuál era importante, y en un celular la barra se partía en dos renglones.
**Cómo.** Es un `<details>`, no un componente de cliente: funciona sin JavaScript,
no hidrata nada y se cierra solo al navegar, porque la pantalla se vuelve a pintar.

### D-73 — La pantalla de publicaciones del vendedor gestiona, no solo informa
`/vender/metricas` mantiene su dirección y cambia de contenido: cada publicación
lleva su portada, su precio, su estado y las acciones que ese estado permite
(editar, reservar, republicar, marcar vendida, retirar).
**Por qué.** Enseñaba tres cifras por artículo y ninguna forma de actuar sobre lo
que esas cifras decían. Para bajar un precio o reservar algo había que salir, buscar
la publicación en el catálogo público y entrar por su ficha, que es el camino de un
comprador, no el de su dueño.
**Qué no cambia.** Las transiciones y quién puede hacerlas siguen en
`setListingStatus`, comprobadas en el servidor y en la misma consulta que escribe.
La pantalla no decide nada: solo deja de esconder lo que ya se podía hacer.

### D-74 — Hay foto de perfil, y no exige identidad verificada
`user.avatar_path` guarda la clave del objeto en el bucket (no una dirección: la
arma `mediaUrl()` en cada entorno). Se sube con URL prefirmada como todo lo demás
(D-50) y el servidor comprueba la clave contra S3 con `claim()` antes de guardarla.
**Por qué sin KYC.** Subir una foto de perfil no es publicar. Un comprador también
tiene cara, y pedirle la cédula para ponerla sería exigirle a todo el mundo lo que
la D-02 le pide solo a quien vende.
**Por qué una columna nueva y no `"image"`.** Esa columna es de Better Auth y la
escribe el proveedor externo; entrar con Google borraría la foto que la persona
subió. Son dos cosas distintas y se guardan aparte.

### D-75 — La comisión la paga el vendedor (confirmado)
Se mantiene la D-09: el comprador paga el precio publicado más el envío, y la
comisión se descuenta de lo que recibe el vendedor.
**Por qué se vuelve a anotar.** El mockup del checkout (06/07) muestra «Protección
de pago (5%)» sumada al total del comprador, que es el producto contrario. Nicolás
lo resolvió el 2026-09-14 a favor de la D-09. **Esa pantalla del mockup no se
sigue**, y queda dicho aquí para que nadie la implemente creyendo que el código
está mal.

### D-76 — La identidad se comprueba otra vez al momento de cobrar
El KYC de registro (D-02) no reemplaza una segunda comprobación: cuando el vendedor
retire dinero —o cambie su cuenta bancaria— se le pide una selfie y se compara con
la de su registro.
**Por qué.** Es lo que pide el RF-06 y lo que dicen los mockups en dos sitios. El
KYC de registro prueba quién abrió la cuenta; la comprobación al cobrar prueba que
quien saca la plata es esa misma persona, que es un riesgo distinto: una cuenta
robada meses después pasa el primero y no el segundo.
**Estado.** Sin construir, y no se puede construir todavía: no existe el retiro de
dinero ni el proveedor real de identidad. Va con esa rebanada, no antes.

### D-77 — En móvil la navegación va abajo, como en el mockup
Barra fija inferior con cinco destinos: Inicio, Buscar, Publicar, Chats y Perfil.
El centro es publicar, en mostaza, porque es la acción que hace crecer el catálogo.
**Por qué.** Estaba en los mockups desde el principio (pantalla 1d) y no se había
construido. En un teléfono el pulgar llega abajo y no arriba, y la D-08 dice que el
móvil manda.
**Qué pasa con la cabecera.** Sigue siendo la navegación del escritorio. En móvil se
queda con la marca y la sesión, y suelta los destinos que ahora viven abajo.

### D-78 — Un pedido sin pagar caduca a los treinta minutos
Reservar el artículo al empezar el checkout se mantiene: es lo que impide que dos
compradores paguen lo mismo. Lo que se agrega es la vuelta atrás. Un pedido que se
queda en `pendiente_pago` treinta minutos se cancela solo y su artículo vuelve al
catálogo; el barrido (`caducar`) corre cada diez minutos por la cola.
**Por qué treinta.** De sobra para volver de la pasarela, pagar con PSE o pedirle la
tarjeta a alguien; poco para el vendedor, cuyo artículo está bloqueado mientras tanto.
**Lo que faltaba de verdad.** No había ninguna forma de soltar la reserva: ni
automática, ni para el comprador, ni para el vendedor. Y a quien abandonaba su propio
pago se le decía «alguien más se adelantó» cuando volvía a intentarlo. Lo encontró la
ronda de usuario del 2026-09-14.
**Consecuencia.** El comprador puede terminar el pago o cancelarlo desde su pedido, y
la ficha le dice que es él quien lo tiene apartado.

### D-79 — La comisión por categoría se reparte a prorrata
En el informe de negocio, la comisión de un pedido se reparte entre sus renglones
según el precio de cada uno.
**Por qué.** La comisión es del pedido y el desglose es por categoría; sumarla tal
cual sobre un `join` de renglones la multiplicaba por el número de artículos. Un
pedido de dos cosas reportaba el doble de comisión que el resumen de la misma
pantalla (ronda de usuario, 2026-09-14).
**Qué se gana.** La suma de las categorías vuelve a dar la comisión del periodo,
incluso cuando un pedido cruza dos categorías.

### D-80 — Una pantalla ajena no se disfraza de artículo vendido
El 404 deja de afirmar que lo que falta es un artículo. Y al intentar editar una
publicación que no es tuya se dice así, **siempre que la publicación ya sea pública**;
de una en revisión o rechazada no se confirma ni que exista.
**Por qué.** Decirle «pudo venderse» a quien pidió una pantalla sin permiso lo manda a
buscar una explicación falsa, y le basta abrir la ficha para ver que era mentira. Pero
confirmar la existencia de lo que todavía no es público sí filtraría algo, así que la
línea se traza en si el artículo ya se puede ver o no.

### D-81 — La ficha muestra lo que 2venta comprobó, y nada que no tenga
En la columna de compra, los atributos del artículo van como distintivos y el
vendedor lleva su foto, su verificación y su reputación (calificación, ventas y
tasa de disputa), con enlace al perfil.
**Por qué.** Es la pantalla donde se decide pagarle a un desconocido, y era la que
más se alejaba del mockup (1f). El «IMEI validado» es el caso claro: se le pide al
vendedor, se valida con dígito de verificación y se guarda desde S-01, y al
comprador —que es a quien le sirve— nunca se le decía.
**Qué no se muestra.** El número de IMEI, nunca: identifica un equipo concreto y con
él se rastrea a su dueño. Solo el hecho de que exista y esté validado. Y el «Batería
89%» del mockup se queda fuera: no es un dato que el producto recoja, e inventarlo
sería mentir sobre el estado del artículo.

### D-82 — Un vendedor sin ventas dice que es nuevo, no muestra ceros
Cierra lo que la D-17 dejó pendiente. Con cero ventas no se enseñan «0 ventas · 0%
disputas» en ninguna parte: el perfil ya lo explicaba con una frase entera, y ahora
la ficha dice «Primera venta en 2venta» y, si la tiene, que su identidad está
verificada.
**Por qué.** Un cero se lee como mal desempeño cuando solo significa que es nuevo, y
al arrancar la plataforma lo son todos. La identidad verificada es la única señal
real que un vendedor nuevo sí tiene, así que es la que se muestra en su lugar.

### D-83 — El seguimiento del pedido es una línea de tiempo, no un rótulo
La pantalla del pedido muestra los pasos por los que pasa, cuáles se cumplieron y
con qué hora, y cuál va ahora. Sustituye al rótulo de estado suelto y a la lista de
«Movimientos» del final, que decían lo mismo repartido en dos sitios.
**Por qué.** Ninguno de los dos decía nunca **qué falta**, que es justo lo que va a
buscar alguien que acaba de pagarle a un desconocido y tiene su plata retenida.
**Cómo se calcula.** Los pasos cumplidos salen de `order_events`, no del estado
actual: un pedido puede saltarse pasos —la entrega en persona va de `pagado` a
`liberado` sin pasar por `despachado`— y así cada paso muestra su hora de verdad.
**Dos caminos.** Con envío son cuatro pasos; en persona, dos. Inventarle a una
entrega en mano un paso de transportadora sería describir algo que no ocurre.
**Los desvíos no se disfrazan de camino feliz.** Cancelado y reembolsado tienen su
propio bloque, y un reclamo abierto dice que el dinero no se mueve mientras se
decide.
**Lo que no se construyó.** El paso «En reparto en Bogotá» del mockup necesita que
la transportadora lo reporte, y la nuestra es de prueba con dos estados. Va con R-04:
decirle a alguien que su paquete se está moviendo sin saberlo es peor que no decirlo.

### D-84 — La paleta es «petróleo y coral»
Verde bosque y mostaza salen; entran petróleo (`#0F4C4A`) y coral (`#FF6B4A`), con la
misma estructura de siempre: la marca sostiene cabecera, precios y superficies
serias, y el acento se reserva para el dinero y la acción principal de cada pantalla.
**Por qué.** Lo pidió Nicolás con la paleta en la mano (2026-09-15). Lo que la hace
funcionar y no solo cambiar de tono es que el petróleo es más profundo y más frío que
el verde, y deja que el coral —cálido y saturado— sea lo único que grita.
**El coral lleva texto oscuro, no blanco.** Blanco sobre coral da 2,82:1 y WCAG pide
4,5:1; con la tinta de marca da 5,78:1. No es una preferencia: es la única de las dos
que se puede leer.
**El coral lleva borde (`accent-edge`, `#D8431F`).** Contra la crema, el coral solo da
2,57:1 y WCAG 1.4.11 pide 3:1 para el contorno de un control. Sin ese borde, un botón
principal no tiene bordes visibles para quien ve poco contraste. La mostaza vieja daba
1,88:1 y nadie lo había medido.
**Los semánticos se separan del acento.** El aviso se va al ámbar y el peligro al
carmesí. Tres naranjas seguidos no significan nada, y el color es lo único que
distingue «cuidado» de «esto borra algo».
**Los grises llevan una gota de petróleo.** Un gris neutro sobre una crema fría se ve
sucio. De paso, el gris tenue pasa de 4,21:1 a 4,75:1 y deja de incumplir AA.

### D-85 — El arco del logo se usa en grande como recurso gráfico
El arco del isotipo —el ciclo de reuso— aparece al 15 % de opacidad en la franja de
inicio y al 7 % en los estados vacíos.
**Por qué.** Estaba solo dentro del logo, a 32 px, donde nadie lo lee como una forma.
Una marca con personalidad repite su gesto en tamaños donde ya no es un logo sino una
textura, y es lo que hace que una franja de color deje de ser un rectángulo.
**Los límites.** Es decorativo y solo decorativo (`aria-hidden`, sin texto). Por
encima del 15 % deja de ser textura y se convierte en una mancha encima del titular;
se probó al 25 % y hubo que bajarlo.

### D-86 — El movimiento tiene un vocabulario, y cada animación tiene un trabajo
Tres curvas y tres duraciones viven en `@theme`, y ninguna pantalla inventa las
suyas. Lo que se mueve: el hundimiento de todo control al tocarlo, el corazón al
guardar, el punto del paso en curso del seguimiento, y el levantamiento de la tarjeta
al pasar por encima.
**Por qué así.** Si cada pantalla escribe su propia curva, el producto se siente hecho
por cinco personas distintas.
**Lo que se decidió NO animar.** La entrada escalonada de las tarjetas del catálogo.
Retrasa el contenido que la persona vino a ver, y es el gesto que más delata a una
interfaz decorada en vez de diseñada. Una animación que no confirma, guía ni explica
no entra.
**Quien pidió menos movimiento lo pidió en serio.** `prefers-reduced-motion` apaga
todo y deja cada elemento en su estado final, nunca en el inicial: una animación de
entrada mal apagada deja contenido invisible para siempre.

### D-87 — No hay esqueletos de carga en el catálogo ni en la búsqueda
Se construyeron, se probaron y se retiraron.
**Por qué.** Un esqueleto de carga necesita `Suspense` con streaming, y el streaming
manda el hueco primero y el contenido después, cosido con JavaScript. Sin JavaScript,
el contenido nunca llega. La D-25 dice que el catálogo y la ficha tienen que existir
como HTML del servidor para que un buscador los indexe, y de eso depende el argumento
entero de la decisión de tecnología. Lo cazaron dos pruebas que ya existían
(«la búsqueda funciona sin JavaScript del cliente», «la ficha se sirve como HTML»).
**Qué sí es posible.** Las pantallas privadas —actividad, guardados, panel del
vendedor— no las indexa nadie y ahí no hay conflicto. Queda anotado en `NOTES.md`
como lo siguiente, no construido: cambiar la garantía de indexación por una animación
de carga sería un mal negocio, pero no aplicarla donde no hay garantía que perder es
solo trabajo pendiente.

### D-88 — Un estado vacío dice qué va a aparecer ahí y cómo hacer que aparezca
Tres piezas siempre: el arco de la marca para que el hueco se vea intencionado, una
frase que diga qué llenará ese espacio, y el camino para llenarlo.
**Por qué.** «Todavía no has comprado nada» es cierto y es inútil: describe el problema
y no ofrece la salida. Y es justo la pantalla que más gente ve al empezar, cuando
todavía no ha decidido si el producto es para ella.

### D-89 — «Tu actividad» lista pedidos, no artículos
Un pedido aparece en un solo renglón, con el primero de sus artículos por nombre y
«y N artículos más» al lado cuando trae varios.
**Por qué.** La consulta unía `order_items` de frente, así que un pedido de dos
artículos salía en dos renglones **con el total del pedido entero en cada uno**: quien
compraba dos cosas de una vez veía su gasto duplicado en pantalla. Era además la causa
del aviso de React de dos hijos con la misma clave, porque las dos filas traían el
mismo `o.id`.
**Cómo se encontró.** Por el indicador de problemas de Next colado en una captura de
la suite visual, con dos renglones distintos mostrando el mismo importe al lado.
**Por qué se nombra el primer artículo y no todos.** Elegido por `i.id` para que sea
siempre el mismo y la lista no baile entre recargas. El importe es el del pedido
entero, así que el renglón tiene que decir que hay más de una cosa: si no, la cifra
parece el precio de lo único que se nombra.

### D-90 — Las conversaciones tienen pantalla propia, en `/chats`
La bandeja se saca de `/actividad` y vive en `/chats`, con la forma de bandeja de
cualquier marketplace: cara de la contraparte, artículo, último mensaje, hora
relativa y punto de no leído. `/actividad` se queda con compras y ventas, y enlaza.
**Por qué.** Lo pidió Nicolás (2026-09-15) comparándolo con Facebook Marketplace, y
detrás había un desajuste concreto: la barra inferior decía «Chats» y llevaba a
`/actividad`, donde las conversaciones eran la **tercera** sección, debajo de compras
y ventas. El rótulo decía una cosa y el destino era otra.
**Por qué no se deja también en `/actividad`.** Tener la misma lista en dos sitios es
lo que hacía que ninguno de los dos se sintiera el sitio. Queda el camino, no la copia.
**El no leído es por participante** (tabla `conversation_reads`), no por conversación:
que el comprador abra el hilo no puede marcar como leído lo del vendedor. No existir
fila significa «no ha leído nada», que es el estado correcto de una conversación
recién abierta, así que no se siembra nada al crearla.
**El contador cuenta conversaciones, no mensajes.** Lo que le sirve a alguien es «con
cuánta gente tengo algo pendiente», no cuántas frases hay sin abrir.
**Control de acceso.** Son datos personales de dos personas: `markConversationRead`
vuelve a filtrar por participación dentro de la propia consulta en vez de confiar en
que la pantalla ya lo comprobó, y el punto de no leído sale de la misma consulta ya
filtrada que la lista.
**Lo que no lleva.** Tiempo real, buscar dentro de las conversaciones, archivar,
silenciar ni marcar como no leído a mano. Nada de eso se pidió y ninguno tiene
volumen que lo justifique todavía.

### D-91 — El chat parece un chat, y la oferta tiene su propio panel
La conversación pasa a altura completa con tres franjas —el artículo arriba, los
mensajes en el medio con su desplazamiento, el compositor abajo—, burbujas con hora,
separadores de día, y las ofertas dentro de la línea de tiempo en su sitio
cronológico. Ofertar sale del compositor y pasa a `/chat/[id]/oferta`.
**Por qué.** Lo pidió Nicolás (2026-09-18) con una captura. «Ofertar» pesaba lo mismo
que «Enviar»: debajo del campo de escribir había un segundo campo, de precio,
siempre visible. La acción de cada día —preguntar— y la excepcional —negociar—
competían por el mismo sitio.
**Por qué una pantalla y no un diálogo.** Una oferta es un compromiso con
vencimiento; merece una decisión consciente y así funciona sin JavaScript.
**La barra inferior desaparece dentro de la conversación.** Es lo que hace cualquier
app de chat: ahí abajo el pulgar quiere el campo de escribir. Al no estar en el
árbol, el hueco que reserva `globals.css` con `body:has(...)` desaparece solo.
**Lo que costó averiguar.** `router.push()` antes de `router.refresh()` en los seis
formularios de sesión era una condición de carrera real: la navegación podía servir
la copia en caché tomada **antes** de que existiera la sesión, y la cabecera se
dibujaba como si nadie hubiera entrado. Explicaba tres intermitentes anotadas. Al
cerrar sesión era peor: «/» podía dibujar a la persona como si siguiera dentro.

### D-92 — Fotos en el chat, y una salida cuando se pone feo
El vendedor puede adjuntar una foto por mensaje; las dos partes pueden reportar la
conversación.
**Por qué van juntas.** La segunda es la condición de la primera. Abrir un canal por
el que entran imágenes a una conversación privada entre desconocidos, sin salida para
quien recibe algo que no pidió, sería añadir una superficie de abuso y ninguna
defensa. El filtro de la D-19 lee texto; una imagen se lo salta entera.
**Solo el vendedor adjunta.** Es lo que se pidió y es el lado que tiene algo que
enseñar. Queda pendiente para el día que haya un reclamo con fotos del defecto.
**Reportar no le avisa a la otra parte.** Un reporte que el reportado puede ver
convierte el botón en algo que da miedo usar, y quien está siendo acosado es justo
quien menos puede permitirse ese miedo.
**Tabla propia y no `reports`.** «Este artículo es falso» y «esta persona me está
acosando» son cosas distintas, van a manos distintas, y la restricción única de
`reports` impediría reportar las dos.
**Quien modera puede leer la conversación, y solo esa.** La condición —que tenga un
reporte sin resolver— vive en el `where` de la consulta, no en la pantalla. Un
administrador no lee conversaciones privadas porque sí: lee las que alguien pidió que
se revisaran, mientras esa revisión siga abierta. Y es de solo lectura: quien modera
juzga lo que pasó, no participa.

### D-93 — El botón de volver es un objeto, no una palabra subrayada
En las dieciséis pantallas que lo tienen, devolverse era
`<Link className="text-sm text-ink2 underline">Volver</Link>`: texto subrayado, sin
forma, sin contorno y sin dirección, con el mismo peso visual que un enlace dentro de
un párrafo. Pasa a ser `src/components/Volver.tsx`: cápsula blanca con el mismo
anillo `line` que las tarjetas, y una flecha que se corre dos píxeles a la izquierda
al pasar el puntero.
**Por qué importa más de lo que parece.** Es el control que más se usa en un teléfono
y era el único de todo el producto que no parecía un control. Un subrayado dice
«esto es un enlace»; no dice hacia dónde va ni que sea el camino de salida de esta
pantalla.
**La flecha es el único movimiento y cumple la D-86.** No adorna: explica la
dirección, que es justo lo que el subrayado no hacía.
**Lo que NO se convirtió.** «Limpiar» en los filtros y los dos `<summary>` que
despliegan un formulario comparten el estilo viejo y se quedan como están: no son
salidas de pantalla, y ponerles una flecha de volver sería mentir sobre lo que hacen.

### D-94 — El coral de la cabecera se perfila; el relleno queda para la acción de la pantalla
«Vender» y «Entrar» usaban el mismo relleno coral sólido que la acción principal de
cada pantalla. En una ficha sin sesión se veían dos botones naranjas del mismo peso
—«Entrar» arriba y «Comprar con pago protegido» abajo— y nada distinguía cuál era el
importante. Ahora la cabecera va perfilada sobre el petróleo con `accent-on-brand`,
un token que ya existía y no se usaba para esto.
**Por qué no se quitó el coral del todo.** Publicar es lo que hace crecer el
catálogo; la invitación tiene que seguir llamando. Lo que no puede es competir.
**La D-84 seguía incumpliéndose donde más se ve.** El repintado a petróleo y coral
arregló las pantallas y no tocó la cabecera, que sale en todas. Encontrado en la
ronda de diseño de Sol, 2026-09-20.

### D-95 — Las pantallas de entrada llevan marca y llevan salida
`AuthShell` no pintaba el logo. Las cuatro pantallas de entrada eran título, campos y
botón flotando sobre la crema, sin identidad y sin más salida que el «atrás» del
navegador.
**Por qué ahí y no en otra parte.** Es el momento exacto en que alguien decide
confiarle un correo, un celular y una contraseña a una empresa que no conoce. Es
cuando más debería verse de quién es el formulario.
**El logo es además la salida.** Enlazado a `/`. No hace falta la cabecera completa:
a quien no tiene sesión no hay carrito ni avisos que mostrarle.
**Se había encontrado antes y se quedó sin decisión.** El informe de arte del
2026-09-13 lo señaló (H6) con la causa exacta y no entró ni en los hallazgos cerrados
ni en los abiertos. Siete días de diferencia entre encontrar algo y decidir sobre
ello es el hueco real que esto también cierra.

### D-96 — Lo que encontró la ronda de verificación del 2026-09-20
Cinco defectos confirmados leyendo el código y reproducidos con pruebas antes de
arreglarlos. Se anotan juntos porque comparten una misma causa de fondo.

**Pagar una oferta aceptada era imposible.** La acción de pago comparaba el total que
manda el comprador contra el precio PUBLICADO, y solo después aplicaba el de la
oferta. Como una oferta aceptada vale distinto por definición, toda negociación
terminaba en «el precio cambió mientras comprabas». Negociar y después no poder pagar
es el peor final posible para esa función.

**Una oferta se resolvía sin mirar de quién era.** Se comprobaba el artículo y el
estado, no el dueño. Ahora se comprueba que quien paga sea el comprador de la
conversación donde vive la oferta, y la pantalla tampoco enseña el precio negociado a
quien no es.

**El vendedor veía la dirección de un pedido sin pagar.** La dirección se captura
antes de pagar; la sección se pintaba con que existiera.

**Una cuenta suspendida podía reportar.** `reportListing()` leía la sesión con
`currentUser()` en vez de `activeUser()`.

**Se podía ofertar por un artículo ya vendido**, y el vendedor aceptaba algo que
nadie podía pagar.

**Sin celular confirmado se podía escribir en una conversación ya existente.** La
comprobación estaba solo en las acciones que CREAN la conversación. Reportar sí
queda exento a propósito: poner un trámite delante de quien pide ayuda es lo contrario
de lo que se decidió en la D-92.

**La causa de fondo, que es lo que hay que recordar.** Tres de los cinco tenían
encima un comentario que afirmaba justo la comprobación que faltaba, y uno tenía una
prueba llamada «no puede publicar ni reportar» que solo probaba publicar. Un
comentario que explica por qué algo es seguro no es prueba de que lo sea, y el nombre
de una prueba no prueba nada: hay que leer el cuerpo.

### D-97 — Las pruebas de un reclamo no piden verificación de identidad
Adjuntar fotos a un reclamo usa un tipo de subida propio (`prueba`) que, como la foto
de perfil, se salta la comprobación de KYC.
**Por qué hay que decirlo.** La firma de subida exigía identidad verificada para
cualquier imagen, y quien reclama es casi siempre el comprador, que por la D-02 nunca
pasa por KYC. Con la regla anterior, en una disputa **solo el vendedor podía probar
algo**: él llega con el video de la publicación y con fotos, y el comprador solo con
un párrafo. Es exactamente al revés de lo que hace falta.
**Lo que no se relajó.** Sigue haciendo falta sesión, cuenta activa y celular
confirmado, y el servidor sigue yendo a S3 a comprobar que el archivo exista, sea de
quien dice y sea una imagen: nunca se cree el tipo ni el tamaño que declara el
cliente.

### D-98 — Tres fotos por parte, y en tabla
Cada parte puede aportar hasta tres fotos a un reclamo, guardadas en `claim_photos`.
**Tres y no una.** Un daño casi nunca se demuestra con una sola foto: la rotura, el
empaque y la etiqueta son tres cosas distintas.
**Tabla y no columnas, al revés que en el chat.** La D-92 eligió columna porque un
mensaje tiene como mucho una foto. Un reclamo no es un mensaje: es un expediente al
que aportan los dos lados y con un número variable. Seis columnas `foto_1..3` por
lado para representar dos listas sería modelar al revés.
**El tope vive dentro de la sentencia**, contando lo que ya hay más la posición de
cada foto del lote. Comprobarlo antes en JavaScript dejaría una ventana entre contar
e insertar.
**Validar antes de congelar el dinero.** Las fotos se comprueban ANTES de mover el
pedido a disputa. Al revés, quien se equivoca de archivo se queda con un reclamo
abierto que no pidió.
**No se pueden borrar.** Una prueba que se retira después de que la otra parte la vio
no es una prueba.

### D-99 — «Volver» lleva a la pantalla de la que se vino (corrección 1 de Catalina, 2026-09-22)
Hay «Volver» en todas las pantallas menos la portada, incluidas las de error. Lleva a
la pantalla de 2venta de la que se vino, según un recorrido que se anota por pestaña
en `sessionStorage` (`src/lib/rastro.ts`); su `href` es solo el respaldo —entrada por
enlace externo, pestaña nueva o sin JavaScript— y es la pantalla padre, no la portada.
Decisión de Nicolás.
**Por qué no el historial del navegador.** Guarda los formularios intermedios: «atrás»
desde el chat recién abierto devolvía a «Iniciar sesión» con la sesión ya iniciada.
El recorrido salta las pantallas de paso (entrar, registro, verificar, bienvenida,
recuperar, pagar) y, al llegar a una pantalla que ya estaba, descarta lo posterior.
**Cuando el texto nombra el destino, manda el texto.** «Volver a tu cuenta»,
«Moderación» o «Volver al artículo» llevan `fijo` e ignoran el recorrido.
**Sin cuenta, lo que se iba a hacer sigue de largo.** «Escribirle al vendedor» manda
a entrar con `volver=/chat/abrir/<artículo>`, que viaja por bienvenida, registro y
verificar el celular. `destinoInterno()` solo deja pasar rutas propias (`//x` y `/\x`
son otro dominio para el navegador). Al terminar se usa `router.replace`, para que
el formulario usado no quede detrás.
**`/chat/abrir` crea con un GET**, y eso tiene un precio: un enlace desde otro sitio
podría abrirle a alguien una conversación vacía que no pidió. Si la petición llega
marcada `Sec-Fetch-Site: cross-site` no crea nada y deja en la ficha. Consecuencia
conocida: quien entra con Google ya verificado cae en la ficha y no en el chat.
**Solo se empieza una conversación sobre lo que está a la venta o reservado**
(`ESTADOS_PARA_ESCRIBIR`). Antes se podía abrir un chat con «Hacer una oferta» sobre un
artículo retirado. Las conversaciones que ya existían se siguen abriendo porque son
la evidencia de lo acordado, pero sin ofertar, y su tarjeta solo enlaza a la ficha si
la ficha existe para quien mira (Luna, tres vueltas).

### D-100 — La portada filtra en su sitio y las categorías se suman (corrección 2, 2026-09-22)
Tocar una etiqueta de la portada (Verificados, Tecnología, Ropa, Niños) filtra la
portada misma: la etiqueta queda marcada, se quita tocándola otra vez y la dirección
cambia (`/?categoria=ropa&categoria=ninos&verificados=1`) para poder compartirla.
Antes llevaba a `/buscar` con el formulario de filtros abierto encima de todo.
Decisión de Nicolás, igual que las dos siguientes.
**Todas las etiquetas se combinan.** El buscador pasó de una categoría a varias
(`categories: string[]`, `any($1::text[])`); las búsquedas guardadas lo heredan porque
usan el mismo `parseFilters`. Las categorías que no existen se descartan antes de
filtrar y contar (`conCategoriasConocidas`); si no, «Filtros 1» aparecía sin nada
marcado. El tope de 50 se aplica antes de ese descarte, por eso es alto.
**«Filtros» es un panel lateral** (`<dialog>` modal que entra desde la izquierda) con
los campos compartidos de `CamposDeFiltro` y un «Ver N resultados» que cuenta en vivo
contra `/api/buscar/conteo`. Va como primera etiqueta de la fila: junto al buscador
no cabía en 375 px sin aplastarlo. Sin JavaScript es un enlace a `/buscar` (D-25).
El foco del teclado no se atrapa dentro del panel: el `<dialog>` nativo ya deja inerte
el fondo, y atraparlo impediría llegar a la barra del navegador.
Mientras no haya paginación la grilla filtrada trae 60 y lo dice («Se muestran los 60
primeros») en vez de anunciar un total que no enseña.

### D-101 — En la búsqueda, los resultados van primero (corrección 3, 2026-09-22)
En el teléfono (menos de 1024 px) los filtros van en el mismo panel lateral de la
portada (D-100), abierto desde un botón junto al conteo; en escritorio, en una
columna fija a la izquierda de la grilla. Antes eran un bloque plegable que, abierto,
empujaba los productos fuera de la pantalla. Decisión de Nicolás.
**La columna entera es la que se queda fija**, con alto máximo de la pantalla y
desplazamiento propio, y «Limpiar / Aplicar» van en su cabecera: abajo quedaban fuera
de la pantalla al cargar, porque la columna empieza a media página (Luna).
**Buscar otra palabra conserva los filtros** (van como campos ocultos en la barra), y
el panel conserva la palabra buscada.
**Sin JavaScript** el botón del panel es `#filtros`, y un `<noscript><style>` muestra la
columna también en el teléfono: el catálogo sigue siendo HTML del servidor (D-25).

### D-102 — Precio en los filtros: rangos rápidos y campos solo numéricos (corrección 4, 2026-09-22)
Cuatro rangos generales («Menos de $50.000», «$50.000 a $200.000», «$200.000 a
$1.000.000», «Más de $1.000.000») llenan «Desde» y «Hasta»; los campos solo aceptan
dígitos y ponen los puntos de miles al escribir (`CampoPesos`, reutilizable para la
corrección 24). Decisión de Nicolás; los rangos no cambian por categoría. Los límites
son inclusivos, así que $50.000 exacto aparece en los dos rangos que lo tocan.
**El servidor solo acepta pesos bien escritos**: sin puntos, o con los puntos de miles
bien puestos, con o sin «$». Antes se le quitaba todo lo que no fuera dígito y
«1abc2» filtraba por 12, «-999999» por 999.999 y «1.5» por 15.
**Un número bien escrito pero enorme es «el máximo»**, no basura, y se recorta a
2.147.483.647: `price_cop` es `integer` y pasarle más tumbaba la página con un 500
(Luna). La caja admite diez dígitos, que ya exceden cualquier precio real.
Sin JavaScript no se dibujan los rangos y los campos funcionan como formulario normal.

### D-103 — Tono cálido y juguetón; el «no hay resultados» da salidas (corrección 5, 2026-09-22)
**Tono de voz de la app**, decisión de Nicolás para este y los textos que siguen
(correcciones 14, 35, 39, 41): tuteo colombiano, cálido y con algo de juego («¡Uy!»),
sin empalagar. Sigue valiendo lo de siempre: el texto dice qué pasa y qué hacer.
**El mensaje vacío nombra lo buscado, consuela y da salidas como botones** (antes:
«No encontramos nada con eso.» y un enlace en el párrafo): «Ver todo lo publicado»,
«Quitar filtros» si hay palabra y filtros, y el aviso. El aviso es la respuesta
honesta a «no hay» en segunda mano, así que vive dentro del mensaje: con sesión
abre el formulario con un nombre ya sugerido desde la palabra y los filtros
(`describirFiltros`); sin sesión lleva a entrar con el motivo explicado y vuelve.
**El panel deja aplicar una combinación vacía** («Aplicar igual (0 resultados)»):
bloquearlo, como decía la D-100, dejaba sin llegar a ese aviso (Luna).
«Ver todo lo publicado» va en petróleo y no en coral: en esas pantallas el coral ya
es del botón «Buscar».

### D-104 — Los campos se revisan al salir de ellos (corrección 6, 2026-09-22)
Patrón de validación de la app, decisión de Nicolás (lo heredan el celular y el
código, correcciones 7 y 8): mientras se escribe no se regaña; al salir del campo, si
está mal, borde rojo y un mensaje debajo que dice qué falta; el error se va solo al
corregir; al enviar se revisa otra vez y el envío no sale. Vive en `CampoValidado`
(escucha el `submit` del formulario en captura para frenarlo antes que el `onSubmit`
de React) y `Field` acepta `error` con `aria-invalid` y `aria-live`.
**Correo** (`src/lib/correo.ts`): se revisa la forma, no que exista. Cada mensaje dice
qué falta («Le falta el final del dominio: ¿cata@mail.com?», el caso de Catalina).
Se sugieren dominios comunes mal escritos («¿Quisiste decir…?»), pero **nunca se
corrige un `.co` a `.com`**: en Colombia hay miles de dominios `.co` reales; solo
`gmail.co`, que no existe. Rechazar un correo real es peor que dejar pasar uno raro,
así que tildes, ñ, `+` y subdominios pasan (Luna probó la batería).
El servidor sigue validando: su error de esquema (`VALIDATION_ERROR`) se traduce.

### D-105 — El celular: «+57» fijo, solo dígitos y validado también en el servidor (correcciones 7 y 10, 2026-09-22)
Solo Colombia y sin selector de país (corrección 10, decisión de Nicolás; sigue a la
D-06). El campo muestra «+57» fijo —sin bandera, pedido expreso de Nicolás—, deja
entrar solo dígitos, máximo diez, y los agrupa solos (300 412 8805); pegar «+57 …» o
«(300) 412-8805» los limpia. Se revisa al salir (D-104). Es el mismo `CampoCelular` en
los cuatro sitios: registro, «Falta tu celular», recuperar y quien recibe el envío.
**El servidor ya no le cree a la pantalla**: el registro y `/update-user` rechazan un
celular que no sea `+573` y nueve dígitos (`INVALID_PHONE`). Antes una petición armada
a mano guardaba cualquier cosa, y el código SMS se manda al número guardado. El
celular de quien recibe se valida y se guarda normalizado (`+57…`).
Borrar hacia atrás un espacio que puso el campo borra el dígito anterior: si no, la
tecla parecía muerta (Luna).

### D-106 — El código del SMS: una caja grande, solo dígitos y sin envío automático (corrección 8, 2026-09-22)
Una sola caja grande (no seis casillas: el autocompletado del SMS y pegar funcionan
sin trucos), solo seis dígitos, revisada al salir (D-104). **No se confirma sola**:
cada intento fallido cuenta, así que lo decide la persona con el botón (decisión de
Nicolás). Con el código incompleto el envío no sale y no gasta intento.
Al pegar el SMS entero se toma el **último** bloque de seis dígitos, seguidos o
partidos por guion, espacio o punto: el mensaje dice «2venta» y puede llevar fechas.
Eso obliga a que el SMS tenga el código al final; está anotado en `src/lib/sms.ts`.
El aviso muestra el número como se dice («+57 300 111 0003»).

### D-107 — Proveedor del código SMS: agregador colombiano; WhatsApp después (correcciones 9 y 50, 2026-09-24)
Decisión de Nicolás. Lanzamiento con SMS por un agregador colombiano ($6–$20 COP por
mensaje, en pesos), elegido tras una prueba de entrega real con los operadores; en
una segunda etapa, el código por WhatsApp con SMS de respaldo. Cotización, fuentes y
preguntas para el proveedor en `docs/alcance/verificacion-celular.md`.
Cambiar la contraseña usa el mismo código (corrección 50): «Cambiar tu contraseña»
lleva a `/recuperar`. **Sin proveedor, en producción nadie puede registrarse ni
recuperar la contraseña**: `sms.ts` se niega a imprimir códigos fuera de desarrollo.
Es el primer bloqueo del lanzamiento.

### D-108 — Términos y política de datos en un panel, con aceptación registrada (corrección 11, 2026-09-24)
Decisiones de Nicolás. Los Términos y Condiciones y la Política de tratamiento de
datos son **un borrador investigado, versión 1, marcado en revisión legal**
(`src/features/legal/ContenidoLegal.tsx`): describe lo que la app hace de verdad y lo
que exigen la Ley 1480 (arts. 47–53; retracto con reintegro en 15 días según la Ley
2439 de 2024), la Ley 1581 y el Decreto 1377. Los datos de la empresa siguen «POR
COMPLETAR» y las dudas para el abogado están en notas que solo se ven en `/legal`.
**Se leen en un panel deslizable con «Aceptar» al final**, que se abre desde la
casilla del registro y, en solo lectura, desde «Tu cuenta». `/legal` tiene el mismo
texto (sin JavaScript y para el abogado).
**Se guarda qué versión aceptó cada persona y cuándo** (`terms_version`,
`terms_accepted_at`; la fecha la pone el servidor). Sin la versión vigente no hay
cuenta (`TERMS_REQUIRED`) y después no se cambia (`TERMS_READONLY`). Cambiar el texto
obliga a subir `VERSION_TERMINOS`.
**Edad (art. 52):** se pide la fecha de nacimiento y no se crean cuentas de menores
de 18 (`UNDERAGE`, `INVALID_BIRTHDATE`, `BIRTHDATE_READONLY`).
**Biométricos (art. 6 de la Ley 1581):** antes de empezar la verificación de
identidad se pide una autorización explícita y aparte; el servidor la exige y guarda
`biometric_consent_at`.
**Pendiente a propósito:** la dirección del vendedor del art. 53 va con la
corrección 15.

### D-109 — No hay nombre de usuario; la persona es su cuenta (corrección 12, 2026-09-24)
Decisión de Nicolás. No se pide un @usuario: la identidad la dan el celular
confirmado (único) y, en quien vende, la verificación de identidad; el nombre visible
es el alias (D-04, D-67, D-43). Un @usuario no agregaba seguridad y sí fricción y
moderación. El modelo y la llave de cada tabla están en
`docs/alcance/identidad-y-llaves.md`: aleatorio o UUID en todo lo que sale en una
dirección, consecutivo solo en filas internas (Luna lo comprobó ruta por ruta).

### D-110 — El registro dice por qué no se creó la cuenta (corrección 13, 2026-09-24)
Decisiones de Nicolás. Cada campo explica su error al salir de él (D-104 a D-108). Además:
**un celular que ya es de otra cuenta confirmada se avisa al tocar Continuar**
(`PHONE_TAKEN`, con enlaces a entrar y a recuperar) y no se crea nada; antes la
persona se enteraba al confirmar el código, con una cuenta a medias creada. Confirma
que el número existe, como ya lo hacía el correo; lo acota el límite de intentos. La
protección al confirmar se queda para la carrera de dos registros simultáneos.
Lo desconocido se dice con calidez y con el código del error, sin borrar lo escrito.
Un nombre vacío ya no crea una cuenta sin nombre (`NAME_REQUIRED`, hallazgo de Luna).

### D-111 — Se vende como persona natural o como empresa; ya no hay «tienda» aparte (corrección 15, 2026-09-24)
Decisiones de Nicolás. El tipo se elige **al empezar a vender** (`/vender`), no al
registrarse: el registro de comprador no cambia y «Registra tu tienda» desaparece.
**Persona natural:** dirección de notificaciones y teléfono (art. 53 de la Ley 1480,
pendiente desde la D-108) y la verificación de identidad de siempre.
**Persona jurídica:** además, razón social, NIT, nombre y cédula del representante
legal (es quien hace la verificación con su cédula y su rostro) y el **RUT en PDF**.
Mientras no haya un proveedor que valide el NIT, **una persona del equipo lo confirma
viendo el RUT** en `/admin`; hasta entonces no hay insignia de empresa ni carga en
lote. El RUT se guarda **en la base, no en el bucket**: el bucket de medios es público
y el RUT trae datos tributarios; solo un admin lo ve (`/admin/rut/[userId]`,
`Cache-Control: private, no-store`), y el servidor comprueba que empiece por `%PDF`
y no pase de 2 MB, sin creerle al navegador.
**La carga en lote es solo para empresas con el NIT confirmado.**
**Tiendas anteriores:** quedan archivadas (`archivada_at`, no se borran) y sus
dueños siguen como personas naturales; quien quiera vender como empresa se registra
de nuevo. El NIT es único solo entre las empresas vigentes. Quien ya vendía antes de
esta corrección ve en `/vender` un aviso para completar dirección y teléfono.
Orden al guardar: primero la empresa (así un NIT repetido no deja nada a medias),
después los datos del vendedor, después la verificación. Los formularios de vendedor
no se vacían tras un error (`enviarSinBorrar`).

### D-112 — Quien vende como persona compra; una empresa solo vende (corrección 17, 2026-09-24)
Decisiones de Nicolás. Se mantiene la D-03 (una cuenta, una reputación) para las
personas naturales: venden y compran con la misma cuenta. **Una cuenta de persona
jurídica vende, pero no compra**, desde que elige «Como empresa» aunque el NIT no
esté confirmado: una compra de empresa pide factura, y eso no existe hasta la
corrección 47. Lo impide el servidor en cada camino (carrito, pago, pago del
carrito, abrir un chat, ofertar como compradora), no solo la ficha. Cuando la acción
llega desde una pantalla abierta antes del cambio, se vuelve a la ficha, al carrito
o al chat, que ya se dibujan con el aviso y sin botones (hallazgo de Luna). La
conversación que ya tenía se conserva para escribir, sin ofertar ni pagar. Su menú
no tiene «Carrito» y «Compras y ventas» se llama «Tus ventas». El aviso dice la
salida: comprar desde una cuenta personal, con otro celular.
**«Compras y ventas» oculta lo vacío:** quien solo compra no ve «Ventas» y quien
vende sin haber comprado no ve «Compras»; si las dos están vacías, queda la de lo
que la persona hace.

### D-113 — «Volver» retrocede cuando el destino es la entrada anterior (corrección 18, 2026-09-24)
El caso de Catalina («desde Ventas, al volver de un pedido cancelado te manda a
Home») ya lo había resuelto el recorrido de la D-99; se dejó fijado con una prueba.
Luna encontró un detalle al mezclarlo con el atrás del navegador: «Volver» sumaba
una entrada al historial, y el atrás reabría la pantalla de la que se acababa de
volver. Ahora, si la entrada anterior del historial es justo el destino, «Volver»
retrocede. Se pregunta al navegador (Navigation API) y no al recorrido, porque el
recorrido junta en una entrada los cambios de filtro que el historial guarda uno por
uno; sin esa API se suma la entrada, como antes.

### D-114 — El chat llega en vivo, y reportar bloquea en silencio (correcciones 19 a 22, 2026-09-24)
Decisiones de Nicolás. El documento de alcance del chat es `docs/alcance/chat.md`.
**En vivo (20):** con el chat abierto, lo nuevo aparece sin recargar. Se hace con
eventos del servidor (SSE) y no con WebSockets: solo hace falta empujar del servidor
al navegador, es una ruta normal de Next y no cambia cómo arranca la imagen. Postgres
reparte el aviso entre servidores (`LISTEN/NOTIFY`, disparador en `messages` y
`offers`, migración 0018); no se agrega nada en AWS. El aviso solo dice «cambió»: la
pantalla se vuelve a pedir y los controles de acceso son los de siempre.
**Fotos en el chat (21):** se quedan como están (D-92) y se evalúan más adelante.
**Reportar (22):** el reporte es también un **bloqueo silencioso**: a quien reportó
no le llegan desde ese momento los mensajes ni las ofertas de la otra persona en esa
conversación (chat, bandeja, contador y avisos), la otra persona no nota nada y todo
queda guardado para el equipo. Es la fila de `chat_reports`, sin tabla nueva. La cola
de moderación se ordena por gravedad (estafa, amenazas y contenido sexual primero,
«Urgente») y por cuántas personas distintas reportaron a la misma cuenta. **No hay
suspensión automática**: se podría usar para atacar a alguien.
**El chat vacío (19)** le habla a cada lado desde su punto de vista.
