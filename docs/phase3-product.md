# Forget Me Not — Phase 3 Product Definition

**Status:** Phase 3 Product Definition — Complete
**Version:** 1
**Parent Product:** Forget Me Not
**Current Phase:** Phase 3 — FMN Companion

---

# 1. Phase 3 Definition

## 1.1 Phase Name

**Phase 3 — FMN Companion / FMN 随行助手**

---

## 1.2 Phase Goal

Phase 3 在 Phase 1 / Phase 2 已建立的旅行购物数据与功能基础上，引入自然语言交互与智能能力，让用户可以更自然地操作 FMN 已有的旅行购物数据与功能。

Phase 3 包含：

* Natural Language Interaction
* Agent
* Workflow
* Tool Calling
* Cross-Function Orchestration

主要解决：

* 购物记录录入
* 历史购物信息查询
* 个人购物数据整理
* Shopping Todo 规划
* 跨功能旅行购物任务

Phase 3 的目标不是让 FMN 成为泛用型 Chatbot。

核心目标是：

> **让 AI 成为 FMN 旅行购物数据与功能之间更自然的操作层。**

---

# 2. Inherited Product Foundation

Phase 3 继承 Phase 1 / Phase 2 已建立的产品基础。

## 2.1 Product Position

FMN 仍然是：

> Travel Shopping Record & Sharing Product

不是：

* Travel Diary
* Photo Album
* E-commerce Platform
* Generic Social Platform
* Travel Route / Navigation Platform

---

## 2.2 Core Data

Phase 3 继续建立在：

```text
Product
×
Price
×
Currency
×
Purchase Location
×
Purchase Date
×
Image
```

之上。

Phase 3 在此基础上，为部分业务增加：

* Quantity
* Receipt Image

---

## 2.3 Trip

Trip 仍然是 Shopping Record 与 Shopping Todo 的主要业务容器。

### Trip Destination（Phase 3 新增）

```text
字段：trips.destination（text，NULL 允许）
单一 destination
纯自由文本（无自动补全）

双轨制：
  新 Trip：应用层必填
  历史 Trip：保持 NULL，不强制补齐

查询：
  LOWER(destination) LIKE LOWER(%input%)
```

---

## 2.4 Public / Private

Phase 1 / Phase 2 已建立的 Public / Private 规则继续有效。

Phase 3 不绕过现有权限规则。

---

## 2.5 Public Product

Phase 3 当前使用的 Public Product 继续来自：

> FMN 用户主动公开的 Shopping Records。

当前不接入外部商品平台作为 Public Product 来源。

---

## 2.6 Currency

继续遵守：

* 用户选择 Currency
* 一个 Trip 可以存在多个 Currency
* 不进行实时汇率换算
* 不进行自动货币转换
* 不生成跨币种统一金额
* 不进行跨币种金额比较

---

## 2.7 Purchase Location

继续采用 Phase 1 的：

> 用户手动输入地点文本。

允许简单的历史输入 / 自动补全，但不使用：

* Maps
* GPS
* POI
* Geocoding

---

## 2.8 Existing Product Behavior

Phase 1 / Phase 2 已有用户流程默认保持不变。

只有本文件明确写出的 Phase 3 规则，才视为对既有能力的升级或新增。

---

# 3. Phase 3 Changes to Existing Product Rules

Phase 3 对既有产品能力进行以下升级：

1. Shopping Record 增加 **Quantity** 与 **Receipt Image**。
2. Shopping Todo 升级为结构化的正式购物计划。
3. Phase 3 New Shopping Todo 必须具有：

   * Trip
   * Product
   * reference_price
   * reference_currency
   * reference_location
4. FMN Companion 成为 FMN 内部统一的智能交互入口。
5. Companion 必须复用已有业务 Workflow，不得绕过既有产品规则。
6. 涉及正式数据写入时，必须经过 Draft / Review / Confirmation。
7. F3-01～F3-05 均只能使用符合权限的数据。

---

# 4. FMN Companion

## 4.1 Product Position

FMN Companion 是：

> **FMN 内部统一的智能交互入口。**

它不是：

* 独立购物 Agent
* 泛用型 Chatbot
* 外部电商助手
* 泛内容搜索助手

它的职责是：

> **理解用户与旅行购物相关的意图，并调用 FMN 内部能力完成任务。**

---

# 5. Companion Entry

Companion 有两种入口类型：

| Entry Type | 承载页面 | Context |
| :--- | :--- | :--- |
| Global Entry | Home / My Trips | None |
| Trip Entry | Trip Detail | Current Trip |

术语定义：

```text
FMN Companion
├── Global Entry
│   └── Context = None
└── Trip Entry
    └── Context = Current Trip
```

