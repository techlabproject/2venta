-- Corrección 37 (Catalina; nombre elegido por Nicolás): «Niños» a secas no puede
-- ser el nombre de una categoría de una tienda. Cambia solo lo que se ve: el
-- `slug` sigue siendo `ninos`, así que los enlaces y las búsquedas guardadas
-- (`?categoria=ninos`) siguen funcionando.
update categories set label = 'Artículos para niños' where slug = 'ninos';
