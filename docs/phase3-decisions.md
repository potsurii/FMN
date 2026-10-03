# Phase 3 Decision Log

**Version:** 1.5
**Created:** 2026-10-01
**Status:** Core Blocking Decisions Closed
**Parent Document:** Phase 3 Pre-Coding Decision Lock v1.1

---

## 使用说明

本文档记录 Phase 3 Coding 前所有 Product / Design / Component / Implementation Decision 的最终状态。

`Core Blocking Decisions` 全部 `Closed` 后，允许进入文档同步与 Plan v2。

`Later Decisions` 不阻断 Step 1 启动，但阻断对应 Feature 的最终实现。

---

## Status Legend

| Status | 含义 |
| :--- | :--- |
| Open | 已识别，未讨论 |
| Discussed | 已讨论，未记录 |
| Documented | 已记录，未关闭 |
| Closed | 已关闭 |
| Later | 不阻断 Coding 启动，需在对应 Feature 接入前关闭 |

---

## Authority Legend

| Authority | 含义 |
| :--- | :--- |
| Product Owner | 产品所有者 |
| Implementer | 实现者（仅限技术实现选择） |
| AI | ❌ 不允许自行关闭 |

---

## Decision Lifecycle

```text
Open → Discussed → Documented → Closed
```

---

## Closure Requirements（D0-03a 补强）

| Decision 类型 | 同步目标 |
| :--- | :--- |
| Product Decision | `docs/phase3-decisions.md` + `docs/phase3-product.md` |
| Design Decision | `docs/phase3-design-system.md` + `docs/phase3-component-library.md` |
| Intelligence / Architecture Decision | `docs/phase3-intelligence-architecture.md` |
| Coding Rule Decision | `.cursor/rules/phase3-*.mdc` |
| Implementation Decision | 对应 Architecture / Migration / Code Plan |

---

## Closure Authority（D0-03b）

| Decision 类型 | 关闭权 |
| :--- | :--- |
| 产品规则 / 用户流程 / 数据语义 | Product Owner |
| 技术实现选择 | Implementer（记录于 Decision Log） |
| AI 自行关闭 | ❌ 不允许 |

---

# Step 0.1 — Documentation Governance

## D0-01 Component Library SoT

**Status:** Closed
**Authority:** Product Owner
**Blocking:** Coding 全局

### Question

`phase3-component-library.md` 当前 v1.0 / v1.1 Override 并存，最终哪个作为 SoT？

### Decision

```text
Q1 = C   v1.0 + Override 合并为唯一 SoT
Q2 = B + Change Log
        完全删除旧内容
        + 顶部保留简短 Change Log（5-10 行）
Q3 = B   由 Cursor 执行文档合并
```

### 合并后结构

```md
# Phase 3 Component Library

## Change Log
v1.1 (2026-10-01)
  - ShoppingTodoCard: ReferencePrice → reference_price
  - ShoppingTodoButton: 直接加入 → 必须走 Formal Requirements
  - PurchaseConversion: ReferencePrice → 正式 Todo 字段
  - Cleanup: v1.0 + Override 合并为单一 SoT

## Current SoT
（所有组件最终规则，每个组件只出现一次）
```

### Docs Synced

- [x] docs/phase3-decisions.md
- [x] docs/phase3-component-library.md
- [x] .cursor/rules/phase3-component-library.mdc

### Closed By

Product Owner

### Closed At

2026-10-01

---

## D0-02 Component Library Cleanup Scope

**Status:** Closed
**Authority:** Product Owner
**Blocking:** Coding 全局

### Decision

```text
D0-02a = A   就地重写为单一版本 + Change Log
D0-02b = A   同步修改 phase3-component-library.mdc
D0-02c = A   重新生成 Cursor Plan v2
```

### Attached Constraints

```text
1. 无 Appendix
2. 无 Deprecated 章节
3. 顶部 Change Log 仅 5-10 行
4. MDC 必须同步引用新 SoT
5. Cursor Plan v2 基于新 SoT 生成
```

### Docs Synced

- [x] docs/phase3-decisions.md
- [x] docs/phase3-component-library.md
- [x] .cursor/rules/phase3-component-library.mdc
- [ ] Cursor Plan v2（待生成）

### Closed By

Product Owner

### Closed At

2026-10-01

---

## D0-03 Decision Closure Standard

**Status:** Closed
**Authority:** Product Owner

### D0-03a Closure Requirements

**Accepted:** Yes

| Decision 类型 | 同步目标 |
| :--- | :--- |
| Product Decision | docs/phase3-decisions.md + docs/phase3-product.md |
| Design Decision | docs/phase3-design-system.md + docs/phase3-component-library.md |
| Intelligence / Architecture Decision | docs/phase3-intelligence-architecture.md |
| Coding Rule Decision | .cursor/rules/phase3-*.mdc |
| Implementation Decision | 对应 Architecture / Migration / Code Plan |

### D0-03b Closure Authority

**Accepted:** Yes

| Decision 类型 | 关闭权 |
| :--- | :--- |
| 产品规则 / 用户流程 / 数据语义 | Product Owner |
| 技术实现选择 | Implementer |
| AI 自行关闭 | ❌ 不允许 |

