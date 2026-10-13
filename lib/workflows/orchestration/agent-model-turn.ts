"use server";

import { readGeminiApiKey } from "@/lib/providers/gemini/config";
import { requestWithTools } from "@/lib/providers/gemini/llm";
import { providerFailure, type ProviderResult } from "@/lib/providers/gemini/types";

/**
 * Server entry for one model turn.
 * The loop stays on the caller so it can re-read the same ctx.cancelled.
 * The API key stays here.
 */
export async function requestAgentModelTurn(input: {
  body: unknown;
  tools: unknown;
}): Promise<
  ProviderResult<{
    text: string | null;
    functionCall: { name: string; args: unknown; id?: string; thoughtSignature?: string } | null;
  }>
> {
  const apiKey = readGeminiApiKey();
  if (!apiKey) {
    return providerFailure("not_configured", "服务端未配置 Gemini。可以继续手动输入。");
  }
  return requestWithTools({ apiKey, body: input.body, tools: input.tools });
}
