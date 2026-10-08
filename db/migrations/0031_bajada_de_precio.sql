-- D-132: lo que bajó de precio se marca en el catálogo y en la ficha, con el precio
-- de antes tachado (GoTrendier lo hace). Se guarda el precio inmediatamente
-- anterior y cuándo bajó; subir el precio borra la marca. La marca dura 14 días:
-- una «rebaja» de hace dos meses ya es solo el precio.
alter table listings
  add column if not exists precio_antes_cop integer,
  add column if not exists bajo_at timestamptz;
