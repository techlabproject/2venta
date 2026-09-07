-- Migración 0003 — estado "retirada" para publicaciones
--
-- Retirar no borra: si la publicación tiene un pedido asociado, borrarla dejaría a
-- un comprador con un pedido que apunta a nada, y a una disputa sin el video contra
-- el cual compararse.
alter table listings drop constraint if exists listings_status_check;

alter table listings add constraint listings_status_check
  check (status in ('borrador','activa','en_revision','rechazada','reservada',
                    'vendida','retirada'));