### Docs Synced

- [x] docs/phase3-decisions.md

### Closed By

Product Owner

### Closed At

2026-10-01

---

# Step 0.2 — Companion Boundary

## D3-01 Companion Entry Boundary

**Status:** Closed
**Authority:** Product Owner
**Blocking:** D1 / D2 / D4

### Decision

FMN Companion 有两种入口类型。不新增独立 Chat 页面。

| Entry Type | 承载页面 | Context |
| :--- | :--- | :--- |
| Global Entry | Home / My Trips | None |
| Trip Entry | Trip Detail | Current Trip |

### Terminology

```text
FMN Companion
├── Global Entry
│   └── Context = None
└── Trip Entry
    └── Context = Current Trip

Companion Surface
  = 用户打开后看到的实际 UI Surface

Context
  = 当前工作上下文
  ≠ 权限限制
```

* **FMN Companion** = 整个随行助手能力 / 交互层的总称
* **Global Entry / Trip Entry** = Companion 的两种入口类型
* **Companion Surface** = 用户打开后看到的实际 UI Surface
* **Context** = 当前工作上下文

### Deprecated Terms

以下术语在 Phase 3 文档与实现中不再使用：

```text
Global Companion
Trip Companion
```

### 禁止

```text
独立 Chat 产品页面
FMN AI Chat 产品化
```

### 澄清：Companion Surface 的展开形态

```text
"独立 Chat 页面" 指：
  独立路由（如 /companion）
  独立产品身份
  用户跳转到一个只有 Companion 的页面

不禁止：
  页面内展开全屏 Companion Surface

Companion Surface 可以为：
  - Compact（侧边抽屉）
  - Expanded（页面内全屏）

打开方式：
  点击 CompanionLauncher
  ↓
  当前页面内展开
  ↓
  不换路由

用户关闭后：
  回到原页面
```

### Context ≠ Permission Boundary

```text
Context 表达：当前默认操作上下文

Context 不表达：
  - 权限限制
  - 数据可见性边界

Trip Entry 下：
  仍可查询用户其他 Trip / 历史数据
```

### Docs Synced

- [x] docs/phase3-decisions.md
- [x] docs/phase3-product.md
- [x] docs/phase3-intelligence-architecture.md
- [x] docs/phase3-design-system.md
- [x] docs/phase3-component-library.md

### Closed By

Product Owner

### Closed At

2026-10-01

---

## D3-02 Global Entry 无 Trip 写路径

**Status:** Closed
**Authority:** Product Owner
**Blocking:** D1 Record Draft Schema

### Decision

```text
Option A — 允许 Draft 缺 Trip，Confirm 前补
```

### Attached Constraints

```text
1. Draft 必须明确显示 Trip = 未指定
2. Confirm 按钮在 Trip 未补齐前不可用
3. Workflow 必须在 Confirm 前验证 Trip 存在
4. 补齐 Trip 的交互必须清晰（不能静默选择）
```

### Rationale

Global Entry 下：

```text
Context = None
Trip = 未指定
```

用户发起写入请求时：

```text
允许先形成 Draft（Trip = 未指定）
Confirm 前必须补齐 Trip
不得静默选择 Trip
```

### Docs Synced

- [x] docs/phase3-decisions.md
- [x] docs/phase3-product.md

### Closed By

Product Owner

### Closed At

2026-10-01

---

# Step 0.3 — Record Foundation

## D1-01 Quantity

**Status:** Closed
**Authority:** Product Owner

### Decision

```text
Option A — Quantity 默认 1，用户可改
```

### Attached Constraints

```text
1. Draft 中 Quantity 默认显示为 1
2. 用户可在 Confirm 前修改
3. 正式写入时 Quantity 必须 >= 1
4. F3-03 聚合必须区分 Record Count ≠ Quantity
```

### Docs Synced

- [x] docs/phase3-decisions.md
- [x] docs/phase3-product.md

### Closed By

Product Owner

### Closed At

2026-10-01

---

## D1-02 Receipt Model

**Status:** Closed
**Authority:** Product Owner

### Decision

```text
D1-02a = A   独立 receipts 表
D1-02b = A   receipts + receipt_items（1→N）
D1-02c =     采纳推荐数据模型
```

### Data Model

```text
receipts
  id
  user_id
  image_url
  receipt_date
  created_at

receipt_items
  receipt_id
  item_id UNIQUE
```

### 关联语义

```text
Receipt 1 → N Items
Item   0..1 Receipt
```

### Attached Constraints

```text
1. receipt_items.item_id UNIQUE
2. 一个 Item 最多关联一张 Receipt
3. 一个 Item 可以没有 Receipt（手动录入）
4. 一张 Receipt 可以关联多个 Items
5. 删除 Receipt 时 receipt_items 是 CASCADE 还是 RESTRICT
   → Implementation Decision（工程师在 Migration 时决定）
```

### Data Safety Invariant

```text
删除 Receipt：
  - 允许删除 receipt_items relationship
  - 允许 CASCADE 或 RESTRICT（Implementation Decision）
  - 不得删除 Shopping Record

Receipt 是辅助信息
Shopping Record 是核心业务数据
两者不是同一层级的生命周期
```

