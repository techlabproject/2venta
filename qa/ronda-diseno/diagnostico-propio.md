# Diagnóstico propio, antes de leer a los agentes

Escrito por el agente de desarrollo mirando las capturas y el código, para no
heredar el criterio de los agentes de la ronda y poder contrastar después.

## Los dos defectos que reportó Nicolás: confirmados

**1. Un vendedor no puede ver sus propios productos.** `/vender/metricas` existe,
se titula «Tus publicaciones» y funciona, pero **ningún enlace de la interfaz
lleva ahí**. El único sitio del código que la menciona es un `revalidatePath` en
`src/features/publish/edit.ts`. Se llega solo escribiendo la URL a mano.

**2. Desde el perfil del vendedor no se puede escribir.** `src/app/vendedor/[id]/page.tsx`
no tiene ninguna acción de conversación. El chat solo se abre desde la ficha de un
artículo, porque el hilo es por artículo. Es coherente con el modelo de datos,
pero el usuario esperaba escribirle a la persona y no lo encontró: hay que dar una
salida desde el perfil aunque el hilo siga siendo por artículo.

## Por qué se ve «plano, monótono y aburrido»

### a. El escritorio desperdicia media pantalla
El feed es `grid-cols-2` dentro de `max-w-3xl` (768 px). En un monitor de 1280 px
quedan dos columnas estrechas centradas con márgenes enormes, y la página se hace
interminable hacia abajo. Es un diseño móvil estirado, no un diseño de escritorio.
**Es el problema visual más grave y el más barato de arreglar.**

### b. El video, que es el producto, es invisible
La tarjeta del feed muestra `poster_path` como una imagen fija. No hay ícono de
reproducción, ni duración, ni nada que diga que detrás hay un video grabado dentro
de la app. El diferenciador entero del negocio —lo que justifica la comisión y la
desconfianza que resuelve— **no aparece en la pantalla más vista del producto**.

### c. Una sola superficie para todo
Cada bloque del producto es `rounded-2xl bg-white`: la tarjeta del feed, el módulo
de pago protegido, las reseñas, los pedidos, las cifras del perfil. Cuando todo
tiene el mismo tratamiento, la jerarquía desaparece y nada destaca. El borde, el
relleno, la sombra y el radio son presupuesto visual, y aquí se gastan parejo.

### d. La paleta está elegida pero no usada
Verde bosque y mostaza son una buena base. Pero el verde vive solo en la cabecera
y el mostaza solo en los botones; todo el cuerpo es crema, blanco y gris. Falta
color en el 90 % de la superficie, y de ahí viene la monotonía.

### e. La escala tipográfica está comprimida
El precio es `text-lg` (18 px) y el título del artículo `text-sm` (14 px): apenas
un paso de diferencia entre el dato que decide la compra y el resto. Los títulos
de pantalla son `text-2xl`. No hay ningún momento tipográfico grande en todo el
producto.

### f. «Verificado» en todas las tarjetas deja de significar algo
El distintivo aparece en las doce tarjetas del feed. Una señal que está siempre
presente deja de leerse. Y es justo la señal que el producto quiere vender.

## Lo que NO hay que tocar

- La paleta: el problema no es cuál, es dónde se usa.
- La pareja de fuentes: Poppins y Work Sans aguantan bien; lo que falta es escala.
- Las decisiones de producto ya tomadas (D-17 sin cifras en cero, D-22 el filtro,
  D-14 el video obligatorio).
