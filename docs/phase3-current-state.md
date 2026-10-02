# Phase 3 Current State

Factual implementation baseline after Phase 3 Batch 1 acceptance and Batch 2A (F3-02 own-history foundation).

This document describes **what exists in the repository now**.  
It is not a product requirements document and not an implementation plan.

---

## 1. Baseline Information

| Field | Value |
| :--- | :--- |
| Date | 2026-10-02 |
| Branch | `master` |
| Last committed HEAD | `4b9c928` — `chore(fmn): add eslint flat config` |
| Prior Batch 1 feature commit | `a65a4e5` — `feat(fmn): implement phase 3 batch 1 foundation` |
| Prior Batch 1 docs commit | `49c7138` — `docs(fmn): add phase 3 specifications and cursor rules` |
| Phase 3 batch status | **Batch 1 accepted**; **Batch 2A implemented** (working tree; not yet committed at doc update) |
| Verification | `npm run phase3:check` / `lint` / `typecheck` / `test:batch1` / `test:batch2a` / `build` — all PASS (`phase3:check` may WARN on Legacy Boundary) |

Related product / decision sources (do not treat as “implemented” unless listed below):

- `docs/phase3-decisions.md`
- `docs/phase3-design-system.md`
- `docs/phase3-component-library.md`
- `docs/phase3-product.md`
- `docs/phase3-intelligence-architecture.md`
- `.cursor/rules/phase3-project.mdc`
- `.cursor/rules/phase3-design-system.mdc`
- `.cursor/rules/phase3-component-library.mdc`

---

## 2. Completed Implementation

### Architecture Boundary Check

| Item | Path / script |
| :--- | :--- |
| Scanner | `scripts/phase3-boundary-check.ts` |
| npm script | `npm run phase3:check` |

Checks: forbidden `/companion` route, AI component family, conversation DB tables, OCR/STT/LLM deps, `lib/history` ↛ `lib/search`, historical-search read-only, required Companion / Draft / data-foundation baseline. Exit `0` = no FAIL (WARN allowed).

---

### Batch 1 — Step 1: Data Foundation

Migration:

- `supabase/migrations/20261001180000_phase3_data_foundation.sql`

#### Quantity

- `items.quantity` — `integer not null default 1`, constraint `items_quantity_positive` (`quantity >= 1`)
- `shopping_todos.quantity` — same shape; constraint `shopping_todos_quantity_positive`
- App helpers: `lib/quantity.ts`
- Wired through item/todo types, forms, and DAL

#### Receipts

- Table `receipts`: `id`, `user_id`, `image_path`, `receipt_date`, `created_at`
- Table `receipt_items`: `(receipt_id, item_id)` PK; `receipt_items_item_id_unique` on `item_id`
- FKs: receipts → `auth.users`; receipt_items → receipts / items (`ON DELETE CASCADE` on join rows)
- App DAL: `lib/receipts/types.ts`, `lib/receipts/mutations.ts`

#### Storage

- Buckets (stubs for I-02 lifecycle): `receipt-images-temp`, `receipt-images`
- App constants: `lib/storage/receipt-buckets.ts`
- Full temp promote / cleanup jobs are **not** implemented

#### RLS

- RLS enabled on `receipts` and `receipt_items`
- Own-row policies for select / insert / update / delete (receipt_items has no update policy)
- Storage path-prefix own policies for both receipt buckets

#### Explicitly not completed in Step 1

- Legacy Todo boundary UTC timestamp is **not** written in migration (requires Product Owner / deployment input)
- Runtime gate stub: `lib/todos/legacy-boundary.ts` via `FMN_LEGACY_TODO_BOUNDARY_UTC` (returns `unknown` until set)
- I-01 multi-write batch transaction RPC / function skeleton is **not** present

---

### Batch 1 — Step 2: Companion Shell + Runtime State

UI:

| Piece | Path |
| :--- | :--- |
| Host | `components/companion/CompanionHost.tsx` |
| Launcher | `components/companion/CompanionLauncher.tsx` |
| Surface | `components/companion/CompanionSurface.tsx` |
| Draft review | `components/companion/RecordDraftReview.tsx` |
| History results | `components/companion/HistoryResultSection.tsx` |