* **FMN Companion** = 整个随行助手能力 / 交互层的总称
* **Global Entry / Trip Entry** = Companion 的两种入口类型
* **Companion Surface** = 用户打开后看到的实际 UI Surface
* **Context** = 当前工作上下文

废弃术语：

```text
Global Companion
Trip Companion
```

---

## 5.1 Global Entry

Global Entry 承载于：

* Home
* My Trips

默认：

```text
Context = None
```

可以用于：

* 历史购物查询
* 个人购物数据整理
* 商品 / Todo 操作
* 其他 Phase 3 Companion 能力

### Global Entry 无 Trip 写路径

在 Global Entry 下：

```text
Context = None
目标 Trip 未确定
```

当用户发起需要写入数据的任务时：

* 允许先形成 Draft，`Trip = 未指定`
* Confirm 前必须补齐 Trip
* 不得静默选择 Trip
* Trip 选择必须由用户明确完成

例如：

```text
用户（Global Entry）：
  帮我记录刚买的 Anessa

系统：
  生成 Draft
  Trip = 未指定

Draft 显示：
  Product: Anessa
  reference_price: ...
  Trip: 未指定

用户：
  选择本次旅行

Draft 补齐：
  Trip = 当前日本之旅

→ 进入 Confirm 流程
```

---

## 5.2 Trip Entry

Trip Entry 承载于：

* Trip Detail

默认：

```text
Context = Current Trip
```

例如：

用户当前正在：

> 日本之旅

用户说：

> 帮我记录昨天买的 Anessa。

默认目标 Trip：

> 当前日本之旅

---

# 6. Context Principle

## 6.1 Current Trip Is Default Context

当前 Trip：

> 是自然语言任务的默认上下文。

但：

> **不是历史搜索权限边界。**

例如当前位于：

> 泰国旅行

仍可以询问：

> 我之前在日本买过 Anessa 吗？

Companion 必须允许查询用户自己的历史日本旅行。

---

## 6.2 Write Context

对于需要写入数据的任务：

> 当前 Trip 可以作为默认写入目标。

如果用户明确要求写入其他 Trip：

> 必须确定对应目标 Trip。

尤其 Shopping Todo：

> 不允许因为目的地相同而静默选择某个 Trip。

---

# 7. Phase 3 Core Capabilities

| ID    | Feature            | Core Question |
| ----- | ------------------ | ------------- |
| F3-01 | 智能购物记录录入           | “帮我把买的东西记录下来” |
| F3-02 | 历史购物信息查询           | “我以前买过什么？”    |
| F3-03 | 个人购物数据整理           | “帮我整理我的购物记录”  |
| F3-04 | Shopping Todo 智能规划 | “我准备买这个”      |
| F3-05 | 跨功能任务编排            | “帮我把这几件事一起完成” |

---

# 8. F3-01 — 智能购物记录录入

## 8.1 Feature Goal

用户已经购买商品，但不希望逐字段填写表单。

支持：

* Text
* Voice
* Receipt Photo

核心产品流程：

```text
Natural Input
↓
Shopping Record Draft
↓
User Review / Modify
↓
User Confirm
↓
Formal Shopping Record
```

---

## 8.2 Input

### Text

例如：

> 我昨天在东京银座买了一支 Anessa，3300 日元。

### Voice

语音输入与 Text 进入相同的 Shopping Record 业务流程。

### Receipt Photo

支持用户拍摄或上传收据，并根据收据内容形成一个或多个 Shopping Record Draft。

一张收据：

> 可以对应多个 Shopping Records。

---

# 9. F3-01 Data Rules

## 9.1 Required Final Fields

正式 Shopping Record 必须具备：

* Trip
* Product Name
* Actual Paid Price
* Currency
* Purchase Date

---

## 9.2 Purchase Date Priority

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

### 说明

* Receipt Date 是"默认推断"而非"最终覆盖"。
* 用户修改后的值永远是最终值。
* 用户未修改时，按初始化优先级取值。

---

## 9.3 Purchase Location

Purchase Location 是重要购物信息，但不是 Record Save 的阻塞条件。

如果未知：

```text
Purchase Location = 未填写
```

不得猜测。

---

## 9.4 Category

AI 可以建议 Category。

用户可以修改。

Category 识别失败：

> 不阻止保存。

---

## 9.5 Product Image

Product Image：

> 商品主图。

可选，单条 Shopping Record 最多 1 张。

---

## 9.6 Receipt Image

Receipt Image：

> 用户用于录入购物记录的收据图片。

Receipt Image 与 Product Image 是不同数据概念。

### Receipt Model

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

约束：

* 一个 Item 最多关联一张 Receipt
* 一个 Item 可以没有 Receipt（手动录入）
* 一张 Receipt 可以关联多个 Items

