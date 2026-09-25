# Informe de Luna — vuelta 2

**Veredicto: PASA CON OBSERVACIONES — las tres correcciones pasan en los recorridos ejecutables y ante las manipulaciones probadas; queda pendiente confirmar externamente el sembrado de lugares y no apareció «Ver más» con el catálogo corto.**

## Hallazgos

1. **Baja — El sembrado de lugares sigue pendiente de confirmación real. No encontré un nombre obviamente inexistente ni una zona obviamente equivocada.**

   - **Ancho:** 390 × 844 y 1280 × 800.
   - **Pasos:** en `http://localhost:3100/comprar/391778d3-67c0-4bfa-bd3b-1d68fca571f0`, como Laura, elegir «Nos vemos en persona» y revisar las opciones de `Chapinero`; recorrer las zonas de la lista en 1280.
   - **Esperaba:** lugares públicos reconocibles y coherentes con la zona, o el mensaje de que aún no hay sugerencias.
   - **Vi:** en Chapinero, `Centro Comercial Andino`, `Centro Comercial Avenida Chile` y `Parque de la 93`; en Cota, exactamente `Todavía no tenemos lugares sugeridos en Cota. Acuerden por el chat un lugar público y concurrido.`. También vi listas coherentes para Usaquén, Santa Fe, Tunjuelito, Bosa, Kennedy, Fontibón, Engativá, Suba, Teusaquillo, Antonio Nariño, Puente Aranda, La Candelaria, Soacha y Chía; las zonas restantes no mostraron lugares sugeridos. La migración deja estos registros «por confirmar».
   - **Capturas:** [lugares de Chapinero](capturas/v2-checkout-presencial-chapinero-390.png), [Cota sin sugerencias en 390](capturas/v2-checkout-cota-sin-lugares-390.png), [Cota sin sugerencias en 1280](capturas/v2-checkout-cota-sin-lugares-1280.png).

No se encontraron otros defectos funcionales en las correcciones 43–47 ejecutadas.

## Lo que verifiqué y pasa

- **Perfil de Camila, validación de punto (390):** al enviar `lat=4.71` y `lng=-74.03` con `Chapinero`, apareció: `Ese punto no queda en Chapinero. Vuelve a tocar «Usar mi ubicación» o elige la zona sin él.`. URL: `http://localhost:3100/cuenta/editar`. [Captura](capturas/v2-profile-punto-fuera-zona-390.png)

- **Perfil con zona inventada (390):** apareció exactamente `Elige tu zona de la lista.` en `http://localhost:3100/cuenta/editar`. [Captura](capturas/v2-profile-zona-inventada-390.png)

- **URLs limpias:**  
  `http://localhost:3100/?min=&max=&categoria=ropa&orden=recientes` terminó en `http://localhost:3100/?categoria=ropa`.  
  `http://localhost:3100/buscar?min=&max=&zona=&orden=recientes&q=chaqueta` terminó en `http://localhost:3100/buscar?q=chaqueta`.  
  Funcionó en 390 y 1280. [Portada 390](capturas/v2-home-clean-390.png), [portada 1280](capturas/v2-home-clean-1280.png), [buscar 390](capturas/v2-search-clean-390.png), [buscar 1280](capturas/v2-search-clean-1280.png)

- **Radio y «Más cerca»:** conservaron únicamente sus parámetros en portada y `/buscar`, en ambos anchos. «Más cerca» mostró primero `Chapinero · a menos de 1 km` y después `Usaquén · a unos 7 km`. [Radio móvil](capturas/v2-search-radio-390.png), [radio escritorio](capturas/v2-search-radio-1280.png), [cerca móvil](capturas/v2-search-cerca-390.png), [cerca escritorio](capturas/v2-search-cerca-1280.png)

- **Ficha pública:** Camila apareció como `Camila V.`, `Verificado` y `Primera venta en 2venta · identidad verificada · Chapinero`; Andrés apareció como `Andrés M.` y `Usaquén`. No vi dirección ni coordenadas. [Camila](capturas/v2-ficha-camila-390.png), [Andrés](capturas/v2-ficha-andres-1280.png)

