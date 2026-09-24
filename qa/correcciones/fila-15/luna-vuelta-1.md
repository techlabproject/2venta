# Informe de prueba — fila 15 de Catalina

**Veredicto: PASA CON OBSERVACIONES** — la separación persona/empresa, la verificación simulada, la revisión administrativa, la privacidad del RUT y la carga en lote funcionan; queda un bloqueo al recuperarse de un NIT repetido y tres observaciones menores de UX.

## Hallazgos

### 1. Severidad: media — un NIT repetido deja el alta de vendedor en un estado sin salida

- **Ancho:** 390 px.
- **URL:** http://localhost:3100/vender?tipo=juridica; después de recargar, http://localhost:3100/vender.
- **Pasos exactos:** iniciar sesión como laura@2venta.demo; elegir empresa; completar razón social "Otra Empresa Luna S.A.S.", NIT "900123456", representante, cédula, rut-prueba.pdf, dirección, teléfono y autorización; tocar «Empezar verificación»; después abrir /vender de nuevo.
- **Esperado:** el mensaje debe decir qué hacer y la persona debe poder corregir el NIT o volver a elegir el tipo de vendedor.
- **Visto:** en el primer envío aparece exactamente «Ese NIT ya está registrado en otra cuenta.» en la URL de empresa. Al volver a /vender, desaparecen el selector de tipo y los campos de empresa: solo se ve «1. Foto de tu cédula por ambos lados, sin reflejos.», «2. Una selfie para confirmar que eres tú.», «3. Listo. Nosotros no guardamos ni la cédula ni la selfie.», la autorización biométrica y «Empezar verificación». No hay enlace «Cambiar», selector ni campo «Razón social».
- **Capturas:** [error del NIT repetido](./capturas/validacion-nit-repetido-390.png), [estado sin salida tras volver](./capturas/nit-repetido-estado-persistido-390.png).

### 2. Severidad: baja — sin autorización, el bloqueo depende del mensaje nativo del navegador

- **Ancho:** 390 px.
- **URL:** http://localhost:3100/vender?tipo=juridica.
- **Pasos exactos:** completar todos los campos válidos y adjuntar rut-prueba.pdf; dejar sin marcar la casilla; tocar «Empezar verificación».
- **Esperado:** un mensaje textual de 2venta que indique que hay que marcar la autorización.
- **Visto:** la URL no cambia, el foco queda en el input de tipo checkbox con checked: false, y no aparece un role="alert" ni otro mensaje nuevo de la aplicación. Sí queda visible el texto exacto de la casilla: «Autorizo que el proveedor de verificación trate la foto de mi rostro para confirmar que soy quien dice mi cédula. Es un dato biométrico, y por eso sensible: darlo es voluntario, pero sin él no puedo vender en 2venta. Ver la política de datos.» El navegador sí impide enviar el formulario.
- **Captura:** [validación sin autorización](./capturas/validacion-sin-autorizacion-390.png).

### 3. Severidad: baja — «Ver RUT» entrega un PDF descargable, no una pestaña renderizada

- **Ancho:** 390 px.
- **URLs:** http://localhost:3100/admin y http://localhost:3100/admin/rut/7ynEfuXcOWH6ChIxLxYU5VJWqOXxlIK8.
- **Pasos exactos:** iniciar sesión como admin@2venta.demo; abrir /admin; tocar «Ver RUT».
- **Esperado:** que el enlace que dice «Ver RUT» abra el PDF en la pestaña nueva indicada por la interfaz.
- **Visto:** Chromium emitió una descarga con nombre sugerido rut.pdf. El archivo descargado empieza por %PDF-1.4 y se guardó como [evidencia PDF](./capturas/rut-verificado-admin.pdf); no apareció una vista PDF renderizada en una pestaña.
- **Captura:** [cola administrativa con «Ver RUT»](./capturas/admin-empresas-390.png).

### 4. Severidad: baja — el formulario de empresa es largo en móvil, aunque sigue siendo legible

- **Ancho:** 390 px.
- **URL:** http://localhost:3100/vender?tipo=juridica.
- **Pasos exactos:** iniciar sesión con una cuenta nueva; elegir «Como empresa (persona jurídica)»; completar el formulario válido.
- **Esperado:** que la diferencia y los campos especiales se entiendan sin que la longitud vuelva pesada la tarea.
- **Visto:** la captura completa mide 390 × 1486 px frente a un viewport de 390 × 844 px: exige unos 642 px de desplazamiento vertical. Los campos y sus ayudas no se solapan. Se entienden la razón social, NIT, representante, RUT, dirección, teléfono y autorización; el texto explica que dirección y teléfono «No se muestran en tu perfil» y que el RUT «no se publica».
- **Captura:** [formulario de empresa completo en 390](./capturas/empresa-formulario-completo-390.png).

## Lo que verificaste y pasa

