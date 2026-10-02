# Informe de exploración de 2venta

Fecha: 2026-10-01  
Entorno: http://localhost:3200, móvil 390×844 y escritorio 1280×800, es-CO  
Versión observada: commit 27fc452 (Pruebas: esperar la hidratación antes de elegir la zona en el perfil). El árbol de /Users/nicolasr2/Downloads/2venta ya tenía cambios de otras personas; no modifiqué ese árbol.  
Cuentas usadas: Camila, Andrés, Laura, admin y una cuenta nueva verificada por SMS.

## Veredicto

La app tiene una base navegable y varias protecciones importantes funcionan, pero todavía no está lista para gente real: el flujo de dinero permite liberar un pago con un solo toque, el video que sustenta la promesa de confianza no siempre se puede reproducir, y estados públicos muestran referencias internas o textos legales de borrador. Para una revisión de Catalina la dejaría en “no lista” hasta cerrar esos puntos de confianza, además de pulir los placeholders de imágenes.

## Hallazgos

### Alta

#### H1 · Compra/pedido: liberar el pago no pide confirmación

- Ancho: 390 px.
- URL: /pedido/934e123a-4793-4081-833d-df88643dbff0.
- Pasos: como Laura compré Mesa plegable, elegí envío, llené la dirección, simulé el pago aprobado y abrí el pedido. Toqué “Ya lo recibí, liberar pago” una sola vez.
- Esperado: una confirmación explícita que advierta que el dinero pasa al vendedor y que la decisión no se puede deshacer.
- Visto: el botón desaparece y la pantalla cambia inmediatamente a “Pago liberado al vendedor”; no aparece diálogo de confirmación. Después muestra el formulario de calificación.
- Capturas: [antes del pago](capturas/pago-aprobado-390.png), [estado liberado tras un toque](capturas/pedido-confirmar-recibido-390.png).
- Sugerencia: confirmar antes de ejecutar una liberación irreversible.

#### H2 · Ficha/video: publicaciones marcadas “Con video” muestran un video no reproducible

- Ancho: 390 px.
- URL: /producto/ce9d45a7-6201-4a7a-9918-7119f10b4f44 y, como caso más claro, /producto/47f6bc5d-56d8-441e-9a0c-87d66ea7b00c.
- Pasos: abrí la ficha pública sin sesión y esperé a que cargara el reproductor; en el primer caso esperé 6 segundos y en el segundo 7 segundos.
- Esperado: poder reproducir el video completo que prueba que el vendedor tiene el artículo.
- Visto: el reproductor queda en “0:00 / 0:00” con el botón de reproducción sin duración útil; en el Buzo sin foto queda un spinner y el recurso demo.webm termina con error de formato. La ficha sigue mostrando “Grabado por el vendedor” y la tarjeta “Con video”.
- Capturas: [reproductor en 0:00/0:00](capturas/video-publico-falla-390.png), [spinner en la ficha](capturas/ficha-buzo-laura-390.png).
- Sugerencia: no presentar la insignia de video hasta que el recurso sea reproducible y mostrar un estado de error entendible.

### Media

#### H3 · Vendedor/verificación: se expone una referencia técnica ref_…

- Ancho: 390 px.
- URL: /vender?tipo=natural.
- Pasos: con la cuenta nueva inicié la verificación de identidad y volví a abrir la pantalla mientras estaba pendiente.
- Esperado: un estado humano, por ejemplo “Estamos revisando tu identidad”, sin identificadores internos salvo que haya una razón clara para mostrarlos.
- Visto: debajo del mensaje aparece exactamente “Referencia ref_bfdb124e-b9a6-48fc-a432-d9d3c6ff4461”.
- Captura: [referencia expuesta](capturas/kyc-referencia-tecnica-390.png).
- Sugerencia: ocultar la referencia interna o presentarla solo como código de soporte copiable y explicado.

#### H4 · Legal: los términos públicos muestran placeholders y notas internas

- Ancho: 390 px.
- URL: /legal.
- Pasos: abrí “Términos y datos personales” desde la cuenta de Laura.
- Esperado: texto legal listo para publicación, con razón social, NIT y canales de atención definidos.
- Visto: se muestran “Versión 1 · Borrador en revisión legal”, “[razón social — POR COMPLETAR]”, “NIT [POR COMPLETAR]” y varios párrafos que empiezan por “Para revisión legal:”.
- Captura: [términos visibles para una usuaria](capturas/laura-390-_legal.png).
- Sugerencia: retirar los textos de revisión y completar la identidad legal antes de exponer esta pantalla.

#### H5 · Navegación del vendedor: Volver manda a Home y pierde el contexto

- Ancho: 390 px.
- URL: /producto/0c22bf17-9176-4b88-aed7-ea256558f46d.
- Pasos: con la cuenta nueva abrí el artículo propio después de publicarlo/editarlo y toqué “Volver”.
- Esperado: regresar al espacio del vendedor o a “Tus publicaciones”, que era el contexto desde el que se gestionó el artículo.
- Visto: el enlace tiene href="/" y lleva directamente a Home, aunque el artículo es propio y la acción anterior fue de publicación/gestión.
- Capturas: [ficha antes de volver](capturas/volver-producto-antes-390.png), [destino Home](capturas/volver-producto-destino-home-390.png).
- Sugerencia: conservar el contexto de origen o usar el historial del navegador para “Volver”.

