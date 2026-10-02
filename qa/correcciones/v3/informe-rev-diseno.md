# Revisión independiente de 2venta

Fecha: 1 de octubre de 2026. Revisé `http://localhost:3200` como persona compradora, vendedora y del equipo de 2venta, primero en 390 × 844 px con touch y luego en 1280 × 800 px. Usé capturas de los estados realmente vistos; la app compartía datos con otras revisoras, así que los conteos y pedidos pueden cambiar.

## Veredicto general

2venta tiene una base visual clara y reconocible: tipografía consistente, verde petróleo/coral, tarjetas, botones y mensajes de pago protegido. El happy path de explorar, ver una ficha, elegir envío o encuentro presencial y abrir un reclamo se entiende. Pero todavía no se siente lista para una persona real: en el catálogo abundan imágenes rotas, el video de prueba se ve como una pantalla verde de desarrollo, la barra inferior tapa formularios y el filtro móvil es demasiado angosto. Además, el registro expone términos “Borrador en revisión legal” con campos `[POR COMPLETAR]`, y el pedido muestra estados que se contradicen. El resultado parece un prototipo visual bien maquetado con datos de demostración, no un marketplace terminado.

**Nota celular: 5/10.** La estructura se entiende, pero los fallos de media, la superposición de navegación y el filtro hacen que buscar, publicar y pagar se sientan frágiles.

**Nota escritorio: 6/10.** La grilla, el panel de moderación y el espacio de vendedor se ven bastante mejor a 1280 px; aun así, las tarjetas con media rota, el video verde y algunas columnas de contenido muy estrechas bajan la sensación de producto profesional.

## Hallazgos

### 1. ALTA — El catálogo no parece confiable porque las fotos están rotas y el video parece un stub

