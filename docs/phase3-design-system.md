# Forget Me Not — Phase 3 Design System

**Status:** Phase 3 Design Definition — Complete
**Version:** 1
**Parent Product:** Forget Me Not
**Current Phase:** Phase 3 — FMN Companion
**Base Design System:** `docs/design-system.md`
**Related Product Definition:** `docs/phase3-product.md`
**Related Intelligence Architecture:** `docs/phase3-intelligence-architecture.md`
**Related Component Library:** `docs/phase3-component-library.md`
**Related Decision Log:** `docs/phase3-decisions.md`

---

# 1. Purpose

本 Design System 定义：

> **Phase 3 — FMN Companion 的视觉与交互语言。**

Phase 3 Design System 不重新定义 Forget Me Not 的整体视觉风格。

它继承：

`docs/design-system.md`

已经建立的：

* Travel Archive
* Travel Scrapbook
* Low-saturation Natural Colors
* Paper / Stamp / Card / Tag
* 清晰的信息层级
* 商品信息优先
* 非电商化
* 非社交媒体化
* 克制动效

Phase 3 的任务是：

> **让智能交互自然地进入原有 FMN，而不是把 FMN 变成一个 AI Chat App。**

---

# 2. Design Relationship

```text
Global Design System
        ↓
Phase 3 Design System
        ↓
Companion Components
        ↓
Phase 3 Pages / Surfaces
```

---

# 3. Phase 3 Design Position

FMN Companion 不是：

* Chat App
* Customer Service Chat
* Social Chat
* Generic AI Assistant
* AI Playground
* Full-screen AI Product

而是：

> **FMN 的智能操作层。**

用户应该感觉：

> “我正在操作 FMN。”

而不是：

> “我进入了另一个 AI 应用。”

---

# 4. Core Visual Principle

> **AI 是操作层，不是视觉主角。**

视觉优先级：

```text
FMN Product Context
        ↓
User Goal
        ↓
Structured Information
        ↓
AI Assistance
```

---

# 5. Companion Visual Direction

Phase 3 Companion 采用：

> **Travel Archive × Intelligent Assistant**

同时保留：

> Travel Archive × Travel Scrapbook

的总体品牌语言。

关键词：

* Calm
* Helpful
* Structured
* Contextual
* Lightweight
* Trustworthy
* Human
* Travel-oriented
* Data-aware

避免：

* Sci-fi AI
* Neon
* Cyber
* Glassmorphism overload
* Generic chatbot appearance
* Social messaging appearance
* Enterprise dashboard appearance

---

# 6. Companion Design Density

## Idle

> 低密度。

重点：

* 简短欢迎
* 当前 Trip Context
* 示例操作
* 输入入口

---

## Processing

> 低密度。

只显示用户有意义的处理状态。

---

## Result

> 中等密度。

重点：

* 结果
* 关键数据
* 操作入口

---

## Draft

> 中等至高密度。

重点：

> **即将写入什么。**

---

## Complex Task

> 中等密度。

重点：

* 当前步骤
* 已完成步骤
* 等待信息
* 最终 Draft

不要把执行过程设计成复杂技术控制台。

---

# 7. Companion Surface

## 7.1 Surface 定位

Companion 是：

> **Layer / Surface**

而不是新的页面视觉体系。

## 7.2 打开方式

```text
用户点击 CompanionLauncher
        ↓
当前页面内展开
        ↓
不换路由
        ↓
用户关闭后回到原页面
```

**不新增独立 Chat 页面路由（如 `/companion`）。**

## 7.3 Global Entry

Global Entry：

> 与当前 FMN 页面保持关系。

承载页面：

* Home
* My Trips

Context：

```text
Context = None
```

---

## 7.4 Trip Entry

Trip Entry：

> 强调 Current Trip Context。

承载页面：

* Trip Detail

Context：

```text
Context = Current Trip
```

---

## 7.5 Surface Variants

Companion Surface 支持：

* **Compact** — 侧边抽屉
* **Expanded** — 页面内全屏

两者都是**页面内展开**，不换路由。

---

## 7.6 No History Sidebar

Companion Surface **不提供**：

* 左侧历史对话栏
* 历史会话列表
* 会话切换入口

原因：

> Conversation 不落库
>
> 无历史可展示

对应 Decision：

* D4-01 Conversation Persistence
* D4-02 Session Lifecycle

---

# 8. Context Visual Language

Context 表达：

> 当前默认操作环境。

不是：

> 权限限制。

建议使用：

```text
[ JAPAN TRIP ]
```

或：

```text
JAPAN
JUL 2026
```

当写入目标发生改变时：

