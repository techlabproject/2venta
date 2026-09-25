# Informe de prueba — corrección 52 (D-128), vuelta 2

**Veredicto: PASA — los tres hallazgos de la vuelta 1 quedaron corregidos y no observé regresiones en el repaso rápido.**

## Hallazgos

Ninguno observado en esta vuelta.

## Lo que verificaste y pasa

- **Talla retirada al editar (390 × 844):** como admin desactivé `37` en `http://localhost:3100/admin/configuracion?listo=1#atributos`. Como Camila, en `http://localhost:3100/producto/7856cd61-7ae8-48ec-ba47-f8ff34be3f13/editar`, el campo mostró exactamente `37 (ya no se ofrece)` y la nota `La talla 37 ya no se ofrece a publicaciones nuevas; puedes dejarla o cambiarla.`. El valor quedó seleccionado como `37`. Pulsé `Guardar cambios` sin tocarlo y la ficha volvió a mostrar exactamente `Talla 37`. [Editor 390](capturas/v2-01-talla-390-editor.png), [ficha después de guardar](capturas/v2-02-talla-390-guardada.png).

- **Talla retirada al editar (1280 × 800):** el mismo editor mostró `37 (ya no se ofrece)`, conservó el valor `37` y mostró la misma nota en `http://localhost:3100/producto/7856cd61-7ae8-48ec-ba47-f8ff34be3f13/editar`. [Editor 1280](capturas/v2-03-talla-1280-editor.png).

- **Edad retirada al editar (390 × 844):** el artículo infantil existente `Triciclo rojo para niños de 2 a 4 años` tenía `3 a 4 años`. Tras desactivar esa edad, en `http://localhost:3100/producto/8e1c9acf-166d-4765-8751-e932441a9390/editar` apareció exactamente `3 a 4 años (ya no se ofrece)` y la nota `«3 a 4 años» ya no se ofrece a publicaciones nuevas; puedes dejarla o cambiarla.`. Guardar sin tocarla dejó la ficha con `Para 3 a 4 años`. [Editor 390](capturas/v2-04-edad-390-editor.png), [ficha después de guardar](capturas/v2-05-edad-390-guardada.png).

- **Edad retirada al editar (1280 × 800):** el editor mostró `3 a 4 años (ya no se ofrece)`, mantuvo el valor y mostró la misma nota. [Editor 1280](capturas/v2-06-edad-1280-editor.png).

- **Publicaciones nuevas sin valores retirados:** con `37` y `3 a 4 años` desactivados, en `http://localhost:3100/publicar` no apareció la opción `37` al escoger `Ropa`, ni `3 a 4 años` al escoger `Artículos para niños`, tanto a 390 como a 1280. [Ropa 390](capturas/v2-22-nueva-ropa-sin-37-390.png), [niños 390](capturas/v2-23-nuevo-ninos-sin-edad-390.png), [publicar 1280](capturas/v2-24-nuevo-1280-sin-retirados.png).

- **Límites largos (390 × 844):** quité mediante DevTools el `maxlength` del campo y envié valores por encima del límite en categoría, lugar, talla, frase y motivo. Todos respondieron con el mismo texto exacto: `Es demasiado largo. Los nombres de categoría van hasta 40 letras; los de lugar, hasta 80; las tallas, hasta 30; las frases, hasta 60, y los motivos, hasta 200.`. Las URLs fueron, respectivamente, `http://localhost:3100/admin/configuracion?error=largo#categorias`, `http://localhost:3100/admin/configuracion?error=largo#lugares`, `http://localhost:3100/admin/configuracion?error=largo#atributos`, `http://localhost:3100/admin/configuracion?error=largo#palabras` y `http://localhost:3100/admin/configuracion?error=largo#palabras`. No se guardó ni se recortó ningún valor. Los campos mostraron `maxlength` 40, 80, 30, 60 y 200. [Categoría](capturas/v2-07-largo-categoria-390.png), [lugar](capturas/v2-08-largo-lugar-390.png), [atributo](capturas/v2-09-largo-atributo-390.png), [frase](capturas/v2-10-largo-frase-390.png), [motivo](capturas/v2-11-largo-motivo-390.png).

