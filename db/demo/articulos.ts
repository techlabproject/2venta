// Los doce artículos de la demostración. Precios en pesos enteros, como manda
// la convención. `foto` es el id de la foto en picsum.photos (ver preparar.mts).

export type Articulo = {
  slug: string;
  vendedor: "camila" | "andres";
  title: string;
  description: string;
  category: "tecnologia" | "ropa" | "ninos";
  condition: "nuevo" | "usado_bueno" | "usado_regular";
  price_cop: number;
  imei?: string;
  /** Corrección 38: ropa lleva talla; artículos para niños, edad. */
  talla?: string;
  edad?: string;
  foto: number;
};

export const ARTICULOS: Articulo[] = [
  { slug: "macbook-air", vendedor: "camila", category: "tecnologia", condition: "usado_bueno", price_cop: 2_800_000, foto: 0,
    title: "MacBook Air 13\" 2020, 8 GB, 256 GB", description: "Lo usé para la universidad, dos años. Batería en 91 %, sin golpes, con cargador original. Lo vendo porque me pasé a uno de escritorio." },
  { slug: "iphone-12", vendedor: "andres", category: "tecnologia", condition: "usado_bueno", price_cop: 1_650_000, foto: 3, imei: "352099001761481",
    title: "iPhone 12 de 128 GB, azul", description: "Pantalla y cámaras perfectas. Tiene un rayón chiquito en el borde que se ve en el video. Batería al 87 %. Se entrega con caja." },
  { slug: "control-ps4", vendedor: "camila", category: "tecnologia", condition: "usado_bueno", price_cop: 140_000, foto: 96,
    title: "Control DualShock 4 original, negro", description: "Funciona perfecto, sticks sin drift. Lo pruebo en el video con la consola. Solo el control, sin cable." },
  { slug: "tornamesa", vendedor: "andres", category: "tecnologia", condition: "usado_bueno", price_cop: 620_000, foto: 39,
    title: "Tornamesa Audio-Technica LP60", description: "Con cápsula nueva de este año. Suena limpia, sin zumbido. Incluye el cable RCA. Entrega solo presencial por el tamaño." },
  { slug: "tacones-blancos", talla: "37", vendedor: "camila", category: "ropa", condition: "usado_bueno", price_cop: 95_000, foto: 21,
    title: "Tacones blancos talla 37, usados una vez", description: "Los compré para un matrimonio y solo los usé esa noche. Tacón de 9 cm, punta fina. Vienen con su caja." },
  { slug: "tenis-converse", talla: "42", vendedor: "andres", category: "ropa", condition: "usado_bueno", price_cop: 120_000, foto: 103,
    title: "Tenis Converse Chuck Taylor talla 42", description: "Un año de uso, suela buena. Lavados. Son originales, en el video se ve la etiqueta interior." },
  { slug: "gafas-aviador", talla: "Talla única", vendedor: "camila", category: "ropa", condition: "usado_bueno", price_cop: 85_000, foto: 64,
    title: "Gafas de sol estilo aviador, marco dorado", description: "Lentes sin rayones, marco firme. Incluyo el estuche. No son de marca." },
  { slug: "bolso-cuero", talla: "Talla única", vendedor: "andres", category: "ropa", condition: "usado_regular", price_cop: 180_000, foto: 7,
    title: "Bolso de cuero café, hecho a mano", description: "Cuero de verdad, se nota el uso en las esquinas (video). Cierre y correa en buen estado. Cabe un portátil de 13 pulgadas." },
  { slug: "triciclo", edad: "3 a 4 años", vendedor: "camila", category: "ninos", condition: "usado_bueno", price_cop: 110_000, foto: 146,
    title: "Triciclo rojo para niños de 2 a 4 años", description: "Metal, llantas de caucho. Mi hijo ya no lo usa. Limpio y sin partes sueltas." },
  { slug: "bicicleta-infantil", edad: "5 a 7 años", vendedor: "andres", category: "ninos", condition: "usado_bueno", price_cop: 250_000, foto: 76,
    title: "Bicicleta infantil rin 16, con rueditas", description: "Frenos ajustados y llantas nuevas. Las rueditas de apoyo van incluidas. Para niños entre 4 y 7 años." },
  { slug: "guante-beisbol", edad: "8 a 11 años", vendedor: "camila", category: "ninos", condition: "usado_bueno", price_cop: 70_000, foto: 73,
    title: "Guante de béisbol juvenil, cuero", description: "Talla juvenil, mano derecha (se pone en la izquierda). Cuero suave, ya amoldado. Incluye una pelota." },
  { slug: "atrapasuenos", edad: "0 a 6 meses", vendedor: "andres", category: "ninos", condition: "nuevo", price_cop: 35_000, foto: 104,
    title: "Atrapasueños para cuarto de bebé", description: "Nuevo, nunca colgado. 30 cm de diámetro, plumas naturales. Regalo repetido del baby shower." },
];