### Docs Synced

- [x] docs/phase3-decisions.md
- [x] docs/phase3-product.md
- [x] docs/phase3-intelligence-architecture.md

### Closed By

Product Owner

### Closed At

2026-10-01

---

## D1-03 Receipt Date Semantic

**Status:** Closed
**Authority:** Product Owner

### Decision

```text
D1-03a = A         receipts.receipt_date 独立字段
D1-03b = A         Purchase Date 为 "Draft 初始化优先级"
                   Receipt Date → User Explicit Date → Current Date
D1-03c = A         允许 Receipt Date ≠ Purchase Date
```

### 修正说明

Purchase Date 优先级 = Draft 初始化优先级：

```text
1. Receipt Date
2. User Explicit Date
3. Current Date
```

用户修改优先规则：

```text
用户在 Confirm 前明确修改 Purchase Date
  ↓
用户修改后的值 = 最终值
Receipt Date 不得覆盖用户修改
```

### Attached Constraints

```text
1. 初始化优先级：Receipt Date → User Explicit Date → Current Date
2. 用户修改后 = 最终值
3. Receipt Date 不得覆盖用户修改
4. 用户未修改时，按初始化优先级取值
5. 保留 Receipt Date 与 Purchase Date 的独立性
```

### Docs Synced

- [x] docs/phase3-decisions.md
- [x] docs/phase3-product.md
- [x] docs/phase3-intelligence-architecture.md

### Closed By

Product Owner

### Closed At

2026-10-01

---

# Step 0.4 — Todo Domain

## D2-01 Todo reference_* Migration

**Status:** Closed
**Authority:** Product Owner

### Decision

```text
字段名:     保持 reference_price / reference_currency / reference_location

必填性:
  Phase 3 New Todo = 必填
  Legacy Todo      = 保持历史数据，不强制补齐

Trip:       必填
Legacy:     双轨制
```

### Phase 3 New Todo 必填字段

```text
Trip
Product
reference_price
reference_currency
reference_location
```

### 双轨制语义

```text
旧 Todo（Phase 2 创建）：
  保持原样
  可查看 / 可删除 / 可转换
  不强制补齐
  转换时补齐三字段

新 Todo（Phase 3 创建）：
  必须满足 Phase 3 必填规则
```

### 说明：DB 约束不加 NOT NULL

```text
不得在 Migration 中直接加 NOT NULL 约束。

原因：
  Legacy Todo 已存在数据，可能缺字段
  NOT NULL 会破坏既有数据

必填性由应用层（Workflow / Form）保证：
  New Todo 提交时必须完整
  Legacy Todo 允许保留空值
```

### Docs Synced

- [x] docs/phase3-decisions.md
- [x] docs/phase3-product.md
- [x] docs/phase3-component-library.md
- [x] docs/phase3-intelligence-architecture.md

### Closed By

Product Owner

### Closed At

2026-10-01

---

## D2-02 Todo Manual Entry Scope

**Status:** Closed
**Authority:** Product Owner

### Decision

```text
Option A — 全面升级
Companion + 手动 都走 Phase 3 必填规则
```

### Attached Constraints

```text
1. ShoppingTodoForm 需要新增必填校验
2. 不改字段名（仍是 reference_*）
3. 不涉及数据迁移
4. 不加 DB NOT NULL 约束（见 D2-01）
```

### Docs Synced

- [x] docs/phase3-decisions.md
- [x] docs/phase3-product.md
- [x] docs/phase3-component-library.md

### Closed By

Product Owner

### Closed At

2026-10-01

---

## D2-03 Legacy Todo Compatibility

**Status:** Closed
**Authority:** Product Owner

### Decision

由 D2-01（方案 F 双轨制）覆盖，无需单独决策。

### Docs Synced

- [x] docs/phase3-decisions.md

### Closed By

Product Owner

### Closed At

2026-10-01

---

## D2-04 Todo Quantity

**Status:** Closed
**Authority:** Product Owner

### Decision

```text
Option A — 默认 1，用户可改
```

### Attached Constraints

```text
1. TodoDraft 中 quantity 默认显示为 1
2. 用户可在 Confirm 前修改
3. 正式写入时 quantity 必须 >= 1
4. Todo → Record 转换时 quantity 继承 Todo 的值
5. F3-03 聚合区分 Todo Quantity 与 Record Quantity
6. 模糊数量如"买一些"：
     Draft 显示 1
     不强制询问
```

### Docs Synced

- [x] docs/phase3-decisions.md
- [x] docs/phase3-product.md

### Closed By

Product Owner

### Closed At

2026-10-01

---

## D2-05 Todo Location Semantic

**Status:** Closed
**Authority:** Product Owner

### Decision

```text
Option A — reference_location = Target Purchase Location
```

### Attached Constraints

```text
1. Todo.reference_location 显示为"计划购买地点"
2. 转换时作为建议值预填
3. 用户必须确认或修改实际购买地点
4. 修改 phase3-product.md §38.2：
    明确 reference_location = Target Purchase Location
5. Item.purchase_location = Actual Purchase Location
   两者不是同一个概念
```

