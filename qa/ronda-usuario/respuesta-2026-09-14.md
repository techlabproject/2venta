# Respuesta al informe de pruebas de usuario — 2026-09-14

Los seis hallazgos eran reales y se reprodujeron en el código antes de tocar nada.
Todos quedan cerrados con prueba en `e2e/pago-abandonado.spec.ts` y en las suites
que ya existían.

## Los dos críticos

**El total de la pasarela.** Confirmado y acotado: el monto que se le manda al
proveedor **siempre estuvo bien** (`actions.ts` le pasa `buyerTotalCop`, producto más
envío), y el pedido cobra lo correcto. Lo que mentía era la pantalla del proveedor de
prueba, que mostraba `subtotal_cop` bajo el rótulo «Total a pagar». Es una pantalla
que no existe en producción, así que no había dinero en riesgo — pero es justo la
pantalla donde uno revisa que las cuentas cuadren, y llevó a un probador cuidadoso a
concluir que el cobro estaba mal. Ahora desglosa producto, envío y total, y aparte el
reparto (comisión, vendedor, transportadora).

**La reserva que no se soltaba.** El más grave de los seis, y el diagnóstico del
informe era exacto. Reservar al empezar el checkout es lo correcto —evita que dos
compradores paguen lo mismo— pero no había nada que deshiciera esa reserva: ni
caducidad, ni acción para soltarla, ni para el vendedor. Peor: quien abandonaba no
podía volver a comprar **su propio** artículo, y se le decía que «alguien más se
adelantó». Tres arreglos:

1. La ficha ya no miente. Si está reservado por un pago tuyo sin terminar, lo dice y
   te lleva a tu pedido.
2. El pedido sin pagar ofrece terminar el pago o cancelarlo. Cancelar suelta el
   artículo en el acto.
3. Los pedidos sin pagar **caducan solos a los 30 minutos** (`caducar`, por la cola,
   cada 10 minutos). Cubre a quien nunca vuelve, que es el caso que deja al vendedor
   con el artículo bloqueado sin saberlo.

## Los dos altos

**La comisión doble en el informe de administración.** Real, y con una causa exacta:
la consulta por categoría hace `join order_items` y sumaba `o.commission_cop`, que es
del pedido, una vez por renglón. Un pedido de dos artículos reportaba el doble. Ahora
se reparte a prorrata del precio de cada renglón, que es lo único que hace que la
suma de las categorías vuelva a dar la comisión del pedido.

**Cerrar una sesión sin confirmación.** La acción borraba la fila y no revalidaba la
página, así que no pasaba nada visible hasta recargar. Una línea. Que la fila
desaparezca es la confirmación.

## Los dos medios

**«Esto ya no está» para errores de permisos.** Era un texto escrito para un artículo
vendido, y se usaba también para pantallas ajenas. Ahora el 404 no afirma que se trate
de un artículo; y editar una publicación que no es tuya lo dice con todas las letras,
**pero solo si la publicación ya es pública**: de una en revisión o rechazada no se
confirma ni que exista.

**Los datos de entrega que se perdían.** Se recuerdan en el navegador mientras se arma
la compra. No salen del dispositivo, y si el almacenamiento está bloqueado el
formulario funciona igual.

## Lo que el informe no vio y salió de perseguirlo

- **Una prueba de cifrado que fallaba una vez de cada 256.** `otp.test.ts` alteraba el
  dato cambiando los dos últimos caracteres por «ff»: cuando el dato ya terminaba en
  «ff» no alteraba nada y la prueba comprobaba que un dato intacto se descifra. Una
  prueba de integridad que a veces no prueba nada es peor que no tenerla.
- **El worker de `docker compose` corre una imagen construida, no el código fuente**, y
  compite por los mensajes con las pruebas. Al agregar el trabajo `caducar` se comía
  los mensajes y los descartaba en silencio. Anotado en `CLAUDE.md`.

## De la lista de «no verificado»

Casi todo lo que quedó sin verificar (SMS real, cámara, reclamos con evidencia,
retiro bancario, notificaciones) no está sin probar por descuido: son las piezas que
siguen conectadas a proveedores de mentira. Ver `NOTES.md`.
