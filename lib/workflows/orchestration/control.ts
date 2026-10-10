/**
 * Batch 5 slice 2 — bounded task control.
 * Recognizes a fixed set of sentences and stores the reading on TaskState.
 */

import { createTaskState } from "@/lib/companion/task-storage";
import type { CompanionEntry, ShoppingTodoDraft, TaskState } from "@/lib/companion/types";
import { extractDestination } from "@/lib/trips/destination-parse";
import {
  continueJapanSunscreenTask,
  type SunscreenHistoryRow,
  userAskedToCompareCurrentTrip,
} from "@/lib/workflows/orchestration/sequence";

const NOT_A_PLACE = new Set([
  "购物",
  "记录",
  "整理",
  "这次",
  "旅行",
  "东西",
  "价格",
  "防晒",
  "代办",
]);

export const PUBLIC_SUNSCREEN_GAP =
  "当前还不能从公开商品里查找防晒霜。请说明你自己的购买记录，或手动添加购物代办。";

export const DESTINATION_UNRESOLVED =
  "还不能确定目的地。请直接写出要整理的目的地。在确认之前不会查询全部记录。";

export const TRIP_PICK_PROMPT =
  "请点选这次要整理的旅行。确认之前不会排序，也不会创建购物记录草稿。";

export type TripChoice = { id: string; name: string };

export type AgentFacts = {
  operation: string;
  scope: string;
  destination: string;
  trip: string;
  sort: string;
};

export type AgentStep =
  | { kind: "passthrough" }
  | { kind: "stopped" }
  | { kind: "message"; text: string; task: TaskState | null }
  | { kind: "ask"; text: string; task: TaskState }
  | {
      kind: "organize";
      text: string;
      task: TaskState;
      forcedDestination: string | null;
      confirmedTripId: string | null;
    }
  | { kind: "history"; text: string; task: TaskState }
  | { kind: "history-then-todo"; historyText: string; task: TaskState }
  | {
      kind: "choose-trip";
      text: string;
      task: TaskState;
      candidates: TripChoice[];
    }
  | {
      kind: "todo-draft";
      task: TaskState;
      draft: ShoppingTodoDraft;
      text: string;
    };

const EMPTY_FACTS: AgentFacts = {
  operation: "",
  scope: "",
  destination: "",
  trip: "",
  sort: "",
};

export function acceptDestinationSuggestion(
  original: string,
  suggested: string,
): string | null {
  const value = suggested.trim();
  if (!value || value.length > 40 || NOT_A_PLACE.has(value)) return null;
  if (!original.includes(value)) return null;
  return value;
}

export function agentAllowsTodoConfirm(
  task: TaskState | null,
  tripId: string | null,
): boolean {
  if (task?.finalState === "cancelled") return false;
  return Boolean(tripId && tripId.trim());
}

function ownedPhrase(
  text: string,
): "own-history" | "naha" | "gap" | "this-sort" | "japan-todo" | null {
  const t = text.trim();
  if (!t) return null;
  if (/我想买一款防晒/.test(t)) return "gap";
  if (
    /上次/.test(t) &&
    /日本/.test(t) &&
    /防晒/.test(t) &&
    /下一次日本/.test(t) &&
    /代办/.test(t)
  ) {
    return "japan-todo";
  }
  if (/我买过的所有防晒/.test(t)) return "own-history";
  if (/整理/.test(t) && /那霸/.test(t) && /购物/.test(t)) return "naha";
  if (/把这次旅行买的东西按价格从高到低/.test(t)) return "this-sort";
  return null;
}

function facts(partial: Partial<AgentFacts>): AgentFacts {
  return { ...EMPTY_FACTS, ...partial };
}

function stamp(
  task: TaskState,
  fact: AgentFacts,
  patch: Partial<TaskState> = {},
  extra: Record<string, unknown> = {},
): TaskState {
  return {
    ...task,
    ...patch,
    updatedAt: new Date().toISOString(),
    intermediateResults: {
      ...task.intermediateResults,
      ...fact,
      ...extra,
    },
  };
}

function begin(
  goal: string,
  entry: CompanionEntry,
  currentTripId: string | null,
  originalText: string,
): TaskState {
  const task = createTaskState({
    goal,
    context: { entry, tripId: currentTripId, tripName: null },
    draftId: null,
    draftType: null,
    currentStep: "interpret",
  });
  task.intermediateResults = { ...EMPTY_FACTS, originalText };
  return task;
}

function storedRows(task: TaskState): SunscreenHistoryRow[] {
  const raw = task.intermediateResults.historyRows;
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((row) => {
    if (!row || typeof row !== "object") return [];
    const name = (row as { name?: unknown }).name;
    const category = (row as { category?: unknown }).category;
    if (typeof name !== "string") return [];
    return [
      {
        name,
        category: typeof category === "string" ? category : null,
      },
    ];
  });
}

function storedChoices(task: TaskState): TripChoice[] {
  const raw = task.intermediateResults.candidates;
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((row) => {
    if (!row || typeof row !== "object") return [];
    const id = (row as { id?: unknown }).id;
    const name = (row as { name?: unknown }).name;
    if (typeof id !== "string" || typeof name !== "string") return [];
    return [{ id, name }];
  });
}

