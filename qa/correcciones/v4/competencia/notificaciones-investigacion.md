# Investigación: Notificaciones de chat en 2venta

## 1. Web Push (Push API + Service Worker + VAPID)

### Qué necesita
- **HTTPS obligatorio**: Service Workers solo se registran en orígenes seguros (localhost es excepción en desarrollo)
- **Service Worker**: Ejecuta en segundo plano, recibe eventos `push` y muestra notificaciones
- **VAPID**: Par de claves (pública/privada) que identifica tu servidor ante el push service del navegador
- **Librería Node.js recomendada**: `web-push` (npm), genera claves VAPID con `npx web-push generate-vapid-keys`

### Soporte en navegadores (2026)
| Navegador | Escritorio | iOS/Android | Notas |
|-----------|-----------|-----------|-------|
| **Chrome** | ✓ (v42+) | ✓ Android | Sin instalar PWA; FCM gratis |
| **Firefox** | ✓ | ✓ Android | Estándar W3C |
| **Edge** | ✓ | ✓ Android | Paridad con Chrome |
| **Safari** | ✓ macOS 13+ (v16) | ❌ iPhone tab | Solo PWA en Home Screen |
| **Safari iOS** | — | ✓ Home Screen (v16.4+) | Requiere instalar web en pantalla de inicio |

**iPhone/iOS**: Requiere instalar PWA (Safari → Compartir → Añadir a pantalla de inicio) desde iOS 16.4. NO funciona en tab normal. Bloqueado en UE por regulación (iOS 17.4+). Safari 18.4 añadió Declarative Web Push (simplificado).

**Android Chrome**: Funciona sin instalar PWA, completamente gratuito (Firebase Cloud Messaging).

**Costo**: Cero. Ni Apple ni Google cobran por push. Lo que cuesta es la plataforma/SDaaS que uses (Pusher, OneSignal, etc.), no es obligatorio; puedes auto-alojar.

---

## 2. Alternativas para notificaciones fuera de navegador

### Correo (AWS SES)
- **Costo**: $0.10 por 1.000 emails ($0.0001 por email)
- **Ventajas**: Llegabilidad universal, archivable
- **Desventajas**: Lento (minutos a horas), fácil de ignorar, requiere unsubscribe legal

### WhatsApp Business (plantillas de utilidad)
- **Costo en Colombia (oct 2026)**: 
  - Service: $0.0008 por mensaje
  - Utility: $0.0008 por mensaje
  - Marketing: $0.0125 por mensaje
- **Ventajas**: Medio preferido en Colombia, se lee casi siempre
- **Desventajas**: Requiere que usuario hable primero (2-3 días ventana de respuesta); templating limitado; aprobación de Meta; costo por usuario

### SMS
- **Costo en Colombia (Twilio)**: $0.0592 por SMS
- **Ventajas**: Instantáneo, garantizado, sin app requerida
- **Desventajas**: Mucho más caro que WhatsApp; requiere solicitar permiso a regulador colombiano (MinTIC)

---

## 3. Indicadores dentro de la web abierta (sin push)

Buenas prácticas cuando la app está abierta:
- **Título de la pestaña**: Cambiar a "(1) Chat" para contador pequeño
- **Insignia en encabezado**: Punto rojo o número sobre icono de chat
- **Aviso dentro de la página**: Toast (esquina inferior) o panel flotante que no interrumpa
- **Sonido**: Opcional, muy discreto (no autoplay sin gestura del usuario)
- **Badge API**: Mostrar número en icono de app si fue instalada como PWA

**Benchmark marketplace**: Mercado Libre, Wallapop y Vinted usan contador en tab + insignia roja en encabezado + aviso flotante dentro.

---

## 4. Patrones para pedir permiso sin molestar

**❌ No hacer**: Pedir al cargar la página (rechazo 90%+)