### 转换流程

```text
Todo.reference_location
  （计划购买地点）
        ↓
作为建议值预填
        ↓
用户确认 / 修改
        ↓
Item.purchase_location
  （实际购买地点）
```

### Docs Synced

- [x] docs/phase3-decisions.md
- [x] docs/phase3-product.md
- [x] docs/phase3-component-library.md
- [x] docs/phase3-intelligence-architecture.md

### Closed By

Product Owner

### Closed At

2026-10-01

---

## D2-06 Legacy Todo Detection

**Status:** Closed
**Authority:** Product Owner

### Decision

```text
Option B — 以 created_at 为边界
```

### Attached Constraints

```text
1. 定义 Phase 3 migration boundary 时间点
2. Legacy Todo：created_at < boundary
3. New Todo：created_at >= boundary
4. 应用层通过 created_at 判定，不依赖 is_legacy 字段
5. 未来 Phase 3 Todo 若出现语义演变：
   应重新定义新的 boundary
```

### 补充：Boundary 定义

```text
Phase 3 Migration Boundary
  = 2026-10-02T00:00:00.000Z
  （Product Owner 明确指定）
```

### 判定规则

```text
Legacy / New 判定统一使用 UTC：
  created_at <  boundary  → Legacy
  created_at >= boundary  → New

Boundary 值：
  - 不得依赖运行时动态计算
  - 不得依赖客户端本地时间
  - 必须是 migration / deployment 中明确写入的固定值
```

### 展示规则

```text
UI 展示创建时间时：
  允许使用用户本地时区做展示转换
  不影响 Legacy / New 判定
```

### Docs Synced

- [x] docs/phase3-decisions.md
- [x] docs/phase3-product.md
- [x] docs/phase3-intelligence-architecture.md

### Closed By

Product Owner

### Closed At

2026-10-01

---

# Step 0.5 — State Model

## D4-01 Conversation Persistence

**Status:** Closed
**Authority:** Product Owner

### Decision

```text
Option A — Conversation 不落库
```

### Attached Constraints

```text
1. 对话记录不写入数据库
2. 不新增 conversations / messages 表
3. 关闭 Companion Surface 后，对话不保留
4. 刷新页面 / 关闭 Tab 后，对话不保留
5. Draft 独立存在（由 D4-03 决定）
```

### 状态架构

```text
Conversation State
  = in-memory runtime state
  = 页面生命周期内保留
```

### UI 含义

```text
Companion Surface 不提供：
  - 左侧历史对话栏
  - 历史会话列表
  - 会话切换入口

原因：
  Conversation 不落库
  无历史可展示
```

### Docs Synced

- [x] docs/phase3-decisions.md
- [x] docs/phase3-intelligence-architecture.md

### Closed By

Product Owner

### Closed At

2026-10-01

---

## D4-02 Session Lifecycle

**Status:** Closed
**Authority:** Product Owner

### Decision

```text
Option B — Browser Session 内保留
```

### 保留范围

```text
Conversation State = in-memory runtime state
当前浏览器 Tab 内
当前页面生命周期内
```

### 清空条件

```text
关闭 Companion Surface
刷新页面
关闭 Tab
```

### 与 D4-01 的关系

```text
D4-01 定义 Conversation 不落库
D4-02 定义 Conversation 的具体清空条件
  → 关闭 Companion Surface 时清空
  → 刷新页面 / 关闭 Tab 时清空
```

### 状态架构

```text
Conversation
    ↓
Memory only
    ↓
Close / Refresh → clear

Draft
    ↓
localStorage
    ↓
Confirm / Cancel / 7 days → clear
```

### Docs Synced

- [x] docs/phase3-decisions.md
- [x] docs/phase3-intelligence-architecture.md

### Closed By

Product Owner

### Closed At

2026-10-01

---

## D4-03 Draft Lifecycle

**Status:** Closed
**Authority:** Product Owner

### Decision

```text
Option B — Draft 独立于对话
D4-03a = A   localStorage
D4-03b = C   7 天 Expire
```

### Attached Constraints

```text
1. Draft 以 JSON 形式存 localStorage
2. 存储 key 命名：fmn:draft:<draftType>:<id>
3. 用户 Confirm / Cancel 后立即清除对应 Draft
4. 每次打开 Companion 时检查 Expire
5. 不做跨设备同步
6. 不做 Draft 版本管理
```

### 状态架构

```text
Draft State
  = localStorage
  = 跨刷新保留
  = 跨 Tab 保留
  = 7 天 Expire
```

### Docs Synced

- [x] docs/phase3-decisions.md
- [x] docs/phase3-intelligence-architecture.md

### Closed By

Product Owner

### Closed At

2026-10-01

---

## D5-01 Draft 是否 Product Entity

**Status:** Closed
**Authority:** Product Owner

### Decision

```text
Option A — Draft 是临时 application state
```

### Attached Constraints

```text
1. 不新建 drafts 表
2. Draft 校验由 Workflow / Application 层负责
3. 与 D4-01 / D4-03 一致
```

### Docs Synced

- [x] docs/phase3-decisions.md
- [x] docs/phase3-intelligence-architecture.md

