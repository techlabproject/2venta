# Informe de prueba — Catalina, versión 3 / D-129

Fecha: 2026-10-01 · Probadora: Luna · navegador conectado a `http://localhost:3100`.

## Veredicto

**General: PASA CON OBSERVACIONES.** No apareció una discrepancia visible reproducible; queda una comprobación interna de servidor y una variante de paginación sin JavaScript en **NO VERIFICADO**.

| Fila | Veredicto | Evidencia principal |
|---|---|---|
| 4 · Precio en filtros | PASA | Deslizador doble, escalones y contador vivo; no cruza las puntas. [portada 390](capturas/04-filtros-390-50k-200k.png) [buscar 390](capturas/40-buscar-filtros-390.png) [buscar 1280](capturas/40-buscar-filtros-1280.png) [sin JS 390](capturas/06-sinjs-filtros-390.png) [sin JS 1280](capturas/06-sinjs-filtros-1280.png) |
| 5 · Sin resultados | PASA | Mensajes y enlaces correctos en palabra y combinación de filtros. [palabra](capturas/06-sin-resultados-palabra.png) [filtros](capturas/08-sin-resultados-filtros.png) |
| 60 · Barra de ubicación | PASA | Una sola tarjeta; “Cambiar” abre el formulario debajo dentro de ella en 390 y 1280 px. [390](capturas/10-ubicacion-390-abierta.png) [1280](capturas/10-ubicacion-1280-abierta.png) |
| 33–34 · Paginación | PASA | Portada: 24 → 48; Camila: 24 de 26 → 26. [portada](capturas/11-portada-390-pagina2.png) [Camila](capturas/22-camila-metricas-390-pagina2.png) |
| 21 · Chat sin fotos | PASA | No hay control ni `input[type=file]`; `imageKey` inyectado a mano se rechaza y no crea mensaje. [compradora](capturas/15-chat-sin-fotos-laura.png) [rechazo](capturas/16-chat-rechaza-imageKey.png) [vendedora](capturas/18-chat-sin-fotos-camila.png) |
| 71 · Chat | PASA | No aparece “Cierra el trato aquí”; el teléfono se enmascara y conserva el aviso. [aviso](capturas/17-chat-aviso-telefono.png) |
| 27 · Mensajes sin leer | PASA | “1 sin leer”, conversación en negrita con punto y “1” en `/actividad` y `/chats`; al abrir desaparece. [actividad](capturas/20-actividad-no-leidos.png) [chats](capturas/20b-chats-no-leidos.png) [leído](capturas/21-actividad-leido.png) |
| 62 · Registro | PASA | Ayuda exacta: “Te mandamos un código para confirmarlo.” [registro](capturas/13-registro-vendedor-390.png) |
| 63 · Vender | PASA | “Como empresa (persona jurídica)” y “Tienda o negocio con NIT”; no aparece “cambalache”. [tipo](capturas/25-tipo-vendedor-390.png) |
| 64–65 · Verificación del vendedor | PASA CON OBSERVACIONES | No se pide “Teléfono de contacto”; solo “Dirección de notificaciones”. Se intentó inyectar `telefono=3000000000`; el flujo siguió sin mostrar un campo telefónico. La igualdad persistente en servidor queda en NO VERIFICADO. [formulario](capturas/26-vendedor-natural-390.png) [inyección](capturas/25-vendedor-inyeccion-telefono-390.png) |
| 66 · Verificación simulada | PASA | La pantalla muestra el aviso de simulación, no “Referencia ref_…”; “Estamos revisando” tampoco muestra referencia. [simulación](capturas/27-kyc-simulada-390.png) [revisión](capturas/28-vendedor-estamos-revisando-390.png) |
| 67 · Video al publicar | PASA | Tras grabar se ve reproducción con `src` y `poster` `blob:`, `srcObject` apagado; “Grabar otro” reabre cámara y vuelve a bloquear publicar. [grabado](capturas/32-video-grabado-390.png) [otro](capturas/33-grabar-otro-390.png) |
| 68 · Comisión | PASA | 20.000 → comisión 2.500 y llegan 17.500; 200.000 → 10.000 y llegan 190.000; 3.000.000 → máximo 120.000 y llegan 2.880.000. La ficha propia repite la regla. [3 millones](capturas/34-comision-3m-390.png) [ficha propia](capturas/35-publicado-ficha-390.png) |
| 69 · Después de publicar/editar | PASA | “Publicado.” / “Cambios guardados.”, “Ver mis productos”, sin “Volver”; atrás no regresa a `/publicar`; entrando normal a la ficha reaparece “Volver”. [publicado](capturas/35-publicado-ficha-390.png) [editado](capturas/37-editado-ficha-390.png) [ficha normal](capturas/38-ficha-normal-390.png) |