**✓ Hacer**:
1. **Después de 1+ pageview**: Usuario conoce la app
2. **Después de una acción relevante**: Publicó un artículo, recibió primer mensaje, hizo primera compra
3. **Pre-mensaje de contexto**: "Recibe notificaciones cuando alguien te escriba" antes del diálogo del SO
4. **Respetar rechazo**: Si dice no, no preguntar de nuevo en esa sesión
5. **Opción granular**: Permitir que controle qué notificaciones recibe (mensajes sí, ofertas no)

---

## 5. Recomendación por fases para 2venta

### Fase 1 (Ya, sin costo)
- ✓ Soporte Web Push en escritorio (Chrome, Firefox, Edge, Safari macOS)
- ✓ Indicador visual en-página: insignia roja en icono chat + contador en tab
- ✓ Toast/alerta cuando llega mensaje y app está abierta
- ✓ Pedir permiso push después del primer mensaje recibido
- **Librería**: `web-push` (Node.js) + cliente con `PushManager`

### Fase 2 (Bajo costo, cuando exista tráfico)
- ✓ WhatsApp Business: notificar mensajes nuevos (utility, $0.0008/msg)
- ✓ SMS solo para alertas críticas (reclamos, liberación de pago)
- ✓ Email como fallback si usuario rechaza push
- **Prerequisito**: Verificar celular es obligatorio (ya existe en 2venta)

### Fase 3 (Con app nativa iOS/Android)
- ✓ Push nativo (APNs para iOS, FCM para Android)
- ✓ Consolidar: no duplicar notificaciones web vs app nativa
- ✓ Deep linking directo a conversación

### Nota sobre iOS PWA
Si quisiera alcanzar usuarios de iPhone sin app nativa, iOS 16.4+ permite Web Push, pero solo si instalaron la web en pantalla de inicio. Mercado Libre en Colombia NO tiene PWA en iOS (decisión de producto); Wallapop tampoco. Es nicho muy pequeño en 2026.

---

## Resumen ejecutivo

| Medio | Costo | Alcance | Latencia | Esfuerzo |
|-------|-------|---------|----------|----------|
| **Web Push** | $0 | Escritorio 100%, Android 90%, iPhone 5% | Segundos | Bajo |
| **WhatsApp** | $0.0008-0.0125/msg | 70% mercado Colombia | Segundos | Medio |
| **SMS** | $0.0592/msg | 100% | Segundos | Bajo |
| **Email** | $0.0001/msg | 90% | Minutos | Bajo |

**Recomendación inmediata**: Fase 1 (Web Push + visual en-página) cubre 90% de escritorio y Android sin costo. Agregar WhatsApp cuando escale (inversión mínima para alcance máximo en Colombia). App nativa es futuro.

---

## Fuentes

- [Browser Push Notifications: How They Work in 2026](https://www.suprsend.com/post/browser-push-notifications)
- [Push API - MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Do Progressive Web Apps Work on iOS? The Complete Guide for 2026](https://www.mobiloud.com/blog/progressive-web-apps-ios/)
- [PWA iOS Limitations and Safari Support [2026]](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide)
- [Push Notifications for Chrome - PushAlert](https://pushalert.co/push-notifications-for-chrome)
- [WhatsApp Business API: The worldwide pricing model (2026/2027)](https://sleekflow.io/en-us/blog/whatsapp-business-price)
- [SMS Pricing in Colombia for Text Messaging](https://www.twilio.com/en-us/sms/pricing/co)
- [Amazon SES Pricing 2026: Official Cost Breakdown](https://leadsnipper.com/blog/amazon-ses-pricing-2026)
- [iOS Push Notification Permissions: The Best Practices](https://blog.hurree.co/ios-push-notification-permissions-best-practises)
- [10 Best Practices for Push Notification UX Design](https://www.onething.design/post/best-practices-for-push-notification-ux-design)
- [web-push - npm](https://www.npmjs.com/package/web-push)
- [Behind Web Push Notifications: Browser Differences](https://www.braze.com/resources/articles/behind-web-push-notifications-3)
- [Notification Center Best Practices and UX - Courier](https://www.courier.com/guides/how-to-build-a-notification-center/chapter-3-best-practices-for-notification-centers)
