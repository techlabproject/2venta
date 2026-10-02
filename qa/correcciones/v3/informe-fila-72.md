# Informe E2E compra–venta en la nube — fila 72

Fecha de ejecución: 1–2 de octubre de 2026, America/Bogota  
Entorno: `https://d13g2bd9j8wj8k.cloudfront.net` (`dev`)  
Anchos: 390 × 844 px móvil; comprobación adicional a 1280 px.  
Cuentas usadas: `laura@2venta.demo`, `camila@2venta.demo`, `andres@2venta.demo`, `admin@2venta.demo`.

## Veredicto

**PASA CON OBSERVACIONES.** El flujo funciona de punta a punta en la nube: búsqueda, chat entre comprador y vendedora, pago simulado con envío, guía, entrega, liberación y calificación; compra presencial con zona/lugar, código correcto e incorrecto; reclamo con respuesta y decisión administrativa; y cancelación de una compra no pagada. El dinero y los estados finales se reflejan en las dos partes.

Las observaciones importantes son: la pantalla muestra estados futuros de despacho/entrega antes de que la vendedora genere la guía; para $2.800.000 aplica una comisión visible de $120.000 (tope) aunque el recorrido solicitado comunica “5 % mín. $2.500” y no muestra ese tope; y el formulario de reclamo está plegado bajo un texto que parece enlace, no un botón.

## Recorrido