- **Pantalla / ancho / URL:** portada y resultados, 390 px y 1280 px; `http://localhost:3200/` y `http://localhost:3200/buscar`.
- **Qué pasa:** en la portada, prácticamente todas las tarjetas muestran el icono de imagen rota sobre un rectángulo gris. En resultados con video, varias tarjetas muestran una pantalla verde fosforescente con una forma geométrica y un contador; en la ficha el reproductor queda en spinner con `0:00`.
- **Por qué importa:** en segunda mano la foto/video es la principal evidencia de que el artículo existe y está en el estado anunciado. Esto parece una aplicación sin terminar o contenido generado, y reduce la confianza antes de abrir una ficha.
- **Qué esperaba:** una foto real o un fallback explícito (“sin foto”), una miniatura del video y un reproductor que cargue; si el video es simulado, una etiqueta visible de demo, no una superficie verde.
- **Propuesta corta:** reparar la carga de assets y añadir fallback visible; generar una miniatura real al terminar la grabación. En demo, usar una previsualización neutra con “Video de prueba” en vez de la pantalla verde.
- **Evidencia:** [portada móvil](capturas/01-portada-mobile.png), [portada escritorio](capturas/02-portada-desktop.png), [filtro/resultados escritorio](capturas/42-filtros-desktop.png), [ficha móvil](capturas/05-ficha-mobile.png), [ficha de publicación de prueba](capturas/30-publicado-mobile.png).
- **Competencia:** las páginas públicas de [Mercado Libre Colombia](https://www.mercadolibre.com.co/) y el flujo de artículos de [Wallapop](https://ayuda.wallapop.com/hc/es-es/articles/360002048677-Usar-filtros-de-b%C3%BAsqueda) parten de una imagen/miniatura utilizable; la media no aparece como un bloque de error en la tarjeta.

### 2. ALTA — La barra inferior fija tapa campos y acciones durante tareas largas

- **Pantalla / ancho / URL:** checkout de envío y presencial, pedido y publicar; 390 px; `http://localhost:3200/comprar/47f6bc5d-56d8-441e-9a0c-87d66ea7b00c`, `http://localhost:3200/pedido/3c88ec9f-6345-4b39-ad4c-c45220a96146` y `http://localhost:3200/publicar`.
- **Qué pasa:** la barra Inicio/Buscar/+ /Chats/Perfil permanece encima del contenido. En checkout cubre el campo “Apartamento, torre, referencia” y luego parte del resumen; en pedido tapa el bloque de entrega; en publicar cruza la explicación de la cámara y los campos.
- **Por qué importa:** una persona puede no ver qué campo falta, creer que ya terminó o tocar una pestaña cuando intentaba completar una tarea de dinero o de publicación.
- **Qué esperaba:** la navegación inferior debe desaparecer en checkout, publicación, chat y pedido, o el contenido debe tener un margen inferior seguro que nunca quede debajo de ella.
- **Propuesta corta:** usar un shell de tarea sin tabs globales; conservar solo “Volver” y la acción principal. Si la barra se conserva, reservar `safe-area` real y validar el último campo visible.
- **Evidencia:** [checkout envío](capturas/15-checkout-mobile.png), [pedido](capturas/17-pedido-creado-mobile.png), [checkout presencial](capturas/49-checkout-persona-mobile.png), [publicar](capturas/26-publicar-inicio-mobile.png), [publicar grabando](capturas/28-video-grabado-mobile.png).

### 3. ALTA — El filtro móvil es demasiado estrecho y mezcla dos decisiones de ubicación

- **Pantalla / ancho / URL:** búsqueda con filtros; 390 px y 1280 px; `http://localhost:3200/buscar` y ancla `#filtros`.
- **Qué pasa:** en móvil el drawer ocupa aproximadamente la mitad de la pantalla, los textos se parten en varias líneas y los controles quedan apiñados. Detrás sigue visible la tarjeta “¿Dónde estás?”. En escritorio el panel es un scroll interno: medí 877 px de contenido dentro de 768 px visibles; verificación y orden quedan más abajo y no se ven al abrirlo.
- **Por qué importa:** no queda claro si la ubicación es la zona del comprador o la del vendedor, y los filtros importantes parecen ausentes. Es fácil aplicar una combinación sin saber qué cambió.
- **Qué esperaba:** un filtro full-screen en móvil, una única ubicación con estado visible, resumen de filtros aplicados y todos los controles principales alcanzables sin un scroll oculto dentro de otro scroll.
- **Propuesta corta:** convertir el drawer móvil en hoja de pantalla completa; separar “mi ubicación/distancia” de “zona del vendedor” y mostrar chips de filtros aplicados. En escritorio, hacer visible el panel completo o permitir que la página lo acompañe al hacer scroll.
- **Evidencia:** [filtro móvil abierto](capturas/04-filtros-mobile.png), [búsqueda móvil](capturas/03-buscar-mobile.png), [filtros escritorio](capturas/42-filtros-desktop.png).
- **Competencia:** [Wallapop documenta filtros de categoría, precio, estado, distancia, fecha y orden](https://ayuda.wallapop.com/hc/es-es/articles/360002048677-Usar-filtros-de-b%C3%BAsqueda) y permite guardar la búsqueda; 2venta tiene las piezas, pero las presenta con más fricción y sin un resumen persistente.

### 4. ALTA — El registro puede quedar bloqueado por la aceptación de términos

- **Pantalla / ancho / URL:** registro de comprador; 390 px; `http://localhost:3200/registro?rol=comprador`.
- **Qué pasa:** al intentar marcar “Leí y acepto…”, el checkbox no quedó marcado y se abrió el modal de términos. El modal ocupa casi toda la pantalla y deja la aceptación fuera del foco. El estado visible sigue mostrando el checkbox sin resolver.
- **Por qué importa:** es un bloqueo de conversión: una persona que solo quiere crear la cuenta no puede saber si aceptó ni cómo volver al formulario.
- **Qué esperaba:** el checkbox debe cambiar de estado al tocar su caja; el texto “Términos…” debe abrir el modal de forma independiente. El modal debe tener una salida evidente y, al aceptar, devolver el estado al formulario.
- **Propuesta corta:** separar el botón de términos del `label` del checkbox y mostrar un estado “Aceptado” antes de permitir continuar.
- **Evidencia:** [registro](capturas/07-registro-mobile.png), [modal de términos abierto](capturas/debug-terms.png).

### 5. ALTA — La pantalla de registro expone un texto legal de borrador y datos incompletos

- **Pantalla / ancho / URL:** modal “Términos y política de datos”; 390 px; `http://localhost:3200/registro?rol=comprador`.
- **Qué pasa:** aparece “Versión 1 · Borrador en revisión legal. Este texto todavía no lo ha aprobado un abogado” y el contenido incluye `[razón social — POR COMPLETAR]`, `[NIT POR COMPLETAR]`, correo y teléfono sin completar.
- **Por qué importa:** contradice la promesa de “primera confianza” y puede hacer que una persona no entregue sus datos ni pague después. No es copy de placeholder aceptable en una pantalla de producción.
- **Qué esperaba:** términos publicados y aprobados, con la razón social, NIT y canales reales; si aún no están listos, no exponer el documento al público.
- **Propuesta corta:** reemplazar el borrador por la versión legal aprobada y revisar todo el contenido que venga de datos de configuración antes del lanzamiento.
- **Evidencia:** [modal legal](capturas/debug-terms.png), [formulario de registro](capturas/07-registro-mobile.png).
- **Competencia:** [Mercado Libre Colombia explica públicamente Compra Protegida y el alcance de los reclamos](https://www.mercadolibre.com.co/compra-protegida); la referencia transmite reglas operables, no un texto de revisión interna.

### 6. ALTA — El pedido muestra estados contradictorios

- **Pantalla / ancho / URL:** pedido de Laura; 390 px y 1280 px; `http://localhost:3200/pedido/3c88ec9f-6345-4b39-ad4c-c45220a96146`.
- **Qué pasa:** la línea naranja marca “El vendedor despachó”, pero inmediatamente debajo se lee “Ya lo entregó a la transportadora”; el siguiente estado dice “Entregado” y “La transportadora reportó la entrega”. La acción principal ya es “Ya lo recibí, liberar pago”.
- **Por qué importa:** con dinero retenido, la persona no sabe si debe esperar al despacho, confirmar una entrega ya realizada o revisar un evento atrasado.
- **Qué esperaba:** un único estado actual destacado —“Entregado: revisa y confirma”— y los eventos anteriores en tono secundario, con fecha y origen.
- **Propuesta corta:** derivar el color/estado activo de la misma fuente que habilita la acción; presentar la cronología como “Completado / Actual / Próximo” y explicar cualquier demora de transportadora.
- **Evidencia:** [pedido móvil](capturas/17-pedido-creado-mobile.png), [pedido escritorio](capturas/18-pedido-desktop.png), [pedido tras liberar pago](capturas/19-recibido-calificar-mobile.png).
- **Competencia:** [Mercado Libre describe monitoreo del envío hasta la entrega y una cobertura de Compra Protegida](https://www.mercadolibre.com.co/seguridad?showDeal=true); [Vinted explica cuándo suspender un pedido y pedir reembolso](https://www.vinted.es/help/313/465-politica-de-reembolso-de-vinted). En ambos casos el estado debe dejar claro qué acción corresponde ahora.

### 7. ALTA — La venta de un artículo mostrado como “Camila V.” no aparece en la actividad de Camila

- **Pantalla / ancho / URL:** compra de Laura y espacio de Camila; 390 px; `http://localhost:3200/pedido/3c88ec9f-6345-4b39-ad4c-c45220a96146`, `http://localhost:3200/actividad` con `camila@2venta.demo`.
- **Qué pasa:** Laura ve el artículo como vendido por “Camila V.”, paga y recibe el pedido. Al entrar como `camila@2venta.demo`, “Tu actividad” solo muestra el estado vacío “Aquí van tus ventas”; tampoco aparece conversación ni pedido para despachar.
- **Por qué importa:** impide seguir la tarea de vendedora, despachar o cobrar. Para el usuario se ve como una venta perdida, aunque el artículo muestre el mismo nombre público.
- **Qué esperaba:** toda compra debe aparecer inmediatamente en la cuenta dueña de la publicación, con la tarea “Despachar” o “Cobrar en persona”.
- **Propuesta corta:** validar la relación publicación–vendedor–pedido con un ID único, y no reutilizar alias “Camila V.” en fixtures que pertenecen a otra cuenta. Añadir una alerta visible al vendedor cuando entra una venta.
- **Evidencia:** [pedido de Laura](capturas/17-pedido-creado-mobile.png), [espacio de Camila](capturas/25-vender-camila-mobile.png), [actividad vacía de Camila](capturas/33-actividad-camila-mobile.png).
- **Nota:** la evidencia puede estar influida por datos demo compartidos, pero desde la interfaz la identidad pública y la cuenta entregada parecen ser la misma; debe corregirse o documentarse antes de una revisión con usuarios.

### 8. MEDIA — La publicación obliga a usar video, pero la cámara simulada parece un error visual

- **Pantalla / ancho / URL:** publicar artículo; 390 px; `http://localhost:3200/publicar`.
- **Qué pasa:** la cámara muestra un fondo verde intenso, un contador y una forma tipo “pac-man”; después de grabar, esa misma superficie queda como video del artículo. El texto explica bien qué grabar, pero no aclara que la cámara es simulada.
- **Por qué importa:** el requisito del video es una buena idea de confianza, pero la interfaz hace que el vendedor piense que la cámara falló o que su publicación quedó dañada.
- **Qué esperaba:** una cámara o preview neutral, controles de grabar/detener y una confirmación “Video listo” con miniatura reconocible.
- **Propuesta corta:** sustituir el stub verde por preview real o por un estado de demo explícito; después de grabar mostrar “Video listo” con reproducir, reemplazar y duración.
- **Evidencia:** [publicar antes de grabar](capturas/26-publicar-inicio-mobile.png), [cámara abierta](capturas/27-camara-simulada-mobile.png), [grabando](capturas/28-video-grabado-mobile.png), [publicación resultante](capturas/30-publicado-mobile.png).
- **Competencia:** [Vinted separa en su centro de ayuda publicar y gestionar anuncios](https://www.vinted.es/help), y [Facebook explica el flujo de vender en Marketplace](https://www.facebook.com/help/550954179351183); 2venta añade una prueba de existencia diferenciadora, pero necesita presentarla como un flujo terminado.

### 9. MEDIA — Hay demasiados nombres de prueba y contenido sintético en superficies que deberían vender

- **Pantalla / ancho / URL:** portada, resultados y publicaciones; 390 px y 1280 px; `http://localhost:3200/`, `http://localhost:3200/buscar`, `http://localhost:3200/vender/metricas`.
- **Qué pasa:** aparecen títulos como “Buzo sin foto 1790913671693”, “Leída 1790914011027 2”, “demostración 40”, “Cámara de prueba UX” y “Descripción de prueba”. La lista comunica volumen, pero no un marketplace cuidado.
- **Por qué importa:** es la causa principal de que se sienta “hecha por IA” o con datos sembrados. Los IDs largos compiten con el precio y no ayudan a decidir.
- **Qué esperaba:** títulos descriptivos de usuario, fotos consistentes, metadatos de estado y zona, sin IDs salvo en un detalle técnico.
- **Propuesta corta:** separar datos de QA del catálogo que se presenta en revisión; curar 20–30 publicaciones representativas con títulos y media creíbles.
- **Evidencia:** [portada móvil](capturas/01-portada-mobile.png), [publicaciones de Camila](capturas/32-mis-publicaciones-mobile.png), [filtros escritorio](capturas/42-filtros-desktop.png).

### 10. MEDIA — El “problema con el pedido” está escondido bajo un disclosure después de la acción de confirmar

- **Pantalla / ancho / URL:** pedido de Laura; 390 px; `http://localhost:3200/pedido/f3c8e83f-278e-4747-8dc3-6f8f68a8370a`.
- **Qué pasa:** el reclamo aparece como un `summary` debajo del bloque “Ya lo recibí, liberar pago”. Solo al expandirlo se ven los motivos, plazo de 48 horas/7 días, fotos y “Abrir reclamo”.
- **Por qué importa:** la persona que recibió algo mal puede pulsar la acción de liberar dinero antes de encontrar su salida segura, o no percibir que el plazo es urgente.
- **Qué esperaba:** junto a la acción de confirmación, una opción visible “Tengo un problema” con el plazo; el disclosure puede conservarse para los detalles.
- **Propuesta corta:** poner ambas acciones al mismo nivel visual, con “No confirmes si hay un problema” y el plazo visible.
- **Evidencia:** [reclamo cerrado](capturas/23-pedido-claim-candidato-mobile.png), [reclamo abierto](capturas/24-reclamo-abierto-mobile.png).
- **Competencia:** [Mercado Libre indica “Inicia un reclamo” como parte explícita de Compra Protegida](https://www.mercadolibre.com.co/compra-protegida); [Vinted indica pulsar “Tengo un problema” desde la conversación y suspender el pedido](https://www.vinted.es/help/313/465-politica-de-reembolso-de-vinted). En 2venta la salida existe, pero tiene menor visibilidad.

### 11. MEDIA — El espacio de vendedor está bien estructurado, pero en móvil la navegación tapa su tarjeta de ventas

- **Pantalla / ancho / URL:** espacio de vendedor; 390 px y 1280 px; `http://localhost:3200/vender`.
- **Qué pasa:** en móvil la barra inferior cruza el título “Ventas y conversaciones” y el botón “Abrir”. En escritorio las tres tarjetas se leen claramente.
- **Por qué importa:** la tarea más crítica del vendedor —ver qué debe despachar— queda parcialmente cubierta justo en el tamaño principal.
- **Propuesta corta:** aplicar el mismo shell de tarea sin barra fija y mantener las tres tarjetas dentro del primer viewport móvil.
- **Evidencia:** [vendedor móvil](capturas/25-vender-camila-mobile.png), [vendedor escritorio](capturas/34-vender-camila-desktop.png).

### 12. MEDIA — Configuración de administración es una página monolítica difícil de mantener

- **Pantalla / ancho / URL:** configuración del equipo; 390 px; `http://localhost:3200/admin/configuracion`.
- **Qué pasa:** después de categorías aparecen 32 lugares, cada uno con zona, nombre, tipo, confirmación, activo y Guardar; luego tallas, edades, palabras prohibidas e historial. Hay anclas superiores, pero el volumen sigue siendo una sola página con repetición.
- **Por qué importa:** aumenta la probabilidad de guardar el lugar equivocado y hace difícil encontrar qué elemento necesita revisión; no es una vista operativa para una cola de 32 pendientes.
- **Propuesta corta:** convertir cada sección en tabla con búsqueda/filtro y paginación; dejar “por confirmar” como cola prioritaria y mover historial a una pestaña propia.
- **Evidencia:** [configuración, primer viewport](capturas/53-configuracion-admin-viewport.png), [página completa](capturas/40-configuracion-admin-mobile.png).

### 13. BAJA — Algunos estados vacíos son buenos, pero la cuenta puede crecer sin jerarquía

- **Pantalla / ancho / URL:** actividad, chats y cuenta; 390 px; `http://localhost:3200/actividad`, `http://localhost:3200/chats`, `http://localhost:3200/cuenta`.
- **Qué pasa:** los vacíos de compras y conversaciones sí explican qué ocurrirá y tienen CTA. En cambio, la cuenta muestra muchas sesiones abiertas repetidas, en tarjetas idénticas, y desplaza cualquier acción relevante.
- **Por qué importa:** la persona no distingue su sesión actual de las demás y puede interpretar el listado como un error o una brecha de seguridad.
- **Propuesta corta:** agrupar “esta sesión”, “otros dispositivos” y “cerrar las demás”; mostrar como máximo las cinco más recientes y un enlace para ver el resto.
- **Evidencia:** [actividad vacía](capturas/11-2-actividad-mobile.png), [chats vacío](capturas/11-3-chats-mobile.png), [cuenta](capturas/11-4-cuenta-mobile.png).

## Lo que está bien hecho

- La identidad visual es consistente y distintiva: verde petróleo/coral, bordes suaves, tipografía y estados de botones se repiten sin sentirse caóticos.
- La ficha agrupa precio, condición, categoría, talla, descripción y vendedor verificado de forma comprensible; “Pago protegido” explica qué ocurre con el dinero.
- El checkout diferencia claramente envío y encuentro presencial. El copy “Nunca entregas efectivo” y las recomendaciones de seguridad son útiles y adecuadas para Bogotá.
- El flujo de pedido tiene una cronología entendible como concepto y conserva una acción de liberar el pago; al confirmar, la pantalla de calificación es simple y legible.
- Los estados vacíos de actividad, chats y búsqueda sin resultados son humanos, breves y tienen CTA: [búsqueda sin resultados](capturas/45-busqueda-sin-resultados-mobile.png).
- El espacio de vendedor en escritorio está bien jerarquizado: identidad, publicaciones, ventas y datos legales quedan separados; [vista de escritorio](capturas/34-vender-camila-desktop.png).
- El panel de moderación del equipo prioriza “URGENTE”, muestra motivo, persona reportada y enlaces de acción; [moderación escritorio](capturas/43-admin-admin-desktop.png) y [conversaciones reportadas](capturas/43-conversaciones-admin-desktop.png).
- El login sí ofrece un error claro —“Correo o contraseña incorrectos”— sin lenguaje técnico: [error de login](capturas/46-login-error-mobile.png).

## Comparación con la competencia

| Tema | 2venta observado | Referencia pública | Lectura para 2venta |
|---|---|---|---|
| Ficha, media y confianza | Video obligatorio, vendedor verificado y pago protegido; pero fotos rotas y video verde. | [Mercado Libre](https://www.mercadolibre.com.co/) y [Wallapop](https://ayuda.wallapop.com/hc/es-es/articles/360002048677-Usar-filtros-de-b%C3%BAsqueda) parten de media utilizable y metadatos visibles. | La diferenciación del video es buena solo si la prueba se ve real y carga siempre. |
| Filtros y precio | Categoría, precio, estado, distancia, zona del vendedor y orden; panel estrecho/scroll interno. | [Wallapop enumera categoría, precio, estado, distancia, fecha, orden y guardado de búsquedas](https://ayuda.wallapop.com/hc/es-es/articles/360002048677-Usar-filtros-de-b%C3%BAsqueda). | Mantener el alcance, pero convertirlo en filtros progresivos y resumidos. |
| Chat | Chat desde la ficha, oferta y advertencia de no pagar por fuera. | [Wallapop recomienda no compartir datos personales ni enlaces externos en chat](https://ayuda.wallapop.com/hc/es-es/articles/360004506798--C%C3%B3mo-funciona-el-chat); [Mercado Libre deja el chat asociado a la compra protegida](https://www.mercadolibre.com.co/compra-seguro). | 2venta tiene una base de seguridad correcta; debe conservarla y dar más visibilidad al contexto del artículo y estado de venta. |
| Publicar | Video dentro de la app, checklist de seguridad, fotos opcionales y comisión visible. | [Vinted separa publicar y gestionar anuncios](https://www.vinted.es/help); [Facebook documenta Marketplace como flujo específico de venta](https://www.facebook.com/help/550954179351183). | El video es una ventaja de confianza, pero la cámara simulada debe parecer producto, no herramienta interna. |
| Seguimiento y reclamos | Timeline, dinero retenido, liberación y reclamo desplegable. | [Mercado Libre explica seguimiento y Compra Protegida](https://www.mercadolibre.com.co/seguridad?showDeal=true); [Vinted muestra el camino “Tengo un problema” y mantiene el pago a salvo](https://www.vinted.es/help/313/465-politica-de-reembolso-de-vinted). | Hacer inequívoco el estado actual y poner el reclamo junto a confirmar, no debajo. |
| Vacíos y avisos | Buenos textos en chats, actividad y sin resultados; alertas de búsqueda no comprobadas en esta ronda. | [Centro de ayuda de Vinted](https://www.vinted.es/help) separa Comprar, Vender, pedidos y cuenta; Wallapop ofrece guardar búsquedas. | Mantener el tono humano y añadir estados/alertas accionables, no solo texto. |

## Las 5 mejoras de mayor impacto

1. **Arreglar la capa de media:** imágenes con fallback, miniaturas de video, estado de carga/error y datos de catálogo curados.
2. **Crear un shell móvil de tareas:** retirar la barra inferior de checkout/publicar/pedido/chat o reservar espacio seguro; probar con teclado y scroll hasta el último campo.
3. **Rediseñar filtros y ubicación:** hoja full-screen en móvil, una única decisión de ubicación, chips de filtros y panel desktop sin scroll oculto.
4. **Alinear estados y propiedad del pedido:** una sola máquina de estados para comprador, vendedor y transportadora; el artículo comprado debe aparecer en la actividad del vendedor correcto con “Despachar” o “Cobrar”.
5. **Cerrar la brecha de confianza:** corregir checkbox/modal de términos, publicar términos legales reales, retirar placeholders y hacer que la cámara simulada se vea como una demo intencional.

## NO VERIFICADO

- No completé el registro de una cuenta nueva hasta confirmar el celular: el flujo quedó detenido en la aceptación de términos; el acceso directo a `/verificar` redirigió a login. No cambié ninguna cuenta demo.
- No pude completar despachar ni cobrar en persona como Camila: la cuenta demo no mostró la venta de Laura y el submit del checkout presencial no terminó dentro de la sesión de revisión. Sí verifiqué visualmente la elección “Nos vemos en persona”, zona, reglas de seguridad, total sin envío y botón de pago.
- No verifiqué cámara, micrófono ni subida real desde un dispositivo físico; probé el flujo simulado disponible en la app, tal como se indicó.
- No verifiqué KYC real, pagos reales, transportadora real, recuperación de contraseña, cuenta de empresa/RUT, Andrés ni carga de fotos desde galería.
- No determiné desde la interfaz si las imágenes rotas provienen del backend, de URLs expiradas o de un fallback CSS; el hallazgo es estrictamente visual y de experiencia.
- La comparación externa usó sitios y centros de ayuda públicos, sin crear cuentas ni iniciar sesión; no es una auditoría exhaustiva de sus apps móviles.
