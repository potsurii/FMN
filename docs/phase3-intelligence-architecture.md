# Forget Me Not — Phase 3 Intelligence Architecture

**Status:** Phase 3 Intelligence Architecture — Complete
**Version:** 1
**Parent Product:** Forget Me Not
**Current Phase:** Phase 3 — FMN Companion
**Related Product Definition:** `docs/phase3-product.md`
**Related Decision Log:** `docs/phase3-decisions.md`

---

# 1. Architecture Purpose

Phase 3 introduces **FMN Companion** as the intelligent interaction layer of Forget Me Not.

本文件定义：

* Agent
* Workflow
* Tool Calling
* Intent Understanding
* Workflow Routing
* Task Orchestration
* Task State
* Intermediate Results
* Draft
* Confirmation
* Resume
* Re-plan
* Permission Boundary
* F3-01～F3-05 的智能执行结构

本文件回答：

> **FMN Companion 如何理解用户请求，并调用正确的 FMN Workflow 完成任务。**

本文件不重新定义 Phase 3 产品需求。

产品行为与业务规则以：

`docs/phase3-product.md`

为准。

所有已锁定 Decision 以：

`docs/phase3-decisions.md`

为准。

---

# 2. Architecture Principles

## 2.1 Companion Is an Intelligent Interaction Layer

FMN Companion：

> 负责理解用户意图、组织任务并调用已有 FMN 能力。

它不是新的业务数据系统。

---

## 2.2 Workflow Is the Business Execution Boundary

Workflow：

> 负责确定性的业务流程与业务规则。

Agent：

> 负责理解、选择、组织和动态推进。

Agent 不应该重新实现 Workflow 中已经存在的业务规则。

---

## 2.3 Existing Workflow First

如果一个用户请求可以由已有 Workflow 完成：

> 优先调用已有 Workflow。

不得因为加入 Agent 而重新创造重复业务逻辑。

---

## 2.4 Single Workflow Before Orchestration

如果请求只需要一个 Workflow：

```text
Companion
↓
Single Workflow
```

不进入 F3-05。

只有用户目标需要两个或以上 Workflow 时：

```text
Companion
↓
F3-05 Orchestration
↓
Multiple Workflows
```

---

## 2.5 Draft Before Formal Write

所有需要正式写入业务数据的智能任务：

```text
Understand
↓
Workflow
↓
Draft
↓
User Review
↓
User Confirm
↓
Formal Write
```

Agent 不得绕过 Draft / Confirmation 直接写入正式业务数据。

---

## 2.6 Explicit Confirm Semantics

正式写入必须发生于明确的 Confirm Action。

不视为 Confirm：

* 被动浏览 Draft
* 滚动
* 关闭 Companion
* "看起来不错"
* 普通对话中的肯定表达
* "好的" / "嗯" / "继续"

视为 Confirm：

* 点击明确的 Confirm 按钮
* 明确说"帮我保存" / "确认写入"

如果支持自然语言 Confirm：

> 必须识别为明确的 confirmation intent。
>
> 不得将模糊肯定视为 Confirm。

---

## 2.7 Data Truth First

AI 层：

> 不负责制造事实。

无法确定的数据必须：

* 从 FMN 数据中读取
* 从用户输入中取得
* 或向用户询问

不得猜测或编造。

---

## 2.8 No External Data in Current Phase

Phase 3 Companion 当前仅使用：

```text
User's FMN Data
+
FMN Public Data
```

不得通过外部：

* E-commerce
* Product Search
* Price Database
* Maps
* GPS
* POI
* Geocoding
* External Recommendation System

补充当前产品数据。

---

# 3. High-Level Architecture

```text
                         User
                           │
                           ↓
                  ┌──────────────────┐
                  │  FMN Companion   │
                  └────────┬─────────┘
                           ↓
                  Intent Understanding
                           ↓
                  Context Resolution
                           ↓
                  Task Classification
                           │
                ┌──────────┴──────────┐
                ↓                     ↓
         Single Workflow        Cross-Function
                │                     │
       ┌────────┼────────┐            ↓
       ↓        ↓        ↓           F3-05
     F3-01    F3-02    F3-03           │
       │        │        │             ↓
       └────────┼────────┴──────→ Workflow Orchestration
                │                       │
                │                       ↓
                └────────────────→ F3-04
                                        │
                                        ↓
                                  Draft / Result
                                        │
                              ┌─────────┴─────────┐
                              ↓                   ↓
                           Result            Confirmation
                                                   │
                                                   ↓
                                              Formal Write
```

