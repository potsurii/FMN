# FMN Architecture Map

Lightweight structural map of the Forget Me Not (FMN) repository.  
**Audit / documentation only** — not a product spec and not an implementation plan.

Generated from directory tree, key filenames, migrations headers, and Phase 3 current-state baseline. Deep business-logic analysis intentionally omitted.

| Field | Value |
| :--- | :--- |
| Map date | 2026-10-08 |
| Baseline commit (last committed) | `0a23547` — `feat(fmn): complete phase 3 batch 2c` |
| Note | Phase 3 Batch 1 / 2A / 2B / 2C complete and committed. See `docs/phase3-current-state.md`. |
| Scanner | `npm run architecture:scan` → `scripts/fmn-architecture-scan.ts` |

---

## 1. Project Overview

**FMN** is a Travel Shopping Record & Sharing Web App.

```text
FMN
├── Phase 1: Core Travel Shopping Record
│     Trips, Items, auth shell, image storage
├── Phase 2: Public Sharing / Search / Social Layer
│     Profiles, visibility, public search, follows, recommendations, Shopping Todos
└── Phase 3: Companion Intelligence Layer
      Companion Surface, Draft→Confirm,
      Quantity / Receipts foundation,
      F3-01 text write path,
      F3-02 own-history + Destination + 最近 (L-01 / L-03),
      F3-03 Organize,
      F3-04 Todo formal + Duplicate (L-02)
```

### Tech stack

| Layer | Choice |
| :--- | :--- |
| Framework | Next.js 15 (App Router) |
| UI | React 19 |
| Backend / Auth / DB | Supabase (SSR client `@supabase/ssr`, JS client `@supabase/supabase-js`) |
| Language | TypeScript |
| Styling | Tailwind CSS 4 |
| Tooling | ESLint 9 flat config, `tsc`, lightweight `tsx` verify/scan scripts |

### Application architecture (summary)

- **Pages** under `app/` compose domain UI and mount Companion where allowed.
- **Components** are presentation / interaction; business rules live in `lib/` and Workflows.
- **Domain libraries** (`lib/items`, `lib/trips`, …) talk to Supabase.
- **Workflows** (`lib/workflows/*`) orchestrate Companion capabilities (write Confirm, own-history, organize, todo planning).
- **Data** lives in Postgres + Storage buckets with RLS.

### Current development phase

Phase 3 is active. Coding baseline of record: **`docs/phase3-current-state.md`**.  
Phase 3 Plan v2 is **historical planning only** — do not rewrite it to track completion.

---

## 2. High Level Architecture

```text
User
  │
App Router Pages          (app/**/page.tsx)
  │
Components                (components/**)
  │
Workflows                 (lib/workflows/**)     [Phase 3]
  │
Domain Libraries          (lib/items, trips, todos, search, history, …)
  │
Supabase Data Layer       (lib/supabase/*, lib/storage/*, lib/auth/*)
  │
Database / Storage        (supabase/migrations, buckets)
```

| Layer | Responsibility |
| :--- | :--- |
| App Router Pages | Routes, data loading, page composition, Companion mount points |
| Components | UI primitives and feature UI; prefer reuse over AI-parallel components |
| Workflows | Companion capability orchestration (Draft→Confirm write; own-history read) |
| Domain Libraries | Types, queries, mutations, validation for each domain |
| Supabase Data Layer | Session, server/browser clients, upload helpers, auth gate |
| Database / Storage | Schema, RLS, storage buckets |

Inherited product constraints (still in force): multi-currency independent (no live FX); Purchase Location is text (no Maps/GPS); Public / Private visibility rules.

---

## 3. Directory Map

