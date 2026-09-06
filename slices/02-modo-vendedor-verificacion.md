# Rebanada S-02 — Modo vendedor y verificación de identidad

**Zona sensible.** Toca identidad, documentos oficiales y datos biométricos.

## Qué hace

Una cuenta ya creada activa el modo vendedor y pasa por la verificación de
identidad. La verificación la hace un proveedor externo: 2venta nunca guarda la
cédula ni la selfie, solo el estado que el proveedor reporta y su identificador de
referencia. Cuando el estado queda aprobado, el perfil y las publicaciones muestran
el distintivo "Identidad verificada", y el perfil público del vendedor se puede ver.

## Por qué va en este momento

Es la D-02, que es más estricta que los requisitos originales: el vendedor verifica
antes de publicar, no antes de cobrar. Publicar (S-03) depende de esto, así que va
antes. Y es lo que hace verdadero el distintivo que los mockups muestran en todo el
feed: hasta ahora no se pintó porque no había dato real detrás.

## Archivos que toca

- `db/schema.sql` — tabla `kyc_verifications`; `listings.seller_id` pasa a apuntar
  a `user` en vez de a la tabla `sellers`, que desaparece
- `src/features/kyc/` — proveedor, estados y pantallas
- `src/app/(cuenta)/vender/` — activar modo vendedor y estado de la verificación
- `src/app/api/kyc/webhook/route.ts` — recibe el resultado del proveedor
- `src/app/vendedor/[id]/page.tsx` — perfil público
- `src/features/catalog/` — el distintivo, ahora que el dato existe
- `e2e/kyc.spec.ts`

## Explícitamente fuera

- El proveedor real. R-02 sigue sin respuesta, así que se integra contra una
  interfaz propia con una implementación de prueba que se comporta igual: pide
  verificación, devuelve referencia, avisa por webhook. Cambiar de proveedor es
  escribir otra implementación de esa interfaz.
- Comparar la selfie al momento de retirar plata. Necesita el proveedor real.
- El panel de administración para consultar verificaciones. Es S-10.

## Prueba de punta a punta

`npm run verify`. Comprueba:

1. Una cuenta nueva activa el modo vendedor, arranca la verificación y queda en
   estado pendiente, con una pantalla que dice qué está pasando.
2. El webhook del proveedor aprueba, y el perfil muestra "Identidad verificada".
3. El distintivo aparece en la ficha del producto de ese vendedor.
4. El perfil público muestra alias, zona y estado de verificación, y no muestra
   nombre completo, correo, celular ni dirección.

## Casos de fallo con prueba

- Webhook con firma inválida: se rechaza y no cambia nada.
- Webhook repetido: no duplica ni revierte el estado.
- Webhook para un usuario que no existe: se rechaza sin crear nada.
- Verificación rechazada: se muestra el motivo y deja reintentar.
- Un usuario sin sesión no puede iniciar la verificación de otro.
- Un vendedor no verificado no muestra el distintivo en ninguna parte.

## Decisiones de la lista de zonas sensibles

- Los documentos de identidad y datos biométricos no se almacenan. Solo estado y
  referencia.
- El estado se consulta contra la tabla que alimenta el proveedor, no contra una
  bandera que la aplicación pueda escribir por su cuenta.
- El rechazo muestra el motivo y permite reintentar. Un rechazo sin salida
  convierte a un usuario legítimo en un ticket de soporte.
- El estado intermedio es visible: estos procesos tardan y una pantalla muda se
  lee como una falla.
- El webhook verifica firma antes de procesar. Un webhook sin verificación de
  firma es un endpoint que cualquiera usa para marcarse como verificado.
- El webhook es idempotente y tolera llegar repetido o desordenado.

## Depende de

S-01.
