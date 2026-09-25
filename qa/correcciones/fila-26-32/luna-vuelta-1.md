# Informe de prueba — correcciones 26 a 31

Fecha: 24 de septiembre de 2026. Navegador Chromium conectado al servidor existente. Anchos usados: 390 × 844 y 1280 × 800.

## Veredicto

**PASA CON OBSERVACIONES** — los flujos de retiro, historial, republicación, protección ante pedidos vivos y conversaciones funcionan; el diálogo no se cierra al tocar fuera de él.

## Hallazgos

### 1. El diálogo de retiro no se cierra al tocar fuera

- **Severidad:** baja.
- **Ancho:** 390 px, con contexto táctil y toque fuera en la esquina superior izquierda.
- **Pasos exactos:** iniciar sesión como `camila@2venta.demo`; abrir `http://localhost:3100/producto/39b608d7-c504-47cd-a299-61e8a1b01d77`; tocar `Retirar la publicación`; tocar fuera del diálogo.
- **Esperaba:** que el diálogo se cerrara sin cambiar el estado, igual que con `Cancelar` o `Escape`.
- **Vi:** el diálogo siguió visible y la URL siguió siendo `http://localhost:3100/producto/39b608d7-c504-47cd-a299-61e8a1b01d77`. El texto exacto fue: `¿Retirar «MacBook Air 13" 2020, 8 GB, 256 GB»?`; `Deja de verse en el catálogo y nadie más puede comprarla. No se borra: queda en «Tus publicaciones», en Retiradas, y la puedes volver a publicar cuando quieras.` El foco al abrir quedó en `Cancelar`. `Cancelar` y `Escape` sí cerraron el diálogo sin retirar la publicación.
- **Captura:** [capturas/33-touch-fuera-dialogo-390.png](./capturas/33-touch-fuera-dialogo-390.png). Diálogo inicial: [capturas/03-ficha-dialogo-390.png](./capturas/03-ficha-dialogo-390.png).

## Lo que verificaste y pasa

