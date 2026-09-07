# Qué revisar

Escrito la noche del 6 al 7 de septiembre de 2026, después de trabajar de corrido.
Ordenado por lo que más cuesta cambiar después.

## Cómo lo pones a correr

```bash
cd ~/Downloads/2venta
npm run db:up && npx tsx db/seed.ts
npm run dev
```

Para correr todas las pruebas hay que parar antes el servidor de desarrollo:
Next se niega a levantar dos sobre el mismo directorio.

```bash
npm run verify
```

Cuenta de prueba: no hay. Crea una en `/bienvenida`, y cuando pida el código de
verificación, míralo en la consola del servidor (`[sms] código para …`). Para
verificar identidad, el proveedor de prueba tiene botones de aprobar y rechazar.

## Decisiones que tomé solo y conviene que confirmes

**1. La tercera categoría pasó de hogar a niños.** Los mockups dicen tecnología,
ropa y cosas de niños; la D-05 decía hogar. Resolví a favor de los mockups porque
son el artefacto más reciente y coinciden con la oportunidad que tu investigación
había detectado. Para que revertirlo no cueste una migración, las categorías ahora
viven en una tabla: cambiar el conjunto es editar filas en `db/seed.ts`.

**2. React web en cápsula nativa, no Expo.** Quedó como D-25. Te la recomendé y no
la confirmaste; la ejecuté para no bloquear. Revertirla ahora todavía es barato,
más adelante no.

**3. El vendedor dejó de ser una tabla aparte y pasó a ser un usuario**, siguiendo
la D-03 (una sola cuenta con dos modos). Me pareció la lectura correcta de esa
decisión, pero cambia el modelo de datos.

**5. El código de entrega se cifra en vez de hashearse** (D-31). Empecé
hasheándolo, que es más fuerte, y estaba mal: el comprador necesita volver a verlo
al llegar al encuentro y de un hash no se recupera nada. Lo descubrieron las
pruebas. Queda cifrado con un secreto del servidor, que conserva lo que importa:
quien tenga la base sin el secreto no puede liberar pagos ajenos.

**4. Precio mínimo de publicación de $10.000** (D-29). Salió construyendo el pago:
el piso de comisión de $2.500 implica un mínimo que nadie había nombrado. Sin él,
un artículo de $3.000 pagaría 83% de comisión. En $10.000 el piso equivale al 25%,
que sigue siendo alto pero es defendible para el tramo más barato. Deja fuera el
accesorio muy barato, así que es una decisión de producto, no un detalle técnico.

## Entrar con Google: falta que pegues las credenciales

El código está listo. Las credenciales salen de la consola de Google Cloud y solo
las puedes generar tú. Instrucciones paso a paso en `GOOGLE.md`.

El botón solo aparece cuando existen `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET`:
sin ellas el proveedor ni se registra, así que la app no se rompe por no tenerlas.

Un detalle que resolví y conviene que sepas: **entrar con Google no exime del
celular verificado.** Google entrega el correo, no el número, y la D-01 no admite
excepción. Sin ese paso cualquiera podría estafar y volver a entrar con otra cuenta
de Google en dos minutos.

## Cosas que hay que arreglar antes de lanzar

**El código de verificación en texto plano: RESUELTO.** Era lo más serio de esta
lista y venía desde S-01. Se dejó de usar el complemento de la biblioteca, que lo
guardaba en claro y no ofrecía alternativa, y ahora se cifra con un secreto del
servidor, igual que el código de entrega presencial. Quien tenga la base sin el
secreto no puede tomar el control de ninguna cuenta. Queda como D-39.

**No hay proveedor de SMS.** En desarrollo el código sale por consola y
`src/lib/sms.ts` se niega a operar en producción, así que no se puede desplegar por
accidente sin conectarlo.

**No hay transcodificación de video.** Se guarda lo que grabe cada navegador, y eso
no es lo mismo en Android que en iOS. Hay que convertir a un formato único.

**Migraciones: RESUELTO.** Ya hay migraciones numeradas en `db/migrations/`, con
registro de aplicadas y una transacción por migración. El procedimiento está en
`db/LEEME.md`.

## El límite del proveedor de prueba, dicho claro

