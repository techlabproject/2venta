# El chat de 2venta: cómo funciona y qué cubre

Correcciones 19 a 22 de Catalina (2026-09-24). La 20 pedía «documentar, definir el
alcance y la arquitectura del manejo de mensajes»: esto es ese documento. Las
decisiones son de Nicolás; las razones de fondo están en `DECISIONS.md` (D-21, D-22,
D-90, D-91, D-92, D-114).

## Para qué existe

Para que comprador y vendedor resuelvan dudas y negocien **sin salir de 2venta**. Si
la conversación se va a WhatsApp, el pago también se va, y con él la protección del
pago (lo que 2venta vende). Por eso el chat bloquea teléfonos, correos y enlaces.

| Qué | Dónde | Quién lo ve |
|---|---|---|
| **Preguntas públicas** | En la ficha del artículo | Todos. Una respuesta le ahorra la misma duda al siguiente comprador |
| **Chat privado** | `/chat/<id>`, bandeja en `/chats` | Solo las dos partes (y el equipo, solo si alguien la reporta) |
| **Oferta formal** | Dentro del chat, con su propio panel | Las dos partes. Vence en 24 horas; aceptada, el comprador paga ese precio |

## Qué pasa cuando alguien envía un mensaje

1. **Quien escribe** toca «Enviar». El servidor comprueba que tenga el celular
   confirmado (D-01), que sea una de las dos partes y que su cuenta no esté
   suspendida.
2. **El filtro anti-desvío** (D-22) tacha números de teléfono (también escritos con
   letras), correos, enlaces y billeteras. Se guarda **solo el texto ya tachado**:
   el original no queda en ningún lado.
3. **Se guarda** en la base de datos (tabla `messages`), con la hora.
4. **Se avisa en vivo** (corrección 20): la base avisa «esta conversación cambió» y,
   si la otra persona tiene el chat abierto, su pantalla se actualiza sola en un
   instante, sin perder lo que estaba escribiendo. El aviso no lleva el texto: la
   pantalla lo vuelve a pedir y ahí se comprueba otra vez quién puede verlo.
5. **Se avisa por fuera del chat**: aparece en «Avisos» (agrupados por minuto, para
   no llenar la lista) y en el contador de conversaciones sin leer.

Lo que **no** hay hoy: aviso por correo, por WhatsApp ni notificación del teléfono.
Quien no tiene 2venta abierto se entera al entrar. Ver «Lo que falta».

### Arquitectura del «en vivo»

```
Navegador A ──Enviar──▶ Servidor web ──guarda──▶ Postgres
                                                   │ disparador: pg_notify('chat', id)
                                                   ▼
Navegador B ◀──evento «cambio»── Servidor web (escucha el canal `chat`)
     │
     └── vuelve a pedir la conversación (con sus controles de acceso de siempre)
```

- **Eventos del servidor (SSE)**, no WebSockets: solo hace falta empujar del servidor
  al navegador, porque enviar ya usa las acciones de siempre. Es una ruta normal de
  Next (`/api/chat/<id>/eventos`) que solo pueden abrir las dos partes.
- **Postgres reparte el aviso** (`LISTEN/NOTIFY`, migración 0018) entre todos los
  servidores web que haya detrás del balanceador. No hace falta ninguna pieza nueva
  en AWS: CloudFront y el balanceador ya dejan pasar conexiones largas.
- Cada 20 s el servidor manda un latido para que el balanceador no corte la
  conexión. Si se corta (un despliegue, el celular que cambia de red), el navegador
  se reconecta solo a los 3 s y, al volver a la pestaña, pide la conversación una
  vez por si algo llegó mientras tanto.
- Código: `src/lib/tiempo-real.ts`, `src/app/api/chat/[id]/eventos/route.ts`,
  `src/features/chat/ChatEnVivo.tsx`.

## Fotos en el chat (corrección 21)

Hoy **solo quien vende** puede adjuntar una foto por mensaje (D-92), pensado para
contestar «¿tienes más fotos?». Catalina propuso quitarlo porque es difícil de
controlar: una imagen se salta el filtro de texto (puede llevar un teléfono o algo
que nadie pidió).

**Decisión de Nicolás: se deja como está y se evalúa más adelante.** Lo que hay para
contenerlo mientras tanto: el comprador no puede adjuntar, las fotos pasan por la
misma comprobación de archivo que las de las publicaciones, y la conversación se
puede reportar (con el bloqueo de abajo). Opciones cuando se revise: quitarlo;
dejarlo con revisión automática de imágenes (texto dentro de la imagen, desnudos),
que tiene costo por imagen; o limitarlo a fotos tomadas con la cámara en el momento.

## Reportar una conversación (corrección 22)

1. Cualquiera de las dos partes toca «Reportar esta conversación», elige el motivo
   (insultos o amenazas, contenido sexual, intento de estafa, pide datos o pagos por
   fuera, otra cosa) y puede contar qué pasó.
2. **La otra persona no se entera** (D-92). Quien está pasando un mal rato es quien
   menos puede permitirse el miedo a una represalia.
3. **Bloqueo silencioso** (decisión de Nicolás): desde ese momento, a quien reportó
   no le llegan los mensajes ni las ofertas de la otra persona en esa conversación:
   ni en el chat, ni en la bandeja, ni en «Avisos». La otra persona puede seguir
   escribiendo sin notar nada; lo que mande queda guardado para el equipo.
4. **Llega a la cola** `/admin/conversaciones`, **ordenada por gravedad**: primero
   estafa, amenazas y contenido sexual (marcados «Urgente»), después pedir datos o
   pagos por fuera, al final «otra cosa»; y dentro de cada grupo, primero la cuenta
   que más personas distintas han reportado.
5. **Quien modera** puede leer esa conversación completa (solo esa, solo mientras el
   reporte esté abierto, y sin poder escribir en ella) y decidir en
   `/admin/usuarios` si suspende la cuenta. Suspender no borra nada: las víctimas
   necesitan la evidencia.

**No hay sanciones automáticas.** Suspender sola una cuenta al llegar a N reportes
se descartó: se podría usar para atacar a alguien con varias cuentas. El orden de la
cola dice qué mirar primero; la decisión la toma una persona.

## Lo que falta o queda por decidir

- **Avisos por fuera de la app** (correo, WhatsApp, notificación del teléfono) para
  quien no tiene 2venta abierto. Depende de proveedor (el de SMS de la fila 9 puede
  cubrir WhatsApp) y del costo por mensaje.
- **Nadie del equipo recibe un aviso** cuando llega un reporte urgente; hay que
  entrar a `/admin`. Con volumen real hace falta (correo al equipo, por ejemplo).
- **Plazo de respuesta** a un reporte y quién modera en producción.
- **Deshacer un bloqueo**: hoy el reporte es para siempre en esa conversación.
- **«Está escribiendo…» y «visto»**: no existen. Si se quieren, ahí sí conviene pasar
  a WebSockets.
- **Fotos en el chat**: evaluar (arriba).
- Conservación: los mensajes se guardan mientras exista la cuenta; falta fijar el
  plazo en la política de datos (fila 11).