---

# 4. Companion Layers

```text
User Interaction
       ↓
Intent Understanding
       ↓
Context Resolution
       ↓
Task Classification
       ↓
Workflow Routing
       ↓
Workflow Execution
       ↓
Result / Draft
       ↓
Confirmation
       ↓
Formal Business Operation
```

其中：

### Intent Understanding

理解用户想做什么。

### Context Resolution

确定当前 Trip、用户、历史时间范围等上下文。

### Task Classification

判断请求属于：

* F3-01
* F3-02
* F3-03
* F3-04
* F3-05

### Workflow Routing

选择对应 Workflow。

### Workflow Execution

执行具体业务流程。

### Result / Draft

返回查询结果或形成待确认 Draft。

### Confirmation

涉及正式写入时等待用户确认。

---

# 5. Agent

## 5.1 Agent Responsibility

Agent 主要负责：

* Natural Language Understanding
* Intent Recognition
* Context Interpretation
* Workflow Selection
* Multi-step Planning
* Task Progress
* User Question
* Branching
* Resume
* Re-plan
* Result Aggregation

Agent 不负责：

* 绕过业务规则
* 直接修改数据库
* 自行发明业务字段
* 自行决定用户未确认的信息
* 替代具体 Workflow

---

## 5.2 Agent Characteristics

Agent 适用于：

> 用户目标不完全固定、可能需要动态判断的任务。

---

# 6. Workflow

## 6.1 Workflow Responsibility

Workflow 负责：

* 固定业务步骤
* 数据验证
* 业务规则
* 数据查询
* 数据处理
* Draft 生成
* 正式写入
* 业务状态变化

Workflow 应尽可能：

> Deterministic / Predictable

---

## 6.2 Workflow Boundary

每个 Workflow：

> 有自己的明确输入、业务规则和输出。

Agent 不应该修改 Workflow 的业务规则。

---

## 6.3 Current Workflows

Phase 3 当前共有：

```text
F3-01 Record
F3-02 Search
F3-03 Organize
F3-04 Todo
F3-05 Orchestration
```

其中：

> F3-05 本身负责组合其他 Workflow。

---

# 7. Tool Calling

## 7.1 Tool Responsibility

Tool 是：

> Workflow 执行过程中具体的操作能力。

例如概念上可以包括：

* Query Trips
* Query Shopping Records
* Query Shopping Todo
* Create Draft
* Validate Data
* Create Shopping Record
* Update Shopping Todo
* Cancel Shopping Todo

Tool 不应该自行决定：

> 用户真正想做什么。

---

## 7.2 Tool Boundary

推荐逻辑：

```text
Agent
↓
Workflow
↓
Tool
↓
FMN Data
```

而不是：

```text
Agent
↓
Database
```

Agent 不直接绕过 Workflow 操作正式业务数据。

---

## 7.3 Batch Transaction Boundary

一次用户 Confirm 所产生的同一组正式写入：

> 必须属于同一个 transaction boundary。

Implementation may use：

* RPC
* Server Action
* Postgres function
* equivalent server-side transaction mechanism

不得使用应用层串行写入 + 补偿。

---

# 8. Intent Understanding

用户输入首先进入 Intent Understanding。

输入可能来自：

* Text
* Voice
* Receipt Photo
* Conversation Context

输出：

```text
Intent
+
Relevant Entities
+
Context
+
Potential Workflow
```

---

# 9. Context Resolution

## 9.1 Global Context

Global Entry：

```text
Context = None
```

当 Global Entry 接收到需要写入的请求，且未确定目标 Trip：

> 允许先形成 Draft，`Trip = 未指定`。

> Confirm 前必须补齐 Trip。

> 不得静默选择 Trip。

---

## 9.2 Trip Context

Trip Entry：

```text
Context = Current Trip
```

当前 Trip：

> 是默认上下文。

---

## 9.3 Context Does Not Restrict Search

例如：

```text
Current Trip = Thailand
```

用户：

> "我之前去日本买过 Anessa 吗？"

应进入：

```text
Current Trip
     ↓
Default Context
     ↓
History Search
     ↓
Japan Trips
```

---

## 9.4 Write Context

当需要写入数据：

> Current Trip 可以作为默认目标。

如果用户指定其他 Trip：

> 必须确定具体目标 Trip。

不得因为目的地相同而静默选择。

---

# 10. Task Classification