async function placeFromText(
  text: string,
  task: TaskState,
  suggestDestination?: (text: string) => Promise<string | null>,
): Promise<{ place: string | null; task: TaskState }> {
  const parsed = extractDestination(text);
  if (parsed) return { place: parsed, task };
  const attempts = Number(task.intermediateResults.destinationAttempts ?? 0);
  if (attempts >= 1 || !suggestDestination) {
    return { place: null, task };
  }
  const marked = stamp(task, facts({ destination: "unresolved" }), {}, {
    destinationAttempts: 1,
  });
  let suggested: string | null = null;
  try {
    suggested = await suggestDestination(text);
  } catch {
    suggested = null;
  }
  const accepted = suggested ? acceptDestinationSuggestion(text, suggested) : null;
  return { place: accepted, task: marked };
}

export async function advanceAgentTask(input: {
  text: string;
  entry: CompanionEntry;
  currentTripId: string | null;
  task: TaskState | null;
  suggestDestination?: (text: string) => Promise<string | null>;
  listTripChoices?: () => Promise<TripChoice[]>;
}): Promise<AgentStep> {
  if (input.task?.finalState === "cancelled") return { kind: "stopped" };

  if (input.task?.finalState === "active" && input.task.pendingQuestions.length > 0) {
    return resumeWaiting(input.task, input.text.trim(), input.suggestDestination);
  }

  if (
    input.task?.finalState === "active" &&
    input.task.intermediateResults.operation === "sequence" &&
    input.task.completedSteps.includes("history")
  ) {
    return resumeSequence(input.task);
  }

  const phrase = ownedPhrase(input.text);
  if (!phrase) return { kind: "passthrough" };

  if (phrase === "gap") {
    const task = stamp(
      begin(input.text.trim(), input.entry, input.currentTripId, input.text.trim()),
      facts({ operation: "gap", scope: "public", destination: "absent", trip: "absent" }),
      { currentStep: "done", pendingQuestions: [] },
    );
    return { kind: "message", text: PUBLIC_SUNSCREEN_GAP, task };
  }

  if (phrase === "own-history") {
    const task = stamp(
      begin(input.text.trim(), input.entry, input.currentTripId, input.text.trim()),
      facts({
        operation: "history",
        scope: "own",
        destination: "absent",
        trip: "absent",
      }),
      { currentStep: "history" },
    );
    return { kind: "history", text: input.text.trim(), task };
  }

  if (phrase === "japan-todo") {
    if (userAskedToCompareCurrentTrip(input.text)) {
      const task = stamp(
        begin(input.text.trim(), input.entry, input.currentTripId, input.text.trim()),
        facts({
          operation: "sequence",
          scope: "own",
          destination: "japan",
          trip: "unresolved",
        }),
        {
          currentStep: "wait",
          pendingQuestions: [
            "如果要排除当前旅行已经买过的商品，请单独说明。这一步不会自动比较。",
          ],
        },
      );
      return {
        kind: "ask",
        text: "如果要排除当前旅行已经买过的商品，请单独说明。这一步不会自动比较。",
        task,
      };
    }
    const task = stamp(
      begin(input.text.trim(), input.entry, input.currentTripId, input.text.trim()),
      facts({
        operation: "sequence",
        scope: "own",
        destination: "japan",
        trip: "unresolved",
      }),
      { currentStep: "history" },
    );
    return {
      kind: "history-then-todo",
      historyText: "上次去日本买过防晒",
      task,
    };
  }

  if (phrase === "naha") {
    const started = begin(
      input.text.trim(),
      input.entry,
      input.currentTripId,
      input.text.trim(),
    );
    const resolved = await placeFromText(
      input.text.trim(),
      started,
      input.suggestDestination,
    );
    if (!resolved.place) {
      const task = stamp(
        resolved.task,
        facts({
          operation: "organize",
          scope: "own",
          destination: "unresolved",
          trip: "absent",
        }),
        { currentStep: "wait", pendingQuestions: [DESTINATION_UNRESOLVED] },
        { destinationAttempts: 1 },
      );
      return { kind: "ask", text: DESTINATION_UNRESOLVED, task };
    }
    const task = stamp(
      resolved.task,
      facts({
        operation: "organize",
        scope: "own",
        destination: "reliable",
        trip: "absent",
      }),
      { currentStep: "organize", pendingQuestions: [] },
    );
    return {
      kind: "organize",
      text: input.text.trim(),
      task,
      forcedDestination: resolved.place,
      confirmedTripId: null,
    };
  }

  return startThisTripSort(input);
}

