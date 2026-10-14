/**
 * Batch 5 — tool-proposal loop.
 * The model proposes. This loop validates and executes.
 * It does not confirm writes and it does not touch Supabase.
 */

import type {
  ShoppingRecordDraft,
  ShoppingTodoDraft,
  TaskState,
} from "@/lib/companion/types";
import type { ProviderResult } from "@/lib/providers/gemini/types";
import { requestAgentModelTurn } from "@/lib/workflows/orchestration/agent-model-turn";
import { AGENT_SYSTEM_INSTRUCTION } from "@/lib/workflows/orchestration/agent-turn-policy";
import {
  getGeminiTools,
  TOOL_REGISTRY,
  type ToolContext,
  type ToolResult,
} from "@/lib/workflows/orchestration/tool-registry";

const MAX_STEPS_MESSAGE = "任务超出最大步数";

export type AgentContext = ToolContext & {
  /** Re-read every step. Set true on the same object to stop the loop. */
  cancelled?: boolean;
};

export type AgentLoopDraft = ShoppingRecordDraft | ShoppingTodoDraft;

export type AgentLoopResult =
  | { kind: "text"; text: string; task: TaskState | null; draft: AgentLoopDraft | null }
  | { kind: "max-steps"; text: string; task: TaskState | null; draft: AgentLoopDraft | null }
  | {
      kind: "provider-error";
      error: string;
      task: TaskState | null;
      /** True once this turn has entered a tool handler. */
      toolAttempted: boolean;
      draft: AgentLoopDraft | null;
    }
  | {
      kind: "tool-error";
      error: string;
      task: TaskState | null;
      toolAttempted: true;
      draft: AgentLoopDraft | null;
    }
  | { kind: "cancelled"; task: TaskState | null }
  | {
      kind: "choose-trip";
      candidates: Array<{ id: string; name: string }>;
      source: "history" | "organize" | "pick";
      task: TaskState | null;
      draft: AgentLoopDraft | null;
    };

type ToolTurn = {
  text: string | null;
  functionCall: { name: string; args: unknown; id?: string; thoughtSignature?: string } | null;
};

export type AgentLoopRequest = (input: {
  apiKey: string;
  body: unknown;
  tools: unknown;
}) => Promise<ProviderResult<ToolTurn>>;

type ContentPart =
  | { text: string }
  | {
      functionCall: { name: string; args: unknown; id?: string };
      thoughtSignature?: string;
    }
  | { functionResponse: { name: string; response: Record<string, unknown> } };

type Content = { role: "user" | "model"; parts: ContentPart[] };

function taskSummary(task: TaskState | null, ctx: AgentContext): string {
  const contextLine = `上下文：entry=${ctx.entry}，tripId=${ctx.tripId ?? "无"}`;
  if (!task) return contextLine;
  return [
    `目标：${task.goal}`,
    `已完成步骤：${task.completedSteps.join("、") || "无"}`,
    `待回答：${task.pendingQuestions.join("、") || "无"}`,
    `当前步骤：${task.currentStep || "无"}`,
    contextLine,
  ].join("\n");
}

function parametersValid(args: unknown, schema: Record<string, unknown>): boolean {
  if (args != null && (typeof args !== "object" || Array.isArray(args))) return false;
  const value = (args ?? {}) as Record<string, unknown>;
  const properties = schema.properties;
  const propertyMap =
    properties && typeof properties === "object" && !Array.isArray(properties)
      ? (properties as Record<string, unknown>)
      : {};
  if (schema.additionalProperties === false) {
    for (const key of Object.keys(value)) {
      if (!(key in propertyMap)) return false;
    }
  }
  const required = Array.isArray(schema.required) ? schema.required : [];
  for (const key of required) {
    if (typeof key !== "string") return false;
    if (!(key in value) || value[key] == null || value[key] === "") return false;
  }
  for (const [key, rule] of Object.entries(propertyMap)) {
    if (!(key in value) || value[key] == null) continue;
    if (!rule || typeof rule !== "object") continue;
    const spec = rule as { type?: unknown; enum?: unknown };
    const current = value[key];
    if (Array.isArray(spec.enum) && !spec.enum.includes(current)) return false;
    if (spec.type === "string" && typeof current !== "string") return false;
    if (spec.type === "number" && (typeof current !== "number" || !Number.isFinite(current))) {
      return false;
    }
    if (
      spec.type === "integer" &&
      (typeof current !== "number" || !Number.isInteger(current))
    ) {
      return false;
    }
  }
  return true;
}

function responseObject(data: unknown): Record<string, unknown> {
  if (data && typeof data === "object" && !Array.isArray(data)) {
    return data as Record<string, unknown>;
  }
  return { result: data };
}

function tripPickSource(
  status: string,
  toolName: string,
): "history" | "organize" | "pick" | null {
  if (status === "pick_trip" && toolName === "request_trip_pick") return "pick";
  if (status === "choose_trip" && toolName === "search_own_history") return "history";
  if (status === "choose_trip" && toolName === "organize_records") return "organize";
  return null;
}

function tripPickCandidates(
  result: ToolResult,
  toolName: string,
): { candidates: Array<{ id: string; name: string }>; source: "history" | "organize" | "pick" } | null {
  if (!result.ok || !result.data || typeof result.data !== "object") return null;
  const data = result.data as { status?: unknown; candidates?: unknown };
  if (typeof data.status !== "string" || !Array.isArray(data.candidates)) return null;
  const source = tripPickSource(data.status, toolName);
  if (!source) return null;
  const candidates = data.candidates.flatMap((row) => {
    if (!row || typeof row !== "object") return [];
    const id = (row as { id?: unknown }).id;
    const name = (row as { name?: unknown }).name;
    if (typeof id !== "string" || typeof name !== "string") return [];
    return [{ id, name }];
  });
  return candidates.length > 0 ? { candidates, source } : null;
}