Agent 首先判断：

> 是否属于 Single Workflow。

### Single Workflow

例如：

> "我去年去日本买过什么美妆？"

```text
F3-02
```

### Cross-Function

例如：

> "把我上次去日本买过的美妆整理一下，并加入这次日本旅行 Todo。"

```text
F3-05
↓
F3-02
↓
F3-03
↓
F3-04
```

---

# 11. F3-01 Architecture — Record Workflow

## 11.1 Inputs

```text
Text
Voice
Receipt Photo
```

---

## 11.2 Unified Flow

```text
Input
↓
Information Extraction
↓
Record Draft
↓
Validation
↓
User Review
↓
User Confirm
↓
Formal Shopping Record
```

---

## 11.3 Voice

```text
Voice
↓
Speech-to-Text
↓
Natural Language Understanding
↓
F3-01
```

Voice 与 Text：

> 使用相同的 Record Workflow。

---

## 11.4 Receipt

```text
Receipt Photo
↓
Receipt Understanding
↓
Product Identification
↓
Product Splitting
↓
Price Processing
↓
Record Draft
```

一张 Receipt：

> 可以产生多个 Record Draft。

Receipt Image 作为：

> shared input / attachment reference

一张 Receipt Image 可以对应多个由该收据产生的 Draft / Record。

不得将"每一个 Record 必须拥有一张独立 Receipt Image"视为 Phase 3 要求。

---

## 11.5 Record Draft

Draft 至少准备：

```text
Trip
Product Name
Actual Paid Price
Currency
Purchase Date
```

可附加：

```text
Purchase Location
Category
Product Image
Receipt Image Reference
Note
Quantity
```

### Quantity 默认值

Draft 中 Quantity 默认显示为 1。

用户可在 Confirm 前修改。

正式写入时 Quantity 必须 >= 1。

如果用户没有提供 Quantity：

> 不强制询问。
>
> Draft 使用默认值 1。

---

## 11.6 Purchase Date Initialization

Purchase Date 优先级是：

> **Draft 初始化优先级**

```text
Receipt Date
↓
User Explicit Date
↓
Current Date
```

### 用户修改优先规则

```text
用户在 Confirm 前明确修改 Purchase Date
  ↓
用户修改后的值 = 最终值
Receipt Date 不得覆盖用户修改
```

---

## 11.7 Price Processing

价格处理必须以：

> Actual Paid Price

为目标。

Price Processing 内部可以记录价格来源，例如：

```text
receipt_confirmed
calculated
allocated
user_input
```

`price_source` 的定位：

> **internal processing metadata**

除非未来产品定义明确将其提升为正式业务字段，否则：

> 它不是用户需要看到的产品字段，也不是当前要求用户编辑的字段。

---

## 11.8 Receipt Data Model

Receipt 是独立实体：

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

关联语义：

```text
Receipt 1 → N Items
Item   0..1 Receipt
```

### Data Safety Invariant

删除 Receipt：

* 允许删除 receipt_items relationship
* 允许 CASCADE 或 RESTRICT
* **不得删除 Shopping Record**

---

## 11.9 Temporary Receipt Asset Lifecycle

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
```

或：

```text
用户 Cancel / Draft 7 天 Expire
  ↓