### Closed By

Product Owner

### Closed At

2026-10-01

---

## D5-02 Batch Atomic Write

**Status:** Closed
**Authority:** Product Owner

### Decision

```text
Option A — 全部暂停，补齐后再统一写入
```

### Attached Constraints

```text
1. 批量 Confirm 按钮在任一对象不完整时禁用
2. MissingFieldPrompt 必须清晰列出所有缺失项
3. 用户可选择性删除不需要的商品行
4. 删除后剩余全部完整，才允许 Confirm
```

### Docs Synced

- [x] docs/phase3-decisions.md
- [x] docs/phase3-product.md
- [x] docs/phase3-intelligence-architecture.md

### Closed By

Product Owner

### Closed At

2026-10-01

---

## D5-03 Task State Location

**Status:** Closed
**Type:** Product + Implementation Decision
**Authority:** Product Owner

### Decision

```text
Option B — Task State 与 Draft 同层（localStorage）
```

### 修正：Task State 不拥有 Draft

```text
Task State 不拥有 Draft 数据。

Task State 只保存：
  - draftId（引用）
  - Goal
  - Context
  - Subtasks
  - Dependencies
  - Completed Steps
  - Current Step
  - Pending Questions
  - Intermediate Results
  - Final State

Draft 独立存储于 Draft State。
```

### 引用关系

```text
Task State
    ↓
draftId
    ↓
Draft State
```

### Attached Constraints

```text
1. Task State 不复制完整 Draft
2. Task State 只保存 draftId
3. Draft 只存储于 Draft State（localStorage）
4. Task State 与 Draft 一起 7 天 Expire
5. Task State 只包含当前活跃任务
6. Task State 在 Task 完成后立即清除
7. 不落库，与 D4-01 一致
```

### 生命周期

```text
Task 开始
  ↓
Task State 写入 localStorage
  ↓
用户 Pause / 刷新 / 关闭 Tab
  ↓
Task State 保留
  ↓
用户 Resume
  ↓
Task State 读取（通过 draftId 指向 Draft）
  ↓
Task 完成 / Cancel / 7 天 Expire
  ↓
Task State 清除
```

### Docs Synced

- [x] docs/phase3-decisions.md
- [x] docs/phase3-intelligence-architecture.md

### Closed By

Product Owner

### Closed At

2026-10-01

---

## D5-04 Explicit Confirm Semantics

**Status:** Closed
**Type:** Product Decision
**Authority:** Product Owner

### Decision

正式写入必须发生于明确的 Confirm Action。

### 不视为 Confirm

```text
- 被动浏览 Draft
- 滚动
- 关闭 Companion
- "看起来不错"
- 普通对话中的肯定表达
- "好的" / "嗯" / "继续"
```

### 视为 Confirm

```text
- 点击明确的 Confirm 按钮
- 明确说"帮我保存" / "确认写入"

如果支持自然语言 Confirm：
  必须识别为明确的 confirmation intent
  不得将模糊肯定视为 Confirm
```

### Rationale

Phase 3 的核心是 Draft → User Confirm → Write。
必须明确定义什么算 Confirm。
这是防止 AI 自作主张写入数据库的最后一道门。

### Docs Synced

- [x] docs/phase3-decisions.md
- [x] docs/phase3-product.md
- [x] docs/phase3-intelligence-architecture.md
- [x] docs/phase3-design-system.md

### Closed By

Product Owner

### Closed At

2026-10-01

---

# Implementation Decisions

## I-01 Batch Transaction Boundary

**Status:** Closed
**Type:** Implementation Decision
**Authority:** Product Owner + Engineer

### Decision

```text
Option A — Single Transaction Boundary
```

### 说明

```text
一次用户 Confirm 所产生的同一组正式写入，
必须属于同一个 transaction boundary。

Implementation may use:
  - RPC
  - Server Action
  - Postgres function
  - equivalent server-side transaction mechanism

不得使用应用层串行写入 + 补偿。
```

### Attached Constraints

```text
1. 一次 Confirm = 一个 transaction boundary
2. 所有写入在同一 transaction 内完成
3. 任何一条失败 → 全部 ROLLBACK
4. 应用层不负责补偿
5. 记录于 Phase 3 Migration 与实现中
```

### 适用范围

```text
- F3-01 Receipt 一票多 Record
- F3-05 Batch Todo
- F3-05 Batch Record
- 任何一次 Confirm 产生多个正式写入的场景
```

### Docs Synced

- [x] docs/phase3-decisions.md
- [x] docs/phase3-intelligence-architecture.md
- [ ] Phase 3 Migration 文件（待执行）

### Closed By

Product Owner

### Closed At

2026-10-01

---

## I-02 Temporary Receipt Asset Lifecycle

**Status:** Closed
**Type:** Implementation Decision
**Authority:** Product Owner + Engineer

### Decision

```text
Option A — Temporary Receipt Asset + 异步 Cleanup
```

### Attached Constraints