- **Límites largos (1280 × 800):** los mismos campos mostraron `maxlength` 40, 80, 30, 60 y 200. Quité el límite de categoría y envié 41 caracteres; la respuesta fue exactamente `Es demasiado largo. Los nombres de categoría van hasta 40 letras; los de lugar, hasta 80; las tallas, hasta 30; las frases, hasta 60, y los motivos, hasta 200.` en `http://localhost:3100/admin/configuracion?error=largo#categorias`. [Captura](capturas/v2-12-largo-categoria-1280.png).

- **Historial legible (390 × 844):** en `http://localhost:3100/admin/configuracion#historial` el historial mostró líneas como `Categoría: tecnologia`, `nombre: Tecnología V2 · activa: sí · orden: 1`, `Lugar: Parque V2 842913`, `Edad: EdadV2842913`, `Palabra prohibida: v2frase842913` y `Nuevo` cuando no había valor anterior. Para el lugar se leyó `tipo: Parque · zona: La Calera · nombre: Parque V2 842913`; para la frase, `frase: v2frase842913 · activo: sí · motivo: Motivo de la vuelta dos.`. El autor apareció como `Administración 2venta`. [Historial 390](capturas/v2-15-historial-390.png).

- **Historial legible (1280 × 800):** las mismas entidades y textos fueron visibles en `http://localhost:3100/admin/configuracion#historial`, con las columnas `Cuándo`, `Quién`, `Qué`, `Antes` y `Después`. [Historial 1280](capturas/v2-16-historial-1280.png).

- **Repaso de vuelta 1 — acceso privado:** sin sesión, `http://localhost:3100/admin/configuracion` devolvió HTTP 404 en 390 y 1280. Como Laura, el formulario administrativo reenviado en la vuelta anterior siguió devolviendo 404 y no modificó la categoría. [Anónima 390](capturas/v2-19-anon-390.png), [anónima 1280](capturas/v2-20-anon-1280.png).

- **Repaso de vuelta 1 — categoría y portada (390 × 844):** renombré temporalmente `Tecnología` a `Tecnología V2 portada`; la portada mostró ese texto y el enlace exacto `/?categoria=tecnologia`. Después lo restauré a `Tecnología`. [Portada](capturas/v2-25-portada-categoria-390.png).

- **Repaso de vuelta 1 — lugares (390 × 844):** agregué `Parque V2 Compra 902135` en `La Calera`; en `http://localhost:3100/comprar/808c009c-8560-4d20-a0c3-ea7a19c840ec`, al escoger `Nos vemos en persona` y `La Calera`, apareció el lugar. Luego lo desactivé. [Admin](capturas/v2-17-lugar-compra-admin-390.png), [compra](capturas/v2-18-lugar-compra-390.png).

- **Repaso de vuelta 1 — palabra prohibida (390 × 844):** al activar temporalmente `cafe qa84434`, editar como Camila con `Tacones CAFE QA84434` volvió a mostrar exactamente `No se permiten pruebas de cafe QA.`. La regla quedó inactiva al terminar. [Captura](capturas/v2-26-palabra-editar-recheck-390.png).

- **Repaso de vuelta 1 — no dejar categorías vacías (390 × 844):** intentar desactivar la última categoría devolvió `Tiene que quedar al menos una activa.` en `http://localhost:3100/admin/configuracion?error=ultima#categorias`. [Captura](capturas/v2-21-ultima-categoria-390.png).

- **Estado final de la demo:** `Tecnología`, `Ropa` y `Artículos para niños` quedaron con sus nombres, posiciones y estado originales. `37` y `3 a 4 años` quedaron activos. Las ubicaciones, edades y palabras agregadas para esta vuelta quedaron inactivas. Las publicaciones de Camila conservaron `Talla 37` y `Para 3 a 4 años`.

## Observaciones fuera de alcance

- No evalué pagos, envíos, chats ni las demás pantallas de administración.
- No modifiqué el código de la aplicación ni reinicié el servidor.

## NO VERIFICADO

- **Carga en lote:** `camila@2venta.demo` y `andres@2venta.demo` no muestran `Cargar varios artículos de una vez`; `http://localhost:3100/tienda` redirige a `http://localhost:3100/vender`, por lo que no ejecuté una carga CSV.
- **Pedido existente que conserva un lugar inactivo:** no había un pedido de prueba apropiado para verificar esa retención sin afectar la demo.