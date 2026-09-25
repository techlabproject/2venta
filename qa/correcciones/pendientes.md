# Pendientes, riesgos y problemas que dejaron las correcciones

Lista viva: cada fila agrega aquí lo que encontró y no se resolvió en ella. Al final
de las 52 filas se convierte en el documento de cierre para Nicolás y Catalina
(qué cambió, qué falta implementar, qué puede ser un problema después).

## Bloqueos para salir a producción

- **SMS por Twilio (D-120), cuenta de prueba**: solo envía a números verificados en la
  consola de Twilio y **rechaza el texto propio** (error 572006), por eso los códigos
  salen por Twilio Verify con su plantilla; el número es de EE. UU. (+1 737 250 8034).
  Con Verify, si Twilio no responde al comprobar, la persona ve «¡Uy! No pudimos
  comprobar el código» y no puede seguir hasta que Twilio vuelva (no hay respaldo).
  Nicolás decidió seguir en la prueba (2026-09-25; pasar a pago cuesta US$20 de
  entrada): quedan **39 verificaciones**, el SMS dice «(SAMPLE TEST)» y solo llega a
  números inscritos en *Verified Caller IDs* (cada persona que pruebe tiene que
  inscribirse, dictando un código). En desarrollo solo `CODIGOS_REALES_SOLO_A` recibe
  SMS de verdad. Para usuarios reales: pasarla a pago (unos US$0,05 por
  SMS a Colombia, ~$210 COP) o volver al agregador local de la D-107 (~$6 COP).
  Nicolás tiene que poner el Auth Token en el secreto `2venta-dev/twilio`.
- **Meta (2026-09-24)**: la plantilla `codigo_verificacion` no se pudo crear («Esta cuenta
  de WhatsApp Business no tiene permiso para crear una plantilla de mensaje»); el
  portafolio «Boteame» **no está verificado** — Nicolás tiene que iniciar la
  verificación del negocio (RUT o Cámara de Comercio). El nombre visible del número
  +57 311 5705501 se pidió cambiar de «Bogota Detaling Center sede Polo» a «2venta»
  (**en revisión**): los clientes del detailing que le escriben verán el cambio. La
  foto del perfil y la categoría («Automóviles») siguen siendo del detailing.
- **WhatsApp Cloud conectado en el código (D-117), falta encenderlo**: rotar el token
  y el secreto de la app (Nicolás los pegó en el chat el 2026-09-24), llenar el
  secreto `2venta-dev/whatsapp`, poner el id del número en `infra/envs/dev/main.tf`,
  registrar el webhook en Meta (infra/LEEME.md), aprobar la plantilla
  `codigo_verificacion` con vigencia de **10 minutos** y resolver la verificación del
  negocio en Meta. **Quien no tiene WhatsApp no puede registrarse**: falta un canal
  de respaldo (SMS del agregador de la fila 9) o aceptarlo. `envios_codigo` guarda
  celulares: falta fijar cuánto tiempo se conservan.
- (Antes) **Sin proveedor de SMS nadie puede registrarse ni recuperar la contraseña en
  producción** (`src/lib/sms.ts` se niega a operar). Decisión: agregador colombiano;
  contratar tras prueba de entrega. Ver `docs/alcance/verificacion-celular.md`. Al
  conectarlo, el código va AL FINAL del mensaje (D-106). Falta un tope global diario
  de envíos contra abuso distribuido. (Filas 9 y 50.)
- **Términos y política de datos en borrador (v1)**: falta el aval del abogado y los
  datos de la empresa (razón social, NIT, dirección de notificaciones, teléfono,
  correo de atención, fecha de vigencia). Todo marcado «POR COMPLETAR» en
  `src/features/legal/ContenidoLegal.tsx`; las dudas legales están en las notas
  «Para revisión legal», visibles en `/legal`. (Fila 11.)
- Proveedor real de verificación de identidad (hoy simulado). (Fila 49.)

## Legal y cumplimiento (del borrador de términos, fila 11)

