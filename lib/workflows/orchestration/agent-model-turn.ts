"use server";

import { readSessionUser } from "@/lib/auth/require-user";
import { readGeminiApiKey } from "@/lib/providers/gemini/config";
import { requestWithTools } from "@/lib/providers/gemini/llm";
import { providerFailure, type ProviderResult } from "@/lib/providers/gemini/types";
import { logAgentTurnDiag } from "@/lib/workflows/orchestration/agent-turn-diag";
import { prepareAgentModelTurn } from "@/lib/workflows/orchestration/agent-turn-policy";

/**
 * Server entry for one model turn.
 * The loop stays on the caller so it can re-read the same ctx.cancelled.
 * The API key, system instruction, and tool declarations stay here.
 */
export async function requestAgentModelTurn(input: {
  contents: unknown;
}): Promise<
  ProviderResult<{
    text: string | null;
    functionCall: { name: string; args: unknown; id?: string; thoughtSignature?: string } | null;
  }>
> {
  const requestId = crypto.randomUUID();
  const session = await readSessionUser();
  const prepared = prepareAgentModelTurn(session.ok, input.contents);
  if (!prepared.ok) {
    logAgentTurnDiag({
      requestId,
      stage: session.ok ? "validate" : "session",
      code: prepared.failure.code,
    });
    return prepared.failure;
  }

  const apiKey = readGeminiApiKey();
  if (!apiKey) {
    logAgentTurnDiag({ requestId, stage: "config", code: "not_configured" });
    return providerFailure("not_configured", "服务端未配置 Gemini。可以继续手动输入。");
  }
  return requestWithTools({
    apiKey,
    body: prepared.body,
    tools: prepared.tools,
    diagRequestId: requestId,
  });
}