| Path | Responsibility | Phase | Important files / notes |
| :--- | :--- | :--- | :--- |
| `app/` | Routes | P1–P3 | `page.tsx` (Home + Companion Global); `search/`; `trips/**`; `login`/`register`; `users/[userId]`; `followers`/`following` |
| `middleware.ts` | Session refresh / auth gate | P1 | Uses `lib/supabase/middleware.ts` |
| `components/` | UI | P1–P3 | See § Feature Ownership; `companion/` is P3 |
| `lib/items/` | Shopping Record domain | P1 (+ qty P3) | `queries`, `mutations`, `types`, `validation`, `map` |
| `lib/trips/` | Trip domain | P1–P3 | `queries`, `mutations`, `stats`, `visibility`, `detail`, `validation`, `types`, `destination-parse`, `recent-trip`, `resolve-destination-trip`, `resolve-recent-trip` |
| `lib/todos/` | Shopping Todo domain | P2–P3 | `mutations`, `validation`, `legacy-boundary`, `duplicate` |
| `lib/search/` | **Public** discovery search | P2 | `queries`, `sanitize`, `types` — must not become private history |
| `lib/history/` | **Own** historical item search | P3 | `queries`, `sanitize`, `types` — Destination ILIKE + `recentTrip` support; isolated from `lib/search` |
| `lib/companion/` | Companion runtime state | P3 | `draft-storage`, `task-storage`, `confirm-intent`, `types` |
| `lib/workflows/` | Companion workflows | P3 | `record-input/*`, `historical-search/*`, `organize/*`, `todo-planning/*` |
| `lib/receipts/` | Receipt DAL | P3 | `types`, `mutations` |
| `lib/recommendations/` | Item recommend / not-recommend | P2 | `queries`, `mutations` |
| `lib/follows/` | Follow graph | P2 | `queries`, `mutations` |
| `lib/storage/` | Upload + receipt bucket IDs | P1–P3 | `upload.ts`, `receipt-buckets.ts` |
| `lib/supabase/` | Clients | P1 | `client`, `server`, `middleware` |
| `lib/auth/` | `requireUser` | P1 | |
| `lib/quantity.ts` | Shared quantity helpers | P3 | |
| `supabase/migrations/` | Schema + RLS + buckets | P1–P3 | See §5 |
| `supabase/snippets/` | Local SQL scratch | — | Not product source |
| `docs/` | Product / design / Phase 3 specs + current state | — | `phase3-current-state.md` is dynamic baseline |
| `scripts/` | Dev verify / scan | P3 tooling | `batch1-verify`, `batch2a-verify`, `batch2b-verify`, `batch2c1-verify`, `batch2c2-verify`, `batch2c3-verify`, `phase3-boundary-check`, `fmn-architecture-scan` |
| `.cursor/rules/` | Agent rules (Phase 3) | P3 | `phase3-*.mdc` |
| `.cursor/archive/` | Archived Phase 1–2 rules | — | Historical |
| `public/test-assets/` | Dev/test SVG placeholders | — | Not core product UI |

Approximate code-ish file counts (scan): `app` ≈19, `components` ≈53, `lib` ≈57, `docs` ≈9, `scripts` ≈8, migrations = 9 SQL files.

---

## 4. Feature Ownership Map

| Feature | Main files | Phase |
| :--- | :--- | :--- |
| Auth (login / register / session) | `app/login`, `app/register`, `components/auth/AuthForm`, `lib/supabase/*`, `middleware.ts` | Phase 1 |
| Trip CRUD | `app/trips/**`, `components/travel/*`, `lib/trips/*` | Phase 1 |
| Shopping Record (Item) CRUD | `app/trips/.../items/**`, `components/item/*`, `lib/items/*` | Phase 1 |
| Image upload (trip / item) | `lib/storage/upload.ts`, buckets `trip-images` / `item-images` | Phase 1 |
| Profiles / visibility | `lib/trips/visibility.ts`, Phase 2 migration `profiles`, trip/item visibility | Phase 2 |
| Public Search | `app/search/page.tsx`, `components/search/*`, `lib/search/*` | Phase 2 |
| Follows | `app/followers`, `app/following`, `lib/follows/*`, `components/user/FollowButton` | Phase 2 |
| Recommendations | `lib/recommendations/*`, `components/recommendation/*` | Phase 2 |
| Public user profile | `app/users/[userId]/page.tsx`, `components/user/*` | Phase 2 |
| Shopping Todo | `app/trips/.../todos/**`, `components/todo/*`, `lib/todos/*` | Phase 2 (+ P3 quantity / required fields / legacy gate) |
| Companion Shell | `components/companion/*`, mount on Home + Trip Detail | Phase 3 |
| F3-01 text Draft→Confirm→Write | `lib/workflows/record-input/*`, `RecordDraftReview`, `confirm-intent` | Phase 3 |
| F3-02 own-history + Destination + 最近 | `lib/history/*`, `lib/workflows/historical-search/*`, `lib/trips/destination-parse`, `recent-trip`, `resolve-*`, `HistoryResultSection`, `CandidateSelector` | Phase 3 Batch 2A / 2C-1 / 2C-2 |
| F3-03 Organize | `lib/workflows/organize/*`, `OrganizeResultSection` | Phase 3 Batch 2B |
| F3-04 Todo formal + Duplicate | `lib/workflows/todo-planning/*`, `TodoDraftReview`, `TodoDuplicatePrompt`, `lib/todos/duplicate` | Phase 3 Batch 2B / 2C-3 |
| Trip Destination field | `trips.destination`, TripForm / TripCover, migration `20261003120000_phase3_trip_destination.sql` | Phase 3 Batch 2C-1 |
| Quantity | `lib/quantity.ts`, item/todo columns + forms | Phase 3 |
| Receipts foundation | `lib/receipts/*`, migration receipts / receipt_items, receipt buckets | Phase 3 (OCR later) |

