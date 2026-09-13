import { CreateJobCommand, MediaConvertClient } from "@aws-sdk/client-mediaconvert";
import { enqueue } from "@/lib/queue";

// Transcodificación (S-30). Detrás de una interfaz como pagos, identidad y
// envíos: la real es MediaConvert; la de prueba "termina" en el acto. Se elige
// por configuración, no por APP_ENV: el `dev` de la nube corre con
// APP_ENV=desarrollo y ahí sí queremos MediaConvert de verdad.

export type VideoProvider = {
  /** Pide la conversión de `key`. La salida llegará como `video_listo` por la cola. */
  transcode(key: string): Promise<void>;
};

/** Dónde queda la versión convertida de un original. */
export function outputKeyFor(key: string): string {
  return `transcodificado/${key.replace(/\.[a-z0-9]+$/i, "")}.mp4`;
}

const prueba: VideoProvider = {
  async transcode(key) {
    // Sin MediaConvert no hay conversión: la "salida" es el mismo archivo. Lo que
    // se prueba es el circuito, no el códec.
    await enqueue({ type: "video_listo", original: key, salida: key });
  },
};

let client: MediaConvertClient | undefined;

const mediaConvert: VideoProvider = {
  async transcode(key) {
    client ??= new MediaConvertClient({ region: process.env.AWS_REGION });
    const bucket = process.env.S3_BUCKET!;
    await client.send(
      new CreateJobCommand({
        Role: process.env.MEDIACONVERT_ROLE_ARN!,
        // Viaja con el trabajo y vuelve en el evento COMPLETE; es lo que permite
        // saber de qué original es la salida.
        UserMetadata: { original: key },
        Settings: {
          Inputs: [
            {
              FileInput: `s3://${bucket}/${key}`,
              AudioSelectors: { "Audio Selector 1": { DefaultSelection: "DEFAULT" } },
              VideoSelector: {},
              TimecodeSource: "ZEROBASED",
            },
          ],
          OutputGroups: [
            {
              Name: "mp4",
              OutputGroupSettings: {
                Type: "FILE_GROUP_SETTINGS",
                FileGroupSettings: {
                  Destination: `s3://${bucket}/${outputKeyFor(key).replace(/\.mp4$/, "")}`,
                },
              },
              Outputs: [
                {
                  ContainerSettings: { Container: "MP4", Mp4Settings: {} },
                  VideoDescription: {
                    // 720p como máximo; un video de 30 s de un celular no necesita más.
                    Height: 720,
                    ScalingBehavior: "DEFAULT",
                    CodecSettings: {
                      Codec: "H_264",
                      H264Settings: {
                        RateControlMode: "QVBR",
                        QvbrSettings: { QvbrQualityLevel: 7 },
                        MaxBitrate: 3_000_000,
                        SceneChangeDetect: "TRANSITION_DETECTION",
                      },
                    },
                  },
                  AudioDescriptions: [
                    {
                      CodecSettings: {
                        Codec: "AAC",
                        AacSettings: { Bitrate: 96_000, CodingMode: "CODING_MODE_2_0", SampleRate: 48_000 },
                      },
                    },
                  ],
                },
              ],
            },
          ],
        },
      })
    );
  },
};

export const videoProvider: VideoProvider = process.env.MEDIACONVERT_ROLE_ARN
  ? mediaConvert
  : prueba;

export const videoProviderName = process.env.MEDIACONVERT_ROLE_ARN ? "mediaconvert" : "prueba";