- **Registro:** en /registro?rol=vendedor y /registro?rol=comprador no aparece elección de persona/empresa. El texto exacto es «Con tu correo y tu celular empiezas a explorar. Si vas a vender, el siguiente paso es verificar tu identidad.» La elección aparece después, en /vender.
- **Elección y comprensión:** en 390 y 1280 se ven «¿Cómo vas a vender?», «Como persona» — «Vendes cosas tuyas. Verificas tu identidad con tu cédula.» — y «Como empresa (persona jurídica)» — «Tienda, cambalache o negocio con NIT. Puedes cargar varios artículos de una vez.»
- **Persona natural:** recorrido completo en 390 y 1280 desde /vender?tipo=natural, con dirección, teléfono, autorización y «Empezar verificación». /dev/kyc/ref_2411b7d3-5306-4054-95fb-375ecd6f6241?u=p270N2s6YYPuEjQ88gtKSssm9SrTP0QI mostró «Simular aprobación»; después /vender mostró «Tu espacio de vendedor» e «Identidad verificada». /tienda terminó en /vender y no mostró carga en lote. Capturas: [390](./capturas/persona-formulario-390.png), [1280](./capturas/persona-formulario-1280.png), [aprobada](./capturas/persona-aprobada-1280.png).
- **Persona jurídica:** recorrido completo en 390 y 1280 desde /vender?tipo=juridica, con RUT, autorización, /dev/kyc y «Simular aprobación». Antes de confirmar se vio exactamente: «Estamos revisando el RUT de Cambalache Luna S.A.S.. Cuando confirmemos el NIT se activan la insignia de empresa y la carga en lote.» /tienda volvió a /vender mientras el NIT estaba pendiente. Capturas: [formulario 1280](./capturas/empresa-formulario-completo-1280.png), [KYC 1280](./capturas/empresa-kyc-1280.png), [pendiente](./capturas/empresa-pendiente-admin-1280.png).
- **Atrás, cambiar y recargar:** en una cuenta nueva, «Cambiar» volvió de /vender?tipo=juridica a /vender; el botón atrás volvió al selector; al recargar /vender?tipo=natural se perdió una dirección no guardada, pero se conservó el teléfono inicial de la cuenta (3115550300). No quedó una pantalla rota.
- **Validaciones en 390:**
  - Dirección corta o sin número → «Escribe la dirección completa, con calle y número (Calle 72 # 10-34).» [captura](./capturas/validacion-direccion-corta-390.png).
  - Teléfono raro → «El teléfono de contacto debe ser un celular (300 412 8805) o un fijo con indicativo (601 234 5678).» [captura](./capturas/validacion-telefono-raro-390.png).
  - NIT inválido → «Ese NIT no es válido. Revisa el número y el dígito de verificación.» [captura](./capturas/validacion-nit-invalido-390.png).
  - Archivo falso.pdf → «El RUT tiene que ser un PDF.» [captura](./capturas/validacion-rut-no-pdf-390.png).
  - Archivo de 2.0 MB + 1 byte → «El RUT pesa demasiado. El máximo son 2 MB.» [captura](./capturas/validacion-rut-grande-390.png).
  - Razón social con teléfono → «La razón social no puede llevar números de teléfono, correos ni enlaces. Los contactos van por el chat de 2venta, que es lo que protege el pago.» [captura](./capturas/validacion-razon-con-telefono-390.png).
- **Admin y confirmación:** en /admin se vio «Empresas por confirmar», el nombre, NIT y representante, «Ver RUT» y «Confirmar NIT». Tras confirmar, la empresa mostró en /vender «Vendes como Cambalache Luna S.A.S.. Cargar varios artículos de una vez.» En /tienda se vio «Cambalache Luna S.A.S.», «NIT 900123456-8» y «Cargar varios artículos». La carga de lote-prueba.csv creó exactamente «Se creó 1 borrador. Ahora hay que grabarles el video.» y «1 borrador sin video». Capturas: [admin](./capturas/admin-empresas-390.png), [tienda confirmada](./capturas/empresa-tienda-confirmada-390.png), [carga](./capturas/empresa-carga-lote-390.png).
- **Insignia en perfil:** antes de confirmar, /vendedor/7ynEfuXcOWH6ChIxLxYU5VJWqOXxlIK8 mostró Luna E. e «Identidad verificada», sin «Tienda registrada». Después mostró «Cambalache Luna S.A.S.», «Tienda registrada» e «Identidad verificada». Capturas: [antes](./capturas/empresa-perfil-sin-confirmar-390.png), [después](./capturas/empresa-perfil-confirmada-390.png).
- **Seguridad del RUT:** /admin/rut/7ynEfuXcOWH6ChIxLxYU5VJWqOXxlIK8 devolvió 404 y «No encontrado» sin sesión, con Laura y con la propia empresa. No apareció el PDF ni un enlace al PDF en /vender, /tienda ni en el perfil público; fuera de admin solo se mostró el aviso textual de que el RUT está en revisión.
- **Vendedores anteriores:** Camila y Andrés vieron «Completa tus datos de vendedor», con el texto exacto «La ley pide que tengamos una dirección y un teléfono de quien vende, por si un comprador presenta una queja. No se muestran a nadie.» Guardaron dirección y teléfono; después /publicar siguió accesible y mostró «Publicar artículo». Capturas: [Camila](./capturas/camila-completa-datos-inicial-390.png), [Andrés](./capturas/andres-completa-datos-inicial-390.png).

## Observaciones fuera de alcance

- En el modal de términos de /registro aparecieron marcadores legales «[razón social — POR COMPLETAR]» y «[correo — POR COMPLETAR]»; no se evaluó en esta fila.
- En /admin apareció la publicación «Reloj 1790276261215» con «1 reporte: robado»; no se evaluó en esta fila.

## NO VERIFICADO

- **Insignia en una tarjeta de artículo activa:** la empresa sí creó un borrador desde /tienda, pero no se publicó porque exige grabar el video desde la cámara; por eso no hubo una tarjeta activa propia que inspeccionar en el catálogo.
- No se probó una cámara física ni un proveedor KYC real; la aprobación se ejecutó únicamente con /dev/kyc y «Simular aprobación», como estaba indicado.
