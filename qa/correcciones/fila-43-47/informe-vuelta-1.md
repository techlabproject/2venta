Veredicto: NO PASA — los recorridos normales pasan, pero un vendedor puede falsificar el punto oculto del perfil y mostrar distancias falsas sin que el servidor lo rechace.

## Hallazgos

1. **Media — El punto del vendedor no se valida contra la zona visible.**

   - **Ancho:** 390 × 844.
   - **Pasos:** iniciar sesión como `camila@2venta.demo`; abrir `http://localhost:3100/cuenta/editar`; dejar la zona en `Chapinero`; inyectar `lat=4.71` y `lng=-74.03`; pulsar `Guardar`; abrir un contexto comprador en `http://localhost:3100/buscar`; elegir `Chapinero` y pulsar `Listo`.
   - **Esperaba:** rechazo o corrección del punto para que correspondiera a Chapinero.
   - **Vi:** el perfil siguió mostrando `Chapinero` y `Tienes guardado un punto de tu celular, aproximado a 1 km.`. La tarjeta apareció como `Chapinero · a unos 7 km`.
   - **Capturas:** [perfil](capturas/D-punto-falsificado-perfil.png), [tarjeta comprador](capturas/D-punto-falsificado-visible-comprador.png).

2. **Baja — El filtro de escritorio deja parámetros vacíos en la URL.**

   - **Ancho:** 1280 × 800.
   - **Pasos:** abrir `http://localhost:3100/buscar`; elegir `Chapinero`; seleccionar `Distancia → A menos de 5 km`; pulsar `Aplicar`.
   - **Esperaba:** `http://localhost:3100/buscar?radio=5`.
   - **Vi:** funcionó y mostró `6 resultados`, pero la URL quedó `http://localhost:3100/buscar?min=&max=&radio=5&zona=&orden=recientes`.
   - **Captura:** [columna de filtros](capturas/B-buscar-radio5-escritorio.png).

## Lo que verifiqué y pasa

- Sin ubicación, en 390 y 1280, aparece `¿Dónde estás?` y `Te decimos a cuántos kilómetros está cada artículo. Solo lo guardamos en este navegador, aproximado a 1 km.`.
- El radio queda deshabilitado con el texto `Dinos dónde estás (arriba de los resultados) para filtrar por distancia.`.
- Elegir Chapinero funciona con y sin JavaScript. La cookie queda redondeada y `httpOnly`; `Quitar` elimina la ubicación.
- Teusaquillo mostró distancias coherentes: Chapinero `a unos 2 km` y Usaquén `a unos 9 km`.
- Medellín mostró `Por ahora 2venta funciona en Bogotá y sus municipios vecinos. Elige una zona de la lista.` y no guardó ubicación.
- Las listas incluyen las 19 localidades de Bogotá más Soacha, Chía, Cajicá, Cota, Funza, Mosquera, Madrid y La Calera; no contienen Sumapaz ni Medellín.
- En compra no apareció campo `Ciudad`; `Zona` y `¿En qué zona se ven?` usan la lista cerrada.
- Los radios 2, 5, 10 y 20 km devolvieron 6, 6, 12 y 12 resultados respectivamente desde Chapinero.
- `Más cerca` ordenó primero las tarjetas de Chapinero y después las de Usaquén.
- Laura pudo guardar una búsqueda con radio. Se vio `Guardada. Te avisamos cuando aparezca algo que coincida.`.
- Camila pudo usar ubicación, guardar, volver a guardar y cambiar manualmente a Chapinero. Sus tarjetas mostraron `Chapinero · a menos de 1 km`.
- Cookies manipuladas con coordenadas inválidas, zona inventada o formato basura fueron ignoradas.
- El intento contra `/api/auth/update-user` respondió HTTP `400` con `{"message":"zone is not allowed to be set","code":"FIELD_NOT_ALLOWED"}`.
- La ficha pública no mostró dirección ni coordenadas exactas. `/legal` contiene `Ubicación aproximada:` y explica el redondeo a cerca de 1 km.

## Observaciones fuera de alcance

- El sembrado visible no tiene `iPhone 13`, `Chaqueta de jean` ni `Coche Chicco`; se probaron los artículos disponibles.
- En escritorio apareció un badge rojo del entorno de desarrollo con `1 Issue`; no lo atribuí a D-122.
- Camila quedó restaurada a Chapinero y al centro de su zona.

## NO VERIFICADO

- `Ver más` con radio: el catálogo local solo mostró 12 resultados en total y 6 con radio de 2/5 km, por lo que no apareció el enlace en 390 ni en 1280.