### Data Safety Invariant

删除 Receipt：

* 允许删除 receipt_items relationship
* 允许 CASCADE 或 RESTRICT
* **不得删除 Shopping Record**

Receipt 是辅助信息；Shopping Record 是核心业务数据。

---

## 9.7 Note

Note 为可选字段。

AI 不得虚构备注内容。

---

# 10. F3-01 Price Rules

Shopping Record 中保存的价格是：

> **Actual Paid Price**

不是：

* 原价
* 标价
* 未优惠前价格
* 建议零售价

如果收据明确给出最终支付金额：

> 使用最终实际支付金额。

如果税费、折扣、退税等信息可以明确计算：

> 可以计算 Actual Paid Price。

如果整单优惠 / 退税需要分摊：

> 可以合理计算时进行分摊，但必须让用户确认。

如果无法可靠确定：

> 询问用户。

---

# 11. F3-01 Quantity

一个商品：

> 一个 Shopping Record。

同一个商品购买多个：

> 一个 Shopping Record + Quantity。

例如：

```text
Anessa
Quantity = 3
```

而不是：

> Anessa Record × 3。

## 11.1 Quantity 默认值

Draft 中 Quantity 默认显示为 1。

用户可在 Confirm 前修改。

正式写入时 Quantity 必须 >= 1。

如果用户没有提供 Quantity：

> 不强制询问。
>
> Draft 使用默认值 1，用户可修改。

F3-03 聚合必须区分 Record Count 与 Quantity。

---

# 12. F3-01 Confirmation & Edit

所有智能录入均必须：

```text
Input
↓
Draft
↓
Review / Modify
↓
Confirm
↓
Write
```

禁止：

```text
Input
↓
AI
↓
Direct Write
```

自然语言修改只作用于：

> 当前 Draft。

用户取消：

> 当前 Draft 丢弃，不产生正式 Shopping Record。

## 12.1 Explicit Confirm Semantics

正式写入必须发生于明确的 Confirm Action。

### 不视为 Confirm

* 被动浏览 Draft
* 滚动
* 关闭 Companion
* “看起来不错”
* 普通对话中的肯定表达
* “好的” / “嗯” / “继续”

### 视为 Confirm

* 点击明确的 Confirm 按钮
* 明确说“帮我保存” / “确认写入”

如果支持自然语言 Confirm：

> 必须识别为明确的 confirmation intent。
>
> 不得将模糊肯定视为 Confirm。

---

# 13. F3-02 — 历史购物信息查询

## 13.1 Feature Goal

F3-02 用于回答：

> **我以前买过什么？**

F3-02 是：

> Read-only Historical Search Workflow

---

## 13.2 Data Scope

只查询：

* 用户自己的 Shopping Records
* 用户自己的 Trips
* 用户自己的 FMN 历史数据

不使用外部商品数据替代用户历史记录。

---

# 14. F3-02 Query Conditions

支持：

* Product
* Category
* Trip
* Destination
* Purchase Date
* Time Range
* Purchase Location
* Price
* Currency

**Brand 当前不支持**（L-01 明确 BLOCKED）。

支持多条件组合。

### Destination 查询

```text
匹配规则：
  LOWER(trips.destination) LIKE LOWER(%input%)

约束：
  - 大小写不敏感
  - 包含匹配
  - 不跨语言（"日本" ≠ "Japan"）
  - 不做模糊匹配
  - destination 为 NULL 的历史 Trip 不匹配
```

---

## 14.1 Natural Language Time

支持：

* 去年
* 今年
* 上个月
* 最近
* 最近一次
* 上次去日本
* 第一次去日本
* 之前
* 前几次旅行

### "最近" 的语义

```text
"最近" ≠ 时间窗口（7 / 30 / 90 天）

"最近" = 用户最近一次已开始旅行（有 item 记录）的 Shopping Records

实现：
  - Context 有效（Trip Entry + Current Trip 已开始且有 item 记录）
      → 直接用 Current Trip 查询
  - Context 无效（Global Entry / Trip Entry + 未出行 / Trip Entry + 无记录）
      → 列出候选 Trip（start_date 倒序，最多 5 个，过滤：已开始且有 item 记录）
      → 用户选择 = 直接执行查询
  - 单一候选 → 直接用，不列候选
  - 无候选 → 告知"没有创建过有 record 的旅行"
```

---

## 14.2 Relative Trip

例如：

> “上次去日本买了什么？”

解释为：

> 最近一次日本 Trip。

而不是：

> 最近一条日本购物记录。

---

# 15. F3-02 Results

## 15.1 Single Result

使用：

> Record Card。

核心信息：

* Product
* Price
* Currency
* Trip
* Purchase Date
* Purchase Location

