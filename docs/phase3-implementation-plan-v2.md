---
name: Phase 3 Plan v2
overview: Phase 3 Implementation Plan v2（只读）：在锁定的 Decision Log v1.4 与 Phase 2 代码基线上，按 Shared Foundation → F3-01→05 实施 Companion；Later Decisions L-01~L-06 保持未关闭并以 BLOCKED 标注依赖；不写代码、不建 migration、不重新定义产品。
todos:
  - id: step-0-gate
    content: "Step 0: Plan review gate; keep L-01~L-06 Later"
    status: completed
  - id: step-1-migrations
    content: "Step 1: Phase 3 schema (quantity, receipts, todo quantity, legacy boundary constant, storage, batch RPC)"
    status: completed
  - id: step-2-companion-shell
    content: "Step 2: Companion Launcher/Surface + Conversation/Draft/Task runtime"
    status: completed
  - id: step-3-f301-text
    content: "Step 3: F3-01 text Draft→Confirm→createItem (no L-04/05/06)"
    status: completed
  - id: step-4-f302-history
    content: "Step 4: F3-02 own-history (BLOCKED L-01/L-03 for Brand/Destination/最近)"
    status: cancelled
  - id: step-5-f303
    content: "Step 5: F3-03 organize (BLOCKED L-03 for 最近)"
    status: cancelled
  - id: step-6-f304
    content: "Step 6: F3-04 Todo formal + Legacy dual-track (BLOCKED L-02 duplicate)"
    status: cancelled
  - id: step-7-providers
    content: "Step 7: I-01/I-02 + Receipt/Voice/LLM when L-04/05/06 closed"
    status: cancelled
  - id: step-8-f305
    content: "Step 8: F3-05 orchestration (LLM path BLOCKED L-06)"
    status: cancelled
  - id: step-9-harden
    content: "Step 9: build/lint/invariants/Phase1-2 regression"
    status: completed
isProject: false
---

# Phase 3 Implementation Plan v2

> Documentation baseline: LOCKED (`phase3-decisions.md` v1.4 + Phase 3 docs/MDC).  
> Code baseline: Phase 1 / Phase 2 complete. Companion / Quantity / Receipt / Workflow / Agent: **absent** in `*.ts|tsx|sql`.  
> Later Decisions L-01~L-06: **not resolved** in this Plan.

---

## 1. Existing Implementation Baseline

