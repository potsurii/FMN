/**
 * Batch 5 — agent loop.
 * Injects a fake requestWithTools. Does not call Gemini or write to the database.
 *   npm run test:batch5s3
 */

import assert from "node:assert/strict";
import { functionCallFromGeminiResponse } from "../lib/providers/gemini/call";
import { requestWithTools } from "../lib/providers/gemini/llm";
import type { ProviderResult } from "../lib/providers/gemini/types";
import { advanceAgentTask } from "../lib/workflows/orchestration/control";
import { runAgentLoop, type AgentContext, type AgentLoopRequest } from "../lib/workflows/orchestration/loop";
import {
  AGENT_MAX_CONTENTS,
  AGENT_MAX_TEXT_CHARS,
  AGENT_SYSTEM_INSTRUCTION,
  prepareAgentModelTurn,
} from "../lib/workflows/orchestration/agent-turn-policy";
import {
  AGENT_TURN_LOG_PREFIX,
  agentTurnDiag,
  logAgentTurnDiag,
} from "../lib/workflows/orchestration/agent-turn-diag";
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
      assert.equal(result.toolAttempted, false);
      assert.equal(result.draft, null);
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

  section("search_own_history choose_trip interrupts as history");
  {
    const tool = TOOL_REGISTRY.find((item) => item.name === "search_own_history");
    assert.ok(tool);
    const original = tool.handler;
    tool.handler = async () => ({
      ok: true,
      data: {
        status: "choose_trip",
        candidates: [
          { id: "trip-a", name: "Bangkok" },
          { id: "trip-b", name: "Tokyo" },
        ],
      },
    });
    try {
      const request: AgentLoopRequest = async () =>
        okTurn({
          text: null,
          functionCall: { name: "search_own_history", args: { text: "我最近买了什么" } },
        });
      const result = await runAgentLoop({
        text: "我最近买了什么",
        ctx: ctx(),
        task: null,
        requestWithTools: request,
      });
      assert.equal(result.kind, "choose-trip");
      if (result.kind === "choose-trip") {
        assert.equal(result.source, "history");
        assert.equal(result.candidates.length, 2);
      }
    } finally {
      tool.handler = original;
    }
  }

  section("organize_records choose_trip interrupts as organize");
  {
    const tool = TOOL_REGISTRY.find((item) => item.name === "organize_records");
    assert.ok(tool);
    const original = tool.handler;
    tool.handler = async () => ({
      ok: true,
      data: {
        status: "choose_trip",
        candidates: [{ id: "trip-a", name: "Bangkok" }],
      },
    });
    try {
      const request: AgentLoopRequest = async () =>
        okTurn({
          text: null,
          functionCall: { name: "organize_records", args: { text: "整理最近的记录" } },
        });
      const result = await runAgentLoop({
        text: "整理最近的记录",
        ctx: ctx(),
        task: null,
        requestWithTools: request,
      });
      assert.equal(result.kind, "choose-trip");
      if (result.kind === "choose-trip") {
        assert.equal(result.source, "organize");
        assert.equal(result.candidates.length, 1);
      }
    } finally {
      tool.handler = original;
    }
  }

  section("request_trip_pick pick_trip interrupts as pick");
  {
    const tool = TOOL_REGISTRY.find((item) => item.name === "request_trip_pick");
    assert.ok(tool);
    const original = tool.handler;
    tool.handler = async () => ({
      ok: true,
      data: {
        status: "pick_trip",
        candidates: [{ id: "trip-a", name: "Bangkok" }],
      },
    });
    try {
      const request: AgentLoopRequest = async () =>
        okTurn({
          text: null,
          functionCall: { name: "request_trip_pick", args: {} },
        });
      const result = await runAgentLoop({
        text: "把这次旅行买的东西按价格排序",
        ctx: ctx(),
        task: null,
        requestWithTools: request,
      });
      assert.equal(result.kind, "choose-trip");
      if (result.kind === "choose-trip") {
        assert.equal(result.source, "pick");
        assert.equal(result.candidates.length, 1);
      }
    } finally {
      tool.handler = original;
    }
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

  section("provider failure before any tool falls back locally");
  {
    const step = await advanceAgentTask({
      text: "记一条铅笔 30 泰铢",
      entry: "global",
      currentTripId: null,
      task: null,
      requestWithTools: async () => ({
        ok: false,
        code: "provider",
        error: "Gemini 没有返回可用结果。请稍后重试。",
      }),
    });
    assert.equal(step.kind, "local-fallback");
  }

  section("a tool that already ran blocks local fallback");
  {
    let calls = 0;
    const step = await advanceAgentTask({
      text: "记一条铅笔",
      entry: "global",
      currentTripId: null,
      task: null,
      requestWithTools: async () => {
        calls += 1;
        if (calls === 1) {
          return okTurn({
            text: null,
            functionCall: { name: "create_record_draft", args: { product_name: "铅笔" } },
          });
        }
        return {
          ok: false as const,
          code: "provider" as const,
          error: "Gemini 没有返回可用结果。请稍后重试。",
        };
      },
    });
    assert.equal(calls, 2);
    assert.equal(step.kind, "loop-tool-draft");
    if (step.kind === "loop-tool-draft") {
      assert.equal(step.draft.draftType, "shopping_record");
      assert.equal(step.text, "Gemini 没有返回可用结果。请稍后重试。");
    }
  }

  section("a thrown tool counts as attempted and does not fall back");
  {
    const tool = TOOL_REGISTRY.find((item) => item.name === "create_record_draft");
    assert.ok(tool);
    const original = tool.handler;
    tool.handler = async () => {
      throw new Error("handler blew up");
    };
    try {
      const step = await advanceAgentTask({
        text: "记一条铅笔",
        entry: "global",
        currentTripId: null,
        task: null,
        requestWithTools: async () =>
          okTurn({
            text: null,
            functionCall: { name: "create_record_draft", args: { product_name: "铅笔" } },
          }),
      });
      assert.equal(step.kind, "loop-text");
      if (step.kind === "loop-text") assert.equal(step.text, "工具执行失败。");
    } finally {
      tool.handler = original;
    }
  }

  section("server turn policy ignores client tools and requires a session");
  {
    const contents = [{ role: "user" as const, parts: [{ text: "记一条" }] }];
    const denied = prepareAgentModelTurn(false, contents);
    assert.equal(denied.ok, false);
    if (!denied.ok) assert.equal(denied.failure.code, "unauthorized");

    const prepared = prepareAgentModelTurn(true, contents);
    assert.equal(prepared.ok, true);
    if (prepared.ok) {
      assert.equal(prepared.body.systemInstruction.parts[0].text, AGENT_SYSTEM_INSTRUCTION);
      assert.deepEqual(prepared.tools, getGeminiTools());
      assert.deepEqual(prepared.body.contents, contents);
    }

    const tooMany = Array.from({ length: AGENT_MAX_CONTENTS + 1 }, () => ({
      role: "user" as const,
      parts: [{ text: "记一条" }],
    }));
    const overCount = prepareAgentModelTurn(true, tooMany);
    assert.equal(overCount.ok, false);
    if (!overCount.ok) assert.equal(overCount.failure.code, "invalid");

    const overText = prepareAgentModelTurn(true, [
      { role: "user", parts: [{ text: "x".repeat(AGENT_MAX_TEXT_CHARS + 1) }] },
    ]);
    assert.equal(overText.ok, false);

    const bulky = prepareAgentModelTurn(true, [
      {
        role: "user",
        parts: [
          {
            functionResponse: {
              name: "search_own_history",
              response: { blob: "y".repeat(100_000) },
            },
          },
        ],
      },
    ]);
    assert.equal(bulky.ok, false);
    if (!bulky.ok) assert.equal(bulky.failure.error, "模型对话体积超出上限。");
  }

  console.log("\n-- agent turn diagnostic log --");
  {
    const sentence = "我昨天买了一条围巾";
    const secret = "sk-test-secret-key";
    const allowed = new Set([
      "requestId",
      "stage",
      "code",
      "status",
      "responseIsJson",
      "errorStatus",
      "errorCode",
    ]);
    const cases = [
      agentTurnDiag({ requestId: "req-1", stage: "session", code: "unauthorized" }),
      agentTurnDiag({ requestId: "req-2", stage: "validate", code: "invalid" }),
      agentTurnDiag({ requestId: "req-3", stage: "config", code: "not_configured" }),
      agentTurnDiag({ requestId: "req-4", stage: "http", code: "provider", status: 429 }),
      agentTurnDiag({ requestId: "req-5", stage: "response", code: "empty", status: 200 }),
      agentTurnDiag({ requestId: "req-6", stage: "transport", code: "timeout" }),
      agentTurnDiag({ requestId: "req-7", stage: "transport", code: "network", status: 1.5 }),
    ];

    const withJsonError = agentTurnDiag({
      requestId: "req-http-json",
      stage: "http",
      code: "provider",
      status: 503,
      responseIsJson: true,
      errorStatus: "UNAVAILABLE",
      errorCode: 503,
    });
    assert.equal(withJsonError.responseIsJson, true);
    assert.equal(withJsonError.errorStatus, "UNAVAILABLE");
    assert.equal(withJsonError.errorCode, 503);

    const withNonJson = agentTurnDiag({
      requestId: "req-http-nonjson",
      stage: "http",
      code: "provider",
      status: 503,
      responseIsJson: false,
      errorStatus: null,
      errorCode: null,
    });
    assert.equal(withNonJson.responseIsJson, false);
    assert.equal(withNonJson.errorStatus, null);

    for (const line of cases) {
      for (const key of Object.keys(line)) assert.equal(allowed.has(key), true);
      const serialized = JSON.stringify(line);
      assert.equal(serialized.includes(sentence), false);
      assert.equal(serialized.includes(secret), false);
      assert.equal("error" in line, false);
    }
    assert.equal(cases[3]?.status, 429);
    assert.equal(cases[6]?.status, undefined);

    const logged: unknown[] = [];
    const original = console.error;
    console.error = (...args: unknown[]) => {
      logged.push(args);
    };
    try {
      logAgentTurnDiag({
        requestId: "req-log",
        stage: "session",
        code: "unauthorized",
      });
      const fake = async (status: number, json: unknown) => ({ status, json });
      const body = { contents: [{ role: "user", parts: [{ text: sentence }] }] };
      const base = { apiKey: secret, body, tools: [], diagRequestId: "req-http" };
      await requestWithTools({ ...base, call: async () => fake(429, {}) });
      await requestWithTools({ ...base, call: async () => fake(500, {}) });
      await requestWithTools({ ...base, call: async () => fake(404, {}) });
      await requestWithTools({
        ...base,
        call: async () => fake(503, { error: { status: "UNAVAILABLE", code: 503 } }),
      });
      await requestWithTools({
        ...base,
        call: async () => fake(503, null),
      });
      await requestWithTools({ ...base, call: async () => fake(200, {}) });
      await requestWithTools({
        ...base,
        call: async () => {
          const err = new Error("timed out with key " + secret);
          err.name = "TimeoutError";
          throw err;
        },
      });
      await requestWithTools({
        ...base,
        call: async () => {
          throw new Error("network down " + sentence);
        },
      });
      await requestWithTools({
        ...base,
        call: async () =>
          fake(200, {
            candidates: [{ content: { parts: [{ text: "ok" }] } }],
          }),
      });
      await requestWithTools({
        apiKey: secret,
        body,
        tools: [],
        call: async () => fake(500, {}),
      });
    } finally {
      console.error = original;
    }
    const lines = logged.filter(
      (entry) => Array.isArray(entry) && entry[0] === AGENT_TURN_LOG_PREFIX,
    );
    assert.equal(lines.length, 9);
    const stages = lines.map((entry) => (entry as unknown[])[1] as { stage: string; code: string; status?: number });
    assert.deepEqual(
      stages.map((line) => [line.stage, line.code, line.status ?? null]),
      [
        ["session", "unauthorized", null],
        ["http", "provider", 429],
        ["http", "provider", 500],
        ["http", "provider", 404],
        ["http", "provider", 503],
        ["http", "provider", 503],
        ["response", "empty", 200],
        ["transport", "timeout", null],
        ["transport", "network", null],
      ],
    );
    const http503Lines = lines
      .map((entry) => (entry as unknown[])[1] as Record<string, unknown>)
      .filter((line) => line.stage === "http" && line.status === 503);
    const json503 = http503Lines.find((line) => line.responseIsJson === true);
    const html503 = http503Lines.find((line) => line.responseIsJson === false);
    assert.equal(json503?.errorStatus, "UNAVAILABLE");
    assert.equal(json503?.errorCode, 503);
    assert.equal(html503?.errorStatus, null);
    assert.equal(html503?.errorCode, null);

    const blob = JSON.stringify(lines);
    assert.equal(blob.includes(sentence), false);
    assert.equal(blob.includes(secret), false);
    assert.equal(blob.includes("timed out"), false);
    assert.equal(blob.includes("network down"), false);
  }

  console.log("\nbatch5s3 ok");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

// CHECKPOINT 6 DONE
