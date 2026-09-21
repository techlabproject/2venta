"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui";

const MAX_SECONDS = 30;

type Props = {
  onCaptured: (video: Blob, poster: Blob) => void;
};

// Respuesta a R-01, el riesgo número uno del proyecto.
//
// Grabar con getUserMedia más MediaRecorder no es cargar un archivo: se consume el
// flujo en vivo de la cámara. Por eso la galería no es una fuente posible por
// construcción, y no por una validación que alguien pueda saltarse desde las
// herramientas del navegador. Esto es justamente lo que hace creíble el video
// obligatorio de la D-14.
//
// Requiere HTTPS (o localhost) y que la grabación arranque desde un gesto del
// usuario: las dos cosas son condiciones del navegador, no decisiones nuestras.
export function VideoCapture({ onCaptured }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const [state, setState] = useState<
    "inicial" | "listo" | "grabando" | "grabado"
  >("inicial");
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  async function openCamera() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setState("listo");
    } catch {
      setError(
        "No pudimos abrir la cámara. Revisa el permiso en tu navegador e intenta otra vez.",
      );
    }
  }

  function start() {
    const stream = streamRef.current;
    if (!stream) return;

    // Los códecs varían entre navegadores: iOS grababa en contenedor mp4 hasta la
    // 18.3 y Android entrega WebM. Se toma el primero que el navegador acepte, y
    // el servidor guarda lo que llegue.
    const mimeType = [
      "video/webm;codecs=vp8,opus",
      "video/webm",
      "video/mp4",
    ].find((t) => MediaRecorder.isTypeSupported(t));

    chunksRef.current = [];
    const recorder = new MediaRecorder(
      stream,
      mimeType ? { mimeType } : undefined,
    );
    recorder.ondataavailable = (e) =>
      e.data.size && chunksRef.current.push(e.data);
    recorder.onstop = finish;
    recorder.start();
    recorderRef.current = recorder;

    setState("grabando");
    setSeconds(0);
  }

  useEffect(() => {
    if (state !== "grabando") return;
    const id = setInterval(() => {
      setSeconds((s) => {
        if (s + 1 >= MAX_SECONDS) recorderRef.current?.stop();
        return s + 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [state]);

  async function finish() {
    const type = recorderRef.current?.mimeType ?? "video/webm";
    const blob = new Blob(chunksRef.current, { type });

    // La portada se toma de la cámara en vivo, antes de cerrarla. Sacarla del
    // archivo grabado no funciona: un video recién producido por MediaRecorder no
    // trae duración, así que no siempre se puede rebobinar para leer un cuadro.
    // Si sacar la portada falla, antes no se pintaba nada y el componente se
    // quedaba en «grabando» para siempre: `onCaptured` nunca se llamaba, así que
    // el botón de publicar seguía bloqueado sin explicación (ronda de
    // verificación, 2026-09-20).
    let poster;
    try {
      poster = await posterFromLive(videoRef.current);
    } catch {
      setError(
        "No pudimos sacar la portada del video. Vuelve a grabarlo, por favor.",
      );
      setState("listo");
      streamRef.current?.getTracks().forEach((t) => t.stop());
      return;
    }

    const url = URL.createObjectURL(blob);
    setPreview(url);
    setState("grabado");
    streamRef.current?.getTracks().forEach((t) => t.stop());

    onCaptured(blob, poster);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative overflow-hidden rounded-2xl bg-ph">
        <video
          ref={videoRef}
          data-testid="camara"
          className="aspect-[4/3] w-full object-cover"
          playsInline
          muted={state !== "grabado"}
          controls={state === "grabado"}
          src={state === "grabado" ? (preview ?? undefined) : undefined}
        />
        {state === "grabando" && (
          <span className="absolute top-3 left-3 rounded-full bg-danger px-3 py-1 text-xs font-medium text-white">
            Grabando · {seconds}s
          </span>
        )}
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger"
        >
          {error}
        </p>
      )}

      {state === "inicial" && (
        <>
          <Button type="button" variant="outline" onClick={openCamera}>
            Abrir cámara
          </Button>
          <p className="text-xs text-muted">
            El video se graba aquí, no se sube desde la galería. Es lo que le
            permite al comprador ver que el artículo existe y está como dice.
          </p>
        </>
      )}
      {state === "listo" && (
        <Button type="button" onClick={start}>
          Grabar (máximo {MAX_SECONDS} segundos)
        </Button>
      )}
      {state === "grabando" && (
        <Button
          type="button"
          variant="outline"
          onClick={() => recorderRef.current?.stop()}
        >
          Terminar
        </Button>
      )}
      {state === "grabado" && (
        <p
          role="status"
          className="rounded-xl bg-brand/10 px-4 py-3 text-sm text-brand"
        >
          Video listo. Si no te gustó, recarga la página y graba otro.
        </p>
      )}
    </div>
  );
}

// Dibuja el cuadro que la cámara está mostrando en ese instante.
function posterFromLive(video: HTMLVideoElement | null): Promise<Blob> {
  return new Promise((resolve, reject) => {
    if (!video) return reject(new Error("no hay cámara abierta"));

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    canvas
      .getContext("2d")
      ?.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) =>
        blob
          ? resolve(blob)
          : reject(new Error("no se pudo generar la portada")),
      "image/jpeg",
      0.8,
    );
  });
}
