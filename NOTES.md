# Estado

**Última actualización:** 2026-09-13

## En qué voy

Las tres fases del plan más catorce rebanadas posteriores. 257 pruebas de navegador
y 103 unitarias (seis de ellas contra MinIO), más 50 comparaciones visuales.

**S-31 — panel, navegación y foto de perfil (2026-09-13):** la cabecera pasa de
seis enlaces subrayados a navegación con menú (D-72), `/vender/metricas` deja de ser
un tablero de cifras y pasa a ser gestión de publicaciones (D-73), y hay foto de
perfil subida por URL prefirmada sin exigir identidad verificada (D-74). `/vender`,
`/vender/metricas` y `/cuenta` dejan de dibujarse en una columna de móvil.

**Ronda de diseño y flujos (2026-09-13):** informes en `qa/ronda-diseno/` y la
respuesta en `respuesta.md`. Nicolás reportó que el diseño se veía plano y que un
vendedor no encontraba sus productos; tres agentes (arte, flujo del vendedor,
flujo del comprador) lo confirmaron y ampliaron. Cerrados: el panel del vendedor,
el escritorio a cuatro columnas, el video anunciado en el feed, el pago protegido
con superficie propia, los avisos de interés nuevo y el regreso al artículo tras
iniciar sesión.

**Ronda de QA con tres agentes (2026-09-13):** informes en `qa/agentes-2026-09-13/`
y la respuesta en `respuesta.md`. Cinco hallazgos críticos o altos reales, todos
cerrados con prueba: celular verificado en dos cuentas, filtro anti-desvío ausente
en título/descripción/alias/razón social, emoji entre dígitos, fichas no activas
visibles con botón de compra, byte nulo con 500.

**Todos los requisitos funcionales originales están construidos.** Ahora se está
llevando a AWS siguiendo `ARQUITECTURA.md`:

- S-26 empaquetado: HECHA. La imagen de Docker corre las 236 pruebas contra sí
  misma. `APP_ENV` separa "qué proveedores son reales" de "cómo se compiló" (D-54).
- S-27 archivos en S3 con URL prefirmada (D-50, D-57): HECHA. MinIO en el
  portátil, bucket real en S-29.
- S-28 worker y cola SQS (D-51, D-58, D-59): HECHA. ElasticMQ en el portátil.
- S-29 infraestructura y primer despliegue (D-60 a D-63): HECHA. `dev` corre en
  AWS: https://d13g2bd9j8wj8k.cloudfront.net . La prueba de humo
  `e2e/nube.spec.ts` recorre registro → identidad → publicar con video → compra
  contra la nube. `prod` definido, sin aplicar.
- S-30 transcodificación con MediaConvert por la cola (D-64): HECHA en código e
  infraestructura. **MediaConvert también está bloqueado por el plan gratuito**
  (`SubscriptionRequired`): el worker reintentó y habría mandado el mensaje a
  fallidos con alarma, que es lo correcto. En `dev` queda apagado
  (`video_transcodificar = false`) hasta pasar a plan de pago; en `prod`, encendido.
  Comprobar entonces con `NUBE_TRANSCODIFICA=1` en la prueba de humo.
- `prod`: `terraform plan` válido (84 recursos), sin aplicar (D-63).

Cuenta de AWS `681842289811`, perfil de CLI `2venta` (usuario `nicolas-cli`,
`AdministratorAccess`, región `us-east-1`). MFA en la raíz activa, presupuesto de
50 USD/mes con alertas a dos correos. **La cuenta está en el plan gratuito de
AWS**: por eso App Runner dice `SubscriptionRequired` y RDS no admite más de un
día de respaldo (`FreeTierRestrictionError`). Pasarla a plan de pago (Billing →
Account plan) quita las dos restricciones; hasta entonces `dev` corre con 1 día
de respaldo. Repositorio: `github.com/techlabproject/2venta`, público.

De lo que queda a medias, ya casi nada es código propio: son proveedores por
conectar y cuentas por crear.

## Ronda de usuario (2026-09-14)

Informe del agente en `qa/ronda-usuario/` y la respuesta en
`respuesta-2026-09-14.md`. Seis hallazgos, todos reales y todos cerrados con prueba
(`e2e/pago-abandonado.spec.ts`): el total que mostraba la pasarela de prueba, la
reserva que no se soltaba al abandonar el pago (D-78), la comisión duplicada en el
informe por categoría (D-79), la falta de confirmación al cerrar una sesión, los
errores de permisos disfrazados de artículo inexistente (D-80) y los datos de entrega
que se perdían.

