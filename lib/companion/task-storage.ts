import { DRAFT_TTL_MS, TASK_STATE_KEY, type TaskState } from "./types";
import { clearDraft } from "./draft-storage";

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function isExpired(updatedAt: string, nowMs: number = Date.now()): boolean {
  const t = Date.parse(updatedAt);
  if (!Number.isFinite(t)) return true;
  return nowMs - t > DRAFT_TTL_MS;
}

function isTaskState(value: unknown): value is TaskState {
  if (!value || typeof value !== "object") return false;
  const t = value as Partial<TaskState>;
  return (
    t.version === 1 &&
    typeof t.id === "string" &&
    typeof t.updatedAt === "string" &&
    typeof t.goal === "string" &&
    (t.draftId === null || typeof t.draftId === "string")
  );
}

export function saveTaskState(task: TaskState): void {
  if (!isBrowser()) return;
  const next = { ...task, updatedAt: new Date().toISOString() };
  try {
    localStorage.setItem(TASK_STATE_KEY, JSON.stringify(next));
  } catch {
    // fail soft
  }
}

export function loadTaskState(): TaskState | null {
  if (!isBrowser()) return null;
  try {
    const raw = localStorage.getItem(TASK_STATE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isTaskState(parsed)) {
      localStorage.removeItem(TASK_STATE_KEY);
      return null;
    }
    if (isExpired(parsed.updatedAt)) {
      if (parsed.draftId && parsed.draftType) {
        clearDraft(parsed.draftType, parsed.draftId);
      }
      localStorage.removeItem(TASK_STATE_KEY);
      return null;
    }
    return parsed;
  } catch {
    try {
      localStorage.removeItem(TASK_STATE_KEY);
    } catch {
      // ignore
    }
    return null;
  }
}

export function clearTaskState(): void {
  if (!isBrowser()) return;
  try {
    localStorage.removeItem(TASK_STATE_KEY);
  } catch {
    // ignore
  }
}

export function completeTaskAndClearDraft(task: TaskState): void {
  if (task.draftId && task.draftType) {
    clearDraft(task.draftType, task.draftId);
  }
  clearTaskState();
}

export function cancelTaskAndClearDraft(task: TaskState): void {
  if (task.draftId && task.draftType) {
    clearDraft(task.draftType, task.draftId);
  }
  clearTaskState();
}

export function createTaskState(options: {
  goal: string;
  context: TaskState["context"];
  draftId: string | null;
  draftType: TaskState["draftType"];
  currentStep: string;
}): TaskState {
  const now = new Date().toISOString();
  return {
    version: 1,
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `task_${Date.now()}`,
    createdAt: now,
    updatedAt: now,
    goal: options.goal,
    context: options.context,
    subtasks: ["collect", "review", "confirm", "write"],
    dependencies: [],
    completedSteps: [],
    currentStep: options.currentStep,
    pendingQuestions: [],
    intermediateResults: {},
    draftId: options.draftId,
    draftType: options.draftType,
    finalState: "active",
  };
}