| Paso | Persona y acción | Qué vio / resultado exacto | URL y ancho | Evidencia |
|---|---|---|---|---|
| 1. Existencia de datos | Laura inició sesión y buscó Control DualShock | Existía el artículo demo, `$ 140.000`, vendedor `Camila V.`, verificado | `/buscar?q=Control%20DualShock` · 390 | [búsqueda](capturas/01-laura-busca-control-390.png) |
| 2. Ficha | Laura abrió el control | “Control DualShock 4 original, negro”, `$ 140.000`, “Camila V. · Verificado”, “Comprar con pago protegido” | `/producto/778ab212-f35c-4582-98bd-7294efa9e0a0` · 390 | [ficha](capturas/02-laura-ficha-control-390.png) |
| 3. Chat comprador | Laura escribió: “Hola Camila, ¿sigue disponible? Me interesa comprarlo con pago protegido.” | Se creó la conversación con Camila; el mensaje quedó visible | `/chat/33394fc7-76ea-4228-80e2-72744f42958c` · 390 | [mensaje](capturas/04-laura-mensaje-enviado-390.png) |
| 4. Chat vendedora | Camila abrió Chats y respondió: “Hola Laura, sí, sigue disponible. Te lo envío por 10.000 pesos y el pago queda protegido.” | Camila vio “1 conversación sin leer” y la respuesta quedó en el chat | `/chats`, `/chat/33394fc7-76ea-4228-80e2-72744f42958c` · 390 | [chats](capturas/05-camila-chats-390.png), [respuesta](capturas/07-camila-responde-390.png) |
| 5. Envío y dirección | Laura eligió “Te lo enviamos”; usó dirección inventada `Calle 72 #10-34, Torre 2, apto 501`, zona Chapinero, Bogotá | Producto `$ 140.000`; envío `$ 10.000`; total `$ 150.000` | `/comprar/778ab212-f35c-4582-98bd-7294efa9e0a0` · 390 | [método](capturas/08-laura-metodo-entrega-390.png) |
| 6. Pago envío | Laura pulsó “Simular pago aprobado” | En `/dev/pago`: comisión `$ 7.000`, recibe la vendedora `$ 133.000`, transportadora `$ 10.000` | `/dev/pago/fb8b306a-d0bf-4f4e-bd73-55126fd80af0` · 390 | [desglose](capturas/09-laura-resumen-pago-390.png), [pedido pagado](capturas/10-laura-pago-aprobado-pedido-390.png) |
| 7. Pedido vendedora | Camila abrió el pedido y generó la guía | Vio “Comisión 2venta `$ 7.000`”, “Recibes `$ 133.000`”, botón “Generar guía y despachar”; luego `Guía GUIA-FB8B306A`, “Transportadora de prueba” | `/pedido/fb8b306a-d0bf-4f4e-bd73-55126fd80af0` · 390 | [pedido Camila](capturas/12-camila-pedido-pago-390.png), [guía](capturas/13-camila-guia-generada-390.png) |
| 8. Seguimiento y liberación | Laura volvió al pedido, vio la guía/entrega y pulsó “Ya lo recibí, liberar pago” | “Pago liberado al vendedor”; `$ 150.000` guardados antes de liberar; después “Ya calificaste este pedido” | `/pedido/fb8b306a-d0bf-4f4e-bd73-55126fd80af0` · 390 | [seguimiento](capturas/14-laura-seguimiento-entregado-390.png), [liberado](capturas/15-laura-pago-liberado-390.png), [calificación](capturas/16-laura-califico-390.png) |
| 9. Calificaciones | Laura y Camila eligieron 5 de 5 y pulsaron “Calificar” | Ambas vieron “Ya calificaste este pedido” | `/pedido/fb8b306a-d0bf-4f4e-bd73-55126fd80af0` · 390 | [Camila califica](capturas/18-camila-califico-compradora-390.png) |
| 10. Presencial | Laura abrió el MacBook de Camila, eligió “Nos vemos en persona”, zona Chapinero y Parque de la 93 | Total `$ 2.800.000`, envío `$ 0`, lugar “Parque de la 93 (Chapinero)” | `/comprar/ec05092e-701e-4b49-b9e6-ac2a8a7146ac` · 390 | [opciones](capturas/20-laura-presencial-opciones-390.png), [zona/lugar](capturas/21-laura-zona-lugar-elegidos-390.png) |
| 11. Pago presencial | Laura simuló el pago aprobado | Código de entrega `890092`; pago protegido `$ 2.800.000`; la pantalla muestra comisión `$ 120.000` y recepción `$ 2.680.000` | `/dev/pago/6479475d-a006-4a0b-8727-f9a2fe078dd0` · 390 | [pago](capturas/22-laura-pago-presencial-390.png), [código](capturas/23-laura-pago-presencial-aprobado-390.png) |
| 12. Código presencial equivocado | Camila introdujo `111111` | “Ese código no es. Pídele al comprador que lo lea otra vez. Te quedan 4 intentos.” El dinero no se liberó | `/pedido/6479475d-a006-4a0b-8727-f9a2fe078dd0` · 390 | [error](capturas/25-camila-codigo-equivocado-390.png) |
| 13. Código presencial correcto | Camila introdujo `890092` y pulsó “Cobrar la venta” | “Pago liberado al vendedor”; “$ 2.680.000 ya son tuyos” | `/pedido/6479475d-a006-4a0b-8727-f9a2fe078dd0` · 390 | [cobro](capturas/26-camila-codigo-correcto-cobro-390.png) |
| 14. Reclamo: compra | Laura compró Tenis Converse de Andrés con envío | Producto `$ 120.000`; envío `$ 10.000`; total/pagado `$ 130.000` | `/dev/pago/c6d7ce3a-78f0-477e-8cf5-8d9719f1e691` → `/pedido/c6d7ce3a-78f0-477e-8cf5-8d9719f1e691` · 390 | [desglose](capturas/29-laura-pago-tenis-resumen-390.png), [pedido](capturas/30-laura-tenis-pagado-390.png) |
| 15. Reclamo: despacho | Andrés abrió el pedido y generó guía | Comisión `$ 6.000`; recibe `$ 114.000`; `GUIA-C6D7CE3A`, transportadora de prueba; quedó “Entregado” | `/pedido/c6d7ce3a-78f0-477e-8cf5-8d9719f1e691` · 390 | [pedido Andrés](capturas/32-andres-pedido-tenis-pagado-390.png), [guía](capturas/33-andres-guia-tenis-390.png) |
| 16. Reclamo abierto | Laura eligió “Llegó, pero no es lo que decía la publicación” y escribió el detalle | “Con un reclamo abierto”; “El dinero no se mueve mientras lo revisamos” | `/pedido/c6d7ce3a-78f0-477e-8cf5-8d9719f1e691` · 390 | [reclamo](capturas/35-laura-reclamo-abierto-390.png) |
| 17. Respuesta vendedor | Andrés escribió su versión y pulsó “Responder” | Se añadió “Dice quien vendió” con su respuesta | `/pedido/c6d7ce3a-78f0-477e-8cf5-8d9719f1e691` · 390 | [respuesta](capturas/37-andres-responde-reclamo-390.png) |
| 18. Decisión admin | Admin abrió Disputas y eligió “Liberar al vendedor”, con nota | La cola pasó de “2 reclamos abiertos” a “1 reclamo abierto”; el reclamo de Tenis salió de la cola | `/admin/disputas` · 390 | [cola](capturas/38-admin-disputas-390.png), [decisión](capturas/39-admin-decide-liberar-vendedor-390.png) |
| 19. Dinero/estado post-reclamo | Laura y Andrés volvieron al mismo pedido | Laura: “Pago liberado al vendedor”, “Resuelto a favor de quien vendió”. Andrés: “$ 114.000 ya son tuyos” | `/pedido/c6d7ce3a-78f0-477e-8cf5-8d9719f1e691` · 390 | [Laura](capturas/40-laura-reclamo-resuelto-390.png), [Andrés](capturas/41-andres-reclamo-resuelto-390.png) |
| 20. Cancelar sin pagar | Laura inició Tornamesa, llegó a `/dev/pago` pero no simuló pago | Pedido “Esperando el pago”; “Cancelarlo”; el artículo estaba apartado | `/pedido/4d2b064e-e342-4a19-a527-2c1d6ba903ee` · 390 | [pago no realizado](capturas/44-laura-pago-no-realizado-390.png), [pedido apartado](capturas/46-laura-pedido-sin-pagar-390.png) |
| 21. Cancelación | Laura pulsó “Cancelar este pedido” | “Cancelado”, “No se cobró nada y el artículo volvió al catálogo”; después la ficha volvió a mostrar “Comprar con pago protegido” | `/pedido/4d2b064e-e342-4a19-a527-2c1d6ba903ee`, `/producto/15cde5e2-45d8-4e76-8862-28d969ba1d39` · 390 | [cancelado](capturas/48-laura-pedido-cancelado-390.png), [liberado](capturas/49-laura-articulo-liberado-cancelado-390.png) |
| 22. Avisos | Laura y Camila revisaron Avisos | Laura: “Mensaje nuevo sobre Control DualShock 4 original, negro”; Camila vio el mismo aviso | `/avisos` · 390 | [Laura](capturas/50-laura-avisos-390.png), [Camila](capturas/51-camila-avisos-390.png) |
| 23. Escritorio | Laura repitió la comprobación visual de búsqueda/ficha/pedido final | A 1280 px se ven la búsqueda responsive, la ficha “Este artículo ya se vendió” y el pedido final con pago liberado/calificación | `/buscar?q=Gafas`, `/producto/778ab212-f35c-4582-98bd-7294efa9e0a0`, `/pedido/fb8b306a-d0bf-4f4e-bd73-55126fd80af0` · 1280 | [búsqueda](capturas/52-laura-busqueda-1280.png), [ficha](capturas/53-laura-control-vendido-1280.png), [pedido](capturas/54-laura-pedido-final-1280.png) |

