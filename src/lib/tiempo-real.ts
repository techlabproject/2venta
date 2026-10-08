import { Client } from "pg";
import { query } from "@/lib/db";

/**
 * Avisos en vivo (corrección 20 y fila 73 de la revisión 4, D-131).
 *
 * Postgres avisa por dos canales: `chat`, con el id de la conversación que cambió
 * (migración 0018), y `aviso`, con el id de quien recibió una notificación (0030).
 * Cada proceso web abre UNA conexión que escucha los dos y reparte el aviso entre
 * los navegadores interesados. Con varios servidores detrás del balanceador, todos
 * oyen el mismo aviso: no hace falta nada más en la nube.
 *
 * El aviso es solo «esto cambió». Qué se ve lo decide la pantalla al volver a
 * pedirse, con sus controles de acceso de siempre.
 */

type Oyente = () => void;
type Canal = "chat" | "aviso";

const estado = globalThis as unknown as {
  __chatEnVivo?: {
    oyentes: Map<string, Set<Oyente>>;
    cliente: Promise<Client> | null;
  };
};

const vivo = (estado.__chatEnVivo ??= { oyentes: new Map(), cliente: null });

const clave = (canal: Canal, id: string) => `${canal}:${id}`;

function repartir(canal: Canal, id: string) {
  for (const o of vivo.oyentes.get(clave(canal, id)) ?? []) o();
}

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
      if (!n.payload) return;
      if (n.channel === "chat") {
        repartir("chat", n.payload);
        // A la lista de conversaciones de cada parte también le interesa: un
        // segundo mensaje en el mismo minuto no crea notificación (se agrupan),
        // pero la lista tiene que mostrarlo.
        if (hayOyentesDePersona()) avisarPartes(n.payload).catch(() => {});
      } else if (n.channel === "aviso") {
        repartir("aviso", n.payload);
      }
    });
    await cliente.connect();
    await cliente.query("listen chat");
    await cliente.query("listen aviso");
    return cliente;
  })();
  vivo.cliente.catch(() => {
    vivo.cliente = null;
  });
  return vivo.cliente;
}

function hayOyentesDePersona(): boolean {
  for (const k of vivo.oyentes.keys()) if (k.startsWith("aviso:")) return true;
  return false;
}

async function avisarPartes(conversationId: string) {
  const filas = await query<{ buyer_id: string; seller_id: string }>(
    `select buyer_id, seller_id from conversations where id = $1`,
    [conversationId],
  );
  const c = filas[0];
  if (!c) return;
  repartir("aviso", c.buyer_id);
  repartir("aviso", c.seller_id);
}

async function escuchar(canal: Canal, id: string, oyente: Oyente): Promise<() => void> {
  await conectar();
  const k = clave(canal, id);
  let oyentes = vivo.oyentes.get(k);
  if (!oyentes) vivo.oyentes.set(k, (oyentes = new Set<Oyente>()));
  oyentes.add(oyente);
  return () => {
    oyentes.delete(oyente);
    if (oyentes.size === 0) vivo.oyentes.delete(k);
  };
}

/** Llama a `oyente` cada vez que cambia la conversación. Devuelve cómo dejar de oír. */
export function escucharConversacion(conversationId: string, oyente: Oyente) {
  return escuchar("chat", conversationId, oyente);
}

/**
 * Llama a `oyente` cuando a esta persona le llega una notificación o cambia alguna
 * de sus conversaciones. Devuelve cómo dejar de oír.
 */
export function escucharPersona(userId: string, oyente: Oyente) {
  return escuchar("aviso", userId, oyente);
}

/**
 * La respuesta de eventos del servidor que comparten el chat abierto y los avisos
 * de la persona. `suscribir` recibe con qué avisar y devuelve cómo dejar de oír.
 */
export function flujoDeEventos(
  req: Request,
  suscribir: (avisar: () => void) => Promise<() => void>,
): Response {
  const codificar = new TextEncoder();
  let cerrar = () => {};
  const flujo = new ReadableStream<Uint8Array>({
    async start(control) {
      let abierto = true;
      const enviar = (texto: string) => {
        if (!abierto) return;
        try {
          control.enqueue(codificar.encode(texto));
        } catch {
          cerrar();
        }
      };
      const dejarDeOir = await suscribir(() => enviar("event: cambio\ndata: 1\n\n"));
      const latido = setInterval(() => enviar(": latido\n\n"), LATIDO_MS);
      cerrar = () => {
        if (!abierto) return;
        abierto = false;
        clearInterval(latido);
        dejarDeOir();
        try {
          control.close();
        } catch {}
      };
      req.signal.addEventListener("abort", cerrar);
      // Reintentar a los 3 s si se corta (un despliegue, el celular que cambia de red).
      enviar("retry: 3000\n\n");
    },
    cancel() {
      cerrar();
    },
  });

  return new Response(flujo, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-store, no-transform",
      Connection: "keep-alive",
      // Que nadie en medio (compresión incluida) acumule el flujo antes de mandarlo.
      "X-Accel-Buffering": "no",
      "Content-Encoding": "none",
    },
  });
}

// El balanceador corta a los 60 s sin tráfico y CloudFront antes. Un comentario
// cada 20 s mantiene la conexión viva sin que el navegador lo note.
const LATIDO_MS = 20_000;
