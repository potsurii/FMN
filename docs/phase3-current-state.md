# Phase 3 Current State

Factual implementation baseline after Phase 3 Batch 1 acceptance, Batch 2A (F3-02), and Batch 2B (Legacy Boundary UTC + F3-03 + F3-04 formal path).

This document describes **what exists in the repository now**.  
It is not a product requirements document and not an implementation plan.

---

## 1. Baseline Information

| Field | Value |
| :--- | :--- |
| Date | 2026-10-02 |
| Branch | `master` |
| Last committed HEAD | `3d16eaf` — `docs(fmn): archive phase 3 implementation plan v2` |
| Prior Batch 2A feature commit | `fa86bfe` — `feat(fmn): add F3-02 own-history and architecture baseline` |
| Prior Batch 1 eslint commit | `4b9c928` — `chore(fmn): add eslint flat config` |
| Phase 3 batch status | **Batch 1 accepted**; **Batch 2A committed**; **Batch 2B implemented** (working tree; not yet committed at doc update) |
| Verification | `npm run phase3:check` / `test:batch1` / `test:batch2a` / `test:batch2b` / `typecheck` / `lint` / `build` |

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

Checks: forbidden `/companion` route, AI component family, conversation DB tables, OCR/STT/LLM deps, `lib/history` ↛ `lib/search`, historical-search read-only, required Companion / Draft / data-foundation baseline, Legacy Boundary fixed UTC constant. Exit `0` = no FAIL (WARN allowed).

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
- App DAL: `lib/receipts/types.ts`, `lib/receipts/mutations.ts`

#### Storage

- Buckets (stubs for I-02 lifecycle): `receipt-images-temp`, `receipt-images`
- App constants: `lib/storage/receipt-buckets.ts`
- Full temp promote / cleanup jobs are **not** implemented

#### RLS

- RLS enabled on `receipts` and `receipt_items`
- Own-row policies for select / insert / update / delete (receipt_items has no update policy)
- Storage path-prefix own policies for both receipt buckets

#### Explicitly not completed in Batch 1 Step 1

- I-01 multi-write batch transaction RPC / function skeleton is **not** present
- (Legacy Boundary UTC completed later in Batch 2B Step 0 — see below)

---

### Batch 1 — Step 2: Companion Shell + Runtime State

UI:

| Piece | Path |
| :--- | :--- |
| Host | `components/companion/CompanionHost.tsx` |
| Launcher | `components/companion/CompanionLauncher.tsx` |
| Surface | `components/companion/CompanionSurface.tsx` |
| Record Draft review | `components/companion/RecordDraftReview.tsx` |

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

Guarantees:

- Input → Draft → Review → Explicit Confirm → Formal Write
- Global Entry with Trip unset: Confirm disabled until Trip is chosen
- No guessing of Product / Price / Location when absent from input

Verification: `scripts/batch1-verify.ts` (`npm run test:batch1`)

---

### Batch 2A — F3-02 Own History Foundation

**Status:** Implemented (read-only own Shopping Record query)

#### Data access (`lib/history/`)

| File | Role |
| :--- | :--- |
| `types.ts` | `OwnHistoryQuery`; `OWN_HISTORY_LIMIT` |
| `sanitize.ts` | Local ILIKE sanitization — **does not** import `lib/search` |
| `queries.ts` | `searchOwnItems()` — `trips!inner` + `trips.user_id`; includes own private items |

#### Workflow (`lib/workflows/historical-search/`)

| File | Role |
| :--- | :--- |
| `parse-query.ts` | Deterministic intent + filter parse; blocks L-01 / L-03 cues |
| `run-search.ts` | Server action `runOwnHistorySearch` — auth + parse + DAL; **no** mutations |

#### Companion integration

- History path: **no Draft**, **no Confirm**, **no formal write**
- Results: `HistoryResultSection` reuses `ItemCard` + `EmptyState`

Verification: `scripts/batch2a-verify.ts` (`npm run test:batch2a`)

---

### Batch 2B — Step 0: Legacy Boundary UTC

**Status:** Implemented (Product Owner approved)

| Item | Value / path |
| :--- | :--- |
| Boundary UTC | `2026-10-02T00:00:00.000Z` |
| Runtime constant | `lib/todos/legacy-boundary.ts` → `FMN_LEGACY_TODO_BOUNDARY_UTC` / `_ISO` |
| Classifier | `classifyTodoLegacy` → `"legacy"` \| `"new"` \| `"unknown"` (invalid dates → `"unknown"`) |
| Migration (comment only) | `supabase/migrations/20261002120000_phase3_todo_legacy_boundary.sql` |
| Decision Log | `docs/phase3-decisions.md` D2-06 补充：Boundary 定义 |
| Table comment | Prior `obj_description` was NULL; comment set (no overwrite merge needed) |

Does **not**: rewrite old Todo rows, add `NOT NULL`, change RLS.

---

### Batch 2B — Step 5: F3-03 Organize

**Status:** Implemented for fields already in the data model (read-only)

#### Workflow (`lib/workflows/organize/`)

| File | Role |
| :--- | :--- |
| `types.ts` | Spec + result view (recordCount ≠ quantitySum; per-currency totals) |
| `parse-query.ts` | Deterministic parse; explicit price bounds; blocks L-01 Destination / Brand cues / L-03 最近 |
| `compute.ts` | Pure filter/group/sort/aggregate (no DB, no mutations) |
| `run-organize.ts` | Server entry — reuses `lib/history.searchOwnItems`; no writes |

#### Companion UI