```text
1. 未 Confirm 的 Receipt Image 属于 temporary asset
2. 不创建正式 receipts record
3. Draft Cancel / Expire 后，temporary asset 必须进入 cleanup 流程
   Cleanup 可以异步执行
   但 Temporary Receipt Asset 的最长保留时间不得超过 7 天
4. Confirm 后 temporary asset 转为正式 Receipt asset
5. 存储 bucket 与 RLS 需区分 temporary / formal
```

### 生命周期

```text
用户上传 Receipt Image
  ↓
存入 temporary storage
  ↓
生成 Draft
  ↓
用户 Confirm
  ↓
temporary asset 转为正式 Receipt asset
  ↓
创建 receipts + receipt_items

或：

用户 Cancel / Draft 7 天 Expire
  ↓
temporary asset 必须进入 cleanup 流程
（Cleanup 可异步执行，但最长保留 ≤ 7 天）
```

### Docs Synced

- [x] docs/phase3-decisions.md
- [x] docs/phase3-intelligence-architecture.md
- [ ] Phase 3 Migration / Storage 实现（待执行）

### Closed By

Product Owner

### Closed At

2026-10-01

---

# Later Decisions（不阻断 Coding 启动）

## L-01 Brand / Destination 数据模型

**Status:** Closed

**Authority:** Product Owner

### Decision

```text
Brand:       保持 BLOCKED

Destination:
  字段:       trips.destination
  类型:       text
  NULL:       允许
  数量:       单一
  形态:       纯自由文本（无自动补全）
  必填性:     新 Trip 必填（应用层）；历史 Trip NULL
  可编辑:     创建后可编辑
  查询:       LOWER(destination) LIKE LOWER(%input%)
  Migration:  ALTER TABLE trips ADD COLUMN destination text
              （无 NOT NULL，无回填）
```

### Brand

* 本 Phase 不新增 `brand` 字段
* 不从 `product_name` / `notes` / `location` 推导 Brand
* F3-02 / F3-03 遇到明确的 Brand 查询意图时，返回 unsupported
* 不维护 Brand 词表
* 不引入通用品牌启发式
* 不得将商品名称、购买地点、分类或备注中的内容推断为 Brand

### Destination

**字段定义**

* 字段：`trips.destination`
* 类型：`text`
* 允许 `NULL`
* 单一 Destination，不支持多目的地

**填写规则**

* 新 Trip：应用层必填，由 TripForm 校验
* 历史 Trip：保持 `NULL`，不强制补齐
* 数据库层允许 `NULL`，不增加 `NOT NULL` 约束

**形态**

* 纯自由文本
* 不提供自动补全
* 不使用预定义列表
* 不做跨语言映射

**编辑**

* Destination 创建后可编辑
* 不强制补齐历史 Trip 的 Destination

**查询**

* 使用 `LOWER(destination) LIKE LOWER(%input%)`
* 大小写不敏感
* 包含匹配
* 不跨语言映射（例如“日本” ≠ “Japan”）
* 不做模糊匹配
* `NULL` 不匹配

**Migration**

```sql
ALTER TABLE trips ADD COLUMN destination text;
```

* 不增加 `NOT NULL`
* 不进行历史数据回填

**UI**

* TripForm 新增 Destination 字段，应用层必填
* 使用普通文本输入，不提供自动补全
* Trip Detail 显示 Destination
* 历史 Trip 的 Destination 为空时，显示“未填写”

### Impact

* F3-02 / F3-03 支持 Destination 过滤
* Destination 查询基于 `trips.destination`
* Brand 在本 Phase 保持 BLOCKED
* F3-02 / F3-03 不支持 Brand 过滤、分组或聚合

### Docs Synced

* [x] docs/phase3-decisions.md
* [x] docs/phase3-product.md
* [x] docs/phase3-intelligence-architecture.md
* [x] docs/phase3-design-system.md
* [x] docs/phase3-component-library.md（N/A：TripForm 不属于 Companion Component Library；规则由 product §2.3 + design-system §7.4 承载）

### Closed By

Product Owner

### Closed At

2026-10-02

---

## L-02 Duplicate Detection 相等规则

**Status:** Closed

**Authority:** Product Owner

### Scope

* 仅检查同一 Trip 内的 Shopping Todo
* 不检查跨 Trip Todo
* Duplicate Detection 仅用于提示，不得自动合并

### Exact Equality Rules

以下三个字段必须同时完全相同，才判定为 Suspected Duplicate：

1. **Product**：精确字符串相等
2. **Reference Price**：`reference_price` 与 `reference_currency` 组合比较，数值和货币必须同时相同
3. **Reference Location**：精确字符串相等

```text
Product
  + reference_price
  + reference_currency
  + reference_location

全部精确相同
  → Suspected Duplicate

任意一个不同
  → Not Duplicate
```

### Equality Constraints

* 使用精确相等比较
* 不做字符串规范化
* 不做大小写转换
* 不做模糊匹配
* 不推断同义词或相似商品

以下字段不参与 Duplicate Detection：

* Quantity
* Note
* Category
* Product Image
* Target Purchase Date

### User Interaction

检测到 Suspected Duplicate 时，向用户显示“发现相似 Todo”，并提供以下选择：

* 创建新的 Todo
* 使用已有 Todo
* 修改已有 Todo

如果三个比较字段完全相同，额外提示用户是否合并 Quantity，由用户决定。

