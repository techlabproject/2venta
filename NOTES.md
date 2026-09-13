# Estado

**Última actualización:** 2026-09-12

## En qué voy

Las tres fases del plan más once rebanadas posteriores. 236 pruebas de navegador y
88 unitarias.

**Todos los requisitos funcionales originales están construidos.** Ahora se está
llevando a AWS siguiendo `ARQUITECTURA.md`:

- S-26 empaquetado: HECHA. La imagen de Docker corre las 236 pruebas contra sí
  misma. `APP_ENV` separa "qué proveedores son reales" de "cómo se compiló" (D-54).
- S-27 archivos en S3 con URL prefirmada (D-50): siguiente.
- S-28 worker y cola SQS (D-51).
- S-29 Terraform con `dev` y `prod` en la misma cuenta (D-53) + GitHub Actions.

Cuenta de AWS: Nicolás la está creando. Lo que necesito de él: usuario IAM
`nicolas-cli` con `AdministratorAccess` y `aws configure --profile 2venta` hecho en
su terminal. Ya están instalados `awscli` y `terraform`. Repositorio remoto:
`github.com/techlabproject/2venta`, **público**, pendiente de decidir si pasa a
privado antes del primer push.

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
- La liberación automática necesita un programador de tareas que llame
  `POST /api/tareas/liberar` con el secreto. En desarrollo se llama a mano. Con
  S-28 pasa a SQS + worker (D-51).
- Los archivos subidos dentro del contenedor van a su disco, que es efímero: un
  despliegue nuevo los pierde. Solo aceptable hasta S-27.
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
- No se pueden subir fotos como evidencia de un reclamo; hoy es solo texto. Es lo
  primero que hay que agregar cuando haya almacenamiento de verdad.
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
- Los archivos subidos van a disco local en `uploads/`, detrás de
  `src/lib/storage.ts`. Mover a almacenamiento en la nube es reescribir esas tres
  funciones. Falta transcodificar a un formato único: hoy se guarda lo que grabe
  cada navegador, que no es lo mismo en Android que en iOS.
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

S-27: `storage.ts` contra S3 con URL prefirmada, probado contra MinIO en
`docker-compose.yml`. En paralelo, cuando exista el perfil `2venta` de la CLI,
comprobar `aws sts get-caller-identity` y empezar S-29.
