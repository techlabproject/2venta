# Qué revisar

Última actualización: 7 de septiembre de 2026, después de una sesión autónoma larga.

**221 pruebas de navegador y 70 unitarias, todas en verde.** 40 commits.

## Cómo lo pones a correr

```bash
cd ~/Downloads/2venta
npm run db:up && npx tsx db/seed.ts
npm run dev
```

Para correr las pruebas hay que parar antes el servidor de desarrollo:

```bash
npm run verify
```

No hay cuentas de prueba con contraseña. Crea una en `/bienvenida`; el código de
verificación sale en la consola del servidor (`[sms] código para …`). El proveedor
de identidad, el de pagos y el de envíos son de prueba y tienen botones para
simular aprobación y rechazo.

## Lo que pasó mientras no estabas

Terminé las tres fases del plan y después seguí con lo que faltaba, que salió de
comparar tus requisitos originales contra lo construido.

| | |
|---|---|
| Fase 1 | S-00 esqueleto · S-01 cuenta · S-02 KYC · S-03 publicar con video · S-04 buscar · S-05 pago retenido · S-06 envío |
| Fase 2 | S-08 chat · S-09 entrega presencial · S-10 IMEI y moderación · S-11 disputas · S-12 calificaciones |
| Fase 3 | S-13 tienda · S-14 destacados · S-15 alertas y métricas · S-16 favoritos |
| Después | S-17 código cifrado · migraciones · S-18 actividad · S-19 editar · S-20 recuperar contraseña · S-21 perfil y suspensión · S-22 carrito · S-23 fotos |

Más entrar con Google, y los hallazgos de Luna cerrados.

## Las tres cosas que más me importa que revises

**1. La brecha D-27 está cerrada.** Era lo más serio que arrastraba el proyecto
desde S-01: el código de verificación por SMS se guardaba en texto plano y quien
tuviera lectura de la base podía tomar el control de cualquier cuenta. Dejé de usar
el complemento de la biblioteca que lo guardaba así, y ahora se cifra con un secreto
del servidor. Es la D-39.

**2. Encontré huecos que no estaban en ninguna lista.** El más grande: **no había
forma de volver a un pedido ni a una conversación.** Se pagaba, se cerraba la
pestaña y no se encontraba nunca más. Ninguna prueba lo cubría porque todas navegan
con la dirección en la mano. Es la clase de cosa que nadie escribe en un requisito
porque está implícita en todos los demás.

**3. El carrito cumple lo que prometí dos veces.** El piso de comisión de $2.500
equivale a más del 8% en una camiseta de $30.000, y dije dos veces que la salida
era juntar varias prendas en un pedido. Ahora tres camisetas pagan una comisión de
$4.500 en vez de tres pisos de $2.500, y un envío en vez de tres.

## Decisiones que tomé solo y conviene que confirmes

Están todas en `DECISIONS.md` con su porqué. Las que más cambian el producto:

**La tercera categoría es niños, no hogar** (D-05b). Siguiendo los mockups.
Reversible: las categorías viven en una tabla.

**React web en cápsula nativa, no Expo** (D-25). Te lo recomendé, no lo
confirmaste, lo ejecuté para no bloquear.

**Precio mínimo de publicación $10.000** (D-29). Sale del piso de comisión; sin él
un artículo de $3.000 pagaría 83%.

**La electrónica queda en revisión humana antes de publicarse** (D-32). Sale de
R-03: no hay API pública de IMEI. Un vendedor de electrónica espera, y eso cuesta.

**El código de entrega se cifra en vez de hashearse** (D-31). Empecé hasheándolo,
que es más fuerte, y estaba mal: el comprador necesita volver a verlo al llegar al
encuentro.

**Recuperar contraseña va por celular, no por correo** (D-40). El celular está
verificado y el correo no.

**Las fotos sí se suben de galería, el video no** (D-44). El video prueba, las fotos
presentan.

**Suspender no borra y retirar tampoco** (D-42). Al otro lado de cada pedido hay
alguien que no hizo nada malo.

## Lo que falta, y ya casi nada es código nuestro

**Conectar los proveedores reales.** SMS, pagos, identidad y envíos son todos de
prueba, detrás de una interfaz. Los de pagos y envíos dependen de R-02 y R-04, que
siguen sin respuesta de un comercial.

**Pegar las credenciales de Google.** Instrucciones en `GOOGLE.md`.

**Desplegar.** Necesita tus cuentas de alojamiento y base de datos gestionada.

**Transcodificar el video.** Se guarda lo que grabe cada navegador, y eso no es lo
mismo en Android que en iOS.

**Un canal para las alertas.** Se generan y se guardan, pero nadie las recibe: hay
que entrar a verlas, y una alerta que hay que entrar a ver no sirve para lo que
existe.

De tus requisitos funcionales solo queda sin construir el RF-42, reportes de ventas
y comisiones, que estaba marcado de prioridad baja.

## Dónde mirar

- `NOTES.md` — el estado exacto y la lista completa de lo que quedó a medias.
- `slices/` — 23 especificaciones, cada una con su prueba de punta a punta y sus
  casos de fallo. Es el mejor resumen de qué hace cada cosa y por qué.
- `DECISIONS.md` — 44 decisiones con su porqué, qué se descartó y qué se vuelve más
  difícil por haberlas tomado.
- `db/LEEME.md` — cómo se cambia el esquema ahora que hay migraciones.
- `qa/` — el informe de Luna y mi respuesta.
- `e2e/` — 221 pruebas. Si quieres saber qué se comprobó de verdad, están ahí.

## Para la próxima ronda de Luna

El prompt de `AGENTE-QA.md` sigue vigente. Hay bastante superficie nueva desde su
última pasada: carrito, fotos, recuperación de contraseña, suspensión de cuentas,
edición de publicaciones y la pantalla de actividad. Y pídele que congele el árbol
antes de empezar: la mitad del ruido de su primer informe vino de que el código
cambiaba mientras probaba.