Con el envío de mensajes y con la verificación de identidad, cambiar la
implementación de prueba por la real no altera nada más: el flujo del producto es
el mismo. **Con pagos no puedo prometer lo mismo.** Si R-02 resuelve que la
retención no se puede condicionar a la confirmación del comprador, cambia el flujo
y no solo la integración.

Lo que queda listo pase lo que pase: el modelo de datos, la máquina de estados, la
aritmética del dinero y el registro de auditoría. Lo que puede tener que rehacerse
es el momento exacto de la liberación. Está escrito como D-30.

## Lo que quedó demostrado

**R-01, el riesgo número uno, funciona.** Grabar con `getUserMedia` más
`MediaRecorder` consume el flujo en vivo de la cámara, así que la galería no es una
fuente posible por construcción. Hay una prueba automática con cámara simulada que
recorre grabar, publicar, servir el video y verlo en el feed. La decisión D-08 (web
y móvil con la misma base) se sostiene.

## Dónde mirar si quieres revisar código

- `slices/` — la especificación de cada rebanada, con su prueba de punta a punta y
  sus casos de fallo. Es el mejor resumen de qué hace cada cosa.
- `DECISIONS.md` — las 28 decisiones con su porqué y sus consecuencias.
- `src/lib/auth.ts` — configuración de autenticación, con los comentarios que
  explican por qué cada límite está donde está.
- `src/features/publish/VideoCapture.tsx` — la respuesta a R-01.
- `src/features/kyc/provider.ts` — la interfaz por donde entrará el proveedor real
  cuando R-02 tenga respuesta.
- `e2e/` — 177 pruebas de navegador, más 70 unitarias (dinero, filtro anti-desvío, códigos cifrados, IMEI, moderación, NIT y carga en lote). Si quieres saber qué se comprobó de verdad, están ahí.

## Un problema de producto que salió construyendo

El límite de envío de códigos estaba por dirección IP, que es incorrecto para este
producto: detrás de una misma salida puede haber un edificio entero de usuarios
legítimos, y el sexto registro del día los bloquearía a todos. Pasó a contarse por
número de celular. No lo habíamos hablado y me pareció claro, pero es una decisión
de producto, no solo técnica.

## Lo que reportó Luna en la primera ronda

Encontró dos cosas reales.

**El circuito de vendedor no comprobaba el celular confirmado.** Alguien podía
registrarse, saltarse el código por SMS, verificar identidad y publicar, que es
exactamente lo que la D-01 existe para impedir. Ya está cerrado, en las tres
pantallas y también dentro de la acción de servidor.

**El mensaje genérico al poner una contraseña corta.** Ese no lo pude reproducir en
el código actual, y la prueba que agregué para su caso exacto pasa. Pero sondeando
alrededor apareció la misma clase de defecto en dos variantes que sí existían: una
contraseña demasiado larga caía al mensaje genérico, y **una de ocho espacios se
aceptaba**, porque la biblioteca solo mide el largo. Las dos están arregladas.

El tercer hallazgo, el 404 en inglés, ya estaba resuelto: Luna probó un estado
anterior del proyecto. Le agregué al prompt que informe siempre en qué commit
trabajó, porque sin ese dato no hay forma de saberlo.

Vale la pena notar lo que esto dice del método: mis pruebas miraban el código de
estado y no el mensaje, y por eso no veían nada de esto. Es justo el punto ciego
que un verificador independiente existe para encontrar.

## Agente de pruebas

`AGENTE-QA.md` tiene el prompt para Luna, un agente verificador independiente. Está
escrito para que trabaje sin sesgo: le digo cómo levantar el proyecto y qué probar,
pero le pido explícitamente que no lea las pruebas automáticas antes de hacer su
propia pasada, porque si las lee hereda los mismos puntos ciegos de quien las
escribió.

Las brechas ya conocidas están al final del documento, plegadas, para que las lea
después de su propio recorrido. Si las encuentra sola, sabemos que su método sirve.

## Lo que sigue

**La Fase 1 está completa.** El circuito entero funciona: publicar con video,
encontrar buscando, poner dirección, pagar producto más envío, despachar con guía,
la transportadora reporta la entrega, y el pago se libera al confirmar o solo a los
siete días. Eso convierte el proyecto de una idea en algo que se puede probar con
personas.

Empieza la Fase 2, la que hace segura esa transacción. La primera es S-08, chat con
ofertas y filtro anti-desvío, porque la entrega presencial con código se coordina
dentro del chat.
