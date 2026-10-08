# Auditoría de Diseño y Usabilidad Móvil — 2venta

**Período:** 7 de octubre de 2026  
**Auditor:** Evaluación de pantallas públicas sin login  
**Plataforma:** Marketplace colombiano de segunda mano  

---

## 1. Las 10 Observaciones más Importantes (por impacto)

### 1. **Responsive Design No Aprovechado en Desktop**
**Pantalla:** Home, Búsqueda  
**Qué se ve:** El layout en desktop (1280×800) es idéntico al móvil (390×844). El catálogo mantiene 3 columnas, los filtros ocupan el mismo ancho, y no hay reordenamiento estructural.  
**Por qué molesta:** En Bogotá, muchas personas compran desde navegadores de escritorio en el trabajo o en casa. Un grid de 3 columnas en 1280px de ancho deja 40% del espacio desperdiciado. La carga visual es plana y no aprovecha la pantalla grande.  
**Cómo lo resuelven otros:** Mercado Libre muestra 4-5 columnas en desktop y coloca filtros en un sidebar fijo a la izquierda. Wallapop expande el grid dinámicamente. Vinted ajusta entre 2-4 columnas según resolución.

### 2. **Textos Corporativos sin Voz Local**
**Pantalla:** Home (hero section)  
**Qué se ve:** 
- "Cada artículo tiene video grabado por el vendedor y su identidad está verificada. Tu plata queda guardada hasta que confirmes que recibiste."

**Por qué molesta:** El tono es formal y aséptico. Suena como un párrafo de política de privacidad o términos de servicio, no como algo que un bogotano diría. Rompe la conexión con el audience local.  
**Alternativa más natural:** "El video prueba que el producto es real. Tu plata está segura hasta que confirmes que llegó en perfecto estado."

### 3. **Demasiado Contenido sin Pausas en la Portada**
**Pantalla:** Home (móvil)  
**Qué se ve:** Después de los filtros rápidos (Filtros, Verificados, Tecnología, Ropa, etc.), la página vuelca 24+ artículos sin sección ni pausa visual. Cada tarjeta es un rectángulo idéntico.  
**Por qué molesta:** En un celular gama media de Bogotá con conexión 4G lenta, el usuario se ve obligado a hacer scroll excesivo sin saber si hay una estructura que lo guíe. No hay jerarquía: "lo más vendido", "lo nuevo", "ofertas".  
**Cómo lo resuelven otros:** Mercado Libre usa secciones ("Destacado", "Ofertas del día", "Más vendidos"). Vinted agrupa por tendencias. Wallapop usa cards con badges de tiempo ("Hace 2 horas").

### 4. **Panel de Filtros Móvil No Visible por Defecto**
**Pantalla:** Búsqueda (móvil)  
**Qué se ve:** El panel de filtros es ancho (ocupando ~30% de pantalla) desde el primer clic en "Filtros". Funciona bien, pero no se cierra solo al seleccionar un filtro, obligando al usuario a cerrar manualmente.  
**Por qué molesta:** Después de seleccionar "Ropa" en Categoría, el usuario espera que los resultados se actualicen automáticamente y el panel se cierre. En cambio, tiene que hacer un tap adicional. Flujo lento.  
**Cómo lo resuelven otros:** Mercado Libre cierra el panel de filtros apenas el usuario selecciona. Wallapop muestra un botón "Aplicar" flotante que está siempre visible. Vinted aplica filtros en tiempo real sin modal.

### 5. **Falta Diferenciación Visual en el Estado "Sin Resultados"**
**Pantalla:** Búsqueda (después de filtros muy restrictivos)  
**Qué se ve:** Cuando no hay resultados, se muestra el texto "¿Dónde está?" sin decoración visual, sin ilustración ni botón de acción clara.  
**Por qué molesta:** El usuario no sabe si debe limpiar filtros, intentar otra búsqueda o si es un error. Parece un estado incompleto.  
**Cómo lo resuelven otros:** Mercado Libre muestra una ilustración + "No encontramos resultados" + botón "Limpiar filtros". Wallapop sugiere búsquedas alternativas. Vinted invita a agregar el producto a un guardado de búsqueda.

