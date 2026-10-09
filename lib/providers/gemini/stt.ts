import { requestGeminiJson, type GeminiCall } from "./call";
import { providerFailure, type ProviderResult } from "./types";

const STT_PROMPT = [
  "Transcribe this speech into text.",
  "Return JSON only: {\"transcript\":\"\"}.",
  "Do not translate, summarize, guess prices, or add words that were not spoken.",
  "If there is no speech, return an empty transcript.",
].join(" ");

const AUDIO_MIME = new Set([
  "audio/webm",
  "audio/wav",
  "audio/wave",
  "audio/mp4",
  "audio/mpeg",
  "audio/mp3",
]);

export function normalizeAudioMime(mimeType: string): string | null {
  const base = mimeType.split(";")[0]?.trim().toLowerCase() ?? "";
  if (base === "audio/mp3") return "audio/mpeg";
  if (base === "audio/wave") return "audio/wav";
  return AUDIO_MIME.has(base) ? base : null;
}

export function transcriptFromGeminiJson(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;
  const transcript = (value as { transcript?: unknown }).transcript;
  if (typeof transcript !== "string") return null;
  return transcript.trim();
}

export function sttRequestBody(input: { mimeType: string; base64: string }): unknown {
  return {
    contents: [
      {
        role: "user",
        parts: [
          { text: STT_PROMPT },
          { inline_data: { mime_type: input.mimeType, data: input.base64 } },
        ],
      },
    ],
    generationConfig: {
      temperature: 0,
      responseMimeType: "application/json",
    },
  };
}

export async function transcribeAudio(input: {
  bytes: Uint8Array;
  mimeType: string;
  apiKey: string;
  call?: GeminiCall;
}): Promise<ProviderResult<string>> {
  const mimeType = normalizeAudioMime(input.mimeType);
  if (!mimeType) {
    return providerFailure("unsupported", "不支持的音频格式。请改用手动输入。");
  }
  const parsed = await requestGeminiJson({
    apiKey: input.apiKey,
    call: input.call,
    body: sttRequestBody({
      mimeType,
      base64: Buffer.from(input.bytes).toString("base64"),
    }),
  });
  if (!parsed.ok) return parsed;
  const transcript = transcriptFromGeminiJson(parsed.value);
  if (transcript === null) {
    return providerFailure("invalid", "转写结果无法使用。请改用手动输入。");
  }
  if (!transcript) {
    return providerFailure("empty", "没有听到可转写的内容。请改用手动输入。");
  }
  return { ok: true, value: transcript };
}
