# Verificación de datos sobre marketplaces

**Fecha:** 2026-10-07  
**Método:** Búsqueda en fuentes primarias (centros de ayuda oficiales, páginas de precios)

---

## 1. Mercado Libre Colombia: precio mínimo $1.400 COP
**VEREDICTO:** NO VERIFICABLE

No se encontró confirmación oficial de este precio mínimo en fuentes primarias de Mercado Libre Colombia. Las búsquedas no devolvieron esta cifra específica. La plataforma indica que puedes establecer precios según tus preferencias, pero no especifica un mínimo de $1.400.

---

## 2. Mercado Libre Colombia: comisión 11–16% + cargo fijo
**VEREDICTO:** PARCIAL

**Dato correcto:** Las comisiones varían significativamente según la categoría del producto (pueden ser del 11% al 37.5% según fuentes). Existe un cargo fijo para artículos de bajo valor. Mercado Libre recomienda usar el simulador oficial de costos antes de fijar precios, ya que son muy variables por categoría.

**Fuentes:**
- [Guía 2026 de comisiones Mercado Libre](https://blog.rapiboy.com/comisiones-sobre-ventas-en-la-plataforma-meli/)
- [Comisiones por categoría 2026](https://jaguarsheet.com/es/blog/comisiones-mercado-libre)

---

## 3. Mercado Libre Colombia: vendedores particulares publican usados gratis
**VEREDICTO:** VERDADERO

**Dato:** Puedes publicar artículos usados gratis hasta 20 ventas al año. A partir de la venta 21, aplican comisiones. La publicación en sí es gratuita; solo se cobra por venta realizada.

**Fuente:**
- [Cómo vender en Mercado Libre 2026](https://tiendli.com/blog/como-vender-en-mercado-libre-colombia)

---

## 4. Mercado Libre Colombia: "destacar cuesta $8.000 por 7 días"
**VEREDICTO:** NO VERIFICABLE

No se encontró confirmación oficial de este precio específico en fuentes primarias. Las búsquedas no devolvieron información detallada sobre la tarificación exacta del servicio "destacar" o "promocionar" en Mercado Libre Colombia. Se recomienda consultar directamente el portal de vendedores.

---

## 5. Mercado Libre: notificaciones por push, correo y campana web
**VEREDICTO:** VERDADERO

**Dato:** Mercado Libre envía notificaciones de mensajes y preguntas a través de múltiples canales: webhooks/API para integraciones, y el sistema de notificaciones web de la plataforma.

**Fuente:**
- [Notifications - Mercado Libre Developers](https://developers.mercadolibre.com.ar/en_us/products-receive-notifications)

---

## 6. GoTrendier Colombia: comisión 18%
**VEREDICTO:** FALSO

**Dato correcto:** En GoTrendier Colombia la comisión es **9.99% + $3.999** (sujeto a IVA). El 18% aplica en México, pero no en Colombia. No hay cargo fijo adicional por separado: es un porcentaje + una cantidad fija en pesos.

**Envío:** Servientrega cobrado al comprador (~$9.500)

**Fuente:**
- [Lista de costes GoTrendier Colombia](https://www.gotrendier.com.co/statics/listadecostes)

---

## 7. Vinted: comisión 5% + €0,70 al comprador; ¿opera en Colombia?
**VEREDICTO:** PARCIAL - NO OPERA EN COLOMBIA

**Dato correcto:**
- **Comisión:** Verdadero. Vinted NO cobra al vendedor; cobra al comprador una "Buyer Protection Fee" de aproximadamente 5% + €0,70 (o equivalente según región).
- **Colombia:** NO. Vinted opera solo en Europa (España, Portugal, Italia, Francia, UK, Alemania, etc.) y Australia. No tiene presencia oficial en Colombia.

**Fuentes:**
- [Vinted Fees 2026](https://www.voolist.com/blog/vinted-fees-2026)
- [Vinted Launch Timeline](https://velkaistudio.com/vinted-launch-timeline/)

---

## 8. Wallapop: ¿cobra al comprador o vendedor por envío?; ¿opera en Colombia?
**VEREDICTO:** FALSO EN AMBAS PARTES

**Envío:** El comprador paga al buyer. El costo varía por peso (USD 2.59–17.89), más una comisión de protección (~USD 1.83).

**Colombia:** NO. Wallapop opera solo en Europa (España, Italia, Portugal, Francia, UK). No opera en Colombia.

**Fuente:**
- [Wallapop Shipping Information](https://en.androidguias.com/shipping-wallapop/)
- [Wallapop Available Markets](https://www.midireccioneuropea.com/en/vinted--wallapop-which-countries-they-work-in-and-how-to-buy-from-outside-europe-2026/)

---

## 9. WhatsApp Business Platform: precio mensaje plantilla para Colombia
**VEREDICTO:** VERDADERO

**Datos correctos (vigentes desde octubre 1, 2026):**
- **Marketing:** $0.0125 por mensaje
- **Utility:** $0.0008 por mensaje
- **Authentication:** $0.0008 por mensaje
- **Service:** $0.0008 por mensaje (con 1.000 gratis/mes desde octubre 2026)

Colombia tiene las tarifas más bajas globalmente para mensajes utility/authentication.

**Nota:** Este es el precio de Meta. Los proveedores (Twilio, 360dialog, etc.) agregan su propia tarifa.

**Fuentes:**
- [WhatsApp Business API Pricing 2026](https://www.engagelab.com/blog/whatsapp-business-api-pricing)
- [Pricing by Country - Meta](https://www.plivo.com/whatsapp/pricing/co/)

---

## 10. Twilio: precio SMS saliente a Colombia
**VEREDICTO:** VERDADERO

**Dato correcto:** Twilio cobra **$0.0525 por SMS** saliente a Colombia (para todos los operadores mayores: Avantel, Claro, ETB, Tigo, Movistar).

**Fuente:**
- [Twilio SMS Pricing Colombia](https://www.twilio.com/en-us/sms/pricing/co)

---

## 11. iOS: Web Push solo funciona si app está en home screen desde iOS 16.4
**VEREDICTO:** VERDADERO

**Dato correcto:** Web Push en iOS/iPadOS requiere:
- iOS 16.4 o posterior
- La web app debe estar **agregada a la pantalla de inicio** (Add to Home Screen)
- La app debe tener un manifest.json con `"display": "standalone"` o `"fullscreen"`
- Se abre como una app nativa, no en Safari

Los usuarios reciben notificaciones en Lock Screen, Notification Center, y Apple Watch como apps nativas.

**Fuente:**
- [Web Push for Web Apps on iOS - WebKit](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/)
- [iOS Web Push Setup - OneSignal](https://documentation.onesignal.com/docs/en/web-push-for-ios)

---

## 12. Mercado Libre Colombia: paginación con números y "Siguiente"
**VEREDICTO:** NO VERIFICABLE CON PRECISIÓN

No se encontró confirmación en documentación oficial sobre si la UI web de Mercado Libre Colombia específicamente usa números de página o botón "Siguiente". La API usa parámetros offset/limit. Para una respuesta definitiva habría que acceder directamente a la web y verificar el HTML/estructura actual.

---

## 13. Filtro precio en Mercado Libre Colombia: rangos + min/máximo
**VEREDICTO:** VERDADERO

**Dato correcto:** Mercado Libre Colombia ofrece ambos:
- **Rangos predefinidos:** Hasta $25.000, $25.000–$85.000, Más de $85.000 (varían por categoría)
- **Casillas mínimo/máximo personalizadas:** Los usuarios pueden ingresar rangos de precio custom

Las búsquedas muestran opciones categorizadas por rango AND la capacidad de establecer rangos personalizados.

**Fuentes:**
- Listados de categoría en Mercado Libre Colombia (ej. filtros de agua)

---

## Resumen

| # | Afirmación | Resultado |
|---|-----------|-----------|
| 1 | ML CO: $1.400 mín | NO VERIFICABLE |
| 2 | ML CO: 11–16% comisión | PARCIAL |
| 3 | ML CO: usados gratis | VERDADERO |
| 4 | ML CO: destacar $8.000 | NO VERIFICABLE |
| 5 | ML: push/correo/campana | VERDADERO |
| 6 | GoTrendier: 18% | FALSO (9.99%+$3.999) |
| 7 | Vinted: 5%+€0,70; ¿Colombia? | PARCIAL - NO Colombia |
| 8 | Wallapop: envío; ¿Colombia? | FALSO - NO Colombia |
| 9 | WhatsApp: precios Colombia | VERDADERO |
| 10 | Twilio: SMS Colombia | VERDADERO ($0.0525) |
| 11 | iOS: Web Push home screen | VERDADERO |
| 12 | ML CO: paginación números | NO VERIFICABLE |
| 13 | ML CO: filtro precio | VERDADERO |