---

## 5. Data Architecture

### Tables (conceptual)

```text
auth.users
    │
    ├── profiles                    (Phase 2)
    │
    ├── trips                       (Phase 1)
    │     └── items                 (Phase 1; quantity Phase 3)
    │           └── receipt_items   (Phase 3; item_id UNIQUE)
    │                   └── receipts
    │
    ├── shopping_todos              (Phase 2; quantity Phase 3)
    ├── follows                     (Phase 2)
    └── item_recommendations        (Phase 2)
```

### Ownership & RLS (summary)

| Entity | Ownership | Notes |
| :--- | :--- | :--- |
| `trips` | `user_id` | Owner CRUD; public visibility for discovery |
| `items` | via parent trip | No `user_id` column; join trip for ownership |
| `shopping_todos` | via trip | |
| `receipts` | `user_id` | Own-row RLS |
| `receipt_items` | via receipt / item | Join table; CASCADE on join FKs as migrated |
| `follows` / `item_recommendations` | user-scoped | Phase 2 social |

RLS is the permission boundary. Companion **Context** (Global / Trip) is **not** ACL — only default write/query context.

### Storage buckets

| Bucket | Phase | Role |
| :--- | :--- | :--- |
| `trip-images` | P1 | Trip cover |
| `item-images` | P1 | Item photos |
| `receipt-images-temp` | P3 | Temporary receipt assets (I-02 stub) |
| `receipt-images` | P3 | Formal receipt assets (I-02 stub) |

Promote / cleanup lifecycle for receipt temp storage is **not** fully implemented (see current-state).

### Migrations (ordered)

1. `20260924143000_phase1_trips_items_storage.sql`
2. `20260925140000_phase2_foundation.sql`
3. `20260925220000_shopping_todos.sql`
4. `20260926140000_item_recommendations.sql`
5. `20260926150000_p6_search_discovery.sql`
6. `20260926160000_follows.sql`
7. `20261001180000_phase3_data_foundation.sql`
8. `20261002120000_phase3_todo_legacy_boundary.sql`
9. `20261003120000_phase3_trip_destination.sql`

---

## 6. Current Phase 3 Architecture

Only what exists in the repo (see `docs/phase3-current-state.md`):

```text
Companion (in-page Surface)
  │
  ├─ F3-01 Workflow (record-input)
  │     text-parse → Draft → Explicit Confirm → confirm-write → createItem
  │
  ├─ F3-02 Workflow (historical-search)   [Batch 2A / 2C]
  │     parse-query → run-search → searchOwnItems → HistoryResultSection
  │     Destination ILIKE; 「最近」→ recent-trip resolve / CandidateSelector
  │     READ-ONLY (no Draft / Confirm / createItem)
  │
  ├─ F3-03 Workflow (organize)   [Batch 2B / 2C]
  │     parse-query → run-organize → searchOwnItems → OrganizeResultSection
  │
  ├─ F3-04 Workflow (todo-planning)   [Batch 2B / 2C-3]
  │     text-parse → Todo Draft → Explicit Confirm → confirm-write
  │     Duplicate Detection (prompt only; never auto-merge)
  │
  └─ Runtime state
        Conversation: in-memory
        Draft / Task: localStorage (7d)
```

### Companion entry

| Entry | Mount | Context |
| :--- | :--- | :--- |
| Global | `app/page.tsx` | No default trip; write requires explicit trip |
| Trip | `app/trips/[tripId]/page.tsx` | Default trip hint only |

No `/companion` route. No Conversation database.

### Present vs not present

| Capability | Status |
| :--- | :--- |
| Launcher / Surface / Draft / Confirm | Present |
| Quantity + receipts schema / DAL stubs | Present |
| F3-01 text path | Present |
| F3-02 own-history + Destination + 最近 | Present (Batch 2A / 2C-1 / 2C-2) |
| F3-03 organize | Present (Batch 2B) |
| F3-04 Todo formal via Companion | Present (Batch 2B) |
| F3-04 Duplicate Detection | Present (Batch 2C-3) |
| Trip Destination field | Present (Batch 2C-1) |
| F3-05 Agent loop | **Not** present |
| OCR / STT / LLM | **Not** present (Later L-04/05/06) |
| I-01 batch TX RPC | Decision closed; code skeleton **not** present |

---

## 7. Dependency Boundary

### Allowed dependencies

```text
Page / Component
       ↓
Workflow (optional; Companion capabilities)
       ↓
Domain Library (items, trips, history, todos, …)
       ↓
Supabase client / storage helpers
       ↓
Database / Storage (RLS enforced)
```

