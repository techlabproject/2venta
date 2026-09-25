-- D-120 (2026-09-24): los códigos también salen por SMS con Twilio. La tabla de
-- envíos pasa a ser de los dos canales: el id del mensaje ya no es solo de WhatsApp
-- (`wamid…`), también de Twilio (`SM…`).
alter table envios_codigo rename column wamid to mensaje_id;
alter table envios_codigo add column if not exists canal text not null default 'whatsapp'
  check (canal in ('whatsapp', 'sms'));