系统不得自动合并 Todo，也不得自动修改已有 Todo。

### Docs Synced

* [x] docs/phase3-decisions.md
* [x] docs/phase3-product.md
* [x] docs/phase3-intelligence-architecture.md

### Closed By

Product Owner

### Closed At

2026-10-02

---

## L-03 "最近" 语义

**Status:** Closed

**Authority:** Product Owner

### Decision

```text
"最近" ≠ 时间窗口

"最近" = 最近一次已开始旅行（有 item 记录）的 Shopping Records
```

### Context Resolution

**Context Valid**

满足以下所有条件：

* 用户从 Trip Entry 进入
* Current Trip 已开始
* Current Trip 已有 Item Records

处理规则：

* 直接使用 Current Trip 查询
* 不展示候选 Trip 列表

**Context Invalid**

包括：

* Global Entry
* Trip Entry，但 Current Trip 尚未开始
* Trip Entry，但 Current Trip 没有 Item Records

处理规则：

* 仅选择已开始且有 Item Records 的 Trips 作为候选
* 按 `start_date` 降序排列
* 最多展示 5 个候选 Trip
* 用户选择后，直接执行查询，不需要第二次确认
* 如果只有 1 个候选 Trip，直接使用该 Trip，不展示候选列表
* 如果没有候选 Trip，提示“没有创建过有 record 的旅行”

### Constraints

* 不使用固定的 7 / 30 / 90 天时间窗口
* 不新增数据库字段
* 不新增 Migration
* 排除未来尚未开始的 Trip
* 本 Phase 不区分“最近”与“上次”
* 不将“最近”自动解释为最近几天

### Future Consideration

如果未来支持明确的“最近 N 天”查询，可使用时间窗口语义，且时间范围上限为 365 天。该项不属于当前决策，也不阻断当前 Feature 实现。

### Docs Synced

* [x] docs/phase3-decisions.md
* [x] docs/phase3-product.md
* [x] docs/phase3-intelligence-architecture.md
* [x] docs/phase3-design-system.md
* [x] docs/phase3-component-library.md

### Closed By

Product Owner

### Closed At

2026-10-02

---

## L-04 Receipt OCR Provider + Privacy Boundary

**Status:** 
- Layer 1 (Privacy): Closed
- Layer 2 (Provider): Later

**Authority:** Product Owner

### Layer 1 — 隐私边界（Closed）

#### Legal / Product Requirement

```text
系统设计与供应商选择必须满足适用的隐私与数据保护要求，
包括 GDPR / 中国个人信息保护相关要求（如适用）。
```

#### Technical Acceptance Criteria

```text
- TLS 加密传输
- 供应商不得用于训练
- Provider retention ≤ 24h
- 用户 opt-in 才发送
- 用户可查看发送数据范围
- 最小必要上下文
- 供应商不得存储用户原始数据
```

发送内容：Receipt Image

### Layer 2 — 供应商选择（Later）

```text
关闭时机：F3-01 Receipt 接入前
关闭权：Implementer
约束：供应商必须满足 Layer 1 全部隐私边界
```

### 阻断范围

```text
不阻断 Step 1
阻断 F3-01 Receipt 最终实现
```

---

## L-05 Voice STT Provider + Privacy Boundary

**Status:** 
- Layer 1 (Privacy): Closed
- Layer 2 (Provider): Later

**Authority:** Product Owner

### Layer 1 — 隐私边界（Closed）

#### Legal / Product Requirement

```text
系统设计与供应商选择必须满足适用的隐私与数据保护要求，
包括 GDPR / 中国个人信息保护相关要求（如适用）。
```

#### Technical Acceptance Criteria

```text
- TLS 加密传输
- 供应商不得用于训练
- Provider retention ≤ 24h
- 用户 opt-in 才发送
- 用户可查看发送数据范围
- 最小必要上下文
- 供应商不得存储用户原始数据
```

发送内容：用户语音

### Layer 2 — 供应商选择（Later）

```text
关闭时机：F3-01 Voice 接入前
关闭权：Implementer
约束：供应商必须满足 Layer 1 全部隐私边界
```

### 阻断范围

```text
不阻断 Step 1
阻断 F3-01 Voice 最终实现
```

---

## L-06 LLM Provider + Privacy Boundary

**Status:** 
- Layer 1 (Privacy): Closed
- Layer 2 (Provider): Later

**Authority:** Product Owner

### Layer 1 — 隐私边界（Closed）

#### Legal / Product Requirement

```text
系统设计与供应商选择必须满足适用的隐私与数据保护要求，
包括 GDPR / 中国个人信息保护相关要求（如适用）。
```

#### Technical Acceptance Criteria

```text
- TLS 加密传输
- 供应商不得用于训练
- Provider retention ≤ 24h
- 用户 opt-in 才发送
- 用户可查看发送数据范围
- 最小必要上下文
- 供应商不得存储用户原始数据
```

发送内容：

```text
- 用户当前输入
- 为完成当前任务所需的最小上下文
- 不发送完整 Shopping Record / 完整历史
```

### Layer 2 — 供应商选择（Later）