### Baja

#### H6 · Catálogo: artículos sin foto muestran el icono de imagen rota

- Ancho: 1280 px.
- URL: /buscar.
- Pasos: abrí la búsqueda con los artículos actuales y revisé las primeras tarjetas.
- Esperado: un placeholder neutro para un artículo sin fotos.
- Visto: varias tarjetas muestran un rectángulo gris con el icono de imagen rota; el recurso apunta a http://localhost:9000/2venta-media/seed/demo.jpg y no carga. El resto de la tarjeta sí aparece y dice “Con video”.
- Captura: [tarjetas con imagen rota](capturas/desktop-1280-_2Fbuscar.png).
- Sugerencia: usar un placeholder local cuando el artículo no tenga foto o cuando el recurso falle.

## Lo que verifiqué y funciona bien

- Registro: validó correo sin @, celular corto, mayoría de edad y contraseña corta; el celular formatea espacios y no conserva emojis. La cuenta nueva se confirmó con el código obtenido por codigo-sms.sh y pudo iniciar sesión.
- Entrada y recuperación: el login inválido mostró el error de correo; recuperar contraseña avanzó a “Código de seis dígitos” y “Nueva contraseña” sin cambiar la cuenta demo.
- Búsqueda: consulta larga con emojis, búsqueda sin resultados, filtros visibles, orden y carga de más resultados (“24 de 150” y luego más) funcionaron en la pasada. El campo de precio no aceptó letras y formateó valores en pesos colombianos.
- Ficha y privacidad: guardado, carrito, preguntas y formularios de reporte estuvieron accesibles. El teléfono enviado en chat se mostró como “•••••”; el HTML público del artículo no expuso celular ni correo. Camila no pudo abrir por URL el pedido ni la conversación de Laura.
- Chat/oferta: el reporte de conversación explica que se guarda el chat y que se dejan de recibir mensajes; una oferta sobre un artículo ya vendido fue bloqueada con “Ese artículo ya no está disponible.”.
- Vendedor: la verificación simulada aprobada habilitó publicar. La cámara simulada grabó, al terminar mostró “Video listo” y se vio un video con URL blob: antes de publicar. El artículo de prueba se publicó, editó, retiró, republicó y quedó retirado al final.
- Compra: el formulario diferenció envío y entrega presencial; la opción presencial quitó la dirección y mostró la zona de encuentro. En el pago simulado se observaron cifras coherentes: producto $ 120.000, envío $ 10.000, total $ 130.000, comisión $ 6.000, vendedor $ 114.000.
- Administración: moderación, disputas, conversaciones, usuarios, configuración y reportes cargaron para admin. El reporte descargó un CSV válido con métricas y categorías; no observé un fallo en su contenido.
- Diseño general: portada, ficha, búsqueda y panel de reportes se adaptaron a 390 y 1280 px sin desbordamientos generales; publicación y pedido se recorrieron en móvil. El problema visual comprobado fue el de las imágenes rotas de H6.

## NO VERIFICADO

- Recuperar contraseña hasta introducir el código correcto y guardar una contraseña nueva; cambiar número completo de principio a fin.
- Completar una compra presencial: pago, código de entrega, liberación, calificación y vencimiento del código.
- Reclamo, cancelación, reembolso, rechazo/aceptación de ofertas y carreras de estado entre oferta, precio, retiro y pago.
- Carrito con varios artículos del mismo vendedor y comprobación de un solo envío/comisión; cambios de precio mientras el carrito está abierto.
- Vista del pedido como vendedor, disputas abiertas y cruces con cuenta suspendida.
- Flujo de empresa completo: cargar RUT, revisión del equipo, aprobación y publicación/carga en lote de una tienda.
- Rechazo de identidad, revisión de los tres estados completos y verificación de identidad real.
- Subida real de fotos desde galería, límite de seis fotos y previsualización de fotos.
- Destacar una publicación, pago del destacado y comportamiento al retirarla.
- Prueba sistemática de doble toque en todos los botones, recarga en mitad de cada flujo y botón atrás del navegador en todas las zonas.
- Seguridad de rutas de archivos/media y variantes de traversal; no hice una auditoría de endpoints ni de almacenamiento.
- Suspender o aprobar/rechazar datos reales desde admin; no lo ejecuté para no alterar cuentas compartidas.
- Recorrido completo de cada una de las cuatro cuentas demo en ambos anchos; Andrés se recorrió en móvil y admin en ambos anchos, pero no repetí toda la batería de cada cuenta en 1280 px.
- Comparación contra sitios públicos externos.
- El “Excel” no se verificó porque la aplicación entrega CSV; sí se descargó y se revisó el texto del CSV.