---

## 15.2 Multiple Results

使用：

> Record List。

---

## 15.3 Large Result Set

使用：

```text
Limited Main Results
+
查看全部
```

---

## 15.4 No Result

必须明确：

> 没有找到符合条件的记录。

不得虚构。

---

## 15.5 Missing Data

例如：

```text
Purchase Location = 未填写
```

必须显示：

> 未填写。

不得推测。

---

# 16. F3-02 Read-Only & Currency

F3-02 不负责：

* Create Record
* Update Record
* Delete Record
* Create Todo
* Update Todo
* Modify Trip

需要继续执行的任务：

> 交给 F3-04 或 F3-05。

指定 Currency 的价格查询可以进行。

但：

> 不进行跨币种数值比较。

不进行自动汇率换算。

---

# 17. F3-03 — 个人购物数据整理

## 17.1 Feature Goal

F3-03 用于处理一批 Shopping Records：

* Filter
* Group
* Sort
* Aggregate
* Format

核心区别：

```text
F3-02 = 找到 / 回答

F3-03 = 整理 / 分析
```

---

# 18. F3-03 Data Scope

支持：

* 全部历史记录
* 单个 Trip
* 多个 Trip
* 时间范围
* Product
* Category
* Purchase Location
* 多条件组合

**Brand 当前不支持**（L-01 明确 BLOCKED）— 不可作为 Data Scope 维度。

---

# 19. F3-03 Filter

支持：

* Product
* Category
* Trip
* Destination
* Purchase Date
* Purchase Location
* Price
* Currency

**Brand 当前不支持**（L-01 明确 BLOCKED）。

Destination 与 F3-02 使用相同的匹配规则。

---

# 20. F3-03 Group

支持：

* Category
* Trip
* Purchase Date

**Brand 按维度分组当前不支持**（L-01 明确 BLOCKED）。

---

# 21. F3-03 Sort

支持：

* Price
* Purchase Date
* Product Name

用户未指定时：

> 默认按照 Purchase Date 从早到晚。

---

# 22. F3-03 Aggregate

支持：

* Record Count
* Quantity
* Total Amount
* Category Count
* Trip Count
* Average Price

**Brand Count 当前不支持**（L-01 明确 BLOCKED）。

---

## 22.1 Record Count vs Quantity

例如：

```text
Anessa
Quantity = 3
```

则：

```text
Record Count = 1
Quantity = 3
```

必须明确区分。

---

# 23. F3-03 Multi-Currency

同一 Currency：

> 可以进行统计。

不同 Currency：

> 分别统计。

例如：

```text
JPY ¥32,800
THB ฿4,500
```

不得自动合计为统一金额。

Average Price：

> 仅在同一 Currency 中计算。

跨 Trip 可以进行结构化整理，但不得进行跨币种金额比较。

---

# 24. F3-03 Output

默认：

```text
Summary
+
Table / Grouped Table
```

大量数据：

```text
主要结果
+
查看全部
```

---

# 25. F3-03 Read-Only

F3-03 不直接修改 Shopping Records。

F3-03 也不直接创建 Shopping Todo。

需要多个功能继续执行的任务：

> 交给 F3-05。

---

# 26. F3-04 — Shopping Todo 智能规划

## 26.1 Feature Goal

F3-04 用于将：

> 明确的未来购物计划

转化为：

> 用户自己的 Shopping Todo。

Shopping Todo 不是：

* 普通 Todo List
* 收藏夹
* Bookmark
* 模糊购物便签
* Public Product 的只读副本

---

# 27. F3-04 Formal Todo Required Information

Phase 3 New Todo 必须明确：

```text
Trip
Product
reference_price
reference_currency
reference_location
```

也就是：

> **具体 Product + 具体 reference_price + reference_currency + 具体 reference_location + Trip**

任何一个缺失：

> 不允许正式创建 Phase 3 New Todo。

---

## 27.1 Legacy Todo 例外

Legacy Todo（Phase 2 已存在）：

> 保持历史数据，不强制补齐上述字段。

Legacy Todo 可以：

* 查看
* 删除
* 转换

转换时补齐三字段。

Legacy / New 判定：

```text
created_at <  Phase 3 Migration Boundary  → Legacy
created_at >= Phase 3 Migration Boundary  → New
```

Boundary 定义：

> 由 Phase 3 migration / deployment 明确写入的固定 UTC timestamp。

判定统一使用 UTC，不得依赖运行时动态计算或客户端本地时间。

UI 展示创建时间时允许使用用户本地时区，但不影响判定。

---

# 28. F3-04 Product Rules

Product 必须是：

> 具体、可识别的商品。

例如：