### 6. **Badges de Verificación Poco Contrastados**
**Pantalla:** Home, Búsqueda (tarjetas de producto)  
**Qué se ve:** El badge "Verificado" tiene un color teal oscuro (#1a5a54 aprox.) sobre un fondo de tarjeta blanca. En celulares con bajo brillo o bajo contraste, casi no se lee.  
**Por qué molesta:** La verificación del vendedor es la razón principal por la que alguien compra en 2venta. Si el usuario no ve que el producto es de un vendedor verificado, reduce confianza.  
**Cómo lo resuelven otros:** Mercado Libre usa un check + color contraste alto. Vinted usa un ícono de escudo en color destacado. Wallapop enfatiza el nombre del vendedor verificado.

### 7. **Busca de Productos Muy Angosta en Desktop**
**Pantalla:** Home, Búsqueda (escritorio)  
**Qué se ve:** El campo de búsqueda tiene un max-width que no se expande completamente en 1280px. Deja espacio muerto a la derecha.  
**Por qué molesta:** En un escritorio, el usuario espera poder escribir una búsqueda detallada (ej: "MacBook Air M2 2022 caja original"). El campo angosto lo desincentiva.  
**Cómo lo resuelven otros:** Mercado Libre expande el campo al 100% del ancho disponible. Wallapop centra pero con max-width razonable (~800px). Vinted lo expande como máximo posible.

### 8. **Página de Bienvenida Sin Diferenciación Visual**
**Pantalla:** /bienvenida  
**Qué se ve:** Dos botones: "Quiero comprar" (coral, filled) y "Quiero vender" (outline). El layout es centrado, minimalista, sin imágenes ni contexto.  
**Por qué molesta:** No hay diferenciación visual en cuanto a tamaño, peso o microinteracción. Un usuario indeciso no sabe cuál elegir. No hay indicadores visuales de "este es el más popular".  
**Cómo lo resuelven otros:** Mercado Libre enfatiza compra con tamaño más grande + scroll horizontal de categorías. Vinted usa íconos + descripciones breves de cada ruta. Wallapop muestra un carrusel con casos de uso.

### 9. **Chips de Filtros Activos Sin Iconografía Clara**
**Pantalla:** Búsqueda (después de filtrar)  
**Qué se ve:** Los chips "Ropa - Moda" y "Quitar todo" son botones simples sin ícono de X para remover un filtro individual.  
**Por qué molesta:** En móvil, tocar el chip completo es difícil porque no hay un target claro (es difícil saber exactamente dónde hacer clic para quitar solo ese filtro).  
**Cómo lo resuelven otros:** Mercado Libre, Vinted y Wallapop usan X explícita dentro del chip, con padding generoso para toques fáciles.

### 10. **Falta Indicador de Carga o Skeleton en Catálogo**
**Pantalla:** Home, Búsqueda  
**Qué se ve:** Al cargar la página, los productos aparecen de golpe o con un fade. No hay skeleton loaders ni indicador de progreso.  
**Por qué molesta:** En conexión 4G lenta (común en Bogotá), el usuario no sabe si la página se colgó o si está cargando. El tiempo percibido es mayor.  
**Cómo lo resuelven otros:** Mercado Libre y Vinted muestran placeholders grises animados mientras cargan. Wallapop muestra un spinner pequeño en la esquina.

---

## 2. Textos Genéricos o "Escritos por IA"

### Textos Identificados

1. **"Compra usado sin miedo a que te tumben"**  
   *Ubicación:* Home (hero)  
   *Veredicto:* Suena bien, es local y directo. **No hay cambio necesario.**

2. **"Cada artículo tiene video grabado por el vendedor y su identidad está verificada. Tu plata queda guardada hasta que confirmes que recibiste."**  
   *Ubicación:* Home (descripción under hero)  
   *Alternativa:* "El video prueba que el producto es real. Tu plata está segura hasta que confirmes que llegó bien."

3. **"Te decimós a cuántos kilómetros está cada artículo. Solo lo guardaros en este navegador, aproximado a 1 km."**  
   *Ubicación:* Búsqueda (tooltip de ubicación)  
   *Alternativa:* "Te mostramos a qué distancia está cada producto. Solo tomamos referencia aquí en el navegador, con margen de ±1 km."

4. **"¿Dónde está? Te decimós a cuántos kilómetros está cada artículo. Solo lo guardaros en este navegador, aproximado a 1 km. O elige la zona"**  
   *Ubicación:* Búsqueda (bloque de geolocalización)  
   *Veredicto:* "decimós" y "guardaros" son conjugaciones raras. Debería ser "Te decimos" y "guardamos".  
   *Alternativa:* "¿Dónde está? Te mostramos cada producto a qué distancia está de ti (±1 km). O elige una zona."

5. **"Donde está quien vende. Tu ubicación se dice arriba de los resultados para filtrar por distancia."**  
   *Ubicación:* Búsqueda (tooltip de zona del vendedor)  
   *Alternativa:* "Dónde vende el vendedor. Tu zona se muestra arriba para filtrar por cercano."

6. **"Ya tengo cuenta · Iniciar sesión"**  
   *Ubicación:* Bienvenida / Vender  
   *Veredicto:* Correcto, pero muy formal. Podría ser "¿Ya tienes cuenta?" o "Acceder con cuenta existente".  
   *Alternativa:* "¿Ya tienes cuenta? Entra aquí."

7. **"¿No tienes cuenta? Crear una"**  
   *Ubicación:* Login  
   *Veredicto:* Funciona bien, pero sin verbo. Podría tener más empuje.  
   *Alternativa:* "¿Primera vez? Crear cuenta en 2 minutos" (con emoji o badge).

8. **"Ver productos sin cuenta"**  
   *Ubicación:* Bienvenida / Login  
   *Veredicto:* Correcto, pero minimalista. Podría ser invitación más activa.  
   *Alternativa:* "Explora sin registrarte (solo para ver)."

---

## 3. Tres Cosas que 2venta Hace Mejor que la Competencia

### 1. **Video Obligatorio por Producto**
Mercado Libre, Wallapop y Vinted no requieren video para cada artículo. El video grabado en el momento es una barrera de entrada brillante: es fácil para vendedores honestos (toman 30 seg), imposible para estafadores (probar producto en vivo). La gente en Bogotá nota que **confía más en un video que en 100 fotos**. Competitive advantage real.

### 2. **Panel de Filtros Estructurado y Compacto**
El diseño del panel de filtros en 2venta es exhaustivo (categoría, precio, estado, distancia, zona del vendedor) sin ser abrumador. Wallapop tiene filtros escondidos. Mercado Libre los esparce por toda la página. Vinted los minimiza. 2venta lo centraliza bien: es fácil refinar búsquedas sin distracciones.

### 3. **Branding Consistente y Local sin Ruido**
La paleta de colores (teal oscuro + coral + blanco + gris) es clean y diferente. No sigue el patrón de Mercado Libre (azul + naranja). El tono es bogotano ("Compra usado sin miedo a que te tumben"), no corporativo. Eso crea lealtad emocional rápida en usuarios jóvenes de Bogotá.

---

## Conclusión

2venta tiene un buen punto de partida en diseño. Las tarjetas de producto están bien, la página de bienvenida es clara, y los filtros son útiles. **El problema principal es que el responsive design no está optimizado para desktop.** En pantallas grandes (1280px+), la experiencia se siente arrastrada del móvil sin adaptación. Eso es una oportunidad rápida: ajustar el grid a 4-5 columnas en escritorio, expandir el campo de búsqueda, y hacer el sidebar de filtros permanente y más estrecho.

Los textos corporativos y los badges de verificación sin contraste son segundos. La plataforma tiene el potencial de ser más rápida y confiable que Mercado Libre si enfatiza más el video y la identidad verificada: dos cosas que ya hace, pero que se pueden comunicar mejor.

---

*Generado el 7 de octubre de 2026 — Auditoría no-invasiva de interfaces públicas.*