Prefer: **Agent → Workflow → Tool / Data Operation** when Agent exists.  
Formal writes: **Input → Draft → Review → Explicit Confirm → Formal Write**.

### Forbidden coupling (locked rules)

| Forbidden | Why |
| :--- | :--- |
| `lib/search` used as private own-history | Public discovery ≠ private history |
| `lib/history` importing `lib/search` | Boundary automation fails (`phase3:check`) |
| historical-search importing `createItem` / item mutations | F3-02 is read-only |
| `/companion` route / Conversation tables | Design + Decision Log |
| `AIButton` / `AIInput` / `AIForm` family | Component library forbid |
| OCR / STT / LLM deps before L-04/05/06 close | Later Decisions |
| Direct Agent → DB write bypassing Workflow | Architecture |
| Inventing Brand (still BLOCKED) | L-01 Closed: Brand remains BLOCKED |
| Duplicate auto-merge | L-02 explicit: prompt only, never auto-merge |
| Cross-currency price comparison / live FX | Inherited currency rules |

Automation: `npm run phase3:check`.

---

## 8. Possible Cleaning Candidates

**Do not delete in this task.** Categories for a future Cleaning Report only.

### Confirmed unused (evidence: local artifacts, not imported by app)

| Path | Reason | Confidence |
| :--- | :--- | :--- |
| `debug-09d689.log` | Agent/session debug log; untracked | High |
| `npm-install.log` | Install log; untracked | High |
| `supabase/snippets/` (e.g. Untitled query) | Local SQL scratch; not migrations | High |

### Possibly duplicated (patterns, not proven dead code)

| Path / pair | Reason | Confidence |
| :--- | :--- | :--- |
| `lib/search/sanitize` vs `lib/history/sanitize` | Parallel sanitizers by design (isolation), not accidental dup | Medium — **likely keep** |
| `components/search/SearchResultCard` vs `components/item/ItemCard` | Overlapping card UX for public vs own contexts | Medium — review in Cleaning Report |
| Phase 1–2 docs (`docs/product.md`, `design-system.md`, …) vs Phase 3 docs | Layered docs; not duplicates | Low — keep both |

### Need product decision

| Topic | Reason | Confidence |
| :--- | :--- | :--- |
| Brand (L-01 Closed: remains BLOCKED) | No brand field / inference / Brand query | High |
| I-01 batch TX mechanism | Closed decision; implementation timing TBD (Batch 3) | Medium |
| I-02 receipt temp lifecycle | Buckets exist; promote/cleanup TBD (Batch 3) | Medium |
| L-04 / L-05 / L-06 Layer 2 | OCR / STT / LLM still Later | High |

### Keep because architectural boundary

| Path | Reason | Confidence |
| :--- | :--- | :--- |
| `lib/search/**` | Public discovery; must stay separate | High |
| `lib/history/**` | Private own-history | High |
| `lib/workflows/**` | Companion workflow boundary | High |
| `components/companion/**` | In-page Companion (no chat route) | High |
| `.cursor/rules/phase3-*.mdc` | Agent constitution | High |
| `.cursor/archive/` | Historical rules archive | High |
| `docs/phase3-current-state.md` | Sole dynamic implementation baseline | High |

---

## 9. Current Understanding Checklist

| Area | Understanding |
| :--- | :--- |
| Phase 1 | **Clear** — trips/items/auth/storage routes and libs mapped |
| Phase 2 | **Clear** — search, follows, recommendations, todos, profiles/visibility |
| Phase 3 | **Clear** (Batch 1 + 2A + 2B + 2C) — Companion, F3-01, F3-02 (incl. Destination / 最近), F3-03, F3-04 (incl. Duplicate), quantity/receipts stubs; F3-05 and OCR/STT/LLM intentionally absent |
| Database | **Clear** at migration-header level; remote vs local live parity not re-verified in this map |
| Components | **Clear** at folder/ownership level; deep prop/API graph **Need review** only if Cleaning Report requires dead-UI proof |
| Workflows | **Clear** — four workflows present (`record-input`, `historical-search`, `organize`, `todo-planning`) |
| Docs / rules | **Clear** — Phase 3 current-state is dynamic SoT; Plan v2 historical |
| Cleaning readiness | **Ready for Cleaning Report preparation** — candidates listed; no deletes yet |

---

## Related commands

```text
npm run architecture:scan   # this structural inventory
npm run phase3:check        # Phase 3 boundary violations
npm run test:batch1
npm run test:batch2a
npm run test:batch2b
npm run test:batch2c1
npm run test:batch2c2
npm run test:batch2c3
```