Dos cosas más salieron de perseguirlos, y ninguna estaba en el informe:

- `otp.test.ts` fallaba **una vez de cada 256**: alteraba el dato cambiando los dos
  últimos caracteres por «ff», y cuando ya terminaba en «ff» comprobaba que un dato
  intacto se descifra. Arreglado y repetido cincuenta veces por corrida.
- El selector de fotos de `/publicar` era el control nativo, que dibuja «Choose Files ·
  No file chosen» **en inglés** y no se puede traducir. Era la única pantalla del
  producto en otro idioma.

## Repaso de los documentos contra el código (2026-09-14)

Se releyeron `Requisitos Funcionales.docx` (42 requisitos) y `mockups.pdf` (13
pantallas móviles, 1 panel web). Nicolás resolvió las tres preguntas el mismo día:

1. **Quién paga la comisión: el vendedor** (confirma la D-09). El checkout del
   mockup, que se la suma al comprador, es el que está equivocado; no se sigue.
2. **El RF-06 no estaba invertido, estaba a medias.** Pide que la identidad se
   compruebe **otra vez al momento de cobrar**, no que el KYC se mueva hasta allá.
   El KYC de registro existe (D-02); la segunda comprobación no, y va con el retiro
   de dinero, que tampoco existe (D-76). Los mockups ya lo decían en dos sitios:
   «Guardamos esta selfie para compararla cuando retires plata» y «Te pedimos una
   selfie y la comparamos con la de tu registro».
3. **La barra inferior de navegación del mockup se construye** (D-77).

Lo que sigue abierto de ese repaso:

- **El RF-19 sí sigue invertido**, y a propósito: dice que un vendedor no
  verificado publique con normalidad, y la D-02 lo impide. Está escrito en la
  propia decisión y los mockups le dan la razón a la D-02.
- **`SPEC.md` dice que la tercera categoría es «hogar»**; la migración 0008, la base,
  las pantallas y los mockups dicen «niños». El documento de alcance es el
  desactualizado.
- **El IMEI se recoge, se valida y nunca se le muestra al comprador.** La ficha del
  mockup lleva un distintivo «IMEI validado». Es trabajo hecho cuyo valor no se está
  cobrando.
- Menores, del mockup y sin construir: filtro por distancia en kilómetros (no hay
  coordenadas), atributo «Batería 89%», tiempo de respuesta en el perfil, estado
  «En reparto» en el seguimiento, y las secciones «Resumen» y «Verificaciones KYC»
  del panel de administración.

## Por confirmar

- **React avisó de dos hijos con la misma llave** durante las pruebas visuales del
  2026-09-13, en las pantallas de guardados o de vendedor. No se reproduce contra
  los datos de la demostración (ni `favorites`, que tiene clave primaria compuesta,
  ni los `join` de `LISTING_SELECT` duplican filas hoy). No rompe nada y ninguna
  prueba falla por él; queda apuntado para la ronda de Luna usuaria, que es quien
  puede toparse con el estado de datos que lo provoca.

## Qué quedó a medias

- El despliegue a producción quedó fuera a propósito: necesita cuentas que
  todavía no existen (alojamiento, base de datos gestionada, proveedor de SMS).
- El envío real de SMS no está conectado. En desarrollo el código se escribe en el
  registro del servidor y `src/lib/sms.ts` se niega a operar en producción. Conectar
  un proveedor real es cambiar esa única función.
- Ingreso con Google y Apple: la biblioteca los soporta, faltan las credenciales.
- El proveedor de verificación de identidad es de prueba, a la espera de R-02. Vive
  detrás de una interfaz (`src/features/kyc/provider.ts`) y se comporta como el
  real: entrega referencia, redirige y avisa por webhook firmado. Cambiarlo es
  escribir otra implementación de esa interfaz.
- Comparar la selfie al retirar plata: necesita el proveedor real.
- El proveedor de pagos es de prueba (D-30). A diferencia de los otros dos, aquí
  cambiar de implementación puede alterar el flujo del producto y no solo la
  integración: depende de lo que conteste R-02.