```text
Anessa Perfect UV Sunscreen Skincare Milk 60ml
```

可以。

而：

```text
防晒
口红
耳机
```

不能直接创建正式 Todo。

如果用户不知道具体商品：

> 必须进一步确认具体 Product。

---

# 29. F3-04 Product Resolution

Product 主要来自：

```text
Explicit Product
Historical Product
FMN Public Product
```

### Explicit Product

用户直接提供具体商品：

> 可形成 Todo Draft。

### Historical Product

可以调用 F3-02 查询历史购物记录。

如果唯一匹配：

> 展示 Product + reference_price + reference_currency + reference_location，然后由用户确认。

如果存在多个匹配：

> 用户必须选择。

如果没有匹配：

> 明确告知。

之后可以询问是否需要搜索 FMN Public Product。

### Vague Product

例如：

> “帮我做一个防晒 Todo。”

不能直接创建。

如果用户没有具体 Product：

> 不得自行选择商品。

可以询问是否需要使用 FMN Public Product 搜索。

如果只提供品牌但对应多个商品：

> 不得静默选择。

---

# 30. F3-04 Price Rules

Todo 只保存：

> **具体 reference_price**

不使用：

> Budget Range

例如：

```text
¥3000
```

可以。

而：

```text
3000以内
大概3000
预算3000
```

不能直接作为正式 Todo reference_price。

---

# 31. F3-04 Currency Rules

reference_price 必须具有 reference_currency。

例如用户说：

> “价格 3000。”

但没有提供 Currency：

> 必须询问。

不得根据目的地、地点或历史记录自行猜测。

---

# 32. F3-04 Purchase Location

正式 Todo 的 reference_location 必须明确。

地点继续使用 Phase 1 的：

> 手动文本形式。

不使用：

* Maps
* GPS
* POI
* Geocoding

不得由 AI 猜测地点。

---

# 33. F3-04 Public Product

当前 Public Product 只来自：

> FMN 用户自己公开的 Shopping Records。

Public Product 在 Todo 创建过程中的角色是：

> 信息来源。

流程：

```text
Public Product
↓
Todo Draft
↓
User Confirm
↓
My Shopping Todo
```

正式创建以后：

> Todo 属于当前用户，是独立的用户数据。

不保存：

* source
* source_item_id
* source user
* source platform
* source URL

---

# 34. F3-04 Public Product Search

支持：

* Product Search
* Price Filtering
* Currency Filtering
* Phase 2 已有 Public Product 排序

首屏最多：

> 5 个候选商品。

多个候选：

> 用户选择。

只有一个候选：

> 仍然需要用户确认。

不得把单一搜索结果自动创建成 Todo。

---

# 35. F3-04 Public Product Price

Public Product 中展示的价格：

> 是 FMN 公开 Shopping Record 中的真实历史购买价格。

它不是：

> 当前市场价格。

不得表达为实时市场报价。

---

# 36. F3-04 Todo Ownership & Edit

Todo 创建以后：

> 属于当前用户。

用户可以自行编辑：

* Product
* reference_price
* reference_currency
* reference_location
* Quantity
* Note
* Target Purchase Date
* Product Image
* Category

**说明：**

`reference_location` 即 Target Purchase Location（计划购买地点）。

它不是独立的第二个字段。

用户修改自己的 Todo：

> 不修改原始 Public Product。

---

# 37. F3-04 Quantity

同一个 Product：

```text
Product + Quantity
```

例如：

> 买 3 个 Anessa。

生成：

```text
Anessa
Quantity = 3
```

不同 Product：

> 创建不同 Todo。

## 37.1 Quantity 默认值

TodoDraft 中 Quantity 默认显示为 1。

用户可在 Confirm 前修改。

正式写入时 Quantity 必须 >= 1。

如果数量没有提供：

> 不强制询问。

例如：

> “买一些”

处理为：

```text
Quantity = 1（默认，可修改）
```

F3-03 聚合区分 Todo Quantity 与 Record Quantity。

---

# 38. F3-04 Optional Information

可选信息：

* Quantity
* Note
* Target Purchase Date
* Product Image
* Category

不支持：

> Priority。

---

## 38.1 Target Purchase Date

只有用户明确提出购买日期时才保存。

如果用户没有提供：

> 不主动追问。

---

## 38.2 reference_location 语义

`reference_location` 表示：

> **计划购买地点（Target Purchase Location）**

它是 Phase 3 New Todo 的 Required Field。

### 与 Record 的对照

```text
Todo.reference_location
  = Target Purchase Location
  = 计划购买地点
  = Phase 3 New Todo 的 Required Field

Item.purchase_location
  = Actual Purchase Location
  = 实际购买地点
  = Shopping Record 的字段
```

Todo → Shopping Record 转换时：