temporary asset 必须进入 cleanup 流程
（Cleanup 可异步执行，但最长保留 ≤ 7 天）
```

约束：

* 未 Confirm 的 Receipt Image 属于 temporary asset
* 不创建正式 receipts record
* Draft Cancel / Expire 后，temporary asset 必须进入 cleanup 流程
* Cleanup 可以异步执行
* Temporary Receipt Asset 的最长保留时间不得超过 7 天
* 存储 bucket 与 RLS 需区分 temporary / formal

---

# 12. F3-02 Architecture — Search Workflow

## 12.1 Purpose

F3-02：

> Read-only Historical Search

---

## 12.2 Flow

```text
Natural Language
↓
Query Understanding
↓
Search Conditions
↓
Historical Search
↓
Filter / Match
↓
Rank
↓
Result Formatting
```

---

## 12.3 Query Conditions

可以理解：

* Product
* Brand
* Category
* Trip
* Destination
* Purchase Date
* Time Range
* Purchase Location
* Price
* Currency

---

## 12.4 Relative Time Resolution

例如：

> 上次去日本

处理为：

```text
Japan Trips
↓
Sort by Travel Time
↓
Latest Japan Trip
```

而不是：

> Latest Japanese shopping record

---

## 12.5 Search Result

单条：

```text
Record Card
```

多条：

```text
Record List
```

大量结果：

```text
Limited Results
+
查看全部
```

无结果：

> 明确说明没有找到符合条件的记录。

---

## 12.6 Read-only Boundary

F3-02：

> 不执行正式写入。

如果用户下一步要创建：

> 转交 F3-04。

如果任务需要多个 Workflow：

> 由 F3-05 编排。

---

# 13. F3-03 Architecture — Organize Workflow

## 13.1 Purpose

F3-03 负责：

```text
Filter
Group
Sort
Aggregate
Format
```

---

## 13.2 Flow

```text
Natural Language
↓
Intent / Scope
↓
Conditions
↓
Historical Search
↓
Filter
↓
Group
↓
Sort
↓
Aggregate
↓
Format Result
```

---

## 13.3 Scope

可以处理：

* All History
* Single Trip
* Multiple Trips
* Time Range
* Product
* Brand
* Category
* Purchase Location
* Combined Conditions

---

## 13.4 Aggregation

支持：

* Record Count
* Quantity
* Total Amount
* Brand Count
* Category Count
* Trip Count
* Average Price

其中：

```text
Record Count
≠
Quantity
```

---

## 13.5 Currency Processing

不同 Currency：

```text
JPY
↓
JPY Statistics

THB
↓
THB Statistics
```

不得：

```text
JPY + THB
↓
Unified Amount
```

Average Price：

> 只在相同 Currency 中计算。

---

## 13.6 Output

```text
Summary
+
Table / Grouped Table
```

大量数据：

```text
Main Results
+
查看全部
```

---

## 13.7 Read-only Boundary

F3-03：

> 不直接修改 Shopping Records。

也不直接创建 Todo。

---

# 14. F3-04 Architecture — Todo Workflow

## 14.1 Purpose

F3-04：

> 将明确未来购物意图转化为正式 Shopping Todo。

---

## 14.2 Required Data

### Phase 3 New Todo

Phase 3 New Todo 必须满足：

```text
Trip
+
Product
+
reference_price
+
reference_currency
+
reference_location
```

缺任何一个：

> 不进入正式创建。

**Phase 3 New Todo 的必填性由应用层（Workflow / Form）保证。**

### Legacy Todo

Legacy Todo（Phase 2 已存在）视为历史数据，与 Phase 3 New Todo 明确分离。

```text
Legacy Todo
  → 保持历史数据
  → 不强制补齐 reference_price / reference_currency / reference_location
  → 允许缺字段
  → 允许查看 / 删除 / 转换
  → 转换时补齐三字段
```

```text
Phase 3 New Todo
  → 必须满足 Phase 3 Required Fields
  → 由应用层保证
```

### DB 约束边界

**不得因为 Phase 3 Required Fields 而对 `shopping_todos` 表整体加 NOT NULL。**

原因：

```text
Legacy Todo 已存在数据，可能缺字段
DB NOT NULL 会破坏既有数据
```

必填性由应用层表达，不由 DB NOT NULL 表达。

### Legacy / New 判定

```text
created_at <  Phase 3 Migration Boundary  → Legacy
created_at >= Phase 3 Migration Boundary  → New
```

Phase 3 Migration Boundary：

> 由 Phase 3 migration / deployment 明确写入的固定 UTC timestamp。

判定统一使用 UTC。

Boundary 值：

* 不得依赖运行时动态计算
* 不得依赖客户端本地时间
* 必须是 migration / deployment 中明确写入的固定值

UI 展示创建时间时：

> 允许使用用户本地时区做展示转换，不影响判定。

---

## 14.3 Product Resolution

Product 可以来自：

```text
Explicit Product
Historical Product
FMN Public Product
```

---

## 14.4 Historical Resolution

例如：

> "下次去日本买之前用过的那款防晒。"

流程：

```text
User Intent
↓
F3-02
↓
Historical Product
↓
Resolve Candidate
↓
User Select / Confirm
↓
Todo Draft
```

唯一匹配：

> 仍需用户确认。

多匹配：

> 用户选择。

无匹配：

> 明确告知。

可询问是否搜索 FMN Public Product。

---

## 14.5 Public Product Resolution

当前：

```text
FMN Public Product
=
Public Shopping Records
```

流程：

```text
Public Product Search
↓
Candidate Results
↓
User Select
↓
Todo Draft
↓
User Confirm
↓
My Shopping Todo
```

首屏最多：

> 5 个候选。

即使只有一个候选：

> 也必须确认。

---

## 14.6 Todo Draft

```text
Trip
Product
reference_price
reference_currency
reference_location
+
Optional Information
```

### reference_location 语义

```text
reference_location = Target Purchase Location
  = 计划购买地点

