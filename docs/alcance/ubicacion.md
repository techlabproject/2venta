# Ubicación: zonas, ciudad y alcance geográfico

Correcciones 43, 44, 45 y 51 de Catalina, que son una sola decisión:
- 43: «¿El campo de zona debería ser un desplegable para estandarizar zonas?»
- 44: «Solo está pensado para Bogotá, no pide ciudad, solo zona. Plantear alcance.»
- 45: «¿Solo se vende en Bogotá por zonas? ¿Debería ser a nivel de ciudades?»
- 51 (v2): «Ajustar los filtros a las ciudades principales de Colombia, nada rural.»

## Cómo está hoy

- **D-06: la versión 1 es solo Bogotá.** No se pide ciudad.
- La **zona es texto libre** en «Editar tu perfil». El filtro «Zona» de la búsqueda sale
  de las zonas que la gente ha escrito, así que «Chapinero», «chapinero» y «Chapi»
  quedan como zonas distintas.
- El envío cuesta **$12.000 fijos** (proveedor de envío simulado) y «Nos vemos en
  persona» pide una zona.

## Propuesta

| Paso | Qué | Esfuerzo |
|---|---|---|
| **1. Zonas estandarizadas (43)** | Desplegable con las **20 localidades de Bogotá** (Usaquén, Chapinero, Santa Fe, San Cristóbal, Usme, Tunjuelito, Bosa, Kennedy, Fontibón, Engativá, Suba, Barrios Unidos, Teusaquillo, Los Mártires, Antonio Nariño, Puente Aranda, La Candelaria, Rafael Uribe Uribe, Ciudad Bolívar, Sumapaz). Migración que lleva las zonas escritas a mano a la localidad más parecida y deja en «sin zona» lo que no se reconozca | Bajo |
| **2. Ciudad (44, 45, 51)** | Campo «Ciudad» con las ciudades principales (Bogotá, Medellín, Cali, Barranquilla, Cartagena, Bucaramanga, Pereira, Manizales, Cúcuta, Ibagué, Santa Marta, Villavicencio); la zona depende de la ciudad (localidades en Bogotá, comunas en Medellín y Cali, etc.). Filtro por ciudad en la portada y en la búsqueda | Medio |
| **3. Envío por ciudad (con la 47)** | Tarifa según origen y destino (misma ciudad ~$10.000–12.000; entre ciudades, según la transportadora) | Depende del proveedor de envíos |

**Recomendación:** hacer **1 ya** (arregla un problema real de datos) y **2 cuando se
decida salir de Bogotá**: cambia la D-06, la política de datos, el envío y el mercadeo.
Si se hace 2, «Nos vemos en persona» solo tiene sentido entre personas de la misma
ciudad.

## Preguntas para Nicolás

1. ¿Localidades de Bogotá como desplegable ahora?
2. ¿Cuándo se abre a otras ciudades y cuáles primero?
3. ¿Entre ciudades se permite comprar (con envío nacional) o solo dentro de la misma?