- Correcciones 26, 28 y 30: desde la ficha propia a 390 px y 1280 px, y desde `Tus publicaciones` a 390 px y 1280 px, `Retirar` abre un diálogo con el título exacto de la publicación, `Cancelar`, `Sí, retirarla` y el aviso de que no se borra. Ejemplos: `http://localhost:3100/producto/00b69431-8109-4cb5-be7f-b13998dfbae4` y `http://localhost:3100/vender/metricas`. Capturas de escritorio desde `Tus publicaciones`: [40-metricas-dialogo-1280.png](./capturas/40-metricas-dialogo-1280.png) y [41-metricas-retirada-1280.png](./capturas/41-metricas-retirada-1280.png).
- Confirmar el retiro redirige a `http://localhost:3100/vender/metricas?retirada=00b69431-8109-4cb5-be7f-b13998dfbae4` (1280 px) o a `http://localhost:3100/vender/metricas?retirada=0d9d0145-e855-43b7-9d57-e498d73a0427` (390 px). El aviso exacto fue: `Retiraste «iPhone 12 de 128 GB, azul». Ya no se ve en el catálogo; la tienes abajo, en Retiradas, por si la quieres volver a publicar.` Capturas: [11-retirada-1280.png](./capturas/11-retirada-1280.png) y [08-metricas-retirada-390.png](./capturas/08-metricas-retirada-390.png).
- La sección `Retiradas` aparece separada y dice exactamente `Nadie las ve. Vuelven al catálogo con «Republicar».` La tarjeta conserva el título, marca `Retirada` y ofrece `Republicar`.
- `Republicar` devuelve una publicación activa al catálogo y a la búsqueda: `http://localhost:3100/buscar?q=MacBook` dio `0 resultados` mientras estaba retirada y `1` después de republicarla; `http://localhost:3100/buscar?q=iPhone%2012` también mostró `iPhone 12 de 128 GB, azul`. Capturas: [35-busqueda-retirada-390.png](./capturas/35-busqueda-retirada-390.png) y [36-busqueda-republicada-final-390.png](./capturas/36-busqueda-republicada-final-390.png).
- En la ficha propia retirada se vio `Retiraste esta publicación`, `Nadie más la ve. Si la quieres vender otra vez, vuelve al catálogo con el mismo video.` y `Volver a publicar`. Captura: [26-no-republicar-pedido-pagado-390.png](./capturas/26-no-republicar-pedido-pagado-390.png).
- Corrección 29: no apareció ningún botón `Marcar como vendida` en ficha ni en `Tus publicaciones`. Tras un pago aprobado real por la interfaz, `Control DualShock 4 original, negro` quedó como `Vendida` y no ofreció acciones manuales de retiro o republicación; esto es consistente con que la venta ocurra solo al completar la compra.
- Pedido pendiente: Laura llegó a `http://localhost:3100/dev/pago/add32947-1792-4481-a25b-a3b36d2665a8`; Camila vio la publicación `Reservada`, pudo retirarla, y al intentar `Volver a publicar` apareció exactamente `Tiene un pedido en curso: no puede volver al catálogo mientras tanto.` El aviso impidió que volviera al catálogo. Captura: [22-no-republicar-pedido-pendiente-390.png](./capturas/22-no-republicar-pedido-pendiente-390.png).
- Pedido pagado: Laura completó `Simular pago aprobado` en `http://localhost:3100/dev/pago/40ebe2d0-ecee-43dc-ae5d-1b8a7c0cfe42`; el pedido quedó en `http://localhost:3100/pedido/40ebe2d0-ecee-43dc-ae5d-1b8a7c0cfe42` con `Pago recibido y guardado`. Al probar la republicación con el artículo retirado en el estado de prueba, apareció el mismo bloqueo exacto `Tiene un pedido en curso: no puede volver al catálogo mientras tanto.`
- Republicación con moderación: al retirar `Guante de béisbol juvenil, cuero`, preparar el título `Pistola de prueba` y pulsar `Republicar`, se vio `No se pueden publicar armas de fuego ni municiones.`; quedó en `Retiradas` y no apareció en el catálogo. Restaurado el texto legítimo, `Republicar` volvió a funcionar. Captura: [37-republicar-moderacion-bloqueada-390.png](./capturas/37-republicar-moderacion-bloqueada-390.png).
- Republicación de una publicación que estaba `En revisión`: al retirar y republicar una publicación preparada en ese estado, volvió a mostrar `En revisión`, no a `Activa`; la búsqueda devolvió 0 resultados. Captura: [38-republicar-vuelve-a-revision-390.png](./capturas/38-republicar-vuelve-a-revision-390.png).
- Destacada: `Tacones blancos talla 37, usados una vez` fue destacada desde `http://localhost:3100/dev/destacar/03701e8b-b50a-40df-8475-b847f9c92268`; después de retirarla, la promoción dejó de estar vigente y la publicación quedó en `Retiradas`. Capturas: [27-destacada-antes-de-retirar-1280.png](./capturas/27-destacada-antes-de-retirar-1280.png) y [28-destacada-retirada-1280.png](./capturas/28-destacada-retirada-1280.png).
- Doble toque en `Sí, retirarla`: produjo una sola tarjeta `Retirada`, sin duplicar publicaciones ni avisos; después se pudo republicar. Además se completaron dos ciclos consecutivos retirar → republicar sobre la misma publicación: ambos terminaron con una tarjeta activa y cero tarjetas en `Retiradas`. Capturas: [14-doble-confirmacion-390.png](./capturas/14-doble-confirmacion-390.png) y [39-dos-ciclos-retiro-390.png](./capturas/39-dos-ciclos-retiro-390.png).
- Corrección 27: se crearon cuatro conversaciones reales entre Laura y Camila. En `http://localhost:3100/actividad`, Camila vio exactamente tres filas recientes con `Laura T.`, el artículo, el último mensaje y el punto `Sin leer`; el encabezado indicó `4 conversaciones sin leer`. `Ver todas` tiene `href="/chats"` y llevó a `http://localhost:3100/chats`, donde se vieron las cuatro filas. Laura vio sus mensajes con el prefijo `Tú:` y ningún punto de no leído. Capturas: [29-actividad-laura-conversaciones-390.png](./capturas/29-actividad-laura-conversaciones-390.png), [30-actividad-camila-conversaciones-390.png](./capturas/30-actividad-camila-conversaciones-390.png) y [31-chats-ver-todas-390.png](./capturas/31-chats-ver-todas-390.png).
- Sin conversaciones: en `http://localhost:3100/actividad`, Andrés no tuvo la sección `Conversaciones` como encabezado ni el bloque `chats-recientes`; solo apareció `Ventas`. Captura: [32-actividad-sin-conversaciones-390.png](./capturas/32-actividad-sin-conversaciones-390.png).

## Observaciones fuera de alcance

- El pedido pagado de prueba muestra `Pago recibido y guardado` en `/pedido/40ebe2d0-ecee-43dc-ae5d-1b8a7c0cfe42`; no se evaluaron despacho, entrega ni liberación del pago.
- Las pantallas `/dev/pago/...` y `/dev/destacar/...` muestran el proveedor de pagos de prueba; se usaron solo para preparar los casos de riesgo.

## NO VERIFICADO

- No se pudo ejecutar literalmente por interfaz `retirar` después de un pago ya aprobado: al pagar, el artículo pasa a `Vendida` y la ficha propia y `Tus publicaciones` no muestran `Retirar`. Sí se verificó el bloqueo de republicación con pedido pagado usando ese estado de retiro como fixture de prueba, con el texto exacto indicado arriba.
- No había en la demo un artículo que ya hubiera sido marcado manualmente como vendida antes de esta ronda; no se pudo comprobar la conservación histórica de ese caso.
