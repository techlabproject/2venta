# Correcciones de Catalina: cierre

Documento simple para Nicolás y Catalina: qué cambió, qué falta y qué puede ser un
problema después. El detalle de cada fila está en [2026-09-22.md](2026-09-22.md); la
lista viva de pendientes, en [pendientes.md](pendientes.md). Última actualización:
2026-09-25.

## En números

| Estado | Filas |
|---|---|
| Hechas y desplegadas en `dev` | 1–20, 22–32 y 50 (32 filas) |
| Hechas, esperan aprobación para desplegar | 33–41 (9 filas) |
| Propuesta escrita, falta la decisión de Nicolás | 42–49, 51 y 52 (10 filas) |
| En evaluación | 21 (fotos en el chat: se quedan por ahora) |

Cada fila hecha tiene prueba automática y el informe de Luna en `fila-NN/`.

## Qué cambió

**Registro y entrada (6–13, 50).** Correo, celular y código validados al salir del
campo y en el servidor; +57 fijo; el código se puede pegar con el SMS entero. Términos
y política de datos (borrador v1) en un panel que se acepta al final, con versión y
fecha guardadas; mayores de 18; autorización de biométricos. Errores que dicen qué
pasó. Sin @usuario: la llave es un UUID y el celular confirmado es único. Los códigos
duran 10 minutos y salen por WhatsApp Cloud (construido, sin encender) o SMS de Twilio
(cuenta de prueba, con Twilio Verify).

**Búsqueda y portada (1–5, 33).** Las etiquetas filtran en su sitio; los resultados van
primero y los filtros en una columna o un panel lateral; precio con rangos rápidos y
solo dígitos; «sin resultados» cálido y con salidas; 24 artículos por página con «Ver
más» (sirve sin JavaScript), hasta 3 destacados arriba.

**Vender (14–17, 35–40).** Persona natural o jurídica al empezar a vender; la empresa
sube el RUT y el equipo confirma el NIT; lote solo para empresas confirmadas; la
empresa no compra. Tarjeta «Antes de grabar»; video sin sonido; «Artículos para
niños»; talla en ropa y edad en niños (obligatorias); sin revisión humana de
electrónica; IMEI solo para celulares (también si parece un celular).

**Chat y pedidos (18–20, 22, 23).** Cada lado ve su mensaje; mensajes y ofertas en
vivo; reportar bloquea en silencio y va a una cola por gravedad; «Volver» en todo.

**Tus publicaciones (24–32, 34).** Precio con formato COP; «vendido» a mano ya no
existe; retirar confirma y lo retirado se republica; visitas en rangos; 3 chats
recientes con vista previa; 24 por página.

**Guardados y Avisos (41).** Cada pantalla explica qué es y enlaza a la otra.

## Qué falta decidir (propuestas en `docs/alcance/`)

| Filas | Tema | Recomendación | Documento |
|---|---|---|---|
| 42 | Sesiones activas | Ya existen; mejoras opcionales | `sesiones.md` |
| 43, 44, 45, 51 | Zona, ciudad y alcance | Localidades de Bogotá ya; ciudades al abrir fuera de Bogotá | `ubicacion.md` |
| 46 | Encuentro seguro | Lista de lugares públicos por localidad + consejos | `encuentro-seguro.md` |
| 47 | Impuestos y envío | Preguntas al contador; envío en rango; cotizar transportadoras | `impuestos-y-envio.md` |
| 48, 52 | Administración | Cuentas de equipo separadas; panel de categorías y zonas primero | `administracion.md` |
| 49 | Identidad | Didit para arrancar; cotizar Truora y Verifik | `proveedores-identidad.md` |

## Qué falta para producción

- **SMS:** pasar Twilio a pago (~US$0,05 por SMS) o contratar un agregador local; hoy
  solo llega a números verificados en la consola.
- **WhatsApp:** verificación del negocio en Meta para crear la plantilla del código;
  rotar el token y el secreto de la app; cargar los secretos y registrar el webhook.
- **Pagos reales, identidad y transportadora:** proveedores por contratar y conectar.
- **Legal:** aval del abogado a los términos y datos de la empresa.
- **Tributario:** contador (fila 47).
- **AWS:** salir del plan gratuito y aplicar `prod`; renovar las credenciales del
  perfil `2venta` en el portátil.

## Riesgos

Ver `pendientes.md` para la lista completa. Los principales: celulares robados con
IMEI válido y videos con datos personales dependen de reportes; el chat solo avisa
dentro de la app; formularios que se vacían tras un error (22 archivos por revisar);
chat en vivo a través de CloudFront sin confirmar; cuentas anteriores a los términos
sin fecha de nacimiento ni aceptación.
