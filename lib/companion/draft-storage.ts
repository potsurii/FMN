import {
  DRAFT_TTL_MS,
  draftStorageKey,
  type CompanionDraft,
  type DraftType,
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