> 必须明确显示新的目标 Trip。

### Global Entry 无 Trip 写路径

当在 Global Entry 下：

```text
Context = None
Trip = 未指定
```

视觉表达：

* Draft 中 Trip 字段显示为 "未指定"
* Confirm 按钮在 Trip 未补齐前不可用
* 补齐 Trip 的交互必须清晰

不得静默选择 Trip。

---

# 9. Conversation Visual Language

Companion 使用自然语言交互，但：

> 不应视觉上模仿社交聊天产品。

优先：

```text
Text
+
Structured Result
+
Related Action
```

当信息适合结构化展示时：

> 优先结构化 UI。

---

# 10. AI Identity

Companion 可以有轻量身份识别：

* FMN Companion
* 小型图标
* Travel Stamp
* Assistant Mark

但不要使用：

* AI Robot Avatar
* 发光 AI 球
* 大型 AI Logo
* 3D 数字人

Companion 应感觉像：

> FMN 本身的智能功能。

---

# 11. Structured Result

结果优先复用现有 FMN 组件：

```text
Historical Search
→ ItemCard / SearchResultCard

Trip Result
→ TripCard

Statistics
→ StatGroup / Table

Shopping Todo
→ ShoppingTodoCard
```

不要建立平行的 AI Card 系统。

---

# 12. Draft Visual Language

Draft 必须表达：

> **这还不是正式数据。**

Draft：

* 清晰
* 可编辑
* 结构化
* 有轻微视觉区分
* 不表现成 Error

## 12.1 Draft 视觉边界

Draft 是：

> temporary application state

不是：

> Formal Business Data

视觉上必须：

* 与正式数据可区分
* 不使用最终状态的视觉语言
* 不暗示"已写入"

## 12.2 Task State 视觉边界

Task State 与 Draft 同层存储，视觉上属于**进行中任务**。

但必须注意：

```text
关闭 Companion Surface
   ≠
清除 Task State
   ≠
清除 Draft State
```

因此：

* 关闭 Companion 后再次打开时，Conversation 是新的
* Task State / Draft State 仍可能恢复
* UI 必须能表达"这是之前的进行中任务，不是新任务"
* 不得视觉上伪装成"新任务"
* 不得视觉上暗示"Conversation 还在"

## 12.3 Quantity 视觉表达

Quantity 是 Shopping Record 与 Shopping Todo 的字段，UI 必须清晰表达。

### Record Quantity

* ItemCard 中显示为轻量后缀：
  ```text
  Anessa  ×3
  ```
  不显示为独立卡片。
  不显示为电商数量控件。
  不使用 "+/-" 数字调整器视觉。

* Item Detail 中显示为 Data 层级：
  ```text
  Quantity    3
  ```

* 数量 = 1 时：
  > 允许不显示 ×1。
  > 保持卡片信息清爽。

### Todo Quantity

* TodoDraft 中显示为可编辑字段：
  ```text
  Quantity    1
  ```
  默认值 1。
  用户可修改。
  不做成电商数量选择器。
  不做成强烈数字控件。

* ShoppingTodoCard 中显示方式与 ItemCard 一致：
  ```text
  Anessa  ×3
  ```

### F3-03 聚合中的区分

`Record Count` 与 `Quantity` 必须**视觉上独立**：

```text
Record Count    12
Quantity        18
```

不得合并为单一数字。
不得用 "12 条 · 18 件" 之外的模糊表达。
Data 层级一致，但 Label 必须清晰区分。

---

# 13. Confirmation Visual Language

Confirmation 必须回答：

> **你即将让 FMN 做什么？**

重点展示：

1. Target
2. Core Information
3. Modify
4. Confirm

核心写入字段不能隐藏在长文本中。

## 13.1 Explicit Confirm Semantics

只有明确的 Confirm Action 才代表正式写入。

### 不视为 Confirm 的交互（视觉上不能设计成确认入口）

* 被动浏览 Draft
* 滚动
* 关闭 Companion
* “看起来不错”
* 普通对话中的肯定表达
* “好的” / “嗯” / “继续”

### 视为 Confirm 的交互

* 明确点击 Confirm 按钮
* 明确说出“帮我保存” / “确认写入”

如果支持自然语言 Confirm：

> 必须识别为明确的 confirmation intent。

设计上：

* Confirm 按钮必须是明确的、可见的
* 不得用模糊措辞代替
* 不得将浏览行为误判为确认

## 13.2 Batch Confirm 视觉

批量写入时：

```text
Todo Draft × 5
        ↓
Unified Review
        ↓
[ 修改 ]   [ 确认 ]
```

视觉规则：

