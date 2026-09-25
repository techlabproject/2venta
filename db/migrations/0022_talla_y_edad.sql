-- Corrección 38 (decisión de Nicolás): talla en ropa y edad en artículos para
-- niños. Las publicaciones anteriores quedan sin ellas (null); las nuevas las
-- exigen al publicar. Los valores válidos viven en src/features/catalog/atributos.ts.
alter table listings add column if not exists talla text;
alter table listings add column if not exists edad text;