Item.purchase_location = Actual Purchase Location
  = 实际购买地点
```

转换时：

```text
reference_location（计划）
        ↓
作为建议值预填
        ↓
用户确认 / 修改
        ↓
purchase_location（实际）
```

### Quantity 默认值

TodoDraft 中 Quantity 默认显示为 1。

用户可在 Confirm 前修改。

正式写入时 Quantity 必须 >= 1。

如果用户没有提供数量：

> 不强制询问。

形成 Draft 后：

```text
Draft
↓
Review
↓
Confirm
↓
Create
```

---

## 14.7 Todo Edit

Agent Edit：

```text
User Request
↓
Identify Todo
↓
Update Draft
↓
User Confirm
↓
Update Todo
```

如果目标不明确：

> 需要用户确定。

---

## 14.8 Todo Cancel

```text
active
↓
cancelled
```

需要用户确认。

---

## 14.9 Todo Conversion

```text
Shopping Todo
↓
Purchased
↓
Shopping Record
```

沿用既有 Phase 2 转换逻辑。

继承规则：

```text
Todo.reference_location（计划购买地点）
        ↓
作为建议值预填
        ↓
用户确认 / 修改
        ↓
Item.purchase_location（实际购买地点）
```

Actual Paid Price、Purchase Date 等 Record-specific 字段仍必须遵守 F3-01 规则。

---

# 15. F3-04 Duplicate Detection

## 15.1 Detection Target

创建 Todo 前：

> 检查目标 Trip 的现有 Todo。

比较：

```text
Product
reference_price
reference_location
```

---

## 15.2 Same Core Information

如果三者完全相同：

> 可以考虑合并 Quantity。

但是：

> 不自动执行。

---

## 15.3 Different Price / Location

不同 reference_price 或不同 reference_location：

> 不能合并。

---

## 15.4 Similar Todo

如果发现相似 Todo：

> 先向用户展示已有信息。

允许用户决定：

* 使用原 Todo
* 修改原 Todo
* 创建新 Todo

---

# 16. F3-05 Architecture — Orchestration Workflow

## 16.1 Purpose

F3-05 是：

> Multi-Workflow Orchestrator

用于完成：

> 一个目标需要多个已有 Workflow 的任务。

---

## 16.2 Example

```text
Goal
 ↓
F3-02 Search
 ↓
Historical Results
 ↓
F3-03 Organize
 ↓
Organized Results
 ↓
F3-04 Todo
 ↓
Todo Draft
 ↓
User Confirm
 ↓
Formal Todo
```

---

# 17. F3-05 Agent Loop

F3-05 可以使用：

```text
Observe
↓
Understand
↓
Decompose
↓
Plan
↓
Select Workflow
↓
Execute Workflow
↓
Observe Result
↓
Evaluate
↓
Continue / Ask / Branch / Pause / Stop
↓
Aggregate
↓
Draft / Result
↓
Confirm if Needed
↓
Complete
```

Agent Loop 是：

> 内部执行机制。

不得向用户展示内部推理过程。

---

# 18. Task Decomposition

复杂目标：

```text
Goal
↓
Subtask 1
Subtask 2
Subtask 3
```

每个 Subtask：

> 映射到一个已有 Workflow。

---

# 19. Dependency Management

如果：

```text
A Result
↓
B Input
```

则：

> B 必须等待 A。

不得跳过依赖直接执行。

---

# 20. Task State

F3-05 在执行过程中需要维护当前 Task 的状态。

## 20.1 Task State Location

Task State 与 Draft 同层存储于 localStorage。

```text
Task State
    ↓
draftId
    ↓
Draft State
```

## 20.2 Task State 内容

Task State 不拥有 Draft 数据。

Task State 只保存：

```text
Goal
Context
Subtasks
Dependencies
Completed Steps
Current Step
Pending Questions
Intermediate Results
draftId（引用）
Final State
```

Draft 独立存储于 Draft State。

## 20.3 引用关系

```text
Task State
    ↓
draftId
    ↓
Draft State
```

## 20.4 生命周期

Task State 的生命周期独立于 Conversation，与 Draft 同层持久化。

```text
Task 开始
  ↓