- ~~Art. 53 Ley 1480: dirección de notificaciones del vendedor~~ — hecho en la fila 15
  (D-111). Quienes vendían antes la completan desde el aviso de `/vender`; no se les
  obliga todavía: decidir si se bloquea publicar hasta que la completen.
- Parágrafo art. 50 Ley 1480: **enlace visible a la SIC en todo el sitio** (hoy solo
  dentro de los términos).
- Art. 50 lit. d: **acuse de recibo** del pedido a más tardar el día siguiente (hoy se
  ve en el pedido y en «Avisos»; confirmar si hace falta por correo).
- Retracto (art. 47): confirmar que aplique solo a tiendas con NIT, si la ropa usada
  es «uso personal», y quién paga cuando el pago ya se liberó. Revisar Ley 2439/2024.
- Transferencia internacional de datos (AWS fuera de Colombia, art. 26 Ley 1581) y
  posible inscripción en el Registro Nacional de Bases de Datos de la SIC.
- Plazo de conservación de datos (art. 50 lit. e) y fecha de vigencia de la política.
- Tratamiento tributario de la comisión (IVA, facturación electrónica, retenciones):
  fila 47.
- Quien entre con **Google** no pasa por la casilla ni por la fecha de nacimiento:
  hay que pedírselas en «Falta tu celular» (Google hoy no está configurado).
- Las cuentas creadas **antes** de la fila 11 (por ejemplo las que ya existan en
  `dev`) no tienen fecha de nacimiento ni aceptación registrada: decidir si se les
  piden al entrar. Las cuentas demo ya se crean con las dos.
- El reintegro del retracto en 15 días calendario y la reversión del pago están
  escritos, pero **no hay flujo en la app para ejecutarlos** con el proveedor de pagos.

## Producto y experiencia

- **Guardados (fila 41)**: el retirado se ve en «Ya no están» sin enlace (su ficha no es
  pública). Si suspenden al vendedor, sus artículos se retiran y pasa lo mismo.
- **Talla y edad (fila 38)**: todavía no son filtros de búsqueda; en la carga en lote
  son opcionales (columnas `talla` y `edad` sin agregar al CSV); las publicaciones
  anteriores no las tienen y se piden al editarlas.
- **Sin revisión humana de la electrónica (fila 40)**: un celular robado con IMEI
  válido se publica; depende de los reportes. Si algún día hay acceso a la base de
  IMEI reportados, se contrasta al publicar.
- **Videos con personas o datos (fila 36)**: nada los detecta; depende de reportes.
  Los videos grabados antes de la fila 36 conservan el sonido.

- **Fotos en el chat: en evaluación** (fila 21). Opciones en `docs/alcance/chat.md`.
- **Chat**: sin avisos por fuera de la app (correo/WhatsApp/push); nadie del equipo
  recibe aviso de un reporte urgente; no se puede deshacer un bloqueo; no hay plazo
  de respuesta a reportes (filas 20 y 22, `docs/alcance/chat.md`).

- **Una empresa no compra** (fila 17): si necesita comprar, tiene que abrir una cuenta
  personal con **otro celular** (el celular confirmado es único). Revisar cuando
  exista facturación (fila 47): ahí podría permitirse la compra con factura.
- Luna no llegó a publicar como empresa en el navegador (la cámara simulada no
  entregó video); la publicación y la carga en lote de empresa las cubre
  `e2e/store.spec.ts`.

- **NIT sin validar contra la DIAN**: lo confirma una persona viendo el RUT (fila 15).
  Falta decidir quién lo hace en producción y en qué plazo; hoy no hay aviso al
  equipo cuando llega una empresa nueva (solo la lista en `/admin`).
- La empresa que fue rechazada en la verificación del representante puede cambiar
  de tipo, pero **el RUT ya subido no se borra** si pasa a persona natural.

- En el pedido, **el vendedor no ve el celular de quien recibe** (se guarda, no se
  muestra). Visto por Luna en la fila 7.
- La grilla filtrada trae **60 artículos** y lo dice («Se muestran los 60 primeros»):
  la paginación es la fila 33.
- Artículo **retirado**: quien tenía un chat sobre él no puede ver su ficha (el chat
  lo dice). Decidir si debe poder verla.
