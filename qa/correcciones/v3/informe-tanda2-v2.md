# Informe de prueba — vuelta 2

## Veredicto

**PASA**

Con la expectativa corregida de D-99 (`src/lib/rastro.ts`), el comportamiento observado coincide con el diseño: «Volver» salta la pantalla de paso `/comprar/...` una vez creado el pago.

## Hallazgos

No hay hallazgos.

El retorno del flujo normal a la ficha no es un fallo: la ficha muestra **«Lo tienes apartado con un pago sin terminar»** y **«Ir a tu pedido»**. El acceso directo al pago lleva al pedido, como corresponde.

## Lo que pasa

- **Envío:** desde `/dev/pago/8c21bb40-0e49-44a4-b38b-7503deba9f86`, tocar **«Volver»** lleva a `/producto/b752ebad-e132-4c1d-822d-8326d3343af9`. La ficha muestra la reserva y **«Ir a tu pedido»**. [Pago de envío](capturas/09-pago-envio-antes-volver.png) · [Ficha tras volver](capturas/10-pedido-tras-volver.png)
- **Presencial:** desde `/dev/pago/908ff722-abf9-4a67-b953-21a408e8886a`, tocar **«Volver»** lleva a `/producto/9c19eedf-dd1d-4d37-82ca-6b908b896844`, con el mismo estado de reserva y acceso al pedido. [Pago presencial](capturas/17-pago-presencial.png) · [Ficha tras volver](capturas/18-presencial-tras-volver.png)
- **Dirección abierta directamente:** con la sesión de Laura conservada, abrir `/dev/pago/8c21bb40-0e49-44a4-b38b-7503deba9f86` y tocar **«Volver»** lleva a `/pedido/8c21bb40-0e49-44a4-b38b-7503deba9f86`. El pedido muestra **«Esperando el pago»**, **«Terminar el pago»** y **«Cancelar este pedido»**. [Pago directo](capturas/11-pago-directo.png) · [Pedido](capturas/12-direct-volver-pedido.png)
- **Reintento de pago:** **«Terminar el pago»** vuelve a `/dev/pago/8c21bb40-0e49-44a4-b38b-7503deba9f86`. [Reintentar pago](capturas/13-repagar.png)
- **Reserva y cancelación:** los pedidos de envío y presencial se cancelaron correctamente; se mostró **«Pedido cancelado»**, **«No se cobró nada y el artículo volvió al catálogo»**. [Envío cancelado](capturas/14-pedido-cancelado.png) · [Presencial cancelado](capturas/19-presencial-cancelado.png)
- **Pantallas de tarea con salida visible:**

  | URL probada | Salida visible observada | Evidencia |
  |---|---|---|
  | `/comprar/9c19eedf-dd1d-4d37-82ca-6b908b896844` | **«Volver al artículo»** | [captura](capturas/06-comprar.png) |
  | `/dev/pago/908ff722-abf9-4a67-b953-21a408e8886a` | **«Volver»** | [captura](capturas/17-pago-presencial.png) |
  | `/pedido/8c21bb40-0e49-44a4-b38b-7503deba9f86` | **«Volver»** | [captura](capturas/12-direct-volver-pedido.png) |
  | `/publicar` | **«Cancelar»** | [captura](capturas/20-publicar.png) |
  | `/producto/b752ebad-e132-4c1d-822d-8326d3343af9/editar` | **«Volver al artículo»** | [captura](capturas/22-editar-producto.png) |
  | `/chat/105b6318-078c-4e85-b2ef-a5d5bb76e659` | **«Volver»** hacia `/chats` | [captura](capturas/23-chat.png) |

- **Barra inferior a 390 px:** sigue visible en inicio, buscar, chats, perfil, guardados (`/favoritos`) y ficha (`/producto/...`). Se observaron los accesos **Inicio**, **Buscar**, **Chats** y **Perfil** en la franja inferior. [Inicio](capturas/24-inicio-barra.png) · [Buscar](capturas/24-buscar-barra.png) · [Chats](capturas/24-chats-barra.png) · [Perfil](capturas/24-perfil-barra.png) · [Guardados](capturas/24-guardados-barra.png) · [Ficha](capturas/24-ficha-barra.png)

No se completó ningún pago; los pedidos de prueba quedaron cancelados. No se publicó ningún artículo de prueba.

## NO VERIFICADO

- Resultado posterior a **«Simular pago aprobado»** o **«Simular pago rechazado»**.
- Flujo posterior de despacho y confirmación de recibo.
- Resolución a 1280 px.
- Registro de cuenta nueva y código SMS.
