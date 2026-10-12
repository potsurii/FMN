import { isExplicitConfirmIntent } from "@/lib/companion/confirm-intent";
import {
  defaultGeminiCall,
  functionCallFromGeminiResponse,
  requestGeminiJson,
  textFromGeminiResponse,
  type GeminiCall,
} from "./call";
import { GEMINI_TIMEOUT_MS, geminiGenerateUrl } from "./config";
import { providerFailure, type ProviderResult } from "./types";

const VAGUE = new Set(["好的", "嗯", "继续", "看起来不错", "ok", "okay"]);

const LLM_PROMPT = [
  "Extract only shopping facts explicitly stated in the user text.",
  "Return JSON only:",
  "{\"product_name\":null,\"price\":null,\"currency\":null,\"quantity\":null,\"purchase_date\":null,\"location\":null}",
  "Use null for anything not explicitly stated.",
  "Do not guess a product, price, currency, date, or location.",
  "Do not divide a price by quantity.",
  "Do not confirm, save, or invent missing fields.",
  "Vague replies are not shopping facts.",
].join(" ");

export type ExplicitLlmFields = {
  product_name: string | null;
  price: number | null;
  currency: string | null;
  quantity: number | null;
  purchase_date: string | null;
  location: string | null;
};

export function refusalForLlmInput(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed) return "请先输入要整理的内容。";
  if (VAGUE.has(trimmed.toLowerCase()) || VAGUE.has(trimmed)) {
    return "这句话不是明确的购物内容，也不是写入确认。";
  }
  if (isExplicitConfirmIntent(trimmed)) {
    return "整理不会保存记录。请使用「确认写入正式记录」。";
  }
  return null;
}

function nullableString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function nullableNumber(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) return null;
  return value;
}

export function fieldsFromGeminiJson(value: unknown): ExplicitLlmFields | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const currency = nullableString(record.currency);
  const purchaseDate = nullableString(record.purchase_date);
  return {
    product_name: nullableString(record.product_name),
    price: nullableNumber(record.price),
    currency: currency && /^[A-Za-z]{3}$/.test(currency) ? currency.toUpperCase() : null,
    quantity: typeof record.quantity === "number" ? record.quantity : null,
    purchase_date: purchaseDate && /^\d{4}-\d{2}-\d{2}$/.test(purchaseDate) ? purchaseDate : null,
    location: nullableString(record.location),
  };
}

export function hasExplicitLlmFact(fields: ExplicitLlmFields): boolean {
  return Boolean(
    fields.product_name ||
      fields.price !== null ||
      fields.currency ||
      fields.purchase_date ||
      fields.location,
  );
}

export function llmRequestBody(userText: string): unknown {
  return {
    contents: [
      {
        role: "user",
        parts: [{ text: `${LLM_PROMPT}\n\nUser text:\n${userText}` }],
      },
    ],
    generationConfig: {
      temperature: 0,
      responseMimeType: "application/json",
    },
  };
}

export async function extractExplicitFields(input: {
  userText: string;
  apiKey: string;
  call?: GeminiCall;
}): Promise<ProviderResult<ExplicitLlmFields>> {
  const refusal = refusalForLlmInput(input.userText);
  if (refusal) return providerFailure("invalid", refusal);
  const parsed = await requestGeminiJson({
    apiKey: input.apiKey,
    call: input.call,
    body: llmRequestBody(input.userText.trim()),
  });
  if (!parsed.ok) return parsed;
  const fields = fieldsFromGeminiJson(parsed.value);
  if (!fields) return providerFailure("invalid", "整理结果无法使用。请改用手动输入。");
  if (!hasExplicitLlmFact(fields)) {
    return providerFailure("empty", "没有得到明确写出的购物字段。请改用手动输入。");
  }
  return { ok: true, value: fields };
}

function bodyWithTools(body: unknown, tools: unknown): unknown {
  const toolList = Array.isArray(tools) ? tools : [tools];
  if (body && typeof body === "object" && !Array.isArray(body)) {
    return { ...(body as Record<string, unknown>), tools: toolList };
  }
  return { tools: toolList };
}

export async function requestWithTools(input: {
  apiKey: string;
  body: unknown;
  tools: unknown;
  call?: GeminiCall;
  timeoutMs?: number;
}): Promise<
  ProviderResult<{
    text: string | null;
    functionCall: { name: string; args: unknown; id?: string; thoughtSignature?: string } | null;
  }>
> {
  const call = input.call ?? defaultGeminiCall;
  try {
    const response = await call({
      url: geminiGenerateUrl(),
      apiKey: input.apiKey,
      body: bodyWithTools(input.body, input.tools),
      timeoutMs: input.timeoutMs ?? GEMINI_TIMEOUT_MS,
    });
    if (response.status === 429) {
      return providerFailure("provider", "AI 今日调用已达上限，明天会恢复。可以手动输入。");
    }
    if (response.status >= 500) { 
      return providerFailure("provider", "AI服务暂不可用,请稍后重试。");
    }
    if (response.status < 200 || response.status >= 300) {
      return providerFailure("provider", "Gemini 没有返回可用结果。请稍后重试。");
    }
    const text = textFromGeminiResponse(response.json);
    const functionCall = functionCallFromGeminiResponse(response.json);
    if (!text && !functionCall) {
      return providerFailure("empty", "Gemini 返回了空结果。");
    }
    return { ok: true, value: { text, functionCall } };
  } catch (err) {
    const name = err instanceof Error ? err.name : "";
    if (name === "TimeoutError" || name === "AbortError") {
      return providerFailure("timeout", "Gemini 请求超时。可以改用手动输入。");
    }
    return providerFailure("network", "无法连接 Gemini。可以改用手动输入。");
  }
}