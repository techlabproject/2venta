# Arquitectura de 2venta

Estudio de la arquitectura de destino. Describe qué se construyó, por qué se
mantiene así, y cómo se despliega en AWS. Los diagramas de flujo están en la
sección 6.

Este documento no propone reescribir nada. El código ya es un monolito modular; lo
que falta es la forma de despliegue y las piezas que hoy están simuladas.

---

## 1. La decisión

**Monolito modular desplegado como un servicio en contenedor, con Postgres
administrado y un worker aparte para el trabajo en segundo plano.**

Tres hechos del código sostienen esta decisión:

1. `transition()` en `src/features/payments/orders.ts` mueve el estado de un pedido
   dentro de una transacción de Postgres con `for update` sobre la fila. Es lo que
   impide que dos avisos simultáneos del proveedor de pagos liberen el mismo dinero
   dos veces. Separar pagos, pedidos y envíos en servicios distintos convierte esa
   transacción en una saga distribuida con compensaciones. Se cambia un problema que
   la base de datos ya resolvió por uno nuevo, y el modo de falla es plata de un
   comprador real.

2. El sistema son 10.837 líneas de TypeScript, 21 módulos, 12 rutas de API y 33
   tablas, para una ciudad y tres categorías (D-06, D-05b). Es un monolito pequeño y
   va a seguir siéndolo.

3. Los microservicios resuelven un problema de organización: equipos que necesitan
   desplegar sin coordinarse. Aquí no hay dos equipos.

Lo que sí es una decisión abierta —y la que de verdad importa— es la forma de
despliegue. Esa se resuelve en la sección 5.

---

## 2. Qué significa "modular" aquí

"Monolito modular" no es una etiqueta, son reglas comprobables. Estas son las
nuestras:

| Regla | Estado hoy | Cómo se comprueba |
|---|---|---|
| Cada módulo vive en `src/features/<nombre>/` con sus consultas, sus acciones y su prueba | Cumple | Estructura de carpetas |
| Un módulo no importa archivos internos de otro; usa lo que el otro exporta | Cumple | `grep -rho '@/features/[a-z-]*' src/features` |
| Todo lo externo entra por una interfaz tipada, no por una llamada directa | Cumple | `src/lib/sms.ts`, `src/lib/storage.ts`, `*/provider.ts` |
| Ninguna consulta con datos de una persona sale sin comprobar permisos en el servidor | Cumple | `activeUser()`, pruebas de punta a punta |
| Los cambios de esquema van en migraciones numeradas | Cumple | `db/migrations/` |

El acoplamiento medido entre módulos, contando importaciones:

```
payments    13   <- el centro, como debe ser
catalog     11
moderation   5
chat         3
shipping     2   kyc 2   cart 2
promotions   1   pricing 1   alerts 1
```

Esa forma es sana: un núcleo de dinero y un núcleo de catálogo, y el resto colgando
de ellos con una o dos aristas.

**La excepción honesta.** 37 archivos importan `src/lib/db.ts` directamente. Los
módulos comparten un esquema y una piscina de conexiones. Para un monolito eso está
bien: es justamente lo que permite la transacción del punto 1. Pero es lo primero
que habría que romper si algún día se separa algo, y conviene saberlo escrito en vez
de descubrirlo. **No se arregla ahora**: arreglarlo ahora es pagar el costo de los
microservicios sin tener microservicios.

---

## 3. El mapa de módulos

Cuatro grupos, por lo que arriesgan:

**Dinero e identidad** (zona sensible; cualquier cambio pasa por
`zonas-sensibles.md`)
`payments` · `orders` · `claims` · `kyc` · `auth` · `pickup`

**Catálogo y transacción**
`catalog` · `publish` · `cart` · `shipping` · `pricing` · `promotions`

**Relación entre personas**
`chat` · `ratings` · `favorites` · `alerts` · `store` · `profile`

**Operación de 2venta**
`moderation` · `reports` · `metrics`

Un módulo del primer grupo nunca depende de uno del tercero. La dirección de las
importaciones va siempre de afuera hacia el centro.

---

## 4. Las fronteras duras