| Area | Existing | Reusable | Needs Change | Needs New |
| :--- | :--- | :--- | :--- | :--- |
| `app/` routes | Home [`app/page.tsx`](app/page.tsx); login/register; [`app/search/page.tsx`](app/search/page.tsx) (public discovery); trip/item/todo CRUD under `app/trips/...`; users/following/followers | All as mount points / formal write pages behind Companion Confirm | Embed Companion Launcher/Surface on Home + Trip Detail only (no new Chat route) | Companion is in-page Surface, not a page |
| `components/` | Item*, Trip*, Todo*, Search*, form primitives, ConfirmDialog, Stat*, Header — evidence under [`components/`](components/) | Result cards, forms, Confirm UX patterns | Extend Item/Todo display for quantity / reference_location labels; ShoppingTodoForm Phase 3 required validation (D2-02) | `components/companion/*` P0 only (Launcher, Surface, drafts, confirm, input) |
| `lib/items/` | types/queries/mutations/validation/map/detail — no quantity ([`lib/items/types.ts`](lib/items/types.ts)) | `createItem` / `updateItem` as formal write tools | +quantity; receipt association; write path behind Confirm | Receipt DAL |
| `lib/trips/` | queries/mutations/detail/stats | Trip context resolution; trip-time ordering for relative trip | None for Destination column until L-01 | — |
| `lib/todos/` | shopping_todos DAL + `convertTodoToItem` ([`lib/todos/mutations.ts`](lib/todos/mutations.ts)); optional `reference_*` ([migration](supabase/migrations/20260925220000_shopping_todos.sql)) | Convert flow; CRUD | App-layer required fields for New Todo (D2-01/D2-02); +quantity; legacy boundary check (D2-06); location label semantics (D2-05) | Legacy/New gate helpers |
| `lib/search/` | **Public only** — `searchPublicTrips/Items` + `.eq("visibility","public")` ([`lib/search/queries.ts`](lib/search/queries.ts)) | F3-04 public product candidates only | **Do not** reuse for F3-02 own-history | `lib/history/` (or equivalent) isolated own-search |
| `lib/recommendations/` | public item recommend counts | Optional on public candidates | None required for Companion core | — |
| `lib/auth/` | [`require-user.ts`](lib/auth/require-user.ts) | All Companion server loads | — | — |
| `lib/storage/` | [`upload.ts`](lib/storage/upload.ts); buckets trip-images / item-images | Upload pattern | Temporary vs formal receipt buckets + RLS (I-02) | Receipt storage lifecycle |
| `lib/supabase/` | client/server/middleware | Session + RLS client | Server-side txn for batch Confirm (I-01) | RPC / Server Action transaction boundary |
| `supabase/migrations/` | 6 migrations (phase1 storage → follows) | Existing RLS/ownership model | New Phase 3 migration(s) listed in §2 (not created here) | receipts, quantity, todo quantity, legacy boundary constant, batch RPC, storage |
| [`middleware.ts`](middleware.ts) | Session refresh + login gate | Keep | No Companion special-case | — |
| [`package.json`](package.json) | next, react, @supabase/* only | Keep | — | OCR/STT/LLM deps **BLOCKED: L-04/L-05/L-06** (do not add until Later closed) |

**Verified absence:** no `quantity` / `receipt` / `companion` / `draft` / `workflow` / `agent` in application `*.ts|tsx|sql` (docs-only).

---

## 2. Phase 3 Data Foundation

| Decision | Data Change | Migration Needed | Notes |
| :--- | :--- | :--- | :--- |
| D1-01 Quantity | `items.quantity` (>=1); default 1 at Draft | Yes | Formal write requires quantity >= 1 |
| D1-02 Receipt Model | Tables `receipts` + `receipt_items`; `receipt_items.item_id UNIQUE`; Receipt 1→N Items; Item 0..1 Receipt | Yes | Delete Receipt must not delete Shopping Records; CASCADE vs RESTRICT on join = Implementation Decision |
| D1-03 Receipt Date | `receipts.receipt_date` independent of item `purchase_date` | Yes (with D1-02) | Draft init priority: Receipt Date → User Explicit → Current; user edit wins |
| D2-01 Todo reference_* | Keep column names; **no DB NOT NULL** | No schema NOT NULL | App/Workflow enforces required for New Todo only |
| D2-04 Todo Quantity | `shopping_todos.quantity` (>=1); default 1 | Yes | Inherit into Record on convert |
| D2-05 reference_location | Semantics only: Target Purchase Location | No rename required | ≠ Item actual purchase location |
| D2-06 Legacy Boundary | Fixed UTC timestamp constant | Yes — **value to be written by migration / deployment** | Do not invent timestamp in Plan/code; `created_at < boundary` = Legacy |
| D4-03 Draft keys | No DB table | No | localStorage key: `fmn:draft:<draftType>:<id>`; 7-day expire |
| D5-03 Task State | No DB table | No | localStorage; stores `draftId` reference only; 7-day expire |
| I-01 Batch TX | Server-side single transaction for multi-write Confirm | Yes (RPC / Postgres function or equivalent) | No app-layer serial write + compensate |
| I-02 Temp Receipt | Temporary storage bucket + formal receipt asset; RLS separated | Yes (storage policies) | Temp ≤7 days; Confirm promotes; Cancel/Expire → async cleanup |

---

## 3. Companion Runtime

```text
FMN Companion
├── Global Entry (Context = None)
│   └── Home / My Trips  →  app/page.tsx
└── Trip Entry (Context = Current Trip)
    └── Trip Detail      →  app/trips/[tripId]/page.tsx

Companion Surface (in-page, no route change)
├── Compact (Side Drawer)
└── Expanded (Page-in-Page Full Screen)
```

| Concern | Spec (locked) |
| :--- | :--- |
| Launcher | `CompanionLauncher` Global / Trip variants on Home and Trip Detail |
| Surface mount | Same page shell; click Launcher → expand Surface |
| Context | Default write/query context only; **not** permission boundary; Trip Entry may still query other trips |
| Conversation State | In-memory only; clear on Surface close / refresh / Tab close; **no** conversations table; **no** left history sidebar |
| Draft State | localStorage `fmn:draft:<draftType>:<id>`; 7 days; Confirm/Cancel clears; independent of Conversation |
| Task State | localStorage; Goal/steps/etc. + **draftId only** (no embedded Draft blob); 7 days; clear on Task complete/cancel |
| Confirm | Explicit UI Confirm or explicit confirmation intent only (D5-04) |

**Explicit:** No `/companion` route. Close Surface → Conversation cleared; Draft/Task preserved.

Global Entry write path (D3-02): Draft may have Trip=未指定; Confirm disabled until Trip set; never silent Trip pick.

---

## 4. F3-01 ~ F3-05

Order: Shared Foundation → F3-01 → F3-02 → F3-03 → F3-04 → F3-05.

### Shared Foundation

| Layer | Existing | Change | New | Dependency / Blocker |
| :--- | :--- | :--- | :--- | :--- |
| Data | Auth/RLS | §2 migrations when coding | Legacy boundary constant (value at migration time) | — |
| Domain | requireUser, DAL | — | Draft/Task localStorage helpers; Context resolver | — |
| Workflow | None | — | Workflow boundary interface (no Agent→DB) | — |
| Components | Header, pages | Mount points | Launcher, Surface, Header, ContextChip, InputComposer (text), Conversation messages, ProcessingIndicator | — |
| Page / Route | Home, Trip Detail | Embed only | **No** new Chat route | — |

### F3-01 Record Input

| Layer | Existing | Change | New | Dependency / Blocker |
| :--- | :--- | :--- | :--- | :--- |
| Data | items CRUD | +quantity; receipts model | Temp/formal receipt storage | Receipt infra: I-02; OCR: **BLOCKED: L-04** |
| Domain | `createItem` | Formal write only after Confirm; purchase_date init rules | Record Draft model; price_source internal only | LLM extraction: **BLOCKED: L-06** |
| Workflow | Manual ItemForm direct write remains Phase 2 path | Companion path: Input→Draft→Review→Confirm→Write | `workflows/record-input` (text first) | Voice: **BLOCKED: L-05**; Receipt understand: **BLOCKED: L-04**; LLM: **BLOCKED: L-06** |
| Components | ItemForm, CurrencyInput, DatePicker, ImageUploader | Optional quantity display on cards | RecordDraft, ReceiptInput, VoiceInput, ConfirmationCard, BatchDraft | Voice/Receipt UI shells OK; providers blocked |
| Page / Route | items/new|edit | Unchanged for manual | Companion Surface only | — |

**Unblocked without L-04/05/06:** Text → structured Draft (manual field fill / rule-based) → Confirm → `createItem` (+ quantity).  
**Blocked:** OCR receipt splitting, STT, LLM NLU.

### F3-02 Historical Search

| Layer | Existing | Change | New | Dependency / Blocker |
| :--- | :--- | :--- | :--- | :--- |
| Data | items+trips via RLS | — | Own-history queries (**isolated from** [`lib/search`](lib/search)) | Brand/Destination fields: **BLOCKED: L-01** |
| Domain | `fetchItemsByTripId`, trip lists | — | Relative trip resolve by **trip dates** (“上次去日本” = latest Japan Trip, not latest Japan item) | “最近” window: **BLOCKED: L-03**; Destination meaning: **BLOCKED: L-01** |
| Workflow | None | — | Read-only search workflow | Partial: product/category/price/date/location without Brand/Destination |
| Components | ItemCard, SearchResultCard, EmptyState | Reuse for results | ResultSection | — |
| Page / Route | `/search` stays **public** | Do not convert to private history | Results inside Companion | — |

### F3-03 Data Organization

| Layer | Existing | Change | New | Dependency / Blocker |
| :--- | :--- | :--- | :--- | :--- |
| Data | Same own items | Needs quantity for Quantity aggregate | — | Relies on D1-01 |
| Domain | `lib/trips/stats`, Stat/TotalSpend | — | Filter/Group/Sort/Aggregate; per-currency buckets; Record Count ≠ Quantity | “最近”: **BLOCKED: L-03** |
| Workflow | None | Builds on F3-02 result sets | Organize workflow (read-only) | — |
| Components | Stat, StatGroup, TotalSpend, ItemCard | Reuse | Organize result modules | — |
| Page / Route | None | Companion structured output | No analytics dashboard page | — |

### F3-04 Todo Planning

| Layer | Existing | Change | New | Dependency / Blocker |
| :--- | :--- | :--- | :--- | :--- |
| Data | shopping_todos `reference_*` optional | +quantity; legacy boundary; **no NOT NULL** | — | — |
| Domain | create/update/convert | New Todo required: Trip+Product+reference_price+reference_currency+reference_location (app layer); ShoppingTodoForm upgrade (D2-02); convert prefills reference_location as suggestion | Product resolution: Explicit / Historical(F3-02) / FMN Public (`lib/search` public only, max 5, no source persist) | Duplicate detect: **BLOCKED: L-02** |
| Workflow | Direct form write | Companion: Intent→TodoDraft→Confirm→Write | `workflows/todo-planning` | Duplicate UX blocked until L-02 |
| Components | ShoppingTodoForm/Card/List | Required validation; “计划购买地点” label; Legacy not error | TodoDraft, CandidateSelector | — |
| Page / Route | todos new/edit/purchase | Keep convert; enforce New rules on manual create | Companion | — |

### F3-05 Orchestration

| Layer | Existing | Change | New | Dependency / Blocker |
| :--- | :--- | :--- | :--- | :--- |
| Data | None | — | Task State localStorage (draftId) | — |
| Domain | F3-01..04 tools | Reuse only | Orchestrator; batch Confirm → I-01 transaction | LLM planning: **BLOCKED: L-06** |
| Workflow | Single workflows | ≥2 workflows enter F3-05 | Pause/resume; unified confirm; no partial write (D5-02) | Depends on 01–04 callable |
| Components | — | — | TaskProgress / TaskStep / OrchestrationModule (display only) | — |
| Page / Route | Companion Surface | — | No separate orchestration page | — |

---

## 5. UI / Component Plan

| Existing Component | Reuse Scenario | Extension / New |
| :--- | :--- | :--- |
| Button, Input, Textarea, Select, FormField | Companion forms / actions | No AIButton |
| CurrencyInput, DatePicker, ImageUploader | Record/Todo Draft fields | ReceiptInput / VoiceInput (capture only) |
| ConfirmDialog | Simple destructive confirms | ConfirmationCard for formal write (shows target + fields) |
| ItemCard, ItemGrid, ItemMeta, Price, Location, CategoryTag | F3-02/03 results; Draft preview | Quantity suffix; empty location → 未填写 |
| ItemForm | Phase 2 manual + purchaseFromTodo | Keep; Companion uses Draft path for smart write |
| TripCard, TripCover | Context / trip picker | ContextChip |
| ShoppingTodoCard/Form/List | Todo results + manual CRUD | Required fields; plan-location label; no SourceInfo |
| SearchInput, SearchResultCard, SearchResultGroup | Public `/search` + public candidates | Own-history uses separate DAL + ResultSection |
| Stat, StatGroup, TotalSpend | F3-03 per-currency | — |
| EmptyState, Header, BackButton | Shell / empty | CompanionLauncher, CompanionSurface, CompanionHeader |

**Must NOT create** (component MDC — no parallel AI system): `AIButton`, `AIInput`, `AIForm`, `AICard`, `AIItemCard`, `AITripCard`, `AIConfirmDialog`, `PublicTripCard`/`PrivateItemCard` families, `/companion` as product page.

P0 Companion (from component library, implement as needed): CompanionLauncher, CompanionSurface, CompanionHeader, ContextChip, ConversationMessage/User/Assistant, InputComposer, VoiceInput, ReceiptInput, ProcessingIndicator, RecordDraft, TodoDraft, DraftField, ConfirmationCard, ConfirmationActionGroup, MissingFieldPrompt, CandidateSelector, TaskStatus/Progress (for F3-05).

---

## 6. Verification

| Gate | Action |
| :--- | :--- |
| Typecheck / Lint / Build | `tsc` / `npm run lint` / `npm run build` |
| Migration verification (list only) | Apply Phase 3 migration(s); verify quantity columns; receipts + UNIQUE item_id; todo quantity; legacy boundary constant present; RLS; temp/formal buckets; batch RPC |
| Phase 1/2 regression | Manual trip/item/todo; public search; follow; recommend; share; convert todo→item |
| Phase 3 acceptance | Global/Trip Entry; Surface compact/expanded; Draft→Confirm→Write; cancel clears draft; close Surface clears conversation keeps draft/task; batch all-or-nothing |

**Invariants:** Draft ≠ Formal; Conversation ≠ Draft; Context ≠ Permission; reference_location ≠ purchase_location; Receipt Date ≠ Purchase Date; Record Count ≠ Quantity; Legacy Todo ≠ Error; Implicit ack ≠ Confirm; Batch Write ≠ Partial Write.

---

## 7. Implementation Order

### Step 0 — Preconditions

**Goal:** Coding gate; Later Decisions remain Later.  
**Files:** None.  
**Data/Logic/Components:** None.  
**Dependencies:** Decision Log v1.4 locked.  
**Verification:** Plan reviewed; no L-01~L-06 closed by Plan.

### Step 1 — Data migrations (schema only)

Goal: Add Quantity, Receipt model, Todo Quantity, and required storage / RLS foundations.

Modules: supabase/migrations/* (to create at coding time); update lib/items|todos types/map.

Data: Per §2.

Legacy Boundary:
Do not define, infer, or hard-code the boundary timestamp in Plan.
The exact UTC boundary value must be supplied as an explicit
migration / deployment input at implementation time.

Storage / RLS: Stub temporary and formal receipt buckets (I-02).
Batch RPC: Skeleton only (full implementation in Step 7).

Business: DAL reads new fields; no Companion yet.

Components: Item / Todo forms show quantity defaults where manual.

Dependencies: None of L-01 ~ L-06.

Verification: Migration apply; RLS; unique item_id; quantity >= 1 constraints as decided.

### Step 2 — Companion shell + state runtime

**Goal:** Launcher + Surface on Home/Trip Detail; Conversation/Draft/Task state helpers.  
**Modules:** `components/companion/*`; thin hooks for localStorage keys `fmn:draft:…`; mount in [`app/page.tsx`](app/page.tsx), [`app/trips/[tripId]/page.tsx`](app/trips/[tripId]/page.tsx).  
**Data:** None formal.  
**Business:** Context resolution; close Surface clears conversation.  
**Components:** Launcher, Surface, Header, ContextChip, InputComposer (text), messages, ProcessingIndicator.  
**Dependencies:** Step 1 optional for shell.  
**Verification:** No `/companion`; compact/expanded; no history sidebar.

### Step 3 — F3-01 text Confirm path

**Goal:** Text/manual Draft → Confirm → createItem (+quantity) via Workflow.  
**Modules:** `lib/workflows/record-input`; RecordDraft; ConfirmationCard; wire createItem as Tool.  
**Data:** Uses quantity column.  
**Business:** Draft≠write; D5-04 confirm; Global Entry trip fill (D3-02).  
**Components:** RecordDraft, ConfirmationCard.  
**Dependencies:** Step 2; **not** L-04/05/06.  
**Verification:** Cancel no formal row; Confirm writes once.

### Step 4 — F3-02 own-history (non-blocked conditions)

Goal: Own-item search by product / category / price / currency / location / date / trip id.

Relative trip resolution by trip dates is implemented only for destination
semantics explicitly available from the existing locked data model.

If destination semantics required by the query are not available,
the affected query remains BLOCKED by L-01.

Do not introduce a new Destination model in implementation to unblock F3-02.

Modules: New lib/history/* (name = Implementation Decision); Companion ResultSection.
Data: Existing items / trips.
Business: Isolate from public search; RLS via requireUser.
Components: Reuse ItemCard.
Dependencies:
- Shared own-data access
- Locked data semantics
- L-01 / L-03 only for affected query capabilities
Verification: Private never in /search; public search unchanged.

### Step 5 — F3-03 organize (partial)

Goal: Group / sort / aggregate own results; per-currency; Count ≠ Quantity.

Modules: organize domain; Stat reuse.

Dependencies:
- Shared own-data access
- Quantity foundation
- "最近" BLOCKED: L-03

F3-03 may reuse F3-02 query primitives where appropriate,
but must not depend on F3-02 conversational search being complete.

Verification: No FX / no cross-currency compare.

### Step 6 — F3-04 Todo formal path

**Goal:** New Todo required fields + quantity; Legacy dual-track; Form upgrade; Companion TodoDraft; public candidates via existing public search.  
**Modules:** todos validation/mutations; ShoppingTodoForm; TodoDraft; convert keeps D2-05 prefill.  
**Dependencies:** Duplicate merge UX **BLOCKED: L-02**; legacy boundary constant from Step 1.  
**Verification:** New Todo rejects missing reference_*; Legacy not shown as error; no source fields.

### Step 7 — Shared Write Infrastructure: I-01 / I-02

Goal:
Implement the shared transactional and temporary-asset infrastructure
required by multi-record writes and receipt-backed workflows.

Includes:
- Server-side atomic batch Confirm (I-01)
- Temporary receipt asset lifecycle (I-02)
- Formal receipt asset promotion (I-02)
- Cleanup lifecycle (I-02)

Does NOT include:
- OCR provider
- STT provider
- LLM provider
- Receipt understanding

Dependencies: Steps 1–3 for schema and CLI-side Draft / Confirm.
Not blocked by L-04 / L-05 / L-06.

Verification:
- Temp cleanup ≤ 7 days
- Confirm promotes asset
- Multi-write atomic (rollback on any failure)

---

### Step 8 — F3-01 Receipt / Voice extensions

Goal:
Extend the already-working F3-01 text path with receipt and voice inputs
when the corresponding Later Decisions are closed.

Dependencies:
- Step 7
- L-04 for OCR
- L-05 for STT
- L-06 for LLM extraction

Blocked until L-04 / L-05 / L-06 close.

Verification:
- Receipt → Draft via OCR
- Voice → Draft via STT
- Both route through same Draft → Confirm → Write

---

### Step 9 — F3-05 orchestration

Goal:
Multi-workflow task state; unified confirm; reuse F3-01–F3-04.

Dependencies:
- Steps 3–6
- Step 7 (batch atomicity)
- LLM-heavy decomposition BLOCKED: L-06

Verification:
- Pause / resume
- Cancel discards drafts
- No partial batch write

---

### Step 10 — Hardening

Goal: Full §6 verification + Phase 1 / 2 regression.

Dependencies: Features claimed done.

Verification:
- Build / lint
- Invariants checklist
- Phase 1 / 2 regression suite

---

## 8. Risk / Decision Required

### Product Decision Required

No additional Product Decision is required for the currently
unblocked implementation slices.

The following Later Decisions remain explicitly unresolved:

* L-01
* L-02
* L-03
* L-04
* L-05
* L-06

They must not be closed, inferred, or bypassed by implementation.

Affected features remain marked BLOCKED until Product closes them.

### Implementation Decision

| ID | Choice space | Why | Fits | Blocks coding? | Affects |
| :--- | :--- | :--- | :--- | :--- | :--- |
| ID-A | Own-history module path (`lib/history` vs `lib/search/own`) | Must isolate from public search | Existing lib layout | No if isolated | F3-02 |
| ID-B | `receipt_items` ON DELETE CASCADE vs RESTRICT | D1-02 explicitly deferred | Postgres FK | No until migration | F3-01 Receipt |
| ID-C | Batch Confirm mechanism (RPC vs Server Action + Postgres fn) | I-01 requires server transaction | Supabase + Next | Blocks multi-write Confirm until chosen | F3-01 multi / F3-05 |
| ID-D | Companion state hook location / file tree under `components/companion` + `lib/companion` | Runtime only | App Router client islands | No | Shared |
| ID-E | Exact temp/formal bucket names | I-02 requires separation | Existing storage pattern | No until Receipt | F3-01 Receipt |

**Forbidden here (not decided):** Todo emptiness beyond D2-01; meaning of 「日本」; 「最近」 days; duplicate equality; OCR/STT/LLM provider.

---

## 9. Definition of Done

- All **Blocking** Closed Decisions implemented for claimed Steps (D1/D2/D3/D4/D5/I as scoped).
- **Later Decisions L-01~L-06 remain unresolved**; blocked layers stay marked BLOCKED until Product closes them.
- Invariants in §6 verified.
- No Phase 1/2 regression (manual CRUD, public search, follow, recommend, share, todo convert).
- No AI-specific duplicate component system; no `/companion` route; no Conversation DB.
- Formal writes only via Draft → Review → Explicit Confirm → Write; batch writes atomic (I-01).
- No side effects outside this Plan’s Steps; no invented product rules.

---

**Plan v2 ready for review.**