Mount points:

- Global Entry: `app/page.tsx` (Home / My Trips)
- Trip Entry: `app/trips/[tripId]/page.tsx` (owner Trip Detail)

Runtime:

| Concern | Implementation |
| :--- | :--- |
| Surface modes | Compact (drawer) / Expanded (page-in-page) |
| Context | Global (`tripId = null`) or Trip (current trip); default write/query context only |
| Conversation | In-memory React state in `CompanionHost`; cleared on Surface close |
| Draft state | `lib/companion/draft-storage.ts` — localStorage `fmn:draft:*`, 7-day TTL |
| Task state | `lib/companion/task-storage.ts` — localStorage; stores `draftId` reference only |
| Types | `lib/companion/types.ts` |

---

### Batch 1 — Step 3: F3-01 Text Path (Draft → Confirm → Write)

| Stage | Implementation |
| :--- | :--- |
| Text input | Companion composer (rule/manual mode; not LLM) |
| Parse → Draft | `lib/workflows/record-input/text-parse.ts` |
| Draft review / edit | `components/companion/RecordDraftReview.tsx` |
| Explicit Confirm intent | `lib/companion/confirm-intent.ts` + Confirm button; non-confirm phrases do not write |
| Formal write | `lib/workflows/record-input/confirm-write.ts` → `confirmShoppingRecordWrite` → `createItem` |

Guarantees in current code:

- Input → Draft → Review → Explicit Confirm → Formal Write
- Global Entry with Trip unset: Confirm disabled until Trip is chosen
- No guessing of Product / Price / Location when absent from input
- Bare digits alone must not invent price (Batch 1 verification covers this)

Not in Batch 1:

- Receipt OCR path
- Voice / STT path
- LLM-assisted understanding

Verification script: `scripts/batch1-verify.ts` (`npm run test:batch1`)

---

### Batch 2A — F3-02 Own History Foundation

**Status:** Implemented (read-only own Shopping Record query)

#### Data access (`lib/history/`)

| File | Role |
| :--- | :--- |
| `types.ts` | `OwnHistoryQuery` (name, category, min/maxPrice, currency, location, purchaseDateFrom/To, tripId); `OWN_HISTORY_LIMIT` |
| `sanitize.ts` | Local ILIKE sanitization — **does not** import `lib/search` |
| `queries.ts` | `searchOwnItems()` — `trips!inner` + `trips.user_id`; no `visibility` filter; includes own private items |

#### Workflow (`lib/workflows/historical-search/`)

| File | Role |
| :--- | :--- |
| `parse-query.ts` | Deterministic intent + filter parse; blocks L-01 / L-03 cues; asks when price lacks currency |
| `run-search.ts` | Server action `runOwnHistorySearch` — auth + parse + DAL; **no** `createItem` / mutations |

#### Companion integration

- `CompanionHost` routes: record → F3-01 Draft; history → F3-02 search; ambiguous → ask
- History path: **no Draft**, **no Confirm**, **no formal write**
- Trip Entry may pass `defaultTripId` as a query hint only (Context ≠ Permission)
- Results: `HistoryResultSection` reuses `ItemCard` + `EmptyState` (`NoHistoryMatches`)

#### Allowed query dimensions

- product name, category, price (+ currency), purchase location, purchase date range, trip id

#### Explicitly not in Batch 2A

- Brand / Destination (L-01)
- “最近” / relative trip (L-03)
- OCR / STT / LLM
- F3-03 / F3-04 / F3-05
- Public search changes (`lib/search/**`, `app/search/page.tsx` untouched)
- No new migration

Verification: `scripts/batch2a-verify.ts` (`npm run test:batch2a`)

---

## 3. Existing Architecture Boundaries

Recorded as **current repository reality** (aligned with locked Phase 3 rules):

