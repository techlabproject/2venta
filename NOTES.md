# Estado

**Última actualización:** 2026-09-06

## En qué voy

S-08 cerrada. Primera de la Fase 2. 91 pruebas de navegador y 21 unitarias, y la
corrida bajó de 2,7 a 1,3 minutos.

Hecho: la Fase 1 completa (S-00 a S-06) más S-08 chat, ofertas y preguntas.
Los hallazgos de Luna de la primera ronda están cerrados.

Siguiente: S-09, entrega presencial con código. Ya se puede coordinar el punto y la
hora dentro del chat, que era lo que faltaba.

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
  `POST /api/tareas/liberar` con el secreto. En desarrollo se llama a mano.
- La transportadora es de prueba: tarifa plana de $12.000 y una sola opción. R-04
  propone un agregador logístico, pero no hay contrato.
- No se puede elegir entre transportadoras ni ver opciones de precio.
- No hay direcciones guardadas: hay que escribirla en cada compra.
- Imágenes en el chat: no se pueden mandar. La D-22 pide que el filtro cubra las
  capturas de pantalla con el número visible; mientras no haya imágenes no hay
  hueco abierto, pero el filtro tiene que crecer cuando se agreguen.
- Contraoferta como acción propia: hoy se rechaza y se ofrece otro precio.
- Bandeja con todas las conversaciones: no existe, hay que entrar por el artículo.
- Reportar una conversación o un usuario (RF-32): va con moderación.
- El seguimiento del envío solo tiene dos estados, despachado y entregado. Falta el
  detalle intermedio que muestra el mockup.
- Los archivos subidos van a disco local en `uploads/`, detrás de
  `src/lib/storage.ts`. Mover a almacenamiento en la nube es reescribir esas tres
  funciones. Falta transcodificar a un formato único: hoy se guarda lo que grabe
  cada navegador, que no es lo mismo en Android que en iOS.
- Fotos adicionales al cuadro de portada: el mockup las muestra, no están.
- Filtro por distancia en kilómetros: el mockup lo muestra, pero no hay coordenadas
  de nada. Se filtra por zona. La distancia entra cuando exista el dato.
- Paginación de resultados: la búsqueda corta en 60. Con una sola ciudad alcanza
  por ahora.
- Las pruebas se acumulan en la misma base: las de publicar crean artículos que
  quedan. Por eso las de búsqueda no cuentan totales sino qué aparece y qué no.
  `npx tsx db/seed.ts` deja todo limpio otra vez.
- Editar, borrar, marcar como vendida o reservada (RF-16, RF-17): no están.
- Calificación, ventas y tasa de disputa no se muestran en el perfil público
  todavía. Mostrarlas en cero daría impresión falsa de mal desempeño; llegan
  con S-12.
- Recuperación de contraseña: no existe todavía.
- La forma congelada por S-00 y que las siguientes rebanadas deben copiar:
  una carpeta por funcionalidad en `src/features/`, las consultas de base de datos
  en `queries.ts` dentro de esa carpeta, las pantallas en `src/app/` sin lógica
  propia, y una prueba de punta a punta por rebanada en `e2e/`.

## Qué aprendí que no está en ningún otro archivo

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

Levantar Postgres, crear el esquema con `sellers` y `listings`, sembrar tres
productos y hacer que la lista los muestre.
