"use server";

import { readGeminiApiKey } from "@/lib/providers/gemini/config";
import {
  extractExplicitFields,
  refusalForLlmInput,
  type ExplicitLlmFields,
} from "@/lib/providers/gemini/llm";
import { extractReceiptLinesFromImage } from "@/lib/providers/gemini/ocr";
import { transcribeAudio } from "@/lib/providers/gemini/stt";
import type { ProviderResult } from "@/lib/providers/gemini/types";
import { RECEIPT_TEMP_BUCKET } from "@/lib/storage/receipt-buckets";
import { assertOwnedReceiptPath } from "@/lib/storage/receipt-lifecycle";
import { createClient } from "@/lib/supabase/server";
import type { ReceiptLineExtraction } from "@/lib/workflows/record-input/receipt-draft-group";

const IMAGE_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_AUDIO_BYTES = 8 * 1024 * 1024;
const MAX_TEXT_CHARS = 2000;

async function requireUserId(): Promise<{ ok: true; userId: string } | { ok: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return { ok: false, error: "请先登录" };
  return { ok: true, userId: user.id };
}

function requireKey(): ProviderResult<string> {
  const apiKey = readGeminiApiKey();
  if (!apiKey) {
    return { ok: false, code: "not_configured", error: "服务端未配置 Gemini。可以继续手动输入。" };
  }
  return { ok: true, value: apiKey };
}

function mimeFromPath(path: string, blobType: string): string | null {
  if (IMAGE_MIME.has(blobType)) return blobType;
  const ext = path.split(".").pop()?.toLowerCase();
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  return null;
}

export async function recognizeReceiptLines(input: {
  tempPath: string;
  consent: boolean;
}): Promise<ProviderResult<ReceiptLineExtraction[]>> {
  if (input.consent !== true) {
    return { ok: false, code: "consent_required", error: "需要先同意发送这张收据图片。" };
  }
  const auth = await requireUserId();
  if (!auth.ok) return { ok: false, code: "unauthorized", error: auth.error };
  const key = requireKey();
  if (!key.ok) return key;

  let owned = input.tempPath;
  try {
    assertOwnedReceiptPath(auth.userId, input.tempPath);
    owned = input.tempPath.trim();
  } catch {
    return { ok: false, code: "invalid", error: "找不到可识别的临时收据。" };
  }

  const supabase = await createClient();
  const { data: blob, error } = await supabase.storage.from(RECEIPT_TEMP_BUCKET).download(owned);
  if (error || !blob) {
    return { ok: false, code: "invalid", error: "读取临时收据失败。草稿仍保留。" };
  }
  const mimeType = mimeFromPath(owned, blob.type);
  if (!mimeType) {
    return { ok: false, code: "unsupported", error: "仅支持 JPEG、PNG 或 WebP 收据图片。" };
  }
  const bytes = new Uint8Array(await blob.arrayBuffer());
  return extractReceiptLinesFromImage({ bytes, mimeType, apiKey: key.value });
}

export async function transcribeSpeech(formData: FormData): Promise<ProviderResult<string>> {
  if (formData.get("consent") !== "true") {
    return { ok: false, code: "consent_required", error: "需要先同意发送这段语音。" };
  }
  const auth = await requireUserId();
  if (!auth.ok) return { ok: false, code: "unauthorized", error: auth.error };
  const key = requireKey();
  if (!key.ok) return key;

  const file = formData.get("audio");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, code: "empty", error: "没有可转写的语音。请改用手动输入。" };
  }
  if (file.size > MAX_AUDIO_BYTES) {
    return { ok: false, code: "unsupported", error: "语音文件过大。请改用手动输入。" };
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  return transcribeAudio({
    bytes,
    mimeType: file.type || "application/octet-stream",
    apiKey: key.value,
  });
}

export async function structureShoppingText(input: {
  text: string;
  consent: boolean;
}): Promise<ProviderResult<ExplicitLlmFields>> {
  if (input.consent !== true) {
    return { ok: false, code: "consent_required", error: "需要先同意发送当前输入。" };
  }
  const text = input.text.trim();
  if (text.length > MAX_TEXT_CHARS) {
    return { ok: false, code: "unsupported", error: "输入过长。请缩短后再试。" };
  }
  const refusal = refusalForLlmInput(text);
  if (refusal) return { ok: false, code: "invalid", error: refusal };
  const auth = await requireUserId();
  if (!auth.ok) return { ok: false, code: "unauthorized", error: auth.error };
  const key = requireKey();
  if (!key.ok) return key;
  return extractExplicitFields({ userText: text, apiKey: key.value });
}
