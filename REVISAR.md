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

**4. Precio mínimo de publicación de $10.000** (D-29). Salió construyendo el pago:
el piso de comisión de $2.500 implica un mínimo que nadie había nombrado. Sin él,
un artículo de $3.000 pagaría 83% de comisión. En $10.000 el piso equivale al 25%,
que sigue siendo alto pero es defendible para el tramo más barato. Deja fuera el
accesorio muy barato, así que es una decisión de producto, no un detalle técnico.

## Cosas que hay que arreglar antes de lanzar

**El código de verificación se guarda en texto plano.** Escribí en la
especificación que la biblioteca lo hasheaba y resultó que no: su complemento de
celular no ofrece esa opción, aunque otros complementos suyos sí. Quien tenga
lectura de la base de datos puede tomar el control de una cuenta durante los cinco
minutos que el código vive. Está mitigado (vence rápido, cinco intentos, cinco
envíos por hora) pero no resuelto. Es la D-27 y es lo más serio de esta lista.

**No hay proveedor de SMS.** En desarrollo el código sale por consola y
`src/lib/sms.ts` se niega a operar en producción, así que no se puede desplegar por
accidente sin conectarlo.

**No hay transcodificación de video.** Se guarda lo que grabe cada navegador, y eso
no es lo mismo en Android que en iOS. Hay que convertir a un formato único.

**No hay migraciones.** El esquema se recrea entero al sembrar. Sirve mientras no
haya un usuario real; después no.

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
- `e2e/` — 62 pruebas de navegador, más 7 unitarias en `src/features/payments/money.test.ts`. Si quieres saber qué se comprobó de verdad, están ahí.

## Un problema de producto que salió construyendo

El límite de envío de códigos estaba por dirección IP, que es incorrecto para este
producto: detrás de una misma salida puede haber un edificio entero de usuarios
legítimos, y el sexto registro del día los bloquearía a todos. Pasó a contarse por
número de celular. No lo habíamos hablado y me pareció claro, pero es una decisión
de producto, no solo técnica.

## Agente de pruebas

`AGENTE-QA.md` tiene el prompt para Luna, un agente verificador independiente. Está
escrito para que trabaje sin sesgo: le digo cómo levantar el proyecto y qué probar,
pero le pido explícitamente que no lea las pruebas automáticas antes de hacer su
propia pasada, porque si las lee hereda los mismos puntos ciegos de quien las
escribió.

Las brechas ya conocidas están al final del documento, plegadas, para que las lea
después de su propio recorrido. Si las encuentra sola, sabemos que su método sirve.

## Lo que sigue

S-06, envío y guía. Es la última de la Fase 1 y la más fácil de las que quedan:
escribe la fecha de entrega que la liberación automática ya está esperando.

La Fase 1 ya está completa en lo esencial: **existe una transacción de punta a
punta.** Alguien publica con video, otro lo encuentra buscando, paga con el dinero
retenido, confirma y el pago se libera con la comisión descontada. Eso es lo que
convierte el proyecto de una idea en algo que se puede probar con personas.
