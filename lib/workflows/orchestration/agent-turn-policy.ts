import { providerFailure, type ProviderFailure } from "@/lib/providers/gemini/types";
import { getGeminiTools } from "@/lib/workflows/orchestration/tool-registry";

/** Same instruction the loop used to send from the browser. The server action is the only sender. */
export const AGENT_SYSTEM_INSTRUCTION = [
  "你是 FMN 的购物助手。你只能提议调用已经提供的工具。",
  "不要写入数据库，不要确认保存，不要调用写入工具。",
  "只使用用户明确说出的商品、价格、货币、地点、数量和日期。没有说出的字段保持缺失，不要猜测。",
  "当前旅行只是上下文，不是权限。",
  "用户明确说了排序方式（按价格 / 按日期）且上下文已经足够时，直接调用 organize_records 或相应工具，不要追问。",
  "用户问“我买过什么”、“有哪些记录”等泛查询时，直接调用 search_own_history,不要调用 request_trip_pick。",
  "request_trip_pick 只在用户明确说「这次」「这趟」「当前旅行」且上下文没有 tripId 时使用，其他情况不要调用。",
  "需要查询、整理、生成草稿或解析旅行时，提议一个工具。完成时直接用文字回复。",
].join("\n");

/** Matches runAgentLoop's default maxSteps. */
export const AGENT_MAX_STEPS = 6;

/** One opening user message, then one model part and one functionResponse per step. */
export const AGENT_MAX_CONTENTS = 1 + 2 * AGENT_MAX_STEPS;

/** Four times the single-sentence tidy cap, enough for the task summary. */
export const AGENT_MAX_TEXT_CHARS = 8000;

/**
 * Six steps of about twenty history rows (~250 bytes each), with one extra
 * factor of headroom. Instruction and tool declarations are added server-side
 * and are not counted here.
 */
export const AGENT_MAX_CONTENTS_JSON_BYTES = 96 * 1024;

const MAX_PARTS = 8;

export type AgentContent = {
  role: "user" | "model";
  parts: unknown[];
};

export function validateAgentContents(
  contents: unknown,
): { ok: true; contents: AgentContent[] } | { ok: false; error: string } {
  if (!Array.isArray(contents) || contents.length === 0) {
    return { ok: false, error: "模型请求缺少对话内容。" };
  }
  if (contents.length > AGENT_MAX_CONTENTS) {
    return { ok: false, error: "模型对话轮数超出上限。" };
  }

  const normalized: AgentContent[] = [];
  for (const item of contents) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      return { ok: false, error: "模型对话格式不正确。" };
    }
    const role = (item as { role?: unknown }).role;
    if (role !== "user" && role !== "model") {
      return { ok: false, error: "模型对话格式不正确。" };
    }
    const parts = (item as { parts?: unknown }).parts;
    if (!Array.isArray(parts) || parts.length === 0 || parts.length > MAX_PARTS) {
      return { ok: false, error: "模型对话格式不正确。" };
    }
    for (const part of parts) {
      if (!part || typeof part !== "object" || Array.isArray(part)) {
        return { ok: false, error: "模型对话格式不正确。" };
      }
      const record = part as Record<string, unknown>;
      const known =
        "text" in record || "functionCall" in record || "functionResponse" in record;
      if (!known) return { ok: false, error: "模型对话格式不正确。" };
      if ("text" in record) {
        if (typeof record.text !== "string" || record.text.length > AGENT_MAX_TEXT_CHARS) {
          return { ok: false, error: "单条模型消息过长。" };
        }
      }
    }
    normalized.push({ role, parts });
  }

  const bytes = new TextEncoder().encode(JSON.stringify(normalized)).length;
  if (bytes > AGENT_MAX_CONTENTS_JSON_BYTES) {
    return { ok: false, error: "模型对话体积超出上限。" };
  }
  return { ok: true, contents: normalized };
}

export function prepareAgentModelTurn(
  authenticated: boolean,
  contents: unknown,
):
  | { ok: false; failure: ProviderFailure }
  | {
      ok: true;
      body: {
        systemInstruction: { parts: [{ text: string }] };
        contents: AgentContent[];
      };
      tools: ReturnType<typeof getGeminiTools>;
    } {
  if (!authenticated) {
    return { ok: false, failure: providerFailure("unauthorized", "请先登录")};
  }
  const checked = validateAgentContents(contents);
  if (!checked.ok) {
    return { ok: false, failure: providerFailure("invalid", checked.error)};
  }
  return {
    ok: true,
    body: {
      systemInstruction: { parts: [{ text: AGENT_SYSTEM_INSTRUCTION }] },
      contents: checked.contents,
    },
    tools: getGeminiTools(),
  };
}