* 批量确认按钮与单个确认使用同一 Button 视觉体系
* 不使用电商 "立即购买" 视觉
* 不显示 "5 项将写入" 之类的营销语言
* 数量以 Data 层级呈现，例如：
  ```text
  5 Items
  ```
  或
  ```text
  5 个商品
  ```
* 若任一对象不完整：
  * Confirm 按钮视觉 Disabled
  * 缺失项清晰标注

---

# 14. Missing Information

缺失信息时：

> 询问用户，不是制造错误。

多个可能解释：

> 展示选择。

不得静默推断重要数据。

---

# 15. Voice & Receipt

Voice 和 Receipt：

> 是输入方式，不是独立视觉系统。

Voice：

> 清楚表达 Idle / Recording / Processing / Complete。

Receipt：

> 使用 FMN Paper / Document 语言。

Receipt UI 不应变成文档管理系统。

## 15.1 Temporary Receipt Asset

未 Confirm 的 Receipt Image 属于 temporary asset。

视觉状态：

```text
用户上传 Receipt Image
        ↓
temporary storage
        ↓
Draft
```

用户 Confirm 后：

```text
Temporary Receipt
        ↓
Formal Receipt Asset
        ↓
创建 receipts + receipt_items
```

Cancel / Expire 则：

```text
Temporary Receipt
        ↓
Cleanup
```

UI 必须能够区分：

* Temporary Receipt（尚未 Confirm）
* Formal Receipt（已 Confirm 并创建 receipts record）

**Temporary Receipt 不创建正式 receipts record。**

## 15.2 Receipt Date 与 Purchase Date 视觉区分

`Receipt Date` 与 `Purchase Date` 是两个不同字段。

二者允许不同，UI 必须清晰区分。

### 默认展示

当两者相同时（常见情况）：

```text
Purchase Date
JUL 14, 2026
```

只展示一个日期。

不显示重复的 Receipt Date。

### 当两者不同时

若用户在 Draft 中修改 Purchase Date：

```text
Purchase Date     JUL 14, 2026
Receipt Date      JUL 16, 2026
```

视觉规则：

* 两个日期都以 Data 层级展示
* Label 必须明确区分
* 不隐藏 Receipt Date
* 不把 Receipt Date 视觉弱化到看不见
* 不使用警告色 / 错误色
* 不使用 "不一致" 之类负面措辞

### Item Detail

Item Detail 中：

* Purchase Date 是主展示字段
* Receipt Date 附加展示在 Receipt 相关区域
* 若两者相同：Receipt Date 可省略
* 若两者不同：两者都显示

### 语义边界

```text
Purchase Date
  = 商品购买日期
  = Draft 初始化优先级：Receipt Date → User Explicit Date → Current Date

Receipt Date
  = 收据上的日期
  = 独立字段
```

用户修改 Purchase Date 后：

> Purchase Date = 用户修改值
>
> Receipt Date 保持不变

视觉上不得暗示二者必须相同。

---

# 16. F3-05 Task Progress

F3-05 应让复杂任务：

> 对用户看起来简单。

例如：

```text
正在查询历史记录 ✓
正在整理商品     ✓
正在检查 Todo
```

不显示：

* Tool Name
* Function Name
* JSON
* Agent Loop
* Internal reasoning

---

# 17. Shopping Todo

Shopping Todo remains:

> Travel Shopping

not:

> Task Management

视觉应与 Product Record 保持连续性。

避免：

* 项目管理视觉
* Kanban
* Productivity Dashboard
* 复杂任务标签
* 强烈 Checkbox 系统

## 17.1 reference_location 视觉表达

`reference_location` 表示：

> **计划购买地点（Target Purchase Location）**

它是 Phase 3 New Todo 的 Required Field。

### 与 Record 的对照

```text
Todo.reference_location
  = Target Purchase Location
  = 计划购买地点

Item.purchase_location
  = Actual Purchase Location
  = 实际购买地点
```

视觉上必须：

* 在 Todo 中显示为"计划购买地点"
* 在 Record 中显示为"实际购买地点"
* 转换时预填时清晰标注来源

**不引入第二个独立的 Target Purchase Location 字段。**

未来若 UI 需要强调"计划 vs 实际"，通过：

* 字段语义
* Label
* 上下文

表达，而不是新增字段。

## 17.2 Legacy Todo 视觉表达

Legacy Todo（Phase 2 已存在）：

> 保持历史数据，不强制补齐。

视觉上：

* 与 Phase 3 New Todo 不做强区分
* 不显示"不完整"警告
* 允许查看 / 删除 / 转换
* 转换为 Shopping Record 时，按 Phase 3 转换规则补齐所需字段