- **Compra presencial:** se mostró `¿Dónde exactamente?`, el primer lugar marcado, los tres lugares de Chapinero y `Otro lugar público: lo acuerdan por el chat`. También apareció `Para el encuentro` con consejos de seguridad. [Captura](capturas/v2-checkout-presencial-chapinero-390.png)

- **Zona sin lugares:** Cota mostró exactamente `Todavía no tenemos lugares sugeridos en Cota. Acuerden por el chat un lugar público y concurrido.` y mantuvo `Envío` → `Sin costo`. [390](capturas/v2-checkout-cota-sin-lugares-390.png), [1280](capturas/v2-checkout-cota-sin-lugares-1280.png)

- **Manipulación de lugar:** un UUID real de Chía enviado como lugar de Chapinero devolvió `Elige un lugar de la lista para el encuentro.`. La compra permaneció en presencial. [Captura](capturas/v2-error-lugar-otra-zona-390.png)

- **Manipulación de zona:** una zona `Inventada` devolvió `Elige una zona de la lista.`. La compra permaneció en presencial. [Captura](capturas/v2-error-zona-inventada-390-fixed.png)

- **Pedido presencial:** Laura y Camila vieron exactamente: `Se ven en Centro Comercial Andino (Chapinero). La hora la acuerdan por el chat.` y la tarjeta `Para el encuentro`. [Pago](capturas/v2-pago-presencial-390.png), [Laura](capturas/v2-pedido-comprador-presencial-390.png), [Camila](capturas/v2-pedido-vendedora-presencial-390.png)

- **Carrito y envío a 1280:** dos artículos de Andrés mostraron `Comprando junto te ahorras $ 10.750: un solo envío y una sola comisión en vez de 2.`; subtotal `$ 285.000`, envío `$ 10.000` y total `$ 295.000`. [Carrito](capturas/v2-carrito-dos-articulos-1280.png), [compra](capturas/v2-checkout-envio-carrito-1280.png), [pago](capturas/v2-pago-envio-1280.png)

- **Pedido de envío:** Laura y Andrés vieron `Envío` `$ 10.000`; Laura vio `Pagaste` `$ 295.000`. [Laura](capturas/v2-pedido-compradora-envio-1280.png), [Andrés](capturas/v2-pedido-vendedor-envio-1280.png)

- **Matriz adicional en 390:** dos artículos de Camila mostraron subtotal `$ 195.000`, ahorro de `$ 10.000`, envío `$ 10.000` y total `$ 205.000` en carrito, compra, pago y pedido. [Carrito](capturas/v2-carrito-dos-articulos-390.png), [compra](capturas/v2-checkout-envio-carrito-390.png), [pago](capturas/v2-pago-envio-390.png), [pedido de Laura](capturas/v2-pedido-compradora-envio-390.png), [pedido de Camila](capturas/v2-pedido-vendedora-envio-390.png)

- **Matriz adicional presencial en 1280:** el pedido de Tacones mostró `Se ven en Centro Comercial Andino (Chapinero). La hora la acuerdan por el chat.` para Laura y Camila. [Compra](capturas/v2-checkout-presencial-chapinero-1280.png), [pago](capturas/v2-pago-presencial-1280.png), [Laura](capturas/v2-pedido-comprador-presencial-1280.png), [Camila](capturas/v2-pedido-vendedora-presencial-1280.png)

## Observaciones fuera de alcance

- El pago mostró `Proveedor de pagos de prueba. ... No existe en producción.`.
- Lo tributario/facturación no apareció; está dejado para el contador.
- La lista de lugares está sembrada como «por confirmar». No vi un lugar aparentemente inexistente o asignado a otra zona, pero falta confirmación oficial.

## NO VERIFICADO

- `Ver más` con radio: no apareció con el catálogo disponible; se observaron `5 resultados` con radio de 5 km.
- JavaScript desactivado en esta vuelta.