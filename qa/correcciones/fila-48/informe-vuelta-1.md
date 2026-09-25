# Informe de prueba — corrección 48 y códigos SMS

**Veredicto:** `PASA CON OBSERVACIONES` — D-127 y la espera de reenvío SMS funcionan; queda visible para admin una opción de guardar avisos que no explica por qué no está disponible.

## Hallazgos

### 1. Admin puede intentar guardar una búsqueda, pero la interfaz no explica la restricción

- **Severidad:** baja.
- **Ancho:** 390 px.
- **Pasos exactos:** iniciar sesión como `admin@2venta.demo`; abrir `http://localhost:3100/buscar?q=guante`; abrir **“Avísame cuando aparezca algo así”**; escribir `QA admin` en **“Nombre de la búsqueda”**; pulsar **“Guardar”**.
- **Esperado:** la cuenta del equipo no debería ofrecer guardar búsquedas o pedir avisos, o debería explicar que no puede hacerlo.
- **Visto:** aparecen **“Avísame cuando aparezca algo así”** y **“Guardar”**. Después termina en `http://localhost:3100/admin`, sin mensaje de error ni confirmación. La búsqueda no quedó guardada.
- **Capturas:** [control visible](capturas/admin-aviso-busqueda-visible.png) · [resultado](capturas/admin-aviso-busqueda-despues-guardar.png).

## Lo que verifiqué y pasa

- Admin: a 1280 px aparecen **“Explorar”** y **“Administración”**, sin **“Vender”** ni **“Carrito”**. A 390 px la barra inferior contiene **“Administración”**, sin **“Publicar”** ni **“Chats”**.
- `/vender`, `/publicar`, `/tienda` y `/vender/metricas` redirigen a `http://localhost:3100/admin` en ambos anchos.
- La ficha de Camila muestra: **“Estás en la cuenta del equipo de 2venta: desde aquí no se compra ni se vende. Para eso, usa tu cuenta personal.”** Sin comprar, carrito, chat ni favorito.
- `/carrito` muestra el mismo aviso y **“Ir a administración”**.
- `/comprar/0c5efda3-3464-42f9-b5a1-13f1950201c6` y `/chat/abrir/0c5efda3-3464-42f9-b5a1-13f1950201c6` devuelven a la ficha.
- Los reenvíos adversariales de favorito, carrito, chat, búsqueda, compra, alta de vendedor y oferta no dejaron datos a nombre de admin.
- Administración cargó correctamente: `/admin`, `/admin/usuarios`, `/admin/reportes`, `/admin/disputas` y `/admin/conversaciones`.
- Laura conserva **“Comprar con pago protegido”**, **“Agregar al carrito”**, **“Escribirle al vendedor”** y **“Guardar”**.
- Camila conserva **“Vender”**, **“Tu espacio de vendedor”** y publicación.
- La empresa mostró: **“Esta es una cuenta de empresa: en 2venta las empresas venden, pero no compran. Si quieres comprar algo, hazlo desde una cuenta personal, con otro celular.”**
- Recuperación SMS: después de enviar aparece **“Si ese celular tiene una cuenta, le mandamos un código.”** y **“Mandar otro en 30 s”** deshabilitado.
- Reenviar durante la espera no creó otro código; el contador de envíos permaneció en `1`.
- Tras 31 segundos, **“No me llegó, mandar otro”** quedó habilitado y el segundo envío mostró **“Si ese celular tiene una cuenta, le mandamos otro código.”**

## Observaciones fuera de alcance

- La ficha admin conserva **“Preguntar”** para preguntas públicas; no lo clasifiqué como **“Escribirle al vendedor”**.

## NO VERIFICADO

- Fallo real del proveedor SMS para un número al que sí se debe enviar de verdad.
- Ejecución completa de la acción real `publishListing` con sesión admin; la pantalla mantuvo **“Graba el video para continuar”** deshabilitado.