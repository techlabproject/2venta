# Estado

**Última actualización:** 2026-09-13

## En qué voy

Las tres fases del plan más trece rebanadas posteriores. 239 pruebas de navegador y
96 unitarias (seis de ellas contra MinIO).

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
- Siguiente: transcodificar el video con MediaConvert (ya hay bucket real).

Cuenta de AWS `681842289811`, perfil de CLI `2venta` (usuario `nicolas-cli`,
`AdministratorAccess`, región `us-east-1`). MFA en la raíz activa, presupuesto de
50 USD/mes con alertas a dos correos. **La cuenta está en el plan gratuito de
AWS**: por eso App Runner dice `SubscriptionRequired` y RDS no admite más de un
día de respaldo (`FreeTierRestrictionError`). Pasarla a plan de pago (Billing →
Account plan) quita las dos restricciones; hasta entonces `dev` corre con 1 día
de respaldo. Repositorio: `github.com/techlabproject/2venta`, público.

De lo que queda a medias, ya casi nada es código propio: son proveedores por
conectar y cuentas por crear.

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
- (RESUELTO en S-27) Archivos a disco local. Ahora van al bucket. Falta
  transcodificar a un formato único: hoy se guarda lo que grabe cada navegador,
  que no es lo mismo en Android que en iOS. Necesita MediaConvert, o sea AWS de
  verdad; va después de S-29 como rebanada propia.
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

## Siguiente paso concreto

S-29: Terraform en `infra/` con un módulo y dos entornos (`dev`, `prod`) en la
cuenta `681842289811`: ECR, RDS, S3 + CloudFront, SQS + cola de fallidos,
EventBridge Scheduler (`liberar` cada hora), Secrets Manager, App Runner para la
web y ECS Fargate para el worker. Comprobar antes que App Runner ya esté activo
en la cuenta. Luego GitHub Actions con OIDC.
