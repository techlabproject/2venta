# Informe de segunda vuelta — fila 15 de Catalina

**Veredicto: PASA CON OBSERVACIONES** — los hallazgos 1 y 2 quedaron corregidos; las cabeceras de RUT son correctas y el formulario conserva los datos tras varios errores. La insignia en una tarjeta activa sigue sin poder verificarse porque no se creó una publicación activa.

## Hallazgos

No hay hallazgos nuevos. Las dos observaciones anteriores se revalidaron y quedan cerradas:

### 1. Hallazgo anterior: NIT repetido — cerrado

- **Severidad anterior:** media.
- **Ancho:** 390 px y 1280 px.
- **URL:** http://localhost:3100/vender?tipo=juridica.
- **Pasos exactos:** con una cuenta de empresa ya registrada con NIT 900123456, iniciar sesión como laura@2venta.demo; completar razón social «Otra Empresa 2 S.A.S.», NIT «900123456», representante, cédula, rut-prueba.pdf, dirección, teléfono y autorización; tocar «Empezar verificación». Repetir en 1280 px con el mismo formulario.
- **Esperado:** mensaje claro, formulario utilizable para corregir y, si nunca arrancó la verificación, que /vender vuelva a mostrar la elección.
- **Visto en 390:** aparece exactamente «Ese NIT ya está registrado en otra cuenta.»; permanecen razón social «Otra Empresa 2 S.A.S.», NIT «900123456», dirección «Calle 80 # 20-15», teléfono «300 555 0101», autorización marcada y archivo «rut-prueba.pdf».
- **Visto en 1280:** aparece el mismo mensaje exacto y permanecen los mismos valores y archivo.
- **Visto al volver a http://localhost:3100/vender:** reaparecen los dos enlaces de elección, «Como persona» y «Como empresa (persona jurídica)». No quedó guardado un vendedor ni arrancó KYC.
- **Capturas:** [390](./capturas/v2-nit-repetido-390.png), [1280](./capturas/v2-nit-repetido-1280.png), [elección restaurada](./capturas/v2-nit-repetido-vuelve-eleccion-390.png).

### 2. Hallazgo anterior: autorización sin mensaje propio — cerrado

- **Severidad anterior:** baja.
- **Ancho:** 390 px y 1280 px.
- **URL:** http://localhost:3100/vender?tipo=juridica.
- **Pasos exactos:** completar razón social «Errores Persistentes S.A.S.», NIT «900654321», representante, cédula, rut-prueba.pdf, dirección «Carrera 7 # 72-10, oficina 401» y teléfono «300 412 8805»; dejar sin marcar la autorización; tocar «Empezar verificación». Repetir en 1280 px.
- **Esperado:** mensaje textual de 2venta que explique qué falta, sin borrar el formulario.
- **Visto en ambos anchos:** aparece en un alerta el texto exacto «Para verificar la identidad necesitamos la autorización para la foto del rostro.» La URL no cambia; la casilla queda desmarcada; razón social, NIT, dirección, teléfono y «rut-prueba.pdf» permanecen.
- **Capturas:** [390](./capturas/v2-sin-autorizacion-390.png), [1280](./capturas/v2-sin-autorizacion-1280.png).

## Lo que verificaste y pasa

- **Conservación tras varios errores seguidos, 390 px:** en el mismo formulario se provocaron, en orden, error de dirección, teléfono, RUT no PDF, razón social con teléfono y autorización faltante. Después de cada envío permanecieron los demás valores. El archivo fue «rut-prueba.pdf», cambió deliberadamente a «falso.pdf» para probar ese caso y volvió a «rut-prueba.pdf»; no fue borrado por un error. Mensajes vistos:
  - «Escribe la dirección completa, con calle y número (Calle 72 # 10-34).»
  - «El teléfono de contacto debe ser un celular (300 412 8805) o un fijo con indicativo (601 234 5678).»
  - «El RUT tiene que ser un PDF.»
  - «La razón social no puede llevar números de teléfono, correos ni enlaces. Los contactos van por el chat de 2venta, que es lo que protege el pago.»
  - «Para verificar la identidad necesitamos la autorización para la foto del rostro.»
  - Capturas: [dirección](./capturas/v2-error-1-direccion-390.png), [RUT](./capturas/v2-error-3-rut-390.png), [autorización](./capturas/v2-sin-autorizacion-390.png).
- **Rechazo de verificación, 390 px:** en /dev/kyc/ref_02b0915a-2eda-4c9f-a735-06ed5689b37c?u=BlbH712GFx2wgO02NnMJfLvZoJhj8ARr se tocó «Simular rechazo». /vender mostró exactamente «No pudimos verificarte» y «La foto de la cédula salió borrosa.», además de «Volver a intentar» y «Cambiar mis datos de vendedor». El enlace llevó a /vender?tipo=natural; allí permanecieron el aviso de rechazo y el formulario. La dirección quedó vacía, el teléfono inicial fue «3115551102» y la autorización quedó desmarcada. Capturas: [rechazo](./capturas/v2-rechazo-estado-390.png), [cambiar datos](./capturas/v2-rechazo-cambiar-datos-390.png).
- **RUT:** para http://localhost:3100/admin/rut/RBxeHLMOuiaKFO2ErMoYvK8ljqasycGb, la respuesta observada fue status 200 con Content-Type: application/pdf, Content-Disposition: inline; filename=rut.pdf y Cache-Control: private, no-store. El Chromium sin visor PDF descargó el archivo; no se reporta como defecto. [Captura](./capturas/v2-ver-rut-headers-admin-390.png).
- **Doble punto:** en /vender se vio «Estamos revisando el RUT de Cambalache Dos S.A.S. Cuando confirmemos el NIT se activan la insignia de empresa y la carga en lote.» No apareció «S.A.S..». [Captura](./capturas/v2-doble-punto-corregido-1280.png).
- **Formulario largo:** se dejó como está. En 390 px sigue siendo largo, pero los campos de empresa son los datos exigidos por la ley, las ayudas son legibles y los errores ya no obligan a repetirlos.

## Observaciones fuera de alcance

- En /admin también aparecieron empresas demo preexistentes; no se evaluaron sus datos, solo la empresa creada para esta vuelta.

## NO VERIFICADO

- **Insignia en una tarjeta de artículo activa:** no se creó una publicación activa; por tanto no se pudo inspeccionar una tarjeta propia en el catálogo.
- El rechazo se probó en 390 px; no se repitió ese recorrido completo en 1280 px.