Dentro del proceso no hay red: llamadas a función y transacciones. La red aparece
solo en cinco sitios, y los cinco ya están aislados detrás de una interfaz:

| Frontera | Archivo | Estado |
|---|---|---|
| Pagos | `src/features/payments/provider.ts` | Implementación de prueba; va Mercado Pago (D-26) |
| Identidad | `src/features/kyc/provider.ts` | Implementación de prueba |
| Envíos | `src/features/shipping/provider.ts` | Implementación de prueba |
| SMS | `src/lib/sms.ts` | Se niega a operar en producción sin proveedor |
| Archivos | `src/lib/storage.ts` | Disco local; va S3 |

Esta es la propiedad más valiosa del diseño actual. Conectar un proveedor real es
reescribir un archivo, no tocar el resto.

Los tres proveedores que avisan de vuelta lo hacen por webhook firmado con
HMAC-SHA256 y comparación en tiempo constante, y la escritura es idempotente por
`provider_event_id` único. Sin esa idempotencia, un reintento del proveedor —que
ocurre siempre— duplicaría el efecto.

---

## 5. La forma en AWS

Región **us-east-1** (Virginia). Es la que suele dar mejor latencia real hacia
Bogotá; conviene medirlo antes de fijarlo, no asumirlo.

### 5.1 Cómputo — ECS Fargate detrás de un Application Load Balancer

Dos tareas mínimo, en dos zonas de disponibilidad, para poder desplegar sin caída.

**Por qué contenedor y no Lambda.** `src/lib/db.ts` abre una piscina con `max: 10`
por proceso. En un modelo por función, cada invocación fría abre su propia piscina y
las conexiones se multiplican hasta tumbar Postgres. Se podría poner RDS Proxy
delante, pero su modo transacción pelea con los bloqueos de sesión que usa
`transition()`. El contenedor es el camino que no obliga a reescribir el núcleo de
dinero.

**Alternativa más barata para arrancar:** App Runner. Es el mismo contenedor con
menos piezas y sin ALB. Se pierde el control fino del balanceador y la conexión
directa de WAF. Válido mientras no haya tráfico; migrar a Fargate después es
recrear infraestructura, no cambiar código.

**Descartado:** EC2 administrado a mano (carga operativa sin beneficio a este
tamaño) y EKS (Kubernetes para un servicio es un pasatiempo, no una arquitectura).

### 5.2 Datos — RDS for PostgreSQL 17, Multi-AZ

- Multi-AZ desde el primer día. Hay dinero retenido en esta base.
- Respaldos automáticos con recuperación a punto en el tiempo, retención 14 días.
- Cifrado en reposo con KMS.
- En subred privada, sin acceso público. Solo el grupo de seguridad de las tareas
  de ECS y del worker pueden alcanzarla.
- Instancia inicial `db.t4g.small`. Se sube cuando una métrica lo pida, no antes.

**Sin Aurora.** Su ventaja aparece con lecturas muy por encima de lo que este
sistema va a tener, y su piso de costo es más alto.
**Sin RDS Proxy todavía.** Dos tareas × 10 conexiones = 20. No hay problema que
resolver.
**Sin ElastiCache todavía.** Se agrega cuando una consulta medida esté caliente. Una
caché puesta antes de medir esconde el problema en vez de resolverlo.

### 5.3 Archivos — S3 + CloudFront

Hoy los archivos van a disco local (`src/lib/storage.ts`) y los sirve la aplicación
(`src/app/api/media/[...path]/route.ts`). Las dos cosas cambian:

- **Un bucket privado** con versionado y política de ciclo de vida: el video
  original a Infrequent Access a los 30 días, y las versiones transcodificadas se
  quedan en Standard.
- **La subida va directo del navegador a S3** con una URL prefirmada de corta
  duración. Un video de hasta 60 MB (`MAX_BYTES`) nunca debe atravesar el
  contenedor: ocupa memoria y tiempo de una tarea que debería estar atendiendo
  peticiones.
- **CloudFront con Origin Access Control** sirve los archivos. La ruta
  `/api/media/[...path]` deja de existir en producción.