Task State 写入 localStorage
  ↓
用户 Pause 任务
  ↓
Task State 保留
  ↓
用户 Resume
  ↓
Task State 从 localStorage 读取
  ↓
通过 draftId 指向 Draft State
  ↓
继续执行
  ↓
Task 完成 / Cancel / 7 天 Expire
  ↓
Task State 清除
```

### 生命周期边界（重要）

以下三者必须严格区分：

```text
关闭 Companion Surface
   ≠
关闭 Tab
   ≠
刷新页面
```

对应关系：

| 行为 | Conversation State | Task State | Draft State |
| :--- | :--- | :--- | :--- |
| 关闭 Companion Surface | 清空 | 保留（localStorage） | 保留（localStorage） |
| 刷新页面 | 清空 | 保留（localStorage） | 保留（localStorage） |
| 关闭 Tab | 清空 | 保留（localStorage） | 保留（localStorage） |
| 重新打开 FMN | 无 | 从 localStorage 读取 | 从 localStorage 读取 |
| 7 天未操作 | — | Expire | Expire |
| Task 完成 / Cancel | — | 立即清除 | 按 Confirm / Cancel 规则清除 |

**关键约束：**

```text
关闭 Companion Surface
  → 清空 Conversation State
  → 不清除 Task State
  → 不清除 Draft State
```

```text
刷新页面 / 关闭 Tab
  → 清空 Conversation State
  → 保留 Task State（localStorage）
  → 保留 Draft State（localStorage）