## Hallazgos

### H1 — Severidad media: el timeline anuncia despacho/entrega antes de la guía

- Pasos: después de aprobar el pago del Control y de los Tenis, antes de que Camila/Andrés pulsaran “Generar guía y despachar”.
- Esperado: estado pendiente o “Pago guardado”; “Despachado” y “Entregado” solo después de la acción de la vendedora/transportadora.
- Visto: la página muestra “El vendedor despachó”, “Ya lo entregó a la transportadora” y “Entregado”, pero simultáneamente muestra “Te pagaron. Ya puedes despachar” y el botón “Generar guía y despachar”. Tras pulsar el botón aparecen los timestamps reales.
- Evidencia: [Laura tras pago](capturas/10-laura-pago-aprobado-pedido-390.png), [Camila antes de guía](capturas/12-camila-pedido-pago-390.png), [Andrés antes de guía](capturas/32-andres-pedido-tenis-pagado-390.png).

### H2 — Severidad media: el tope de comisión no se explica en el pago

- Paso: compra presencial del MacBook de `$ 2.800.000`.
- Esperado según el recorrido solicitado: comisión del 5 % con mínimo `$ 2.500`; 5 % de `$ 2.800.000` sería `$ 140.000`, con recepción de `$ 2.660.000`.
- Visto: la pantalla dice “Comisión 2venta `$ 120.000`” y “Recibe el vendedor `$ 2.680.000`”. El envío sí fue correctamente `$ 0` y no entró en la comisión.
- Impacto: la cifra puede parecer incorrecta o arbitraria para comprador/vendedor; si `$ 120.000` es un techo intencional, no se comunica en el desglose de pago.
- Evidencia: [pago presencial](capturas/22-laura-pago-presencial-390.png), [vista Camila](capturas/24-camila-presencial-cobro-390.png).