async function startThisTripSort(input: {
  text: string;
  entry: CompanionEntry;
  currentTripId: string | null;
  listTripChoices?: () => Promise<TripChoice[]>;
}): Promise<AgentStep> {
  const original = input.text.trim();
  if (input.entry === "trip" && input.currentTripId) {
    const task = stamp(
      begin(original, input.entry, input.currentTripId, original),
      facts({
        operation: "organize",
        scope: "own",
        destination: "absent",
        trip: "context",
        sort: "price_desc",
      }),
      { currentStep: "organize" },
    );
    return {
      kind: "organize",
      text: original,
      task,
      forcedDestination: null,
      confirmedTripId: input.currentTripId,
    };
  }

  let choices: TripChoice[] = [];
  try {
    choices = input.listTripChoices ? await input.listTripChoices() : [];
  } catch {
    choices = [];
  }
  const task = stamp(
    begin(original, input.entry, null, original),
    facts({
      operation: "organize",
      scope: "own",
      destination: "absent",
      trip: "unresolved",
      sort: "price_desc",
    }),
    {
      currentStep: "wait",
      pendingQuestions: [TRIP_PICK_PROMPT],
    },
    { candidates: choices },
  );
  if (choices.length === 0) {
    return {
      kind: "ask",
      text: "还没有可选的旅行。确认之前不会排序。",
      task,
    };
  }
  return { kind: "choose-trip", text: original, task, candidates: choices };
}

function resumeSequence(task: TaskState): AgentStep {
  if (task.completedSteps.includes("todo-draft")) {
    return {
      kind: "message",
      text: "购物代办草稿已形成。请补齐字段后再确认。",
      task,
    };
  }
  const continued = continueJapanSunscreenTask(task, storedRows(task));
  if (continued.kind === "draft") {
    return {
      kind: "todo-draft",
      task: continued.task,
      draft: continued.draft,
      text: continued.message,
    };
  }
  return { kind: "message", text: continued.message, task: continued.task };
}

async function resumeWaiting(
  task: TaskState,
  text: string,
  suggestDestination?: (text: string) => Promise<string | null>,
): Promise<AgentStep> {
  if (task.intermediateResults.operation === "organize" && task.intermediateResults.destination === "unresolved") {
    const original = String(task.intermediateResults.originalText ?? "");
    const resolved = await placeFromText(text, task, suggestDestination);
    const place = resolved.place ?? (original ? acceptDestinationSuggestion(original, text) : null);
    if (!place) {
      const next = stamp(
        resolved.task,
        facts({
          operation: "organize",
          scope: "own",
          destination: "unresolved",
          trip: "absent",
        }),
        { pendingQuestions: [DESTINATION_UNRESOLVED], currentStep: "wait" },
      );
      return { kind: "ask", text: DESTINATION_UNRESOLVED, task: next };
    }
    const next = stamp(
      resolved.task,
      facts({
        operation: "organize",
        scope: "own",
        destination: "reliable",
        trip: "absent",
      }),
      { pendingQuestions: [], currentStep: "organize" },
    );
    return {
      kind: "organize",
      text: original || text,
      task: next,
      forcedDestination: place,
      confirmedTripId: null,
    };
  }

  if (task.intermediateResults.sort === "price_desc" && task.intermediateResults.trip === "unresolved") {
    const hit = storedChoices(task).find((choice) => choice.id === text || choice.name === text);
    if (!hit) {
      return { kind: "ask", text: TRIP_PICK_PROMPT, task };
    }
    const next = stamp(
      task,
      facts({
        operation: "organize",
        scope: "own",
        destination: "absent",
        trip: "confirmed",
        sort: "price_desc",
      }),
      { pendingQuestions: [], currentStep: "organize" },
    );
    return {
      kind: "organize",
      text: String(task.intermediateResults.originalText ?? task.goal),
      task: next,
      forcedDestination: null,
      confirmedTripId: hit.id,
    };
  }

  return { kind: "passthrough" };
}

/**
 * A failed history read stays a failure. Only a successful empty read
 * uses the no-record message, and a failure does not form a draft.
 */
export function japanTodoFromHistoryResult(
  task: TaskState,
  result:
    | { ok: true; items: SunscreenHistoryRow[] }
    | { ok: false; error: string },
): AgentStep {
  if (task.finalState === "cancelled") return { kind: "stopped" };
  if (!result.ok) {
    return { kind: "message", text: result.error, task: null };
  }
  return applyJapanHistory(task, result.items);
}

/** Old requests may return after cancel. Only the epoch that started them may update the UI. */
export function shouldCommitAgentResult(
  requestEpoch: number,
  currentEpoch: number,
): boolean {
  return requestEpoch === currentEpoch;
}

/** Shared by text cancel and draft cancel: stop the task and drop trip picking. */
export function cancelSurface(epoch: number): {
  epoch: number;
  recentPick: null;
  taskStopped: true;
} {
  return { epoch: epoch + 1, recentPick: null, taskStopped: true };
}

export function applyJapanHistory(
  task: TaskState,
  rows: SunscreenHistoryRow[],
): AgentStep {
  if (task.finalState === "cancelled") return { kind: "stopped" };
  if (task.completedSteps.includes("history")) return resumeSequence(task);
  const continued = continueJapanSunscreenTask(
    {
      ...task,
      completedSteps: Array.from(new Set([...task.completedSteps])),
    },
    rows,
  );
  if (continued.kind === "draft") {
    return {
      kind: "todo-draft",
      task: continued.task,
      draft: continued.draft,
      text: continued.message,
    };
  }
  return { kind: "message", text: continued.message, task: continued.task };
}
