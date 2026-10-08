import {
  DRAFT_TTL_MS,
  RECEIPT_DRAFT_GROUP_STORAGE_KEY,
  draftStorageKey,
  type CompanionDraft,
  type DraftType,
  type ReceiptDraftGroup,
  type ShoppingRecordDraft,
  type ShoppingTodoDraft,
} from "./types";

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function isExpired(updatedAt: string, nowMs: number = Date.now()): boolean {
  const t = Date.parse(updatedAt);
  if (!Number.isFinite(t)) return true;
  return nowMs - t > DRAFT_TTL_MS;
}

function isShoppingRecordDraft(value: unknown): value is ShoppingRecordDraft {
  if (!value || typeof value !== "object") return false;
  const d = value as Partial<ShoppingRecordDraft>;
  return (
    d.version === 1 &&
    d.draftType === "shopping_record" &&
    typeof d.id === "string" &&
    typeof d.updatedAt === "string" &&
    typeof d.sourceText === "string"
  );
}

function isShoppingTodoDraft(value: unknown): value is ShoppingTodoDraft {
  if (!value || typeof value !== "object") return false;
  const d = value as Partial<ShoppingTodoDraft>;
  return (
    d.version === 1 &&
    d.draftType === "shopping_todo" &&
    typeof d.id === "string" &&
    typeof d.updatedAt === "string" &&
    typeof d.sourceText === "string"
  );
}

function isCompanionDraft(value: unknown): value is CompanionDraft {
  return isShoppingRecordDraft(value) || isShoppingTodoDraft(value);
}

export function saveDraft(draft: CompanionDraft): void {
  if (!isBrowser()) return;
  const next = { ...draft, updatedAt: new Date().toISOString() };
  try {
    localStorage.setItem(
      draftStorageKey(draft.draftType, draft.id),
      JSON.stringify(next),
    );
  } catch {
    // Quota / private mode — fail soft; in-memory UI still works this session.
  }
}

export function loadDraft(
  draftType: DraftType,
  id: string,
): CompanionDraft | null {
  if (!isBrowser()) return null;
  try {
    const raw = localStorage.getItem(draftStorageKey(draftType, id));
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isCompanionDraft(parsed) || parsed.draftType !== draftType) {
      localStorage.removeItem(draftStorageKey(draftType, id));
      return null;
    }
    if (isExpired(parsed.updatedAt)) {
      localStorage.removeItem(draftStorageKey(draftType, id));
      return null;
    }
    return parsed;
  } catch {
    try {
      localStorage.removeItem(draftStorageKey(draftType, id));
    } catch {
      // ignore
    }
    return null;
  }
}

function isReceiptDraftGroup(value: unknown): value is ReceiptDraftGroup {
  if (!value || typeof value !== "object") return false;
  const g = value as Partial<ReceiptDraftGroup>;
  return (
    g.version === 1 &&
    typeof g.id === "string" &&
    typeof g.updatedAt === "string" &&
    typeof g.merchant === "string" &&
    (g.receiptImageRef === null || typeof g.receiptImageRef === "string") &&
    (g.receiptDate === null || typeof g.receiptDate === "string") &&
    Array.isArray(g.items) &&
    g.items.every((item) => isShoppingRecordDraft(item))
  );
}

export function saveReceiptDraftGroup(group: ReceiptDraftGroup): void {
  if (!isBrowser()) return;
  const next = { ...group, updatedAt: new Date().toISOString() };
  try {
    localStorage.setItem(
      RECEIPT_DRAFT_GROUP_STORAGE_KEY,
      JSON.stringify(next),
    );
  } catch {
    // fail soft
  }
}

export function loadReceiptDraftGroup(): ReceiptDraftGroup | null {
  if (!isBrowser()) return null;
  try {
    const raw = localStorage.getItem(RECEIPT_DRAFT_GROUP_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isReceiptDraftGroup(parsed) || isExpired(parsed.updatedAt)) {
      localStorage.removeItem(RECEIPT_DRAFT_GROUP_STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    try {
      localStorage.removeItem(RECEIPT_DRAFT_GROUP_STORAGE_KEY);
    } catch {
      // ignore
    }
    return null;
  }
}

export function clearReceiptDraftGroup(): void {
  if (!isBrowser()) return;
  try {
    localStorage.removeItem(RECEIPT_DRAFT_GROUP_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function clearDraft(draftType: DraftType, id: string): void {
  if (!isBrowser()) return;
  try {
    localStorage.removeItem(draftStorageKey(draftType, id));
  } catch {
    // ignore
  }
}

/** Sweep expired / corrupt draft keys. Safe to call on Companion open. */
export function sweepExpiredDrafts(): void {
  if (!isBrowser()) return;
  const prefix = "fmn:draft:";
  const toRemove: string[] = [];
  try {
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith(prefix)) continue;
      const raw = localStorage.getItem(key);
      if (!raw) {
        toRemove.push(key);
        continue;
      }
      try {
        const parsed: unknown = JSON.parse(raw);
        const updatedAt =
          parsed &&
          typeof parsed === "object" &&
          "updatedAt" in parsed &&
          typeof (parsed as { updatedAt: unknown }).updatedAt === "string"
            ? (parsed as { updatedAt: string }).updatedAt
            : null;
        if (!updatedAt || isExpired(updatedAt)) {
          toRemove.push(key);
        }
      } catch {
        toRemove.push(key);
      }
    }
    for (const key of toRemove) {
      localStorage.removeItem(key);
    }
  } catch {
    // ignore
  }
}