```text
Todo.reference_location（计划购买地点）
        ↓
作为建议值预填
        ↓
用户确认 / 修改
        ↓
Item.purchase_location（实际购买地点）
```

**注意：**

Phase 3 不引入第二个独立的 "Target Purchase Location" 字段。

`reference_location` 本身就是"计划购买地点"的正式字段。

未来若 UI 需要强调"计划 vs 实际"，应通过：

* 字段语义
* Label
* 上下文

表达，而不是新增字段。

---

# 39. F3-04 Duplicate

创建 Todo 前：检查**目标 Trip 内**现有 Shopping Todo。

## 参与比较的 3 个字段（AND 逻辑）

| # | 字段 | 相等判定 |
| :--- | :--- | :--- |
| ① | Product | 精确字符串 |
| ② | reference_price + reference_currency | 数值 + 币种整体 |
| ③ | reference_location | 精确字符串 |

判定：

```text
三个全相同 → 疑似重复
任一不同   → 不算重复
```

## 相等判定

```text
精确相等
不做规范化 / 模糊匹配
```

## 不参与比较

```text
Quantity / Note / Category / Product Image / Target Purchase Date
```

## 跨 Trip

```text
不比较跨 Trip 的 Todo
```

---

# 40. F3-04 Duplicate Interaction

## 发现疑似重复

例如已有：

```text
Anessa
¥3000
松本清
```

用户再次说：

> "帮我加一个 Anessa。"

Agent 应显示"发现相似 Todo"，让用户决定：

* 新建
* 使用已有
* 修改已有

不自动合并。

## 三字段完全相同时

提示"是否合并 Quantity"，用户决定，不自动合并。

## Note 不同

不作为核心合并阻断条件。

---

# 41. F3-04 Existing Shopping Record

如果目标 Trip 已经存在相同或相近的 Shopping Record：

> 不自动禁止创建 Todo。

Agent 可以提醒：

> 当前旅行中已经记录过该商品及其购物信息。

最终是否创建：

> 由用户决定。

---

# 42. F3-04 Draft & Confirmation

正式 Todo 创建前：

```text
Trip
Product
reference_price
reference_currency
reference_location
+
Optional Information
```

形成：

> Todo Draft

然后：

```text
Draft
↓
User Review
↓
User Confirm
↓
Create
```

不得自动写入正式 Todo。

---

# 43. F3-04 Edit

## Manual Edit

```text
Todo
↓
Edit
↓
Save
```

## Agent Edit

```text
User Request
↓
Identify Todo
↓
Update Draft
↓
User Confirm
↓
Update
```

如果目标 Todo 不明确：

> 必须让用户确定目标。

---

# 44. F3-04 Cancel & Status

取消 / 删除采用：

```text
active
↓
cancelled
```

取消操作需要用户确认。

Todo 状态：

```text
active
converted
cancelled
```

其中：

* `active` = 待购买
* `converted` = 已进入 Shopping Record
* `cancelled` = 用户取消

Legacy Todo 由 D2-01 / D2-06 定义，保持历史数据。

---

# 45. F3-04 Todo → Shopping Record

沿用 Phase 2：

```text
Shopping Todo
↓
已购买
↓
Shopping Record
```

F3-04 不重新定义既有 Todo → Shopping Record 转换逻辑。

Todo 中已有且适用于 Record 的信息应尽可能继承到 Shopping Record。

其中：

```text
reference_location（计划购买地点）
        ↓
作为建议值预填
        ↓
用户确认 / 修改
        ↓
purchase_location（实际购买地点）
```

Actual Paid Price、Purchase Date 等 Record-specific 字段仍必须遵守 F3-01 规则。

---

# 46. F3-05 — 跨功能任务编排

## 46.1 Feature Goal

F3-05 处理：

> 一个用户目标需要两个或以上已有 Workflow 才能完成的任务。

例如：

> “把我上次去日本买过、这次还没买的东西整理出来，然后加入这次日本旅行 Todo。”

---

## 46.2 Orchestration Boundary

如果只需要一个 Workflow：

> 不进入 F3-05。

例如：

> “我去年去日本买过什么防晒？”

直接：

```text
F3-02
```

如果需要两个或以上 Workflow：

> 进入 F3-05。

---

# 47. F3-05 Supported Workflows

F3-05 可以调用：

* F3-01
* F3-02
* F3-03
* F3-04

F3-05 不新增独立业务数据模型。

---

# 48. F3-05 Workflow Reuse

F3-05 必须复用已有 Workflow。

例如：

```text
F3-01
↓
Shopping Record
↓
F3-03
↓
Filter / Organize
↓
F3-04
↓
Todo
```

F3-05：

> 不能绕过底层 Workflow 规则。