- Filtro de precio: los rangos son generales; no cambian por categoría.

- Textos explicativos con molde «muy IA» (Nicolás prefirió tratarlos fila por fila,
  no en una pasada general). Además de los de las filas 35, 39 y 41: verificar el
  celular («Es lo que evita que alguien estafe…»), `/vender` sin verificar («Es lo que
  separa a 2venta de un grupo de compraventa cualquiera»), `/tienda` (dos frases),
  perfil del vendedor («…que es lo que garantiza que responde con su nombre»), calificar
  un pedido («Gracias: es lo que le permite al…»), `/publicar/[id]` («Solo falta el
  video. Es lo que le permite…») y la pista del alias en editar perfil. (Fila 14.)

## Técnico

- Escribir en el celular de `/registro` apenas carga la página (antes de que termine de
  cargar el JavaScript) puede perder lo escrito: dos pruebas lo mostraron y ahora
  esperan a la carga completa. En un celular lento le puede pasar a una persona.
  Investigar (fila 24).

- **Chat en vivo por CloudFront sin probar**: funciona en desarrollo y contra la
  imagen de producción; falta confirmarlo en `dev` tras desplegar (CloudFront y el
  balanceador con conexiones largas; latido cada 20 s). Prueba de humo pendiente.

- Después de pasar por el pago y cancelar, **el atrás del navegador** (no «Volver»)
  puede regresar al formulario de compra `/comprar/…`. Funciona, pero es una
  pantalla de paso. Se evitaría reemplazando esa entrada del historial al ir a
  pagar. Baja (Luna, fila 18).
- Filtros de búsqueda en escritorio dejan parámetros vacíos en la dirección
  (`min=`, `max=`); cosmético (Luna, fila 18).

- La prueba «el ticket promedio no se diluye con los pedidos reembolsados»
  (`e2e/reportes.spec.ts`) toma el último pedido de toda la base: si otra prueba crea
  un pedido en paralelo, falla. Sola pasa. Debería buscar el pedido que ella creó.

- **React 19 vacía un formulario después de cada envío por `action={...}`**: si la
  acción devuelve un error, lo escrito se pierde. Se corrigió en los formularios de
  vendedor (fila 15, `enviarSinBorrar` en `src/features/sellers/Forms.tsx`); hay otros
  22 archivos con `action={submit}` que revisar (reclamos, ofertas, preguntas,
  perfil…). (Fila 15.)
- El alias elegido a mano es único solo por una comprobación de la app (no hay índice
  único, a propósito, D-67): dos cambios simultáneos al mismo alias podrían quedar
  iguales. Riesgo bajo; se cierra con un índice parcial o un bloqueo si hace falta.
  (Fila 12.)
- La prueba «un pedido abandonado caduca solo» se pasa de 60 s en la suite completa
  (tres veces); sola pasa en 23 s y en el CI pasa. Revisar por qué se alarga.
- MinIO en local y CI usa `cgr.dev/chainguard/minio` (quay.io dejó de servir la
  imagen, 401). Si Chainguard cambia sus condiciones, habrá que moverla otra vez.
- Referencias visuales (`npm run test:visual`) desactualizadas desde la fila 1:
  borrar los `.png` y regenerar antes de confiar en ellas.
- ~~Supr delante de un espacio del celular no hacía nada~~ — arreglado en la fila 24
  (también en el precio).
- `e2e/catalog.spec.ts` y `e2e/buscar-filtros.spec.ts` todavía buscan lo sembrado en la
  portada o en la búsqueda sin palabra. Con 24 por página (fila 33) pueden fallar si
  corren tarde en la suite; hoy pasan. Si fallan, se hace lo mismo que en `search.spec`:
  buscar por palabra.
- **Credenciales de AWS del portátil vencidas** (2026-09-24): la prueba de humo contra
  la nube no pudo leer el código SMS de CloudWatch («security token … invalid»).
  Nicolás tiene que renovar el perfil `2venta`; después, correr la prueba de humo y
  confirmar el chat en vivo a través de CloudFront.
