import { DEFAULT_QUANTITY } from "@/lib/quantity";
import type { CategorySlug } from "@/lib/category";
import type { Visibility } from "@/lib/items/types";

export const DRAFT_KEY_PREFIX = "fmn:draft:";
export const TASK_STATE_KEY = "fmn:task:active";
export const DRAFT_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export type CompanionEntry = "global" | "trip";

export type CompanionSurfaceMode = "compact" | "expanded";

export type CompanionContext = {
  entry: CompanionEntry;
  /** Default trip context only — not a permission boundary. */
  tripId: string | null;
  tripName: string | null;
};

export type DraftType = "shopping_record" | "shopping_todo";

export type ShoppingRecordDraft = {
  version: 1;
  draftType: "shopping_record";
  id: string;
  createdAt: string;
  updatedAt: string;
  /** Raw user text retained for review (rule/manual path; not LLM). */
  sourceText: string;
  tripId: string | null;
  tripLabel: string | null;
  name: string;
  price: number | null;
  currency: string | null;
  /** Actual purchase location; empty string = 未填写 (allowed). */
  location: string;
  purchaseDate: string | null;
  category: CategorySlug | null;
  note: string;
  quantity: number;
  imagePath: string | null;
  receiptImageRef: string | null;
  visibility: Visibility;
};

export type TaskFinalState =
  | "active"
  | "completed"
  | "cancelled"
  | "paused";

export type TaskState = {
  version: 1;
  id: string;
  createdAt: string;
  updatedAt: string;
  goal: string;
  context: CompanionContext;
  subtasks: string[];
  dependencies: string[];
  completedSteps: string[];
  currentStep: string;
  pendingQuestions: string[];
  intermediateResults: Record<string, unknown>;
  /** Reference only — never embed Draft payload. */
  draftId: string | null;
  draftType: DraftType | null;
  finalState: TaskFinalState;
};

export function newDraftId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `draft_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function draftStorageKey(draftType: DraftType, id: string): string {
  return `${DRAFT_KEY_PREFIX}${draftType}:${id}`;
}

export function createEmptyShoppingRecordDraft(options: {
  sourceText: string;
  tripId: string | null;
  tripLabel: string | null;
  purchaseDateDefault: string | null;
}): ShoppingRecordDraft {
  const now = new Date().toISOString();
  return {
    version: 1,
    draftType: "shopping_record",
    id: newDraftId(),
    createdAt: now,
    updatedAt: now,
    sourceText: options.sourceText,
    tripId: options.tripId,
    tripLabel: options.tripLabel,
    name: "",
    price: null,
    currency: null,
    location: "",
    purchaseDate: options.purchaseDateDefault,
    category: null,
    note: "",
    quantity: DEFAULT_QUANTITY,
    imagePath: null,
    receiptImageRef: null,
    visibility: "private",
  };
}