- El retiro del dinero por parte del vendedor no existe. El pedido llega a
  'liberado' y ahí se detiene.
- (RESUELTO en S-28) La liberación automática va por la cola. Falta el
  programador que encole `liberar` cada hora (EventBridge, S-29) y la alarma de
  la cola de fallidos. La ruta manual con `CRON_SECRET` sigue existiendo.
- Los archivos de publicaciones retiradas no se borran del bucket. Y no hay
  política de ciclo de vida todavía: es infraestructura, va en S-29.
- La transportadora es de prueba: tarifa plana de $12.000 y una sola opción. R-04
  propone un agregador logístico, pero no hay contrato.
- No se puede elegir entre transportadoras ni ver opciones de precio.
- No hay direcciones guardadas: hay que escribirla en cada compra.
- LAS ALERTAS NO SE ENVÍAN: no hay proveedor de correo ni de push conectado. Se
  generan y se guardan, y el usuario las ve al entrar. Una alerta que hay que
  entrar a ver no sirve para lo que existe, que es traer a la persona de vuelta.
  Conectar un canal es escribir la función de envío, igual que con los SMS.
- El precio del destacado ($8.000 por 7 días) es un número de partida sin datos
  detrás. Revisar con tráfico real.
- Los destacados no se renuevan solos al vencer.
- No hay métricas de rendimiento del destacado; van con S-15.
- El NIT no se valida contra la DIAN: no hay acceso. Solo se comprueba el dígito
  de verificación.
- No hay facturación electrónica, que es un requisito real para una tienda formal.
- Las retenciones tributarias para persona jurídica siguen sin resolverse; está
  anotado como consecuencia de la D-07 desde el principio.
- No se puede responder ni reportar una reseña.
- El perfil público del comprador no existe; sus calificaciones están en la base
  pero solo las ve el vendedor.
- El reembolso real no mueve dinero: el proveedor de pagos es de prueba. Se llama
  a su método de devolución y queda en el registro, igual que la liberación.
- Quién paga el envío de retorno en una disputa: la D-12 dice que la parte
  responsable, pero calcularlo necesita la transportadora real.
- No se pueden subir fotos como evidencia de un reclamo; hoy es solo texto. Ya
  hay almacenamiento de verdad (S-27); es reutilizar `uploadBlob` y `claim`.
- No se puede apelar una decisión de disputa.
- Google: falta pegar las credenciales, ver GOOGLE.md. El botón solo aparece
  cuando existen las dos variables.
- El panel de administración solo tiene la cola de revisión y reportes. Faltan
  verificaciones de identidad, disputas, usuarios y métricas del mockup.
- (RESUELTO en S-21) Suspender cuentas, reportar usuarios y editar perfil.
- Al vendedor no se le avisa cuando aprueban o rechazan su publicación; lo ve al
  entrar.
- Nadie mira el video automáticamente.
- No hay forma de reemitir el código si el comprador lo pierde. Sin una manera de
  comprobar quién lo pide, sería un camino para liberar sin entregar.
- No hay devolución si el encuentro nunca ocurre: va con S-11.
- No hay puntos de encuentro sugeridos; se acuerdan por chat.
- Imágenes en el chat: no se pueden mandar. La D-22 pide que el filtro cubra las
  capturas de pantalla con el número visible; mientras no haya imágenes no hay
  hueco abierto, pero el filtro tiene que crecer cuando se agreguen.
- Contraoferta como acción propia: hoy se rechaza y se ofrece otro precio.
- (RESUELTO en S-18) Bandeja de conversaciones y listas de compras y ventas.
- Reportar una conversación o un usuario (RF-32): va con moderación.
- El seguimiento del envío solo tiene dos estados, despachado y entregado. Falta el
  detalle intermedio que muestra el mockup.
- (RESUELTO en S-27 y S-30) Archivos al bucket y video transcodificado a MP4.
- (RESUELTO en S-23) Fotos del artículo, hasta seis.
- Filtro por distancia en kilómetros: el mockup lo muestra, pero no hay coordenadas
  de nada. Se filtra por zona. La distancia entra cuando exista el dato.
- Paginación de resultados: la búsqueda corta en 60. Con una sola ciudad alcanza
  por ahora.
