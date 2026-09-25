> **Decidido 2026-09-25:** quedan documentadas las mejores opciones (abajo); **por ahora
> no se integra** (decisión de Nicolás). La verificación sigue simulada, y es un
> bloqueo antes de producción: sin proveedor real, cualquiera se «verifica».

# Verificación de identidad del vendedor: proveedores

Corrección 49 de Catalina: «Se simula la aceptación o el rechazo del vendedor. Cotizar y
documentar posibles proveedores.»

## Cómo está hoy (D-02)

El vendedor hace la verificación en un proveedor **simulado** (`/dev/kyc`, «Simular
aprobación» / «Simular rechazo»). La app ya tiene todo alrededor: autorización de
biométricos (D-108), estados aprobado/rechazado/en proceso, avisos por webhook firmado
(`/api/kyc/webhook`) y el reintento. Cambiar al proveedor real es escribir un adaptador
(`src/features/kyc/provider.ts`) y configurar sus claves.

## Qué necesita 2venta

Foto de la **cédula colombiana** (frente y reverso) + **selfie con prueba de vida** +
comparación de la cara con la de la cédula. Idealmente, **consulta a la Registraduría**
(que la cédula exista y los datos coincidan). Integración web por API o por un enlace
del proveedor, con aviso por webhook.

## Opciones (precios públicos al 2026-09-25; confirmar al contratar)

| Proveedor | Qué hace | Precio | Comentario |
|---|---|---|---|
| **Didit** ([precios](https://didit.me/pricing/), [Colombia](https://didit.me/solutions/countries/colombia/)) | Documento + prueba de vida + comparación de rostro; consulta de la cédula contra la base oficial | **500 verificaciones gratis al mes**; después ~US$0,33 por verificación completa; consulta de cédula ~US$0,20 | Sin tarjeta para empezar; ideal para arrancar |
| **Truora** ([precios](https://www.truora.com/en/pricing/digital-identity)) | Colombiano; identidad digital, validación de documentos y rostro, antecedentes | Por cotización | Fuerte en Colombia; también WhatsApp |
| **Verifik** ([cédula](https://verifik.co/verificacion-cedula-colombia/)) | Colombiano; cédula contra fuentes oficiales en tiempo real, biometría y prueba de vida | Por cotización (demo) | Bueno para la consulta oficial |
| MetaMap, Veriff, Sumsub | Plataformas internacionales con cédula colombiana | Por cotización; suelen tener mínimo mensual | Más caras para el volumen de arranque |

**Recomendación:** **Didit para arrancar** (gratis hasta 500 vendedores al mes, cubre
todo lo que hoy simula la app) y pedir cotización a **Truora** y **Verifik** para
comparar cuando haya volumen o si hace falta la consulta a la Registraduría con
respaldo local.

## Qué falta para conectarlo

1. Crear la cuenta en el proveedor (Nicolás) y el flujo de verificación (documento +
   prueba de vida + comparación).
2. Escribir el adaptador y el webhook firmado (como WhatsApp y Twilio).
3. Revisar el tratamiento de datos biométricos en la política (el proveedor es
   encargado del tratamiento; transferencia internacional si está fuera de Colombia).
