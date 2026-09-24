import { Client } from "pg";

/**
 * Avisos en vivo de las conversaciones (corrección 20).
 *
 * Postgres avisa por el canal `chat` cada vez que una conversación cambia
 * (migración 0018). Cada proceso web abre UNA conexión que escucha ese canal y
 * reparte el aviso entre los navegadores que tienen abierta esa conversación. Con
 * varios servidores detrás del balanceador, todos oyen el mismo aviso: no hace falta
 * nada más en la nube.
 *
 * El aviso es solo «la conversación X cambió». Qué se ve lo decide la pantalla al
 * volver a pedirse, con sus controles de acceso de siempre.
 */

type Oyente = () => void;

const estado = globalThis as unknown as {
  __chatEnVivo?: {
    oyentes: Map<string, Set<Oyente>>;
    cliente: Promise<Client> | null;
  };
};

const vivo = (estado.__chatEnVivo ??= { oyentes: new Map(), cliente: null });

function conectar(): Promise<Client> {
  if (vivo.cliente) return vivo.cliente;
  const cliente = new Client({ connectionString: process.env.DATABASE_URL });
  vivo.cliente = (async () => {
    // Si la conexión se cae (reinicio de la base, red), se vuelve a abrir mientras
    // haya alguien oyendo. Mientras tanto se avisa a todos una vez, para que ninguna
    // pantalla se quede sin lo que llegó durante el corte.
    let cayo = false;
    const caida = () => {
      if (cayo) return;
      cayo = true;
      vivo.cliente = null;
      cliente.removeAllListeners();
      cliente.on("error", () => {});
      cliente.end().catch(() => {});
      for (const oyentes of vivo.oyentes.values()) for (const o of oyentes) o();
      if (vivo.oyentes.size > 0) {
        setTimeout(() => conectar().catch(() => {}), 2000);
      }
    };
    cliente.on("error", caida);
    cliente.on("end", caida);
    cliente.on("notification", (n) => {
      if (n.channel !== "chat" || !n.payload) return;
      for (const o of vivo.oyentes.get(n.payload) ?? []) o();
    });
    await cliente.connect();
    await cliente.query("listen chat");
    return cliente;
  })();
  vivo.cliente.catch(() => {
    vivo.cliente = null;
  });
  return vivo.cliente;
}

/** Llama a `oyente` cada vez que cambia la conversación. Devuelve cómo dejar de oír. */
export async function escucharConversacion(
  conversationId: string,
  oyente: Oyente,
): Promise<() => void> {
  await conectar();
  let oyentes = vivo.oyentes.get(conversationId);
  if (!oyentes) vivo.oyentes.set(conversationId, (oyentes = new Set<Oyente>()));
  oyentes.add(oyente);
  return () => {
    oyentes.delete(oyente);
    if (oyentes.size === 0) vivo.oyentes.delete(conversationId);
  };
}