| Boundary | Current state |
| :--- | :--- |
| No `/companion` route | No `app/companion/**`; Companion is in-page Surface only |
| No Conversation database | No `conversations` / `messages` tables |
| Conversation is in-memory | Cleared on Companion close / refresh / tab close |
| Draft ≠ Formal Record | Draft is localStorage + review UI; formal data only after Explicit Confirm write |
| Context ≠ Permission | Companion Context is default write/query context; RLS / ownership remain the permission boundary |
| Public search ≠ Private history | `lib/search/**` + `/search` = public discovery; `lib/history/**` = own-history only (isolated) |
| No AI provider integration | No OCR / STT / LLM packages or providers in application code |
| No AI-parallel UI components | No `AIButton` / `AIInput` / `AIForm` in `*.ts` / `*.tsx` |
| No Agent loop | F3-05 orchestration not implemented |
| Formal write safety | F3-01 Confirm path only; F3-02 is read-only |
| Boundary automation | `npm run phase3:check` |

---

## 4. Current Blocked Areas

From `docs/phase3-decisions.md` Later Decisions (implementation must not invent closures):

| ID | Topic | Status | Blocks |
| :--- | :--- | :--- | :--- |
| L-01 | Destination / Brand data model semantics | Later | Full F3-02 product conditions that need Brand / Destination |
| L-02 | Duplicate detection equality rules | Later | Full F3-04 duplicate handling |
| L-03 | “最近” / recent time window definition | Later | Full F3-02 / F3-03 “最近” behavior |
| L-04 | OCR provider (Layer 2) | Later (Privacy Layer 1 closed) | F3-01 Receipt OCR path |
| L-05 | STT provider (Layer 2) | Later (Privacy Layer 1 closed) | F3-01 Voice path |
| L-06 | LLM provider (Layer 2) | Later (Privacy Layer 1 closed) | LLM-assisted F3-01 / F3-05 |

Additional open inputs (not Later Decisions, but unfinished):

| Item | Current state |
| :--- | :--- |
| Legacy Todo Boundary UTC | Pending Product Owner; env stub only (`phase3:check` WARNs when unset) |
| I-01 batch transaction RPC | Decision closed; multi-write TX mechanism not implemented yet |
| I-02 receipt temp lifecycle | Buckets/RLS stubs present; promote/cleanup not implemented |

---

## 5. Next Development Slice

Suggested next coding slices (not started):

- Expand F3-02 UX (e.g. “查看全部” within Surface) without inventing L-03
- F3-03 organize (blocked on L-03 for “最近”)
- F3-04 Todo Companion path (blocked on L-02 for duplicates)
- I-01 / I-02 when multi-write / receipt lifecycle is in scope
- OCR / STT / LLM only after L-04 / L-05 / L-06 Layer 2 close

Remain forbidden until Later closes:

- Brand / Destination schema invention
- “最近” product semantics
- Agent loop / F3-05 early
- Inventing Legacy Boundary UTC
- Converting public `lib/search` into private history

---

## 6. Rules for Future Coding

1. **Phase 3 Plan v2 is a historical implementation plan.**  
   Do not update or rewrite it to track completion.  
   Do not mark planned items as completed inside the Plan document.

2. **This document (`docs/phase3-current-state.md`) is the coding baseline for repository reality.**  
   Update **only this Current State document** when implementation status changes.

3. Continue to obey locked Phase 3 sources for product and AI boundaries:

   - `docs/phase3-decisions.md`
   - `docs/phase3-product.md`
   - `docs/phase3-intelligence-architecture.md`
   - `docs/phase3-design-system.md`
   - `docs/phase3-component-library.md`
   - `.cursor/rules/phase3-*.mdc`

4. Do not implement blocked Later Decision features by inventing missing product answers.

5. Prefer:

   ```text
   Agent → Workflow → Tool / Data Operation
   ```

   Formal writes remain:

   ```text
   Input → Draft → Review → Explicit Confirm → Formal Write
   ```

6. Minimum necessary change for the active coding batch only. Do not start Phase 4 or out-of-batch features early.

7. Run `npm run phase3:check` before considering Phase 3 slices done.