- Las pruebas se acumulan en la misma base: las de publicar crean artículos que
  quedan. Por eso las de búsqueda no cuentan totales sino qué aparece y qué no.
  `npx tsx db/seed.ts` deja todo limpio otra vez.
- (RESUELTO en S-19) Editar, reservar, marcar vendida y retirar (RF-16, RF-17).
- Calificación, ventas y tasa de disputa no se muestran en el perfil público
  todavía. Mostrarlas en cero daría impresión falsa de mal desempeño; llegan
  con S-12.
- (RESUELTO en S-20) Recuperación de contraseña por celular y lista de sesiones
  abiertas (RF-04, RF-05).
- La forma congelada por S-00 y que las siguientes rebanadas deben copiar:
  una carpeta por funcionalidad en `src/features/`, las consultas de base de datos
  en `queries.ts` dentro de esa carpeta, las pantallas en `src/app/` sin lógica
  propia, y una prueba de punta a punta por rebanada en `e2e/`.

## Qué aprendí que no está en ningún otro archivo

- Las categorías (D-05b) solo las creaba `db/seed.ts`. En la nube la tabla
  estaba vacía y no se podía publicar. Ahora las crea la migración 0008; el
  dato de referencia del producto va en migraciones, el de prueba en el seed.
- Los nombres de RDS (instancia y grupo de subredes) no pueden empezar por
  dígito; por eso son `dosventa-*` y no `2venta-*`.
- Desde esta red, `scheduler.us-east-1.amazonaws.com` a veces no responde
  (`terraform plan` falla al refrescar el programador). Reintentar o `-target`.
- El primer `apply` de un entorno deja las tareas de ECS caídas porque el
  secreto no tiene valor hasta que RDS existe; se arregla con
  `aws ecs update-service --force-new-deployment` después de migrar.
- El `sub` del token OIDC de GitHub trae los ids numéricos
  (`repo:techlabproject@328214832/2venta@1366891746:environment:dev`), y con
  `environment:` en el job cambia de `ref:` a `environment:`. CloudTrail
  (`AssumeRoleWithWebIdentity`) es donde se ve el `sub` real.
- El runner de GitHub tarda ~13 min en la suite (3 en el portátil). Con 5 s por
  aserción falla una prueba por corrida; en CI hay 15 s y un reintento.

- Seis agentes en paralelo agotan la cuota de la sesión y mueren todos a la vez.
  De dos en dos funciona. Y hay que confirmar el árbol antes de lanzarlos: uno
  encontró cambios sin confirmar a mitad de su revisión.
- Las pruebas corren en paralelo y comparten la cola: el `--una-vez` de una
  prueba puede tomar el mensaje de otra. `runWorkerOnce()` espera a que no quede
  nada visible ni en vuelo antes de devolver; sin eso, los avisos fallan a veces.
- El worker del contenedor tiene que abortar la espera larga de SQS con SIGTERM;
  si no, `docker stop` (y ECS) lo mata con 137 a los diez segundos.
- `chat.spec.ts:19` falló una vez contra la imagen bajo carga (la respuesta del
  vendedor no apareció a tiempo) y pasó 28/28 al repetirla. Intermitente a vigilar;
  para Luna.

- `instrumentation.ts` en la raíz no corre cuando el proyecto usa `src/`. Next solo
  lo busca en `src/`. Estuvo así desde S-25 y nadie lo notó porque la validación se
  probaba en unitarias, no arrancando el servidor.
- Next atrapa la excepción del hook de arranque y sigue vivo sirviendo 500. Para
  detener el proceso hay que hacer `process.exit(1)` uno mismo (D-56).
- `next build` imprime "You are using the default secret" de Better Auth varias
  veces. Es ruido de la compilación, que no tiene `.env.local`; la imagen arranca
  bien con los secretos del entorno.
- La suite contra la imagen tarda 1,8 min frente a ~3 contra `next dev`.
- macOS no trae `timeout`; para acotar un contenedor hay que usar `docker run` y
  matarlo, o `gtimeout` de coreutils.

- Docker Desktop está instalado pero el daemon no arranca solo. Hay que abrirlo
  antes de `docker compose up`.
- No hay Xcode completo, solo Command Line Tools, y no hay Android Studio. No
  bloquea nada hasta que toque empaquetar para las tiendas.
