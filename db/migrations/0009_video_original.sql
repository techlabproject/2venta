-- S-30: el video se transcodifica a MP4 (ARQUITECTURA.md 5.4). `video_path` pasa
-- a apuntar a la salida cuando está lista; el original se conserva aquí.
alter table listings add column if not exists video_original_path text;