function draftFromToolResult(result: ToolResult): AgentLoopDraft | null {
  if (!result.ok || !result.data || typeof result.data !== "object") return null;
  const record = result.data as { draftType?: unknown; draft?: unknown };
  const draft = record.draft;
  if (!draft || typeof draft !== "object") return null;
  const draftType = (draft as { draftType?: unknown }).draftType;
  if (record.draftType === "shopping_record" && draftType === "shopping_record") {
    return draft as ShoppingRecordDraft;
  }
  if (record.draftType === "shopping_todo" && draftType === "shopping_todo") {
    return draft as ShoppingTodoDraft;
  }
  return null;
}

export async function runAgentLoop(input: {
  text: string;
  ctx: AgentContext;
  task: TaskState | null;
  maxSteps?: number;
  requestWithTools?: AgentLoopRequest;
}): Promise<AgentLoopResult> {
  const maxSteps = input.maxSteps ?? 6;
  const request = input.requestWithTools;
  if (input.ctx.cancelled) return { kind: "cancelled", task: input.task };

  const contents: Content[] = [
    {
      role: "user",
      parts: [
        {
          text: `用户输入：\n${input.text}\n\n任务摘要：\n${taskSummary(input.task, input.ctx)}`,
        },
      ],
    },
  ];
  const toolCtx: ToolContext = {
    entry: input.ctx.entry,
    tripId: input.ctx.tripId,
    tripLabel: input.ctx.tripLabel,
    sourceText: input.text,
  };
  let draft: AgentLoopDraft | null = null;
  let toolAttempted = false;

  for (let step = 0; step < maxSteps; step += 1) {
    if (input.ctx.cancelled) return { kind: "cancelled", task: input.task };

    const tools = getGeminiTools();
    const turned = request
      ? await request({
          apiKey: "",
          tools,
          body: {
            systemInstruction: { parts: [{ text: AGENT_SYSTEM_INSTRUCTION }] },
            contents,
          },
        })
      : await requestAgentModelTurn({ contents });
    if (input.ctx.cancelled) return { kind: "cancelled", task: input.task };
    if (!turned.ok) {
      return {
        kind: "provider-error",
        error: turned.error,
        task: input.task,
        toolAttempted,
        draft,
      };
    }

    const { text, functionCall } = turned.value;
    console.log(
      "[loop] step",
      step,
      functionCall ? "tool" : "text",
      functionCall?.name ?? "ok",
    );
    if (!functionCall) {
      return { kind: "text", text: text ?? "", task: input.task, draft };
    }

    const name = functionCall.name.trim();
    const tool = TOOL_REGISTRY.find((item) => item.name === name);
    const modelParts: ContentPart[] = [];
    if (text) modelParts.push({ text });
    modelParts.push({
      functionCall: {
        name,
        args: functionCall.args ?? {},
        ...(functionCall.id ? { id: functionCall.id } : {}),
      },
      ...(functionCall.thoughtSignature
        ? { thoughtSignature: functionCall.thoughtSignature }
        : {}),
    });
    contents.push({ role: "model", parts: modelParts });

    if (!tool) {
      contents.push({
        role: "user",
        parts: [
          {
            functionResponse: {
              name,
              response: { error: `工具 ${name} 不在允许的清单内。请改用已提供的工具。` },
            },
          },
        ],
      });
      continue;
    }

    if (!parametersValid(functionCall.args, tool.parameters)) {
      contents.push({
        role: "user",
        parts: [
          {
            functionResponse: {
              name,
              response: { error: `工具 ${name} 的参数不符合定义。请按工具要求重新提议。` },
            },
          },
        ],
      });
      continue;
    }

    let result: ToolResult;
    toolAttempted = true;
    try {
      result = await tool.handler(functionCall.args, toolCtx);
    } catch {
      return {
        kind: "tool-error",
        error: "工具执行失败。",
        task: input.task,
        toolAttempted: true,
        draft,
      };
    }
    if (input.ctx.cancelled) return { kind: "cancelled", task: input.task };
    if (!result.ok) {
      return {
        kind: "tool-error",
        error: result.error,
        task: input.task,
        toolAttempted: true,
        draft,
      };
    }

    const toolStatus =
      result.data && typeof result.data === "object" && "status" in result.data
        ? (result.data as { status?: unknown }).status
        : "ok";
    console.log(
      "[loop] tool executed:",
      name,
      "step",
      step,
      "status",
      typeof toolStatus === "string" ? toolStatus : "ok",
    );
    const formed = draftFromToolResult(result);
    if (formed) draft = formed;
    const picks = tripPickCandidates(result, name);
    if (picks) {
      return {
        kind: "choose-trip",
        candidates: picks.candidates,
        source: picks.source,
        task: input.task,
        draft,
      };
    }
    contents.push({
      role: "user",
      parts: [
        {
          functionResponse: {
            name,
            response: responseObject(result.data),
          },
        },
      ],
    });
  }

  return { kind: "max-steps", text: MAX_STEPS_MESSAGE, task: input.task, draft };
}

// CHECKPOINT 4 DONE