不得对 Legacy Todo 显示用户未填写的 Required Fields 为错误。

---

# 18. Color System

Phase 3 不建立新的 AI 品牌色。

继续继承：

* Warm White
* Paper
* Charcoal
* Dark Gray
* Terracotta
* Olive
* Sand
* Muted Blue

Draft / Processing / Waiting / Success / Error：

> 使用已有 semantic colors。

---

# 19. Motion

动效保持：

> subtle, calm, short, purposeful

优先：

* Fade
* Small Translate
* Light Press
* Gentle State Transition

避免：

* Glowing AI Effects
* Particle Effects
* Scanning Animation
* Bounce-heavy Motion
* Long Typewriter Effects

---

# 20. Responsive Design

Phase 3 必须适配：

* Desktop
* Tablet
* Mobile

重点调整：

* Companion width
* Input controls
* Draft layout
* Result layout
* Candidate selection
* Confirmation actions
* Task progress

不要只是缩小 Desktop。

---

# 21. Accessibility

必须保持：

* sufficient contrast
* visible focus
* usable touch targets
* keyboard accessibility
* clear labels
* clear error messages

重要状态不能只通过颜色表达。

---

# 22. Phase 3 Design Reuse

建立新视觉模式前：

1. Check `docs/design-system.md`
2. Check `docs/phase3-design-system.md`
3. Check existing component library

优先复用 FMN 视觉语言。

---

# 23. Anti-Patterns

禁止把 Companion 做成：

### Generic Chatbot

```text
Avatar
↓
Chat Bubble
↓
Chat Bubble
```

### AI Dashboard

```text
Model
Token
Tool
Reasoning
Status
```

### Social Chat

```text
Avatar
Like
Reply
Reaction
```

### E-commerce Assistant

```text
Buy
Discount
Seller
Checkout
```

---

# 24. Future Scope

未来视觉概念只是参考：

> **Future visual concept ≠ Current implementation requirement**

不自动实现：

* AI Avatar
* AI Personality
* Model Selector
* Prompt Editor
* Agent Debugger
* Workflow Editor
* Tool Console
* Reasoning Viewer
* Advanced Scrapbook

---

# 25. Design Rules

## Rule 1

Companion 是 FMN 的智能操作层。

## Rule 2

不要把 FMN 变成 Chat App。

## Rule 3

结构化信息优先于长文字。

## Rule 4

Draft 必须与正式数据视觉区分。

## Rule 5

确认前必须明确展示将写入什么。

## Rule 6

Processing 只显示用户有意义的信息。

## Rule 7

不展示内部推理和工具调用。

## Rule 8

Current Trip 表达 Context，不表达权限限制。

## Rule 9

AI 不建立独立颜色体系。

## Rule 10

Voice / Receipt 是输入方式，不是独立产品品牌。

## Rule 11

F3-02 / F3-03 优先复用既有结果组件。

## Rule 12

F3-05 要让复杂任务对用户看起来简单。

## Rule 13

新组件视觉优先继承 FMN 已有语言。

## Rule 14

Companion Surface 为页面内展开，不换路由。

## Rule 15

Companion Surface 不提供左侧历史对话栏。

## Rule 16

Confirm 必须是明确的 UI / Voice confirmation action。

## Rule 17

reference_location 与 purchase_location 的视觉表达必须清晰区分计划与实际。

## Rule 18

Legacy Todo 不得因未填 Required Fields 被视觉标记为错误。

## Rule 19

Quantity 在 ItemCard / TodoCard 中显示为轻量后缀（×3）。

不得做成电商数量控件。

## Rule 20

Record Count 与 Quantity 在 F3-03 聚合中必须视觉上独立。

## Rule 21

Receipt Date 与 Purchase Date 是两个独立字段。

当二者不同时，必须都显示，不得视觉暗示二者必须一致。

---

# 26. Product Boundary

Product Definition 优先：

```text
Product
↓
Design
↓
Component
```

Design 不得为了视觉方便修改 Product Behavior。

---

# 27. Document Status

**Version:** 1

**Status:** Phase 3 Design Definition — Complete

Phase 3 Design System extends the established Forget Me Not visual language without creating an independent AI visual system.

Current direction:

> **Travel Archive × Intelligent Assistant**

The Companion should feel like:

> **FMN becoming easier to operate, not FMN becoming another AI app.**

Related documents:

* `docs/phase3-product.md`
* `docs/phase3-intelligence-architecture.md`
* `docs/phase3-component-library.md`
* `docs/phase3-decisions.md`
* `docs/design-system.md`
```

---