### H3 — Severidad baja: el acceso al reclamo es poco descubrible

- Paso: pedido entregado de Tenis, Laura intenta abrir un reclamo.
- Esperado: un botón o control claramente accionable que abra el formulario.
- Visto: “Tengo un problema con el pedido” es un `<summary>` plegado; el formulario (tipo de problema, detalle y “Abrir reclamo”) no aparece hasta abrir ese texto. Tratarlo como botón no hace nada; como summary sí funciona.
- Impacto: una persona puede no advertir que el texto se puede desplegar.
- Evidencia: [pedido antes de abrir](capturas/34-laura-tenis-entregado-reclamo-390.png), [formulario/reclamo](capturas/35-laura-reclamo-abierto-390.png).

## Artículos y pedidos usados

| Artículo | Vendedor | Pedido | Estado final |
|---|---|---|---|
| Control DualShock 4 original, negro — `$ 140.000` | Camila V. | `fb8b306a-d0bf-4f4e-bd73-55126fd80af0` | Envío, guía `GUIA-FB8B306A`, entregado, pago liberado, ambas partes calificaron 5/5 |
| MacBook Air 13" 2020, 8 GB, 256 GB — `$ 2.800.000` | Camila V. | `6479475d-a006-4a0b-8727-f9a2fe078dd0` | Presencial en Parque de la 93, código `890092`, pago cobrado por Camila, `$ 2.680.000` visibles como suyos |
| Tenis Converse Chuck Taylor talla 42 — `$ 120.000` | Andrés M. | `c6d7ce3a-78f0-477e-8cf5-8d9719f1e691` | Envío, guía `GUIA-C6D7CE3A`, reclamo resuelto a favor del vendedor, Andrés ve `$ 114.000` como suyos |
| Tornamesa Audio-Technica LP60 — `$ 620.000` | Andrés M. | `4d2b064e-e342-4a19-a527-2c1d6ba903ee` | Compra iniciada sin pagar y cancelada; no se cobró y volvió al catálogo |

## NO VERIFICADO

- No se probó una devolución a favor del comprador (“Devolver al comprador”); sí se probó la decisión alternativa “Liberar al vendedor”.
- No se ejecutó una entrega real ni un operador externo: la transportadora, el pago y la verificación de identidad son las simulaciones `/dev/` del entorno indicado.
- No se esperaron los 30 minutos de expiración automática del pedido no pagado; se comprobó la cancelación manual y el retorno inmediato al catálogo.
- No se probó retiro bancario; la app muestra que los fondos quedan en el proveedor de pagos y que el retiro todavía no se puede hacer desde la app.
- A 1280 px se verificó el estado visual final y navegación de búsqueda/ficha/pedido; no se repitió todo el intercambio, pago y despacho completo porque los artículos Camila usados en el E2E ya estaban vendidos.