### URLs y anchos auditados

- **390 px:** `/`, `/buscar`, `/buscar?q=submarino`, `/buscar?q=submarino&categoria=ninos`, `/?categoria=tecnologia&max=999`, `/actividad`, `/chats`, `/registro?rol=vendedor`, `/vender`, `/vender?tipo=natural`, `/publicar` y las fichas `/producto/9d958465-8b49-4d55-b43f-e107b615dbad` y `/producto/9d958465-8b49-4d55-b43f-e107b615dbad/editar`.
- **1280 px:** `/` con ubicación San Cristóbal y `/buscar` con el panel de filtros en columna.
- **Chat:** `/chat/f77367f4-e468-4c24-9d83-8b237e367e36` a 390 px, con sesión de `laura@2venta.demo` y de `camila@2venta.demo`.
- **KYC simulado:** `/dev/kyc/...` a 390 px; el identificador de la ruta no se presenta como texto “Referencia ref_…” en la interfaz.

## Hallazgos

1. **Ninguno — severidad: no aplica.** No hubo hallazgos de producto reproducibles; por tanto no hay pasos de reproducción ni corrección propuesta.

## Lo que pasa

- En filtros, el panel muestra “Cualquier precio”; al mover las puntas se verificó “$ 50.000 – $ 200.000”, contador de 119 resultados y, al intentar cruzarlas, quedó “$ 150.000 – $ 200.000”. Sin JavaScript aparecen las dos casillas “Precio mínimo” y “Precio máximo”.
- En sin resultados se comprobó `http://localhost:3100/buscar?q=submarino` con “Ups, en este momento no tenemos «submarino»” y “Prueba con otra palabra o date una vuelta por todo lo publicado.”. La combinación filtrada usa la variante contextual “«submarino» con esos filtros” y “Prueba quitando algún filtro…”.
- En la portada se cargaron 24 artículos y “Ver más” llevó a `/?pagina=2` con 48. En Camila, `/vender/metricas` mostró “Ves 24 de 26 publicaciones” y luego 26.
- Para chat se usó una publicación temporal; se probó comprador y vendedora. El intento forzado con `imageKey` devolvió exactamente: “En el chat no se mandan fotos. Lo que quieras enseñar va en las fotos y el video del artículo.”
- Para publicar se usó una publicación temporal, se editó y se retiró al final con “Sí, retirarla”.

## Observaciones fuera de alcance

- El entorno compartido tenía 191 artículos en portada, no 52; otras personas estaban usando la misma base. Se comprobó la regla de 24 por página y no se modificaron esas publicaciones.
- La app usa pantallas de pago, KYC y transportadora simuladas, tal como indicaba el encargo; no se reportan por ser simuladas.
- La cámara utilizó el dispositivo falso del Chromium conectado, pero el recorrido fue por los controles visibles de la app.

## NO VERIFICADO

- La igualdad interna persistente entre el teléfono confirmado de la cuenta y el campo `vendedores.telefono` no tiene una salida visible para una persona compradora/vendedora. Sí se intentó inyectar un `telefono` manual en el formulario y el flujo continuó sin mostrarlo ni pedirlo de nuevo; no se afirma una comprobación directa de base de datos.
- No se probó el flujo completo sin JavaScript de “Ver más” en esta ronda; sí se verificó sin JavaScript la degradación del deslizador a las dos casillas de precio.