- Node 26 y npm 11 disponibles. Next 16.3.4.
- `dotenv` no lee `.env.local`, eso solo lo hace Next. Los scripts fuera de Next
  tienen que pasarle la ruta explícita o fallan conectando al puerto por defecto.
- El puerto 3000 lo ocupa Docker en esta máquina; el servidor de desarrollo usa
  puerto asignado automáticamente.
- Los mockups muestran un distintivo "Verificado" en cada tarjeta del feed. No se
  implementó: la verificación de identidad no existe hasta S-02, y mostrar ese
  distintivo sin dato real le miente al comprador sobre lo único que diferencia a
  2venta. Entra con S-02.
- Desde que la tarjeta del feed muestra los mismos datos que la ficha, las pruebas
  no pueden buscar texto suelto: encuentran ambas. Cada aserción dice ahora en qué
  región de la página espera el dato.
- El repositorio vive en `~/Downloads/2venta`, que es un mal sitio permanente.
  Moverlo es un `mv` y no rompe nada.

## Preguntas abiertas que bloquean el lanzamiento, no el desarrollo

- CONTRADICCIÓN SIN RESOLVER: los mockups dicen que las categorías son tecnología,
  ropa y **cosas de niños**. La D-05 dice tecnología, ropa y **hogar**. El esquema
  de base de datos hoy usa `hogar`. Cambiarlo después de tener publicaciones
  implica migrar datos. Decidir antes de S-03.
- Estrategia de arranque en frío: sin decidir.
- R-02: falta confirmar con Mercado Pago si la retención se puede condicionar a un
  evento propio o solo a un calendario fijo.
- R-03: falta averiguar si hay convenio posible para consultar IMEI de forma
  automatizada.
- R-04: falta confirmar que el agregador logístico notifique la entrega por webhook.
- Qué se le muestra al comprador sobre un vendedor nuevo mientras acumula
  calificaciones (consecuencia de D-17).

## Lo que sigue simulado o sin conectar, y qué lo desbloquea

| Pieza | Estado | Lo desbloquea |
|---|---|---|
| Pagos (Mercado Pago) | proveedor de prueba | R-02: respuesta comercial |
| SMS | en desarrollo sale por el registro; en producción se niega | elegir agregador (R-02) y `SMS_PROVIDER_TOKEN` |
| Identidad (KYC) | proveedor de prueba | contrato con proveedor |
| Transportadora | tarifa plana de prueba | R-04 |
| Correo (SES) | las alertas se guardan, no se envían | un dominio propio: sin él, el remitente no pasa DMARC |
| `prod` | definido, plan válido, sin aplicar | SMS real + pasar la cuenta a plan de pago |
| Dominio propio | no hay; CloudFront da `*.cloudfront.net` con HTTPS | comprarlo (Route 53) |

## Pendientes que dejó la ronda de diseño (2026-09-13)

- Fotos como evidencia de un reclamo: la D-13 dice que se arbitra con la
  evidencia de las dos partes y no se puede subir ninguna. Con S-27 ya es barato
  (`uploadBlob` + `claim`). Debería ser la próxima rebanada.
- Los plazos del reclamo (48 h / 7 días) desaparecen una vez abierto.
- Una pregunta pública con teléfono se oculta sin explicar por qué, a diferencia
  del chat.
- Confirmar con Nicolás si el chat debía abrirse desde el perfil del vendedor
  (hoy se explica que va por artículo, D-69).
- De arte: segunda superficie para contenido no accionable, el arco del logo como
  recurso gráfico, personalidad en los estados vacíos.

## Pendientes de diseño que dejó la ronda de QA

- Chat con oferta activa: "Aceptar" y "Enviar" compiten por el acento mostaza.
- "Crear una cuenta" desde ingresar pasa por un paso extra; comprar sin cuenta no
  explica por qué pide iniciar sesión.
- CSP: falta; requiere nonces para los scripts en línea de Next.
- Para la próxima ronda: un agente por base de datos, y "todo en primer plano"
  en el brief.

## Siguiente paso concreto

Con la nube completa para lo que hoy se puede conectar, lo que sigue es producto
o proveedores. Candidatas por valor y por lo baratas que se volvieron con S-27:
fotos como evidencia de un reclamo (reusar `uploadBlob` y `claim`), direcciones
guardadas, apelar una disputa. Y cuando haya dominio: SES para el correo.