---

# 49. F3-05 Task Behavior

复杂任务必须支持：

* Task Decomposition
* Workflow Selection
* Dependency
* Intermediate Results
* Pause
* Resume
* Re-plan
* Result Aggregation
* Unified Confirmation

---

## 49.1 Dependency

如果：

```text
A Result
↓
B Input
```

则：

> B 必须等待 A 完成。

---

## 49.2 Task Continuation

如果某一步缺少用户信息：

> 任务暂停。

已经完成的结果：

> 必须保留。

用户补充信息后：

> 从中断位置继续，而不是重新执行整个任务。

---

## 49.3 User Changes Goal

用户中途修改目标时：

> 更新当前任务目标与执行计划。

可以复用已经完成的有效结果。

例如：

```text
原目标：
所有美妆

用户修改：
只要防晒

↓
重新整理当前任务
↓
复用已有有效结果
↓
继续执行
```

---

## 49.4 User Cancels Task

用户取消任务：

```text
Cancel Task
↓
Discard Unconfirmed Draft
↓
Stop Execution
```

不需要再次确认。

已经正式写入的数据：

> 不自动回滚。

---

# 50. F3-05 Partial Completion

允许：

> 保留已经完成的中间结果。

但：

> 不允许把不完整的数据写入正式业务数据。

Draft / Intermediate Result：

> 不等于 Formal Data。

---

# 51. F3-05 Unified Confirmation

一个任务产生多个正式写操作时：

> 支持一次统一确认。

例如：

```text
Todo Draft × 5
↓
Unified Review
↓
User Confirm
↓
Create × 5
```

如果批量任务中任何一个正式对象缺少必填信息：

> **整个最终写入流程暂停。**

补齐后：

> 再统一确认。

不得进行部分正式写入。

## 51.1 Batch Atomic Write

一次用户 Confirm 所产生的同一组正式写入：

> 必须属于同一个 transaction boundary。

技术实现可以使用：

* RPC
* Server Action
* Postgres function
* equivalent server-side transaction mechanism

不得使用应用层串行写入 + 补偿。

---

# 52. F3-05 Cross-Trip Support

F3-05 支持：

> 跨多个 Trip 的任务。

例如：

> “比较过去三次日本旅行买过的商品。”

但仍遵守：

> 不进行跨币种自动转换。

---

# 53. F3-05 FMN-Only Boundary

Phase 3 Companion 只使用：

```text
User's FMN Data
+
FMN Public Data
```

不接入外部商品 / 电商 / 地图数据。

包括：

* Amazon
* Rakuten
* 淘宝
* 京东
* 小红书商品搜索
* 外部价格数据库
* 外部地图
* 外部推荐系统

---

# 54. F3-05 Task Progress

任务执行过程中，可以向用户展示有意义的执行状态，例如：

```text
正在查询……
✓ 已找到

正在整理……
✓ 已完成

正在检查 Todo……
✓ 已整理出 4 个商品

等待你的确认
```

只展示：

> 用户有意义的状态。

不展示内部推理内容。

---

# 55. Phase 3 General Interaction Rules

## 55.1 Draft First

所有涉及正式数据写入的智能任务：

```text
Draft
↓
User Review
↓
User Confirm
↓
Write
```

## 55.2 Data Truth First

AI 不得凭空猜测或编造：

* Product
* Price
* Currency
* Purchase Location
* Trip
* Quantity
* Purchase Date
* Historical Data

无法确定时：

> 询问用户。

## 55.3 User Confirmation

涉及正式业务数据写入：

> 最终确认权属于用户。

AI 不得自动确认。

### Explicit Confirm Semantics

正式写入必须发生于明确的 Confirm Action。

不视为 Confirm：

* 被动浏览 Draft
* 滚动
* 关闭 Companion
* “看起来不错”
* 普通对话中的肯定表达
* “好的” / “嗯” / “继续”

视为 Confirm：

* 点击明确的 Confirm 按钮
* 明确说“帮我保存” / “确认写入”

如果支持自然语言 Confirm：

> 必须识别为明确的 confirmation intent。
>
> 不得将模糊肯定视为 Confirm。

## 55.4 Current Context

当前 Trip：

> 是默认上下文。

但：

> 不限制用户查询其他历史 Trip。

## 55.5 Workflow Reuse

已有 Workflow：

> 优先复用。

不得为相同业务规则创造重复流程。

---

# 56. Phase 3 Data Boundary

```text
                    FMN Data
                       │
        ┌──────────────┼──────────────┐
        ↓              ↓              ↓
       Trip       Shopping Record  Shopping Todo
        │              │              │
        └──────────────┼──────────────┘
                       ↓
                 FMN Companion
```

Public Product：

