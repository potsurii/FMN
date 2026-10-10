/**
 * Batch 5 slice 1 — single-workflow routing and text cancel.
 * Pure functions only. Does not call Gemini or write to the database.
 *   npm run test:batch5s1
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { isExplicitCancelIntent, isExplicitConfirmIntent } from "../lib/companion/confirm-intent";
import { cancelTaskAndClearDraft } from "../lib/companion/task-storage";
import {
  activeWorkCancelEffect,
  NOTHING_TO_CANCEL_MESSAGE,
  parseOwnHistoryQuery,
  routeCompanionText,
  UNSUPPORTED_CROSS_WORKFLOW_MESSAGE,
} from "../lib/workflows/historical-search/parse-query";
import { extractDestination } from "../lib/trips/destination-parse";
import { parseOrganizeQuery } from "../lib/workflows/organize/parse-query";
import { buildShoppingTodoDraftFromText } from "../lib/workflows/todo-planning/text-parse";

const ROOT = path.resolve(__dirname, "..");
const idle = { draft: false, todo: false, receipt: false };
const openRecord = { draft: true, todo: false, receipt: false };

function section(name: string) {
  console.log(`\n✔ ${name}`);
}

section("history price question does not open a record draft");
{
  const text = "我上次买铅笔花了多少钱？";
  assert.equal(routeCompanionText(text, idle), "history");
  const parsed = parseOwnHistoryQuery(text);
  assert.equal(parsed.status, "ok");
  if (parsed.status === "ok") {
    assert.equal(parsed.query.name, "铅笔");
    assert.equal(parsed.query.minPrice, undefined);
    assert.equal(parsed.query.tripId, undefined);
  }
}

section("history when/where question stays on history");
{
  const text = "我最近一次买铅笔是什么时候？在哪买的？";
  assert.equal(routeCompanionText(text, idle), "history");
  const parsed = parseOwnHistoryQuery(text);
  assert.ok(parsed.status === "ok" || parsed.status === "ask");
  const query = parsed.status === "ok" ? parsed.query : null;
  assert.equal(query?.name, "铅笔");
  assert.equal(query?.recentTrip, true);
  assert.equal(query?.destination ?? null, null);
  assert.equal(extractDestination(text), null);
}

section("price sort stays on organize and does not pick a trip");
{
  const text = "把这次旅行买的东西按价格从高到低排一下。";
  assert.equal(routeCompanionText(text, idle), "organize");
  const parsed = parseOrganizeQuery(text);
  assert.equal(parsed.status, "ok");
  const spec = parsed.status === "ok" ? parsed.spec : null;
  assert.equal(spec?.sortBy, "price_desc");
  assert.equal(spec?.filter.destination ?? null, null);
  assert.equal(spec?.filter.tripId, undefined);
  assert.equal(extractDestination(text), null);
  const host = fs.readFileSync(
    path.join(ROOT, "components/companion/CompanionHost.tsx"),
    "utf8",
  );
  assert.match(
    host,
    /defaultTripId: context\.entry === "trip" \? context\.tripId : null/,
  );
  const runner = fs.readFileSync(
    path.join(ROOT, "lib/workflows/organize/run-organize.ts"),
    "utf8",
  );
  assert.match(runner, /input\.defaultTripId/);
}

section("explicit destination still extracts the place");
{
  const text = "上次去日本买的铅笔";
  const parsed = parseOwnHistoryQuery(text);
  assert.equal(parsed.status, "ok");
  const query = parsed.status === "ok" ? parsed.query : null;
  assert.equal(query?.destination, "日本");
  assert.equal(extractDestination(text), "日本");
}

section("todo phrase opens a todo draft without invented price or place");
{
  const text = "我想买盒创口贴，先记到待办里。";
  assert.equal(routeCompanionText(text, idle), "todo");
  const parsed = buildShoppingTodoDraftFromText(text, {
    tripId: null,
    tripLabel: null,
  });
  assert.equal(parsed.status, "ok");
  if (parsed.status === "ok") {
    assert.equal(parsed.draft.name, "创口贴");
    assert.equal(parsed.draft.referencePrice, null);
    assert.equal(parsed.draft.referenceCurrency, null);
    assert.equal(parsed.draft.referenceLocation, "");
    assert.equal(parsed.draft.tripId, null);
  }
  const existing = buildShoppingTodoDraftFromText(
    "帮我加一个 Anessa，3000 日元，在松本清买",
    { tripId: "trip-1", tripLabel: "Tokyo" },
  );
  assert.equal(existing.status, "ok");
  if (existing.status === "ok") {
    assert.equal(existing.draft.name, "Anessa");
    assert.equal(existing.draft.referencePrice, 3000);
    assert.equal(existing.draft.referenceLocation, "松本清");
  }
}

section("cross-workflow record request does not write");
{
  const text = "刚才买的东西帮我整理成一条购买记录。";
  assert.equal(routeCompanionText(text, idle), "unsupported");
  assert.match(UNSUPPORTED_CROSS_WORKFLOW_MESSAGE, /不会创建草稿/);
  assert.match(UNSUPPORTED_CROSS_WORKFLOW_MESSAGE, /不会写入/);
}

section("cancel wins and has no effect without active work");
{
  const text = "取消刚才那个。";
  assert.equal(isExplicitCancelIntent(text), true);
  assert.equal(isExplicitConfirmIntent(text), false);
  assert.equal(routeCompanionText(text, idle), "cancel");
  assert.equal(routeCompanionText(text, openRecord), "cancel");
  assert.equal(activeWorkCancelEffect(false), "no-active-work");
  assert.equal(activeWorkCancelEffect(true), "cancel-active");
  assert.match(NOTHING_TO_CANCEL_MESSAGE, /没有可取消/);
  cancelTaskAndClearDraft({
    version: 1,
    id: "task-1",
    createdAt: "2026-10-10T00:00:00.000Z",
    updatedAt: "2026-10-10T00:00:00.000Z",
    goal: "draft",
    context: { entry: "global", tripId: null, tripName: null },
    subtasks: [],
    dependencies: [],
    completedSteps: [],
    currentStep: "review",
    pendingQuestions: [],
    intermediateResults: {},
    draftId: "draft-1",
    draftType: "shopping_record",
    finalState: "active",
  });
  const host = fs.readFileSync(
    path.join(ROOT, "components/companion/CompanionHost.tsx"),
    "utf8",
  );
  const submit = host.slice(
    host.indexOf("function submitText"),
    host.indexOf("function handleSubmitText"),
  );
  assert.match(submit, /cancelTaskAndClearDraft\(task\)/);
  assert.doesNotMatch(submit, /\.from\(\s*["']trips["']\s*\)/);
  assert.doesNotMatch(submit, /\.from\(\s*["']items["']\s*\)/);
}

section("open draft blocks a new workflow and still requires explicit confirm");
{
  assert.equal(routeCompanionText("查铅笔", openRecord), "keep-draft");
  assert.equal(routeCompanionText("确认写入", openRecord), "confirm");
  assert.equal(routeCompanionText("好的", openRecord), "keep-draft");
}

console.log("\nBatch 5 slice 1 verify passed.\n");
