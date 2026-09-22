# Informe de prueba — corrección «Volver»

**Veredicto: NO PASA** — el recorrido principal funciona en 390 px y 1280 px, pero un enlace directo a un artículo retirado abre un chat operativo con «Hacer una oferta», y la pantalla de «No pudimos abrir esto» no tiene «Volver».

## Hallazgos

1. **Severidad: media — se puede abrir un chat y aparece «Hacer una oferta» para un artículo retirado.**

   **Ancho:** 390 px.

   **Pasos exactos:**

   1. Entrar como `laura@2venta.demo` con contraseña `Demo2venta.2026`.
   2. Ir directamente a `/chat/abrir/2a7b9654-04a0-46c2-968b-e1913c386c4d` (artículo «Coche Chicco reclinable», retirado).

   **Esperado:** no crear una conversación para un artículo retirado; mostrar una salida coherente hacia la ficha/no disponible y no ofrecer «Hacer una oferta».

   **Visto:** la URL final fue `http://localhost:3100/chat/26acf1c0-80d2-498c-99f0-4da0a099be29`. La pantalla mostró exactamente: «Coche Chicco reclinable», «$ 260.000 · Hablas con Camila R.», «Todavía no se han escrito. Pregúntale lo que necesites saber antes de comprar: en qué estado está, por qué lo vende, si tiene la caja.», «Hacer una oferta» y «Reportar esta conversación».

   **Captura:** [chat-abrir-retirado-coche-390.png](capturas/chat-abrir-retirado-coche-390.png)

2. **Severidad: media — la pantalla de no encontrado no ofrece «Volver».**

   **Ancho:** 390 px.

   **Pasos exactos:** abrir directamente `http://localhost:3100/producto/00000000-0000-0000-0000-000000000000`.

   **Esperado:** un control «Volver» visible, como en todas las pantallas salvo Home, con un destino razonable.

   **Visto:** URL `http://localhost:3100/producto/00000000-0000-0000-0000-000000000000`; encabezado exacto «No pudimos abrir esto». La pantalla solo mostró «Ver lo que hay ahora» y «Buscar algo parecido»; no mostró ningún enlace o botón «Volver».

   **Captura:** [no-encontrado-sin-volver-390.png](capturas/no-encontrado-sin-volver-390.png)

## Lo que verifiqué y pasa

- Recorrido de Catalina en **390 px y 1280 px**: Home sin «Volver»; ficha «Atrapasueños para cuarto de bebé»; «Escribirle al vendedor»; URL de entrada `http://localhost:3100/ingresar?motivo=chat&volver=%2Fchat%2Fabrir%2F95950ecc-fcda-401d-9d90-16262cb72545`; texto exacto «Entra para escribirle al vendedor. Las conversaciones van dentro de 2venta para que el pago siga protegido.»; «Volver» visible y retorno a `http://localhost:3100/producto/95950ecc-fcda-401d-9d90-16262cb72545`.
- Entrar con Laura llegó al chat del mismo artículo, con URL final `http://localhost:3100/chat/fc4e5eb9-905d-4078-8c3f-ed871336dadc` y el texto «Atrapasueños para cuarto de bebé».
- Crear cuenta por «Quiero comprar» y por «Quiero vender», confirmar el código SMS, llegó directamente al chat del artículo. Cambiar varias veces entre «Iniciar sesión» y «Crear una» conservó `volver=/chat/abrir/95950ecc-fcda-401d-9d90-16262cb72545`.
- Desde el chat, «Volver» llevó a la ficha; el botón atrás del navegador también llevó a la ficha y no dejó visible el formulario de entrada.
- Búsqueda con filtros `http://localhost:3100/buscar?q=Guante&zona=Chapinero&orden=recientes` → ficha → «Volver» conservó exactamente esos filtros.
- Ficha → perfil de vendedor → otra ficha → «Volver» ×3 regresó, en orden, a perfil, ficha original y Home.
- Chat → «Hacer una oferta» → «Volver a la conversación» regresó al chat. Después de «Enviar la oferta», la URL volvió al chat y no al formulario de oferta.
- La presencia del control se observó en autenticación, registro, bienvenida, recuperar, verificar, buscar, ficha, perfil de vendedor, chats, chat, oferta, carrito, comprar, actividad, guardados, avisos, cuenta, editar cuenta, vender, métricas, tienda, publicar (rotulado «Cancelar»), editar publicación, administración y sus subpantallas. En `publicar` el control conserva la misma cápsula visual y destino `/vender`.
- Seguridad de `volver`: probé `//ejemplo.com`, `/%5Cejemplo.com`, `https://ejemplo.com`, `javascript:alert(1)`, `%2F%2Fejemplo.com` y rutas internas raras en `/ingresar`, `/bienvenida`, `/registro` y `/verificar`. No apareció un enlace externo; al iniciar sesión con un valor externo la URL final fue `http://localhost:3100/`.
- `/chat/abrir/<id>` inválido con Laura terminó en `http://localhost:3100/`; con Camila sobre su propio artículo terminó en la ficha `http://localhost:3100/producto/d859b4a8-2db2-409d-84ad-e38a3b2390c9`; sin sesión llevó a entrada con motivo de chat; sin celular confirmado llevó a `http://localhost:3100/verificar?volver=%2Fchat%2Fabrir%2F95950ecc-fcda-401d-9d90-16262cb72545`.
- En 390 px no observé desbordamiento horizontal en ficha, chat ni administración (`scrollWidth` igual a 390). En el chat el compositor «Mensaje» quedó visible abajo, con su caja entre `y=733.5` y `y=779.5` dentro de un viewport de 844 px.
- Capturas clave adicionales: [catalina-entrar-ok-390.png](capturas/catalina-entrar-ok-390.png), [catalina-entrar-ok-1280.png](capturas/catalina-entrar-ok-1280.png), [alta-chat-comprar.png](capturas/alta-chat-comprar.png), [alta-chat-vender-1280.png](capturas/alta-chat-vender-1280.png), [busqueda-filtros-volver.png](capturas/busqueda-filtros-volver.png), [chat-browser-back.png](capturas/chat-browser-back.png), [oferta-enviada-chat-390.png](capturas/oferta-enviada-chat-390.png), [chat-compositor-390.png](capturas/chat-compositor-390.png) y [admin-subpantalla-390.png](capturas/admin-subpantalla-390.png).

## NO VERIFICADO

- Artículo **vendido** en `/chat/abrir/<id>`: no había ningún artículo con estado `vendida` en los datos disponibles y no cambié un artículo demo existente de forma destructiva.
- Pedido real: no había pedidos en «Tu actividad», por lo que no pude abrir `/pedido/<id>` ni verificar el retorno desde una orden.
- Cuenta suspendida: no había una cuenta suspendida alcanzable con las cuentas entregadas.
- Pantalla de grabar video de un borrador (`/publicar/[id]`) y flujo completo de tienda con borradores.
- Subpantalla dinámica de administración `/admin/conversaciones/[id]`: no había una conversación reportada disponible para abrir desde la cola.
- Varias pestañas simultáneas y recarga en mitad de un recorrido; probé contextos y pestañas nuevas separadas, pero no una carrera entre dos pestañas con el mismo recorrido.