```text
关闭时机：F3-01 / F3-05 LLM 接入前
关闭权：Implementer
约束：供应商必须满足 Layer 1 全部隐私边界
```

### 阻断范围

```text
不阻断 Step 1
阻断 F3-01 / F3-05 智能能力最终实现
```

---

# Decision Change Protocol

Closed Decision 在 Coding 后如需修改：

```text
1. 暂停受影响 Feature 的 Coding
2. 修改 docs/phase3-decisions.md
3. 同步受影响文档：
   - docs/phase3-product.md
   - docs/phase3-intelligence-architecture.md
   - docs/phase3-design-system.md
   - docs/phase3-component-library.md
   - .cursor/rules/phase3-*.mdc
4. 重新审核 Cursor Plan 受影响部分
5. 恢复 Coding
```

**AI 不得通过代码实现反向修改已 Closed 的 Product Decision。**

---

# Consistency Check（Coding 前必做）

## 检查范围

```text
Decision Log
  ↕
phase3-product.md
  ↕
phase3-intelligence-architecture.md
  ↕
phase3-design-system.md
  ↕
phase3-component-library.md
  ↕
phase3-*.mdc
  ↕
Cursor Plan v2
```

## 检查项

```text
- 无旧版 Override 残留
- 无旧 Todo 字段语义（price → reference_price）
- 无旧 Receipt 模型
- 无旧 Companion 路由描述（/companion）
- 无旧 Draft 持久化描述（落库）
- 无旧 Conversation 落库描述
- Decision Log 中所有 Sync 目标已实际同步
```

## 通过条件

```text
任一不一致 → 不得进入 Coding。
全部一致   → 允许进入 Cursor Plan v2。
```

---

# Coding Gate Checklist

## Blocking Decisions

| Decision | Status |
| :--- | :--- |
| D0-01 | ✅ Closed |
| D0-02 | ✅ Closed |
| D0-03 | ✅ Closed |
| D3-01 | ✅ Closed |
| D3-02 | ✅ Closed |
| D1-01 | ✅ Closed |
| D1-02 | ✅ Closed |
| D1-03 | ✅ Closed |
| D2-01 | ✅ Closed |
| D2-02 | ✅ Closed |
| D2-03 | ✅ Closed |
| D2-04 | ✅ Closed |
| D2-05 | ✅ Closed |
| D2-06 | ✅ Closed |
| D4-01 | ✅ Closed |
| D4-02 | ✅ Closed |
| D4-03 | ✅ Closed |
| D5-01 | ✅ Closed |
| D5-02 | ✅ Closed |
| D5-03 | ✅ Closed |
| D5-04 | ✅ Closed |
| I-01 | ✅ Closed |
| I-02 | ✅ Closed |

**All Blocking Decisions Closed。**

## Later Decisions（不阻断 Step 1）

| Decision | Status | 阻断 Feature |
| :--- | :--- | :--- |
| L-01 Brand / Destination | ✅ Closed | — |
| L-02 Duplicate Detection | ✅ Closed | — |
| L-03 "最近" 语义 | ✅ Closed | — |
| L-04a OCR Provider | Later | F3-01 Receipt |
| L-05a STT Provider | Later | F3-01 Voice |
| L-06a LLM Provider | Later | F3-01 / F3-05 |

---

# Pending Actions（Coding 前必须完成）

## 文档同步

- [x] `docs/phase3-component-library.md` 合并（D0-01 / D0-02）
- [x] `.cursor/rules/phase3-component-library.mdc` 同步（D0-02）
- [x] `docs/phase3-product.md` 同步（D1-01 / D1-02 / D1-03 / D2-01 / D2-02 / D2-04 / D2-05 / D2-06 / D3-01 / D3-02 / D5-02 / D5-04 / L-04/05/06 隐私边界）
- [x] `docs/phase3-intelligence-architecture.md` 同步（D1-02 / D1-03 / D2-01 / D2-05 / D4-01 / D4-02 / D4-03 / D5-01 / D5-03 / D5-04 / I-01 / I-02）
- [x] `docs/phase3-design-system.md` 同步（D3-01 / D5-04，如涉及）

## Consistency Check

- [x] Decision Log ↔ 所有文档一致性通过

## Cursor Plan v2

- [ ] 基于新 SoT + 新 Decisions 生成
- [ ] 审核通过

## Coding Gate

- [ ] 全部文档同步完成
- [ ] Consistency Check 通过
- [ ] Cursor Plan v2 审核通过
- [ ] Coding 正式开放

---

# Document Status

**Version:** 1.5
**Status:** Core Blocking Decisions Closed
**Later Decisions:** L-04a / L-05a / L-06a Open / Non-blocking
**Next Action:** 完成剩余文档同步 + Consistency Check + Cursor Plan v2
**Coding:** 待开放

---

# Final Principle

> **Coding 不得在 Decision 未关闭时开始。**
>
> **Decision 关闭必须由 Product Owner 或明确授权者执行。**
>
> **AI 不得自行关闭 Decision，不得自行补默认值，不得自行修改产品语义。**
>
> **先锁 SoT，再锁 Data Model，再锁 Runtime，最后 Coding。**

---
