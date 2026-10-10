/**
 * Batch 5 — agent loop.
 * Injects a fake requestWithTools. Does not call Gemini or write to the database.
 *   npm run test:batch5s3
 */

import assert from "node:assert/strict";
import { functionCallFromGeminiResponse } from "../lib/providers/gemini/call";
import type { ProviderResult } from "../lib/providers/gemini/types";
import { runAgentLoop, type AgentContext, type AgentLoopRequest } from "../lib/workflows/orchestration/loop";
import { getGeminiTools, TOOL_REGISTRY } from "../lib/workflows/orchestration/tool-registry";

const TOOL_NAMES = [
  "search_own_history",
  "organize_records",
  "create_record_draft",
  "create_todo_draft",
  "list_trips",
  "resolve_recent_trip",
  "request_trip_pick",
];

const BANNED = ["confirm_write", "createItem", "createTodo", "confirmBatchShoppingWrite"];

function section(name: string) {
  console.log(`\n✔ ${name}`);
}

function ctx(): AgentContext {
  return {
    entry: "global",
    tripId: null,
    tripLabel: null,
    sourceText: "记一条",
    cancelled: false,
  };
}

type Turn = { text: string | null; functionCall: { name: string; args: unknown } | null };

function okTurn(value: Turn): ProviderResult<Turn> {
  return { ok: true, value };
}

async function main() {
  section("registry lists the allowed tools");
  assert.equal(TOOL_REGISTRY.length, TOOL_NAMES.length);
  assert.deepEqual(
    TOOL_REGISTRY.map((tool) => tool.name).sort(),
    [...TOOL_NAMES].sort(),
  );

  section("write tools stay out of the registry");
  for (const name of BANNED) {
    assert.equal(
      TOOL_REGISTRY.some((tool) => tool.name === name),
      false,
      name,
    );
  }

  section("getGeminiTools returns function declarations");
  const tools = getGeminiTools();
  assert.equal(Array.isArray(tools.functionDeclarations), true);
  assert.equal(tools.functionDeclarations.length, TOOL_REGISTRY.length);
  for (const declaration of tools.functionDeclarations) {
    assert.equal(typeof declaration.name, "string");
    assert.equal(typeof declaration.description, "string");
    assert.equal(typeof declaration.parameters, "object");
    assert.ok(declaration.parameters);
  }

  section("functionCallFromGeminiResponse reads a call beside text");
  const parsed = functionCallFromGeminiResponse({
    candidates: [
      {
        content: {
          parts: [
            { text: "先查一下" },
            { functionCall: { name: "list_trips", args: { extra: false } } },
          ],
        },
      },
    ],
  });
  assert.deepEqual(parsed, { name: "list_trips", args: { extra: false } });
  assert.equal(
    functionCallFromGeminiResponse({
      candidates: [{ content: { parts: [{ text: "只有文字" }] } }],
    }),
    null,
  );

  section("runAgentLoop stops at max steps");
  {
    let calls = 0;
    const request: AgentLoopRequest = async () => {
      calls += 1;
      return okTurn({
        text: null,
        functionCall: { name: "create_record_draft", args: { product_name: "铅笔" } },
      });
    };
    const result = await runAgentLoop({
      text: "记一条铅笔",
      ctx: ctx(),
      task: null,
      maxSteps: 6,
      requestWithTools: request,
    });
    assert.equal(calls, 6);
    assert.equal(result.kind, "max-steps");
    if (result.kind === "max-steps") assert.equal(result.text, "任务超出最大步数");
  }

  section("a fake function call executes the tool");
  {
    let step = 0;
    const request: AgentLoopRequest = async () => {
      step += 1;
      if (step === 1) {
        return okTurn({
          text: null,
          functionCall: { name: "create_record_draft", args: { product_name: "铅笔" } },
        });
      }
      return okTurn({ text: "草稿已形成。", functionCall: null });
    };
    const result = await runAgentLoop({
      text: "记一条铅笔",
      ctx: ctx(),
      task: null,
      requestWithTools: request,
    });
    assert.equal(result.kind, "text");
    if (result.kind === "text") {
      assert.equal(result.text, "草稿已形成。");
      assert.equal(result.draft?.draftType, "shopping_record");
      if (result.draft?.draftType === "shopping_record") {
        assert.equal(result.draft.name, "铅笔");
      }
    }
  }

  section("a failed tool exits safely");
  {
    const request: AgentLoopRequest = async () =>
      okTurn({ text: null, functionCall: { name: "create_record_draft", args: {} } });
    const result = await runAgentLoop({
      text: "记一条",
      ctx: ctx(),
      task: null,
      requestWithTools: request,
    });
    assert.equal(result.kind, "tool-error");
  }

  section("provider failure returns provider-error");
  {
    const request: AgentLoopRequest = async () => ({
      ok: false,
      code: "provider",
      error: "Gemini 没有返回可用结果。请稍后重试。",
    });
    const result = await runAgentLoop({
      text: "记一条",
      ctx: ctx(),
      task: null,
      requestWithTools: request,
    });
    assert.equal(result.kind, "provider-error");
    if (result.kind === "provider-error") {
      assert.equal(result.error, "Gemini 没有返回可用结果。请稍后重试。");
    }
  }

  section("cancelling the same context stops the loop");
  {
    const loopCtx = ctx();
    let calls = 0;
    const request: AgentLoopRequest = async () => {
      calls += 1;
      loopCtx.cancelled = true;
      return okTurn({
        text: null,
        functionCall: { name: "create_record_draft", args: { product_name: "铅笔" } },
      });
    };
    const result = await runAgentLoop({
      text: "记一条铅笔",
      ctx: loopCtx,
      task: null,
      requestWithTools: request,
    });
    assert.equal(calls, 1);
    assert.equal(result.kind, "cancelled");
  }

  section("text from the model ends the loop");
  {
    const request: AgentLoopRequest = async () =>
      okTurn({ text: "没有需要执行的工具。", functionCall: null });
    const result = await runAgentLoop({
      text: "你好",
      ctx: ctx(),
      task: null,
      requestWithTools: request,
    });
    assert.equal(result.kind, "text");
    if (result.kind === "text") {
      assert.equal(result.text, "没有需要执行的工具。");
      assert.equal(result.draft, null);
    }
  }

  console.log("\nbatch5s3 ok");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

// CHECKPOINT 6 DONE