```

Cursor 不得将 "Companion Close" 等同于 "Task 清除"。

同时，Cursor 不得将 "Companion Close" 等同于 "Conversation 保留"。

关闭 Companion Surface 后重新打开：

```text
Conversation = 全新
Draft / Task State = 可恢复
```

## 20.5 约束

```text
1. Task State 不复制完整 Draft
2. Task State 只保存 draftId
3. Draft 只存储于 Draft State（localStorage）
4. Task State 与 Draft 一起 7 天 Expire
5. Task State 只包含当前活跃任务
6. Task State 在 Task 完成后立即清除
7. 不落库，与 D4-01 一致
8. 关闭 Companion Surface 不清除 Task State
```

---

# 21. Intermediate Results

中间结果用于：

> 在复杂任务中传递上下文和执行结果。

例如：

```text
F3-02
↓
Historical Results
↓
F3-03
```

F3-02 输出：

> Intermediate Result

不是新的正式业务数据。

---

## 21.1 Draft vs Formal Data

必须区分：

```text
Intermediate Result
≠
Draft
≠
Formal Business Data
```

只有正式 Workflow 完成并经过必要确认后：

> 才产生正式业务数据。

---

# 22. Pause / Resume

如果任务中途缺少必要信息：

```text
Running
↓
Missing Information
↓
waiting_user / paused
```

已经完成的中间结果：

> 必须保留。

用户补充后：

```text
User Input
↓
Resume
↓
Continue from Interrupted Step
```

不得无意义地重新执行整个任务。

---

# 23. Re-plan

如果用户中途改变目标：

```text
Current Task
↓
User Goal Change
↓
Update Task Plan
↓
Reuse Valid Results
↓
Continue
```

---

# 24. Task Cancellation

用户取消：

```text
Cancel Task
↓
Discard Unconfirmed Draft
↓
Stop Execution
```

已经正式写入的数据：

> 不自动回滚。

---

# 25. Unified Confirmation

当一个 Task 产生多个正式写操作：

```text
Draft × N
↓
Unified Review
↓
User Confirm
↓
Write × N
```

---

## 25.1 No Partial Formal Write

如果批量任务中任意一个对象缺少必要信息：

> 整个最终写入流程暂停。

补齐后：

> 重新进入统一确认。

不进行部分正式写入。

---

## 25.2 Batch Transaction Boundary

一次用户 Confirm 所产生的同一组正式写入：

> 必须属于同一个 transaction boundary。

Implementation may use：

* RPC
* Server Action
* Postgres function
* equivalent server-side transaction mechanism

不得使用应用层串行写入 + 补偿。

---

# 26. Cross-Function Data Integrity

F3-05 即使自动编排：

> 仍必须遵守所有下层 Workflow 的业务规则。

例如 F3-04：

```text
Trip
Product
reference_price
reference_currency
reference_location
```

必须完整。

F3-05 不得因为任务复杂：

> 创建一个不完整 Todo。

---

# 27. Minimal Workflow Principle

F3-05 必须遵守：

> **Use the Minimum Necessary Workflows**

例如：

> "去年去日本买过什么防晒？"

只需要：

```text
F3-02
```

而：

> "去年去日本买过什么防晒，并整理一下？"

需要：

```text
F3-02
↓
F3-03
```

而：

> "去年去日本买过的防晒，加入这次日本旅行 Todo。"

需要：

```text
F3-02
↓
F3-04
```

---

# 28. Typical Orchestration Patterns

```text
F3-02 → F3-03
```

```text
F3-02 → F3-04
```

```text
F3-03 → F3-04
```

```text
F3-02 → F3-03 → F3-04
```

```text
F3-01 → F3-03 → F3-04
```

实际执行：

> 根据用户目标动态决定。

---

# 29. F3-05 Can Use F3-04 Query

F3-05 可以调用 F3-04 的 Todo Query：

> 比较现有 Todo 与历史购物信息。

不得绕过 F3-04 的 Todo 业务规则。

---

# 30. Batch Todo Orchestration

例如：

> "把这五个商品都加入这次日本旅行 Todo。"

可以：

```text
Product 1 → Draft
Product 2 → Draft
Product 3 → Draft
Product 4 → Draft
Product 5 → Draft
```

然后：

```text
Unified Review
↓
User Confirm
↓
Create × 5
```

每个 Todo 都必须满足：

```text
Trip
Product
reference_price
reference_currency
reference_location
```

---

# 31. Permission Boundary

Companion 所有操作：

> 必须继承 FMN 现有 Public / Private 权限规则。

Private Data：

> 只能由有权限的用户使用。

Public Product：

> 只能读取公开信息。

跨 Workflow：

> 不得因为 Agent 拥有更多上下文而绕过权限。

---

# 32. Currency Boundary

任何 Workflow：

> 不得自动进行跨 Currency 转换。

例如：

```text
JPY
THB
KRW
```

必须保持独立。

---

# 33. Location Boundary

任何 Workflow：

> 不得通过 Maps / GPS / POI / Geocoding 自动猜测 Purchase Location。

---

# 34. Error Handling

## 34.1 Missing Information

```text
Identify Missing Field
↓
Pause
↓
Ask User
↓
Resume
```

---

## 34.2 Ambiguous Target

```text
Multiple Candidates
↓
Present Candidates
↓
User Select
↓
Continue
```

不得静默选择。

---

## 34.3 No Match

历史数据没有匹配：

> 明确返回 No Match。

不得生成虚假结果。

---

## 34.4 Workflow Failure

底层 Workflow 执行失败：

> 保留当前有效任务状态。

向用户说明当前步骤未完成。

不得伪装为成功。

---

# 35. User-Facing Progress

用户可以看到：

```text
正在查询历史记录 ✓
正在整理商品     ✓
正在检查 Todo
```

不得显示：

* Chain of Thought
* Prompt
* Tool Selection Reasoning
* Hidden Reasoning
* Internal Probability
* Function Call details

---

# 36. Read-only Execution Model

```text
User
↓
Companion
↓
F3-02
↓
Historical Data
↓
Result
```

或者：

```text
User
↓
Companion
↓
F3-03
↓
Structured Result
```

只读任务：

> 不需要 Confirmation。

---

# 37. Read + Write Execution Model

```text
User
↓
Companion
↓
Workflow(s)
↓
Draft
↓
Review
↓
Confirm
↓
Formal Write
```

---

# 38. Agent / Workflow / Tool Relationship

```text
                    Agent
                      │
             Understand / Plan
                      │
                      ↓
                  Workflow
                      │
              Business Execution
                      │
                      ↓
                    Tool
                      │
                Concrete Action
                      │
                      ↓
                  FMN Data
```

职责边界：

| Layer    | Responsibility        |
| -------- | --------------------- |
| Agent    | 理解、选择、规划、继续、暂停、重规划    |
| Workflow | 业务流程、业务规则、验证、Draft、写入 |
| Tool     | 具体操作                  |
| Data     | 保存正式业务事实              |

---

# 39. Data Lifecycle

```text
User Input
↓
Understanding
↓
Intermediate Result
↓
Draft
↓
User Review
↓
User Confirm
↓
Formal Business Data
```

只有最后一步：

> 才成为正式 FMN 数据。

---

# 40. Runtime State Boundary

## 40.1 Conversation State

```text
Conversation State
  = in-memory runtime state
  = 页面生命周期内保留
  = 关闭 Companion Surface 后清空
  = 刷新页面 / 关闭 Tab 后清空
  = 不落库