- La validación de tipo que hoy hace `isAllowedType` se conserva del lado del
  servidor al firmar la URL: el `content-type` que declara el cliente no es prueba
  de nada.

### 5.4 Trabajo en segundo plano — SQS + un worker del mismo código

El worker es **el mismo repositorio, otro punto de entrada**. No es un
microservicio: comparte `src/features/*` y `src/lib/db.ts`. Corre como una segunda
definición de tarea en ECS y consume de SQS.

Tres cosas pasan por ahí:

1. **Liberación automática a los 7 días** (D-11b). EventBridge Scheduler pone un
   mensaje en la cola cada hora; el worker llama `releaseExpiredOrders()`
   directamente. La ruta `POST /api/tareas/liberar` con `CRON_SECRET` se conserva
   como palanca manual de emergencia, pero deja de ser el mecanismo normal: quita
   un secreto de la superficie pública y una llamada HTTP del camino crítico.
2. **Video.** Subida terminada en S3 → EventBridge → MediaConvert transcodifica →
   EventBridge → SQS → el worker marca la publicación como lista. El video que sube
   un vendedor desde el celular puede venir en cualquier formato; sin transcodificar,
   parte de los compradores no lo va a poder ver.
3. **Avisos.** `notifyMatchingSearches()` hoy corre dentro de la acción de publicar.
   Con volumen, eso hace esperar al vendedor por un trabajo que no le importa. Se
   mueve a la cola.

Toda cola con su **cola de mensajes fallidos** y una alarma sobre su profundidad. Un
mensaje que falla en silencio, en este dominio, es un pago que no se liberó.

### 5.5 Secretos — Secrets Manager

Los diez requisitos de `src/lib/config.ts` viven ahí y ECS los inyecta en la
definición de tarea. Nunca en la imagen, nunca en variables de texto plano en la
consola.

**Advertencia que hay que escribir antes de que muerda:** `PHONE_CODE_SECRET` y
`PICKUP_CODE_SECRET` **no se pueden rotar como los demás**. Cifran datos guardados
en la base (D-31). Rotar uno sin descifrar y volver a cifrar deja códigos de entrega
ilegibles, y un código de entrega ilegible es una entrega presencial que no se puede
completar. Los que sí rotan libremente: `BETTER_AUTH_SECRET` (cierra sesiones), los
tres de webhook (coordinando con el proveedor) y `CRON_SECRET`.

La validación al arrancar (D-47) sigue siendo la red: si Secrets Manager no entregó
algo, la tarea no pasa el chequeo de salud y el despliegue se revierte solo.

### 5.6 Red y borde

- **VPC** con dos zonas. Subredes públicas: solo el ALB. Subredes privadas: tareas
  de ECS, worker y RDS.
- **NAT Gateway** para la salida hacia Mercado Pago, el proveedor de SMS, el de
  identidad y la transportadora. Es la pieza cara de esta lista.
- **Endpoints de VPC** para S3, SQS, Secrets Manager y ECR, para que ese tráfico no
  pase por el NAT. Se paga solo en pocas semanas.
- **CloudFront delante de todo**, con WAF: reglas administradas, protección contra
  inyección y un límite de tasa volumétrico.
- **Route 53** para el dominio y **ACM** para el certificado.

**Sobre el límite de tasa.** La aplicación limita por número de celular, no por IP,
a propósito: detrás de un NAT de universidad o de oficina, limitar por IP bloquearía
a todo el edificio por culpa del sexto registro. WAF cubre la capa volumétrica —
alguien martillando el sitio— y la aplicación cubre la capa de negocio. Son dos
controles distintos y ninguno reemplaza al otro.

### 5.7 Observabilidad — CloudWatch

Registros y métricas en CloudWatch. Lo que importa no son las alarmas genéricas de
CPU, sino las que hablan del dominio:

| Alarma | Por qué |
|---|---|
| Profundidad de la cola de mensajes fallidos > 0 | Un trabajo que se perdió en silencio |
| La liberación automática no corrió en 2 horas | Dinero que debía moverse y no se movió |
| Firmas de webhook inválidas por encima de lo normal | O un secreto desincronizado, o alguien probando |
| Pedidos en `pagado` con más de 10 días | El estado se atascó en algún punto |
| Errores 5xx del grupo de destino | Lo de siempre |
| Conexiones de RDS cerca del máximo | Una fuga de conexiones |

### 5.8 Entrega — GitHub Actions → ECR → ECS

- GitHub Actions autenticado con OIDC. Sin llaves de larga vida guardadas en el
  repositorio.
- El flujo corre `npm run verify` completo antes de construir la imagen. Un
  despliegue que no pasó las 236 pruebas de navegador y las 79 unitarias no sale.
- Imagen a ECR, actualización continua en ECS con chequeo de salud y reversión
  automática.
- **Las migraciones corren como una tarea aparte antes del despliegue**, no al
  arrancar el contenedor. Si arrancan con el contenedor, dos tareas levantando a la
  vez intentan migrar a la vez.

### 5.9 Correo y SMS

- **SES** para el correo transaccional: recuperación de contraseña (RF-04/05),
  avisos de pedido.
- **SMS: sin resolver.** Es R-02. SNS entrega SMS a Colombia, pero para un volumen
  de códigos de verificación un agregador local suele salir mejor de precio y de
  tasa de entrega. La decisión no bloquea nada del resto: `src/lib/sms.ts` es una
  función.

---

## 6. Los flujos

Los diagramas están en la página publicada que acompaña este documento. En texto,
los cuatro que importan:

**Petición de un usuario.** Navegador → Route 53 → CloudFront (estáticos desde su
caché) → ALB → tarea de ECS → RDS. Los secretos ya están en el proceso desde el
arranque.

**El dinero.** El comprador confirma con el total que vio en pantalla (D-46) → la
acción de servidor valida y llama al proveedor por su interfaz → Mercado Pago cobra
→ avisa por webhook a `/api/pagos/webhook` a través de CloudFront y el ALB → se
verifica la firma → `transition()` mueve el pedido a `pagado` dentro de una
transacción con bloqueo de fila e idempotencia por `provider_event_id`. El dinero
queda retenido. A los 7 días de la entrega registrada, EventBridge Scheduler → SQS →
worker → `releaseExpiredOrders()` → el proveedor libera. Un reclamo abierto detiene
ese reloj.

**Un video.** El vendedor graba → la aplicación pide una URL prefirmada → el
navegador sube directo a S3 → S3 avisa a EventBridge → MediaConvert transcodifica →
EventBridge → SQS → el worker actualiza `listing_photos` y la publicación queda
visible. El contenedor web nunca tocó los 60 MB.

**Un reclamo.** Comprador abre reclamo → el pedido pasa a `en_disputa` → la
liberación automática lo salta → el vendedor responde → un administrador resuelve →
libera o reembolsa por el proveedor. Todo dentro del monolito, en una transacción.

---

## 7. Lo que no vamos a usar, y por qué

Esta lista es tan importante como la anterior. La tentación en AWS es adoptar
servicios porque existen.

| Servicio | Por qué no |
|---|---|
| Lambda para la aplicación web | La piscina de conexiones y los bloqueos de fila de `transition()` |
| API Gateway | El ALB alcanza. La autenticación la resuelve la aplicación, no el borde |
| DynamoDB | El dominio es relacional y transaccional. Un pedido toca cinco tablas a la vez |
| Step Functions | Orquesta sagas distribuidas. No tenemos sagas porque no tenemos servicios distribuidos |
| Cognito | Better Auth ya es el dueño de las sesiones y vive en Postgres. Dos sistemas de identidad es peor que uno |
| EKS | Kubernetes para un servicio |
| Aurora | Su ventaja llega muy por encima de este tamaño; su piso de costo, no |
| ElastiCache | Todavía no hay una consulta medida que lo justifique |
| Kinesis | SQS cubre todo lo que hay. No hay flujo continuo de eventos |

---

## 8. Costo

Orden de magnitud mensual, con tráfico bajo y todo encendido. Hay que confirmarlo
con la calculadora de AWS antes de comprometerse.