> 来自公开 Shopping Records。

Companion：

> 不产生独立于 FMN 业务模型之外的新核心数据对象。

---

# 57. Privacy Boundary

F3-01～F3-05 必须遵守 FMN Public / Private 规则。

Private Data：

> 只能由拥有相应权限的用户使用。

Public Product：

> 只能使用公开信息。

跨功能任务：

> 不得绕过权限。

## 57.1 External Provider Privacy

当 F3-01 / F3-05 涉及外部服务（OCR / STT / LLM）时，必须遵守以下边界。

### Legal / Product Requirement

系统设计与供应商选择必须满足适用的隐私与数据保护要求，包括 GDPR / 中国个人信息保护相关要求（如适用）。

### Technical Acceptance Criteria

* TLS 加密传输
* 供应商不得用于训练
* Provider retention ≤ 24h
* 用户 opt-in 才发送
* 用户可查看发送数据范围
* 最小必要上下文
* 供应商不得存储用户原始数据

### 发送内容范围

```text
OCR  →  Receipt Image
STT  →  用户语音
LLM  →  用户当前输入
        + 为完成当前任务所需的最小上下文
        - 不发送完整 Shopping Record / 完整历史
```

### Provider 选择

具体供应商属于 Later Decision，必须在对应 Feature 接入前关闭。

---

# 58. Explicitly Out of Scope for Phase 3

以下不属于当前 Phase 3：

### Travel Lifecycle

* Travel Lifecycle Automation
* 自动 Trip Status 管理
* 生命周期提醒
* App Push Notification
* Browser Notification

### External Search / Commerce

* 外部商品搜索
* 外部价格数据库
* Amazon
* Rakuten
* 淘宝
* 京东
* 小红书商品搜索
* 电商购买
* 支付
* 订单

### Location / Currency

* Maps
* GPS
* POI
* Geocoding
* 实时汇率
* 自动货币转换
* 跨货币金额比较

### Social / Recommendation

* 新增复杂 AI 推荐算法
* 用户画像推荐
* Like
* Favorite
* 评论社区
* 站内私信

### Automatic Execution

* 自动确认写入
* 跳过用户确认
* 不完整 Todo 的正式创建
* 不完整 Shopping Record 的正式写入

---

# 59. Removed Feature

原规划中的：

> **F3-06 — Travel Lifecycle Automation**

已从当前 Phase 3 正式移除。

它：

> 不属于当前 Phase 3 核心功能，也不进入当前开发。

未来如重新设计 App / Mini Program 等产品形态：

> 可以重新定义 Travel Lifecycle 能力。

未来重新定义时：

> 不默认继承当前被移除的 F3-06 需求。

---

# 60. Phase 3 Success Criteria

## Record

> 用户可以通过自然语言、语音或收据快速录入真实购物信息，并在确认后形成正式 Shopping Record。

## Search

> 用户可以通过自然语言查询自己的历史购物记录。

## Organize

> 用户可以让 FMN 对自己的购物数据进行筛选、分组、排序和统计。

## Todo

> 用户可以建立包含完整真实购物信息的 Shopping Todo。

## Orchestration

> 用户可以通过一个自然语言目标，让 FMN 串联多个已有能力完成复杂的旅行购物任务。

---

# 61. Final Product Principle

Phase 3 的核心不是：

> 做一个“很聪明的 AI”。

而是：

> **让 AI 成为 FMN 旅行购物数据与功能之间更自然的操作层。**

最终用户体验：

```text
用户表达需求
        ↓
FMN Companion
        ↓
理解意图
        ↓
调用合适的 Workflow
        ↓
读取 / 处理 FMN 数据
        ↓
必要时继续追问
        ↓
必要时跨多个 Workflow
        ↓
返回结果 / Draft
        ↓
用户确认
        ↓
正式执行
```

最终仍遵循：

> **AI 负责理解与协助，FMN 数据负责事实，Workflow 负责执行，用户负责最终决定。**

---

# 62. Document Status

**Version:** 1

**Status:** Phase 3 Product Definition — Complete

**Current Features:**

* F3-01 智能购物记录录入
* F3-02 历史购物信息查询
* F3-03 个人购物数据整理
* F3-04 Shopping Todo 智能规划
* F3-05 跨功能任务编排

**Removed:**

* F3-06 Travel Lifecycle Automation

This document defines the current Phase 3 product requirements.

Detailed intelligent execution architecture is defined separately in:

`docs/phase3-intelligence-architecture.md`

Phase 3 visual rules are defined in:

`docs/phase3-design-system.md`

Phase 3 component rules are defined in:

`docs/phase3-component-library.md`

Phase 3 decision log is defined in:

`docs/phase3-decisions.md`

---