- `OrganizeResultSection` — StatGroup (Record Count / Quantity) + per-currency Stat + ItemCard groups
- `CompanionHost` routes `organize` intent → `runOrganize`

#### Supported

- Filter: category / **explicit price bounds** (`minPrice` / `maxPrice` + currency) / currency / location / purchase date / trip
  - e.g. `价格高于 3000 日元`, `价格低于 3000 日元`, `3000 日元以内`, `价格在 2000-5000 日元之间`
  - Approx (`预算` / `大概` / `左右`) does **not** become exact price bounds
- Group: category / currency / trip
- Sort: price / date / product name
- Aggregate: record count, quantity sum, **per-currency totals only** (no FX)

#### Explicitly blocked / not invented

- Brand intent via explicit `牌子` / `品牌` cues (L-01) — returns unsupported message (no brand vocabulary; bare names alone are not treated as Brand)
- Destination / relative trip (L-01) — returns unsupported message
- “最近” window (L-03) — returns unsupported message
- Cross-currency sum / FX
- Any item create/update/delete

---

### Batch 2B — Step 6: F3-04 Todo Formal Path (Companion)

**Status:** Implemented (Draft → Explicit Confirm → Write); Phase 2 manual form unchanged

#### Workflow (`lib/workflows/todo-planning/`)

| File | Role |
| :--- | :--- |
| `text-parse.ts` | Rule parse → `ShoppingTodoDraft`; budget/approx → ask (no draft write) |
| `confirm-write.ts` | `confirmShoppingTodoWrite` → `createTodo` after server re-validation |

#### Companion UI / runtime

- `ShoppingTodoDraft` in `lib/companion/types.ts`
- `TodoDraftReview` — required fields gate Confirm
- `CompanionHost` routes `todo` intent; Confirm button / explicit confirm phrases only

#### New Todo required (application layer; no DB `NOT NULL`)

- Trip, Product, `reference_price` (concrete), `reference_currency`, `reference_location` (计划购买地点)

#### Price semantics

- Concrete (e.g. `3000 日元`) → may set `reference_price`
- 预算 / 大概 / 以内 / 左右 / 上下（与数字同句且距离 ≤10 字符）→ **ask**; never invent formal price
- Unrelated `以下` / `上下` in other clauses do not block

#### Explicitly not in Batch 2B

- L-02 Duplicate Detection equality / auto-merge
- Public Product candidate selector (optional; not required this batch)
- Legacy Todo force-fill of New required fields

Verification: `scripts/batch2b-verify.ts` (`npm run test:batch2b`)

---

## 3. Existing Architecture Boundaries

| Boundary | Current state |
| :--- | :--- |
| No `/companion` route | No `app/companion/**`; Companion is in-page Surface only |
| No Conversation database | No `conversations` / `messages` tables |
| Conversation is in-memory | Cleared on Companion close / refresh / tab close |
| Draft ≠ Formal Record / Todo | Draft is localStorage + review UI; formal data only after Explicit Confirm |
| Context ≠ Permission | Companion Context is default write/query context; RLS / ownership remain permission boundary |
| Public search ≠ Private history | `lib/search/**` + `/search` = public; `lib/history/**` = own-history only (isolated) |
| Organize is read-only | `lib/workflows/organize` reuses history; no item mutations |
| No AI provider integration | No OCR / STT / LLM packages or providers in application code |
| No AI-parallel UI components | No `AIButton` / `AIInput` / `AIForm` in `*.ts` / `*.tsx` |
| No Agent loop | F3-05 orchestration not implemented |
| Formal write safety | F3-01 / F3-04 Confirm paths only; F3-02 / F3-03 read-only |
| Legacy / New Todo boundary | Fixed UTC `2026-10-02T00:00:00.000Z` |
| Boundary automation | `npm run phase3:check` |

---

## 4. Current Blocked Areas

From `docs/phase3-decisions.md` Later Decisions (implementation must not invent closures):

| ID | Topic | Status | Blocks |
| :--- | :--- | :--- | :--- |
| L-01 | Destination / Brand data model semantics | Later | Full Destination matching; Brand beyond explicit `牌子`/`品牌` cues; schema invention |
| L-02 | Duplicate detection equality rules | Later | Full F3-04 duplicate handling (auto-merge forbidden) |
| L-03 | “最近” / recent time window definition | Later | Full F3-02 / F3-03 “最近” behavior |
| L-04 | OCR provider (Layer 2) | Later (Privacy Layer 1 closed) | F3-01 Receipt OCR path |
| L-05 | STT provider (Layer 2) | Later (Privacy Layer 1 closed) | F3-01 Voice path |
| L-06 | LLM provider (Layer 2) | Later (Privacy Layer 1 closed) | LLM-assisted F3-01 / F3-05 |

Additional open inputs (not Later Decisions, but unfinished):

| Item | Current state |
| :--- | :--- |
| I-01 batch transaction RPC | Decision closed; multi-write TX mechanism not implemented yet |
| I-02 receipt temp lifecycle | Buckets/RLS stubs present; promote/cleanup not implemented |

---

## 5. Next Development Slice

Suggested next coding slices (not started):

- Batch 2B Review / acceptance
- I-01 / I-02 when multi-write / receipt lifecycle is in scope
- OCR / STT / LLM only after L-04 / L-05 / L-06 Layer 2 close
- F3-05 / Agent loop only when explicitly authorized

Remain forbidden until Later closes:

- Brand / Destination schema invention
- “最近” product semantics
- Duplicate auto-merge rules
- Agent loop / F3-05 early
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