| Pieza | USD/mes aprox. |
|---|---|
| RDS `db.t4g.small` Multi-AZ | 60 |
| NAT Gateway (base, sin datos) | 33 |
| Fargate, 2 tareas de 0,5 vCPU y 1 GB | 30 |
| ALB | 20 |
| CloudWatch | 10 |
| S3 + CloudFront (volumen bajo) | 10 |
| Secrets Manager, 10 secretos | 4 |
| MediaConvert | por minuto procesado |
| **Total** | **del orden de 170** |

**Las dos palancas reales** son el Multi-AZ de RDS (a zona única baja unos 30 al
mes, y es lo que **no** hay que hacer con dinero retenido en la base) y el NAT
Gateway. Los endpoints de VPC de la sección 5.6 reducen el tráfico que pasa por el
NAT, que es la parte variable.

Empezar en App Runner en vez de Fargate + ALB quita unos 40 al mes mientras no haya
tráfico.

---

## 9. Lo que falta en el código

Ninguno de estos es una reescritura. Son los cambios concretos para pasar de "corre
en el portátil" a "corre en AWS".

| # | Cambio | Archivo | Tamaño |
|---|---|---|---|
| 1 | `store`/`read` contra S3, más una función que firme URLs de subida | `src/lib/storage.ts` | Reescribir tres funciones |
| 2 | Quitar la ruta que sirve archivos en producción | `src/app/api/media/[...path]/route.ts` | Borrar |
| 3 | Punto de entrada del worker que consume de SQS | nuevo, `src/worker/` | Nuevo, pequeño |
| 4 | Mover `notifyMatchingSearches` de la acción a la cola | `src/features/publish/actions.ts:135,194` | Dos llamadas |
| 5 | Endpoint de salud para el grupo de destino del ALB | nuevo, `src/app/api/salud/route.ts` | Nuevo, trivial |
| 6 | `output: "standalone"` para que la imagen no lleve `node_modules` entero | `next.config.ts` | Una línea |
| 7 | Dockerfile multietapa | nuevo, raíz | Nuevo |
| 8 | Agregar `AWS_REGION`, `S3_BUCKET`, `MEDIA_BASE_URL`, `SQS_QUEUE_URL` a los requisitos | `src/lib/config.ts` | Cuatro entradas |
| 9 | Proveedores reales: pagos, identidad, envíos, SMS | `*/provider.ts`, `src/lib/sms.ts` | Depende de R-02 y R-04 |

Los puntos 1 a 8 se pueden hacer ya. El 9 espera una respuesta comercial.

---

## 10. Reglas de convivencia

Lo que mantiene el monolito modular en vez de convertirlo en una bola de barro:

1. **Un módulo no lee las tablas de otro.** Pide por la función que el otro exporta.
   Esta es la única regla cuyo incumplimiento no se nota hasta que es carísimo.
2. **Nada externo se llama directo.** Entra por una interfaz en `provider.ts` o en
   `src/lib/`.
3. **Todo lo que escribe dinero pasa por `transition()`.** No hay una segunda forma
   de cambiar el estado de un pedido.
4. **Toda escritura disparada por un tercero es idempotente.** Los webhooks se
   reintentan siempre.
5. **El worker no tiene lógica propia.** Llama funciones de `src/features/*`. Si
   alguna vez tiene lógica que la aplicación web no tiene, ya se partió en dos
   sistemas sin que nadie lo decidiera.

---

## 11. Cuándo dejar de ser un monolito

El disparador no es el tráfico. Es este: **hay dos equipos que se pisan al
desplegar.** Mientras eso no pase, cualquier separación cuesta más de lo que rinde.

Si llega, el orden de extracción está determinado por lo que ya está aislado:

1. **Medios** — ya está detrás de `storage.ts` y ya corre en el worker. Es el único
   con una curva de escala distinta: consume CPU a ráfagas.
2. **Búsqueda del catálogo** — si el crecimiento es de lectura, se replica antes de
   separarse.
3. **Nunca el dinero.** `payments`, `orders` y `claims` se quedan juntos y en una
   sola base. Esa transacción es el producto.
