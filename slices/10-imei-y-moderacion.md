# Rebanada S-10 — IMEI y moderación

## Qué hace

Publicar en electrónica exige el IMEI, que se valida con su dígito verificador y no
se puede repetir. Toda publicación pasa por un filtro de contenido prohibido. La
electrónica queda en revisión humana antes de estar visible. Cualquiera con cuenta
puede reportar una publicación, y los reportes llegan a una cola de moderación.

## Por qué va en este momento

Es la D-15 y la D-16, y es lo que hace que el distintivo de verificado signifique
algo más que "este señor mostró su cédula": que lo que vende tampoco sea robado.

## Lo que R-03 dejó decidido

No hay API pública para contrastar el IMEI contra la base de equipos reportados. La
consecuencia es el modelo híbrido:

- **Ropa y niños** salen directo al catálogo.
- **Electrónica** queda en revisión hasta que una persona la mira.

Pedir el IMEI igual sirve por dos razones, aunque hoy no se pueda contrastar
automáticamente. Se guarda desde ya, así que cuando haya convenio se puede
contrastar todo el histórico sin volver a molestar a ningún vendedor. Y pedirlo
ahuyenta a una parte de quien vende robado, que es un efecto real aunque no se
pueda medir.

Cuando el contraste sea automático, lo único que cambia es la función
`initialStatus`.

## El dígito verificador

El IMEI trae dígito verificador calculado con Luhn, así que un número inventado se
detecta sin consultar nada externo. Eso no prueba que el equipo no sea robado, pero
filtra de entrada al que escribe cualquier cosa por salir del paso, que es la
mayoría de los casos.

## El costo de moderar de más

El filtro de contenido tiene el mismo problema que el anti-desvío: rechazar una
publicación legítima pierde un vendedor. Por eso la lista es corta y específica en
vez de amplia y difusa. Un ejemplo concreto que salió construyendo: la palabra
"perico" estaba en la lista de sustancias, y en Colombia son huevos revueltos y
también un loro. Se quitó. Detectar droga por jerga es una carrera que no se gana;
ese trabajo le toca a la cola de reportes.

## Archivos que toca

- `src/features/moderation/imei.ts` — validación, con pruebas unitarias
- `src/features/moderation/rules.ts` — contenido prohibido y estado inicial
- `src/features/moderation/` — reportar y revisar
- `src/app/admin/page.tsx` — la cola
- `db/schema.sql` — `imei`, estados nuevos, tabla `reports`, rol de administrador
- `e2e/moderation.spec.ts`

## Explícitamente fuera

- Contraste automático contra la base de equipos reportados. Bloqueado por R-03.
- El panel de administración completo del mockup: verificaciones de identidad,
  disputas, usuarios, métricas. Aquí solo está la cola de revisión y reportes.
- Suspender cuentas (RF-41).
- Avisarle al vendedor por notificación cuando su publicación se aprueba o se
  rechaza. Hoy lo ve al entrar.
- Moderación del video. Nadie lo mira automáticamente.

## Prueba de punta a punta

1. Publicar electrónica exige el IMEI; ropa no lo pide.
2. Un IMEI con el dígito verificador equivocado se rechaza.
3. La electrónica queda en revisión y no aparece en el catálogo ni en la búsqueda.
4. Ropa y niños salen directo.
5. Un administrador aprueba y la publicación aparece.
6. Un reporte llega a la cola.

## Casos de fallo con prueba

- El mismo IMEI publicado dos veces se rechaza.
- La moderación automática rechaza armas, sustancias, imitaciones, documentos
  falsos, animales, medicamentos y lo que se declare robado, mirando título y
  descripción.
- No rechaza publicaciones legítimas que se le parecen: armario, mueble armado,
  huevos pericos, camiseta Nike original, licencia vencida de decoración.
- Quien no es administrador recibe 404 en el panel, sin pista de que exista.
- Quien no es administrador no puede aprobar llamando la acción directamente.
- El vendedor no puede reportar su propia publicación.
- Sin sesión no se puede reportar.
- La misma persona no puede reportar dos veces la misma publicación.

## Depende de

S-09.