```

Companion Surface 不提供：

* 左侧历史对话栏
* 历史会话列表
* 会话切换入口

原因：

> Conversation 不落库
>
> 无历史可展示

---

## 40.2 Draft State

```text
Draft State
  = localStorage
  = 跨刷新保留
  = 跨 Tab 保留
  = 7 天 Expire
```

Draft 以 JSON 形式存 localStorage。

存储 key 命名：

```text
fmn:draft:<draftType>:<id>
```

约束：

* 用户 Confirm / Cancel 后立即清除对应 Draft
* 每次打开 Companion 时检查 Expire
* 不做跨设备同步
* 不做 Draft 版本管理

---

## 40.3 Task State

```text
Task State
  = localStorage
  = 与 Draft 同层
  = 7 天 Expire
  = 只包含当前活跃任务
  = 在 Task 完成后立即清除
```

Task State 只保存：

```text
Goal
Context
Subtasks
Dependencies
Completed Steps
Current Step
Pending Questions
Intermediate Results
draftId（引用）
Final State
```

不复制完整 Draft。

---

## 40.4 Draft 不是 Product Entity

Draft 的定位：

```text
Draft 是临时 application state
不属于 FMN 正式业务数据模型
不进入正式数据库表
不需要新建 drafts 表
```

### 重要边界

Draft **不是 Product Entity**，但 Draft 在 Confirm 前**仍然需要业务完整性验证**。

具体含义：

```text
Draft 不进入正式数据库
  ≠
Draft 不需要业务规则
```

```text
Draft 的验证由 Workflow / Application Layer 负责
  → Required Fields 完整性
  → 字段语义合法性
  → Trip 是否存在
  → 权限是否允许
  → 跨币种规则
  → 批次一致性（D5-02）
```

后端在 Confirm 时，必须：

* 验证 Draft 是否满足对应 Workflow 的 Required Fields
* 验证用户是否拥有对应 Trip / 数据的权限
* 验证是否符合 Currency / Location / Visibility 边界

只有验证通过后：

> 才允许 Formal Write。

Draft 的 UI 校验（前端）与 Draft 的业务校验（Workflow / Application Layer）**不是同一层**，两者都必须存在。

---

# 41. Architecture Boundary

Phase 3 Intelligent Architecture 当前不负责：

* Travel Lifecycle Automation
* Push Notification
* External Product Search
* E-commerce Integration
* Payment
* Maps
* GPS
* POI
* Geocoding
* Live FX
* External Recommendation Systems
* Social Messaging

也不新增：

> 独立于 Phase 3 Product Definition 之外的新核心业务模型。

---

# 42. Relationship With Product Definition

产品规则优先级：

```text
Phase 1 / Phase 2 Product Foundation
            ↓
     phase3-product.md
            ↓
phase3-intelligence-architecture.md
```

其中：

### `phase3-product.md`

定义：

> **What the product does**

### `phase3-intelligence-architecture.md`

定义：

> **How Companion organizes and executes those capabilities**

如果 Architecture 与 Product Definition 冲突：

> 以 Product Definition 为准。

---

# 43. Document Status

**Version:** 1

**Status:** Phase 3 Intelligence Architecture — Complete

Product Definition:

`docs/phase3-product.md`

Phase 3 Design System:

`docs/phase3-design-system.md`

Phase 3 Component Library:

`docs/phase3-component-library.md`

Phase 3 Decision Log:

`docs/phase3-decisions.md`

Phase 3 Intelligence Architecture extends the established Phase 3 product boundaries with the execution structure for FMN Companion.

Current clarifications:

* Receipt Image is a shared input / attachment reference and may relate to multiple Records.
* `price_source` is internal processing metadata unless explicitly promoted into the product model.
* Purchase Date priority is a Draft initialization priority.
* Confirm is an explicit user action.
* Batch writes share a single transaction boundary.
* Task State stores a reference to Draft, not the Draft itself.
* Temporary Receipt Assets have a bounded lifecycle.
* Closing Companion Surface does not clear Task State or Draft State.
* Draft is not a Product Entity, but Draft still requires business validation by Workflow / Application Layer before Confirm.
* Legacy Todo and Phase 3 New Todo are separated; DB NOT NULL is not applied to `shopping_todos` because of Legacy data.
* Architecture does not redefine Product requirements.
```

---
