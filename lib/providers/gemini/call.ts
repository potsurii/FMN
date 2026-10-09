import { GEMINI_TIMEOUT_MS, geminiGenerateUrl } from "./config";
import { providerFailure, type ProviderResult } from "./types";

export type GeminiCall = (input: {
  url: string;
  apiKey: string;
  body: unknown;
  timeoutMs: number;
}) => Promise<{ status: number; json: unknown }>;

export async function defaultGeminiCall(input: {
  url: string;
  apiKey: string;
  body: unknown;
  timeoutMs: number;
}): Promise<{ status: number; json: unknown }> {
  const response = await fetch(input.url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-goog-api-key": input.apiKey,
    },
    body: JSON.stringify(input.body),
    signal: AbortSignal.timeout(input.timeoutMs),
  });
  let json: unknown = null;
  try {
    json = await response.json();
  } catch {
    json = null;
  }
  return { status: response.status, json };
}

export function textFromGeminiResponse(json: unknown): string | null {
  if (!json || typeof json !== "object") return null;
  const candidates = (json as { candidates?: unknown }).candidates;
  if (!Array.isArray(candidates) || !candidates[0] || typeof candidates[0] !== "object") {
    return null;
  }
  const content = (candidates[0] as { content?: unknown }).content;
  if (!content || typeof content !== "object") return null;
  const parts = (content as { parts?: unknown }).parts;
  if (!Array.isArray(parts)) return null;
  const texts = parts
    .map((part) =>
      part && typeof part === "object" && typeof (part as { text?: unknown }).text === "string"
        ? (part as { text: string }).text
        : "",
    )
    .join("");
  return texts.trim() ? texts : null;
}

export function parseModelJson(text: string): unknown | null {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

function readShortCode(value: unknown, key: string): string | null {
  if (!value || typeof value !== "object" || !(key in value)) return null;
  const field = (value as Record<string, unknown>)[key];
  if (typeof field !== "string" || field.length === 0 || field.length > 64) return null;
  if (/api[_-]?key|authorization|bearer|token/i.test(field)) return null;
  return field;
}

function geminiFetchThrowFields(err: unknown, category: "timeout" | "network") {
  const cause =
    err && typeof err === "object" && "cause" in err
      ? (err as { cause?: unknown }).cause ?? null
      : null;
  return {
    name: err instanceof Error ? err.name : "non-error",
    category,
    code: readShortCode(err, "code"),
    causeName: cause instanceof Error ? cause.name : null,
    causeCode: readShortCode(cause, "code"),
    syscall: readShortCode(cause, "syscall") ?? readShortCode(err, "syscall"),
    hostname: readShortCode(cause, "hostname") ?? readShortCode(err, "hostname"),
  };
}

function logGeminiFetchThrow(err: unknown, category: "timeout" | "network") {
  const data = geminiFetchThrowFields(err, category);
  console.error("[gemini] fetch threw", data);
}

export async function requestGeminiJson(input: {
  apiKey: string;
  body: unknown;
  call?: GeminiCall;
  timeoutMs?: number;
}): Promise<ProviderResult<unknown>> {
  const call = input.call ?? defaultGeminiCall;
  try {
    const response = await call({
      url: geminiGenerateUrl(),
      apiKey: input.apiKey,
      body: input.body,
      timeoutMs: input.timeoutMs ?? GEMINI_TIMEOUT_MS,
    });
    if (response.status < 200 || response.status >= 300) {
      return providerFailure("provider", "Gemini 没有返回可用结果。请稍后重试。");
    }
    const text = textFromGeminiResponse(response.json);
    if (!text) return providerFailure("empty", "Gemini 返回了空结果。");
    const parsed = parseModelJson(text);
    if (parsed === null) return providerFailure("invalid", "Gemini 返回的内容不是有效结构。");
    return { ok: true, value: parsed };
  } catch (err) {
    const name = err instanceof Error ? err.name : "";
    if (name === "TimeoutError" || name === "AbortError") {
      logGeminiFetchThrow(err, "timeout");
      return providerFailure("timeout", "Gemini 请求超时。可以改用手动输入。");
    }
    logGeminiFetchThrow(err, "network");
    return providerFailure("network", "无法连接 Gemini。可以改用手动输入。");
  }
}
