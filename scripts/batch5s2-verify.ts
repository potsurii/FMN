/**
 * Batch 5 slices 2–4 — bounded control, one sequence, confirm safety.
 * Injects a fake destination completer. Does not call Gemini or write.
 *   npm run test:batch5s2
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createTaskState } from "../lib/companion/task-storage";
import {
  acceptDestinationSuggestion,
  advanceAgentTask,
  agentAllowsTodoConfirm,
  applyJapanHistory,
  cancelSurface,
  japanTodoFromHistoryResult,
  PUBLIC_SUNSCREEN_GAP,
  shouldCommitAgentResult,
} from "../lib/workflows/orchestration/control";
import {
  sunscreenTodoFromRows,
  userAskedToCompareCurrentTrip,
} from "../lib/workflows/orchestration/sequence";

const ROOT = path.resolve(__dirname, "..");

function section(name: string) {
  console.log(`\n✔ ${name}`);
}

async function main() {

const base = {
  entry: "global" as const,
  currentTripId: null,
  task: null,
};

section("fixed sentences stay inside the five task fields");
{
  let suggested = 0;
  const history = await advanceAgentTask({
    ...base,
    text: "我买过的所有防晒霜",
    suggestDestination: async () => {
      suggested += 1;
      return "日本";
    },
  });
  assert.equal(history.kind, "history");
  if (history.kind === "history") {
    assert.equal(history.text, "我买过的所有防晒霜");
    assert.equal(history.task.intermediateResults.operation, "history");
    assert.equal(history.task.intermediateResults.scope, "own");
    assert.equal(history.task.intermediateResults.destination, "absent");
    assert.equal(history.task.intermediateResults.trip, "absent");
    assert.equal(history.task.intermediateResults.sort, "");
  }

  const gap = await advanceAgentTask({
    ...base,
    text: "我想买一款防晒霜",
    suggestDestination: async () => {
      suggested += 1;
      return "日本";
    },
  });
  assert.equal(gap.kind, "message");
  if (gap.kind === "message") {
    assert.equal(gap.text, PUBLIC_SUNSCREEN_GAP);
    assert.equal(gap.task?.intermediateResults.operation, "gap");
    assert.equal(gap.task?.intermediateResults.scope, "public");
  }
  assert.equal(suggested, 0);

  const other = await advanceAgentTask({ ...base, text: "查铅笔" });
  assert.equal(other.kind, "passthrough");
}

section("unreliable place is asked, and a substring can be used");
{
  const calls: string[] = [];
  const unreliable = await advanceAgentTask({
    ...base,
    entry: "trip",
    currentTripId: "current-trip",
    text: "帮我整理那霸的购物记录",
    suggestDestination: async (text) => {
      calls.push(text);
      return "东京";
    },
  });
  assert.equal(unreliable.kind, "ask");
  assert.equal(calls.length, 1);
  assert.equal(acceptDestinationSuggestion("帮我整理那霸的购物记录", "东京"), null);
  assert.equal(acceptDestinationSuggestion("帮我整理那霸的购物记录", "那霸"), "那霸");

  const reliable = await advanceAgentTask({
    ...base,
    entry: "trip",
    currentTripId: "current-trip",
    text: "帮我整理那霸的购物记录",
    suggestDestination: async () => "那霸",
  });
  assert.equal(reliable.kind, "organize");
  if (reliable.kind === "organize") {
    assert.equal(reliable.forcedDestination, "那霸");
    assert.equal(reliable.confirmedTripId, null);
    assert.equal(reliable.task.intermediateResults.destination, "reliable");
  }
}

section("a follow-up place does not call the completer again");
{
  let calls = 0;
  const first = await advanceAgentTask({
    ...base,
    text: "帮我整理那霸的购物记录",
    suggestDestination: async () => {
      calls += 1;
      return null;
    },
  });
  assert.equal(first.kind, "ask");
  if (first.kind !== "ask") throw new Error("expected a question");
  const second = await advanceAgentTask({
    ...base,
    text: "日本",
    task: first.task,
    suggestDestination: async () => {
      calls += 1;
      return "大阪";
    },
  });
  assert.equal(calls, 1);
  assert.equal(second.kind, "organize");
  if (second.kind === "organize") {
    assert.equal(second.forcedDestination, "日本");
    assert.equal(second.confirmedTripId, null);
  }
}

section("global 这次 sort waits even for one trip");
{
  const one = await advanceAgentTask({
    ...base,
    currentTripId: "ignored-on-global",
    text: "把这次旅行买的东西按价格从高到低排一下",
    listTripChoices: async () => [{ id: "only", name: "东京行" }],
  });
  assert.equal(one.kind, "choose-trip");
  if (one.kind === "choose-trip") {
    assert.equal(one.candidates.length, 1);
    assert.equal(one.task.intermediateResults.sort, "price_desc");
    assert.equal(one.task.intermediateResults.trip, "unresolved");
    const picked = await advanceAgentTask({
      ...base,
      text: "东京行",
      task: one.task,
    });
    assert.equal(picked.kind, "organize");
    if (picked.kind === "organize") {
      assert.equal(picked.confirmedTripId, "only");
      assert.equal(picked.task.intermediateResults.trip, "confirmed");
    }
  }

  const onTrip = await advanceAgentTask({
    ...base,
    entry: "trip",
    currentTripId: "this-trip",
    text: "把这次旅行买的东西按价格从高到低排一下",
    listTripChoices: async () => {
      throw new Error("trip entry must not list choices");
    },
  });
  assert.equal(onTrip.kind, "organize");
  if (onTrip.kind === "organize") {
    assert.equal(onTrip.confirmedTripId, "this-trip");
  }
}

section("last Japan sunscreen becomes one todo draft and does not compare");
{
  const text = "查询上次日本旅行买过的防晒，并将其加入下一次日本旅行的购物代办";
  assert.equal(userAskedToCompareCurrentTrip(text), false);
  const step = await advanceAgentTask({ ...base, text });
  assert.equal(step.kind, "history-then-todo");
  if (step.kind !== "history-then-todo") throw new Error("expected sequence");
  assert.equal(step.historyText, "上次去日本买过防晒");
  assert.equal(step.task.completedSteps.includes("history"), false);

  const formed = applyJapanHistory(step.task, [
    { name: "安耐晒", category: "beauty" },
    { name: "创口贴", category: "daily" },
  ]);
  assert.equal(formed.kind, "todo-draft");
  if (formed.kind !== "todo-draft") throw new Error("expected draft");
  assert.equal(formed.draft.name, "安耐晒");
  assert.equal(formed.draft.tripId, null);
  assert.equal(formed.draft.referencePrice, null);
  assert.equal(formed.task.completedSteps.includes("history"), true);
  assert.equal(formed.task.completedSteps.includes("todo-draft"), true);

  const again = applyJapanHistory(formed.task, []);
  assert.equal(again.kind, "message");
  assert.equal(formed.task.draftId, formed.draft.id);

  const kept = sunscreenTodoFromRows({
    sourceText: text,
    rows: [{ name: "安耐晒", category: "beauty" }],
    compareCurrentTripPurchases: false,
  });
  assert.ok(kept.draft);
  const blocked = sunscreenTodoFromRows({
    sourceText: text,
    rows: [{ name: "安耐晒", category: "beauty" }],
    compareCurrentTripPurchases: true,
  });
  assert.equal(blocked.draft, null);
}

section("an explicit compare request does not continue into a draft");
{
  const step = await advanceAgentTask({
    ...base,
    text: "查询上次日本旅行买过的防晒，把当前旅行还没买的加入下一次日本旅行的购物代办",
  });
  assert.equal(step.kind, "ask");
}

section("cancel stops later steps, and a missing trip cannot confirm");
{
  const waiting = createTaskState({
    goal: "sequence",
    context: { entry: "global", tripId: null, tripName: null },
    draftId: null,
    draftType: null,
    currentStep: "history",
  });
  waiting.finalState = "cancelled";
  waiting.intermediateResults = {
    operation: "sequence",
    scope: "own",
    destination: "japan",
    trip: "unresolved",
    sort: "",
  };
  const stopped = await advanceAgentTask({
    ...base,
    text: "继续",
    task: waiting,
  });
  assert.equal(stopped.kind, "stopped");
  assert.equal(applyJapanHistory(waiting, [{ name: "安耐晒", category: "beauty" }]).kind, "stopped");

  const open = createTaskState({
    goal: "todo",
    context: { entry: "global", tripId: null, tripName: null },
    draftId: "draft",
    draftType: "shopping_todo",
    currentStep: "review",
  });
  assert.equal(agentAllowsTodoConfirm(open, null), false);
  assert.equal(agentAllowsTodoConfirm(open, "  "), false);
  assert.equal(agentAllowsTodoConfirm(open, "trip-1"), true);
  assert.equal(agentAllowsTodoConfirm(waiting, "trip-1"), false);
}

section("history failure stays a failure and does not form a draft");
{
  const task = createTaskState({
    goal: "查询上次日本旅行买过的防晒，并将其加入下一次日本旅行的购物代办",
    context: { entry: "global", tripId: null, tripName: null },
    draftId: null,
    draftType: null,
    currentStep: "history",
  });
  const failed = japanTodoFromHistoryResult(task, {
    ok: false,
    error: "请先登录后再查询历史记录。",
  });
  assert.equal(failed.kind, "message");
  if (failed.kind === "message") {
    assert.equal(failed.text, "请先登录后再查询历史记录。");
    assert.equal(failed.task, null);
  }
  assert.notEqual(failed.kind, "todo-draft");

  const empty = japanTodoFromHistoryResult(task, { ok: true, items: [] });
  assert.equal(empty.kind, "message");
  if (empty.kind === "message") {
    assert.equal(empty.text, "上次日本旅行里没有找到防晒记录，没有创建代办草稿。");
  }
}

section("a cancelled trip pick does not apply the old organize result");
{
  const requestEpoch = 2;
  let currentEpoch = requestEpoch;
  let ui: { view: string | null; recentPick: string | null; message: string | null } = {
    view: null,
    recentPick: "Osaka",
    message: null,
  };
  const cancelled = cancelSurface(currentEpoch);
  currentEpoch = cancelled.epoch;
  ui = { ...ui, recentPick: cancelled.recentPick, message: "已取消当前草稿。" };
  if (shouldCommitAgentResult(requestEpoch, currentEpoch)) {
    ui = { view: "旧的大阪结果", recentPick: null, message: "已整理 1 条记录" };
  }
  assert.equal(shouldCommitAgentResult(requestEpoch, currentEpoch), false);
  assert.equal(ui.view, null);
  assert.equal(ui.recentPick, null);
  assert.equal(ui.message, "已取消当前草稿。");

  const host = fs.readFileSync(
    path.join(ROOT, "components/companion/CompanionHost.tsx"),
    "utf8",
  );
  const organize = host.slice(
    host.indexOf("async function runOrganizeFlow"),
    host.indexOf("async function runFormalWrite"),
  );
  const guard = organize.indexOf("shouldCommitAgentResult");
  const showResult = organize.indexOf("setOrganizeView(result.view)");
  assert.ok(guard !== -1 && showResult !== -1 && guard < showResult);
}

section("draft cancel stops the task and clears trip picking");
{
  const next = cancelSurface(4);
  assert.equal(next.epoch, 5);
  assert.equal(next.recentPick, null);
  assert.equal(next.taskStopped, true);
  assert.equal(shouldCommitAgentResult(4, next.epoch), false);

  const host = fs.readFileSync(
    path.join(ROOT, "components/companion/CompanionHost.tsx"),
    "utf8",
  );
  const textCancel = host.slice(
    host.indexOf('if (route === "cancel")'),
    host.indexOf('if (route === "confirm")'),
  );
  const draftCancel = host.slice(
    host.indexOf("function handleCancelDraft"),
    host.indexOf("function handleDraftChange"),
  );
  assert.ok(textCancel.includes("invalidateAgentWork"));
  assert.ok(textCancel.includes("clearCancelledSurface"));
  assert.ok(draftCancel.includes("invalidateAgentWork"));
  assert.ok(draftCancel.includes("clearCancelledSurface"));
  const cleanup = host.slice(
    host.indexOf("function clearCancelledSurface"),
    host.indexOf("function handleCancelDraft"),
  );
  assert.ok(cleanup.includes("cancelTaskAndClearDraft"));
  assert.ok(cleanup.includes("setRecentPick(null)"));
}

section("new files do not call todo batch write or public search");
{
  const sequence = fs.readFileSync(
    path.join(ROOT, "lib/workflows/orchestration/sequence.ts"),
    "utf8",
  );
  const control = fs.readFileSync(
    path.join(ROOT, "lib/workflows/orchestration/control.ts"),
    "utf8",
  );
  assert.equal(sequence.includes("confirmShoppingTodoWrite"), false);
  assert.equal(sequence.includes("confirmBatchShoppingWrite"), false);
  assert.equal(control.includes("confirmBatchShoppingWrite"), false);
  assert.equal(control.includes("lib/search"), false);
  assert.equal(fs.existsSync(path.join(ROOT, "scripts/batch5s1-verify.ts")), true);
}

console.log("\nBatch 5 slice 2–4 checks passed.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
