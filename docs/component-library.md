可以。下面这版我直接按你刚才确认的方向，把现有 **Phase 1 Component Library v1.0** 迭代成 **Phase 2 Component Library v2.0**。

我会保留原来的整体架构和大部分章节，不为了“升级”而重构整个文档；同时把 Phase 2 已经确定的 **搜索、推荐/不推荐、关注、购物代办、购买转换、公开/私密、用户主页、分享、认证** 纳入组件体系。

你可以直接用下面内容覆盖 `docs/component-library.md`。

````md
# Forget Me Not — Component-Library

> Reusable components for the Forget Me Not Web App.

---

# 1. Component Library Overview

## 1.1 Purpose

Component Library 定义 Forget Me Not 中可复用的 UI Components、Business Components、Page Modules 以及它们之间的组合关系。

Component Library 回答：

> Forget Me Not 使用什么组件构建界面？

产品功能范围由：

`docs/product.md`

决定。

视觉语言由：

`docs/design-system.md`

决定。

Component Library 不负责重新定义产品功能。

---

## 1.2 Current Phase

当前 Component Library 对应：

> Phase 2 — Product Definition

Phase 1 已完成的组件体系继续保留。

Phase 2 在 Phase 1 的基础上增加：

- Public / Private
- Recommendation Feedback
- Search
- User Profile
- Follow
- Shopping Todo
- Purchase Conversion
- Sharing
- Authentication

---

## 1.3 Core Principle

Component Library 遵循：

> Reuse before create.

优先：

```text
已有组件
    ↓
组合
    ↓
形成 Business Component
    ↓
形成 Page Module
    ↓
形成 Page
````

而不是：

```text
Page
    ↓
重新编写 UI
```

---

# 2. Component Architecture

Forget Me Not 使用分层组件架构。

```text
Foundation
    ↓
Basic Composite
    ↓
Business Component
    ↓
Page Module
    ↓
Page
```

---

## 2.1 Foundation

最基础的视觉和交互组件。

例如：

* Button
* Icon
* Text
* Image
* Link
* Avatar
* Badge

Foundation Components 不应该知道具体业务。

---

## 2.2 Basic Composite

由多个 Foundation Components 组成的基础复合组件。

例如：

```text
FormField
├── Label
├── Input
├── HelperText
└── ErrorMessage
```

Phase 2：

```text
SearchInput
├── Icon
├── Input
└── ClearButton
```

---

## 2.3 Business Component

与 Forget Me Not 产品领域直接相关的组件。

例如：

* TripCard
* ItemCard
* RecommendationFeedback
* ShoppingTodoCard
* ProfileHeader
* FollowButton
* TripVisibilityControl
* ItemVisibilityControl

Business Components 可以组合 Foundation / Basic Composite Components。

---

## 2.4 Page Module

用于组成页面的较大模块。

例如：

* TripArchive
* ItemGrid
* ShoppingTodoList
* SearchResultGroup
* StatGroup

Page Modules 负责组织组件，但不重新定义产品规则。

---

## 2.5 Page

页面负责组合已有组件。

页面不应该重复实现已经存在的组件逻辑。

Page 本身不是 Component Library 中的 Business Component。

---

# 3. Component Architecture Tree

```text
Forget Me Not Components

├── 01 Foundation
│   ├── Button
│   ├── IconButton
│   ├── Text
│   ├── Heading
│   ├── Icon
│   ├── Image
│   ├── Divider
│   ├── Link
│   ├── Avatar
│   ├── Badge
│   ├── SearchInput
│   └── ShareButton
│
├── 02 Form
│   ├── Input
│   ├── Textarea
│   ├── Select
│   ├── DatePicker
│   ├── CurrencyInput
│   ├── ImageUploader
│   └── FormField
│
├── 03 Feedback
│   ├── Modal
│   ├── ConfirmDialog
│   ├── Toast
│   ├── Loading
│   ├── Skeleton
│   ├── EmptyState
│   └── ErrorState
│
├── 04 Navigation
│   ├── Header
│   ├── Tabs
│   ├── BackButton
│   └── ViewSwitcher
│
├── 05 Travel
│   ├── TripCard
│   ├── TripCover
│   ├── TravelStamp
│   ├── DayStamp
│   ├── TripStats
│   └── TripArchive
│
├── 06 Item
│   ├── ItemCard
│   ├── ItemGrid
│   ├── ItemImage
│   ├── ItemMeta
│   ├── Price
│   ├── Location
│   ├── CategoryTag
│   └── PurchaseContextImage
│
├── 07 Data
│   ├── Stat
│   ├── StatGroup
│   ├── TotalSpend
│   ├── ItemCount
│   ├── CategoryCount
│   ├── CategoryDonut
│   ├── CategoryBar
│   └── Receipt
│
├── 08 Scrapbook
│   ├── ScrapbookTemplate
│   ├── ScrapbookCard
│   ├── Postcard
│   ├── PhotoLayer
│   ├── StampLayer
│   └── ReceiptPaper
│
├── 09 User
│   ├── ProfileHeader
│   ├── UserMeta
│   ├── FollowButton
│   └── SocialAccount
│
├── 10 Discovery
│   ├── SearchResultCard
│   ├── SearchResultGroup
│   └── RecommendationFeedback
│
├── 11 Shopping Todo
│   ├── ShoppingTodoCard
│   ├── ShoppingTodoList
│   ├── ShoppingTodoButton
│   └── PurchaseConversion
│
├── 12 Visibility
│   ├── VisibilityBadge
│   ├── TripVisibilityControl
│   └── ItemVisibilityControl
│
└── 13 Auth
    └── AuthForm
```

---

# 4. Component Priority

Components are divided into implementation priority.

## P0 — Phase 2 Core

P0 components are required for the Phase 2 core experience.

Phase 1 P0 components remain active.

```text
Button
Input
Select
DatePicker
CurrencyInput
ImageUploader
FormField

TripCard
TripCover
TravelStamp

ItemCard
ItemGrid
ItemMeta
Price
Location
CategoryTag

ConfirmDialog
Toast
EmptyState

Header
BackButton
```

Phase 2 P0 components:

```text
Avatar
Badge
SearchInput
ShareButton

RecommendationFeedback

ProfileHeader
FollowButton

ShoppingTodoCard
ShoppingTodoButton
PurchaseConversion

VisibilityBadge
TripVisibilityControl
ItemVisibilityControl

SearchResultCard
```

---

## P1 — Supporting

P1 组件用于支持当前 Phase 2 页面实现。

```text
IconButton
Text
Heading
Icon
Image
Divider
Link

Textarea

Loading
ErrorState

TripStats

Stat
StatGroup
TotalSpend
ItemCount
CategoryCount

SearchResultGroup
UserMeta
SocialAccount
ShoppingTodoList
AuthForm
```

P1 不代表额外产品功能。

它表示：

> 为实现当前 Phase 2 页面而需要的支持性组件。

---

## P2 — Future / Enhancement

以下组件已经被识别，但当前 Phase 不要求实现：

```text
Tabs
ViewSwitcher

DayStamp
PurchaseContextImage

CategoryDonut
CategoryBar
Receipt

ScrapbookTemplate
ScrapbookCard
Postcard
PhotoLayer
StampLayer
ReceiptPaper
```

P2 components must not be implemented automatically during Phase 2.

---

# 5. Component Specification Standard

Every reusable component should follow the same specification structure.

```md
## Component Name

### Purpose

### Category

### Structure

### Content / Data

### Variants

### States

### Behavior

### Usage

### Rules
```

对于 Phase 2 Business Components，如果涉及产品业务规则，可以在 `Rules` 中引用 Product Definition，但不能重新定义 Product Definition。

---

# 6. Foundation Components

## 6.1 Button

### Purpose

提供主要操作入口。

### Category

Foundation

### Structure

```text
Button
├── Optional Icon
└── Label
```

### Variants

* Primary
* Secondary
* Danger

### States

* Default
* Hover
* Pressed
* Focus
* Disabled
* Loading

### Behavior

Button 应明确表达当前操作。

### Rules

* Primary 用于页面主要操作
* Secondary 用于次要操作
* Danger 用于删除等破坏性操作
* 不使用过度圆润的电商按钮风格
* 不使用不必要的装饰
* Button 文案应清晰明确
* 不因为具体页面而创建新的 Button Component

---

## 6.2 IconButton

### Purpose

提供图标形式的紧凑操作。

### Category

Foundation

### Variants

* Default
* Ghost
* Danger

### States

* Default
* Hover
* Pressed
* Focus
* Disabled

### Rules

IconButton 必须具有明确语义。

如果图标含义不够明确，应提供可访问的文本标签。

---

## 6.3 Text

### Purpose

统一文字基础样式。

### Category

Foundation

### Variants

根据 Typography Hierarchy：

* Body
* Caption
* Data
* Label

### States

默认即可。

---

## 6.4 Heading

### Purpose

统一页面和模块标题。

### Category

Foundation

### Variants

* Display
* Heading
* Subheading

---

## 6.5 Icon

### Purpose

提供统一图标。

### Category

Foundation

### Rules

图标用于辅助识别，不应该成为主要视觉装饰。

---

## 6.6 Image

### Purpose

统一图片展示。

### Category

Foundation

### States

* Loading
* Loaded
* Error
* Empty

---

## 6.7 Divider

### Purpose

分隔信息区域。

### Category

Foundation

### Rules

使用轻量视觉。

不要通过大量 Divider 制造后台系统感。

---

## 6.8 Link

### Purpose

提供可导航文本。

### Category

Foundation

### Variants

* Default
* Muted

### States

* Default
* Hover
* Visited
* Focus
* Disabled

---

## 6.9 Avatar

### Purpose

展示用户头像。

### Category

Foundation

### Variants

* Small
* Default
* Large

### States

* Loaded
* Loading
* Error
* Empty

### Rules

Avatar 不负责用户资料业务逻辑。

它只负责：

> 用户身份的视觉展示。

---

## 6.10 Badge

### Purpose

展示简短的状态或分类信息。

### Category

Foundation

### Variants

* Default
* Subtle
* Accent

### States

* Default
* Active

### Usage

可以用于：

* 旅行状态
* 公开 / 私密状态
* 商品分类
* 其他短状态信息

### Rules

Badge 不负责状态业务逻辑。

---

## 6.11 SearchInput

### Purpose

提供统一的搜索输入入口。

### Category

Foundation / Basic Composite

### Structure

```text
SearchInput
├── Search Icon
├── Input
└── Optional Clear Action
```

### Variants

* Default
* Compact

### States

* Empty
* Focus
* Filled
* Loading
* Disabled

### Rules

SearchInput 负责输入和展示。

搜索对象、搜索逻辑和结果处理由页面及业务层负责。

实现位置：`components/search/SearchInput.tsx`

---

## 6.12 ShareButton

### Purpose

触发公开内容的分享操作。

### Category

Foundation

### Variants

* Default
* Icon

### States

* Default
* Hover
* Pressed
* Loading
* Disabled

### Rules

* 只用于已允许分享的公开内容
* 不负责生成分享数据
* 不负责判断内容是否允许公开
* 不因为具体分享对象创建新的 Button 类型

---

# 7. Form Components

## 7.1 Input

### Purpose

输入单行文本。

### Category

Form

### Structure

```text
FormField
├── Label
├── Input
├── HelperText
└── ErrorMessage
```

### Variants

* Default
* Compact

### States

* Empty
* Focus
* Filled
* Error
* Disabled

### Rules

Label 不能被 Placeholder 完全替代。

---

## 7.2 Textarea

### Purpose

输入多行备注。

### Category

Form

### Variants

* Default

### States

* Empty
* Focus
* Filled
* Error
* Disabled

---

## 7.3 Select

### Purpose

选择预定义选项。

### Category

Form

### Variants

* Default
* Compact

### States

* Closed
* Open
* Selected
* Error
* Disabled

### Rules

用于：

* 商品分类
* 货币
* 其他预定义选项

---

## 7.4 DatePicker

### Purpose

选择旅行或商品日期。

### Category

Form

### Variants

* Default
* Compact

### States

* Empty
* Selected
* Open
* Error
* Disabled

### Usage

用于：

* Trip Start Date
* Trip End Date
* Purchase Date

---

## 7.5 CurrencyInput

### Purpose

输入商品价格并选择对应货币。

### Category

Form

### Structure

```text
CurrencyInput
├── Currency
└── Amount
```

### Variants

* Default
* Compact

### States

* Empty
* Focus
* Filled
* Error
* Disabled

### Rules

Currency 与 Amount 必须绑定。

不要把货币与价格拆成互不相关的数据。

不要在 Component 中执行实时汇率转换。

---

## 7.6 ImageUploader

### Purpose

上传图片。

### Category

Form

### Variants

* ProductImage
* TripCoverImage
* PurchaseContextImage

### States

* Empty
* Uploading
* Preview
* Error
* Disabled

### Rules

Phase 1：

* Trip Main Image ≤ 1
* Product Image ≤ 1

PurchaseContextImage 为未来能力。

Phase 2 不改变上述图片数量规则。

---

## 7.7 FormField

### Purpose

统一表单字段结构。

### Category

Form

### Structure

```text
FormField
├── Label
├── Control
├── HelperText
└── ErrorMessage
```

### Variants

* Default
* Required

### States

* Default
* Focus
* Error
* Disabled

### Rules

表单字段必须保持统一的 Label、Control、Error 关系。

---

# 8. Feedback Components

## 8.1 Modal

### Purpose

展示需要用户关注的临时内容。

### Category

Feedback

### Variants

* Small
* Default
* Large

### States

* Closed
* Opening
* Open
* Closing

---

## 8.2 ConfirmDialog

### Purpose

处理删除或其他需要用户确认的操作。

### Category

Feedback

### Variants

* Default
* Danger

### States

* Closed
* Open
* Confirming

### Usage

主要用于：

* 删除旅行
* 删除商品
* 删除其他用户创建的数据
* 公开 / 私密状态变化需要确认的场景

### Rules

破坏性操作必须明确说明后果。

ConfirmDialog 可以通过内容配置处理不同业务场景。

不要为每一种业务场景创建独立 Dialog Component。

例如不要创建：

```text
DeleteTripDialog
DeleteItemDialog
MakeTripPrivateDialog
```

---

## 8.3 Toast

### Purpose

提供轻量操作反馈。

### Category

Feedback

### Variants

* Success
* Info
* Warning
* Error

### States

* Entering
* Visible
* Leaving

### Example

```text
✓ 商品已记录
```

---

## 8.4 Loading

### Purpose

表示正在加载。

### Category

Feedback

### States

* Loading

---

## 8.5 Skeleton

### Purpose

提供内容加载占位。

### Category

Feedback

### Phase

P2 / Future

---

## 8.6 EmptyState

### Purpose

展示没有数据时的状态。

### Category

Feedback

### Variants

* NoTrips
* NoItems
* NoSearchResults
* NoTodoItems

### Rules

EmptyState 应保持：

> Travel Archive

感觉。

可以使用：

* Empty Stamp
* Paper
* Archive-like illustration

但不要过度装饰。

---

## 8.7 ErrorState

### Purpose

展示无法正常加载或操作时的错误状态。

### Category

Feedback

### Rules

错误信息应该：

* 明确
* 简短
* 可理解
* 在可能时提供下一步操作

---

# 9. Navigation Components

## 9.1 Header

### Purpose

提供全局页面导航和页面上下文。

### Category

Navigation

### Variants

* Default
* Detail
* Public

### States

* Default
* Scrolled

### Structure（登录后）

```text
Header
├── Brand → /
├── Primary Nav
│   ├── 我的旅行 → /          (Active on /)
│   └── 搜索 → /search        (Active on /search)
└── User Area
    ├── email
    └── 退出
```

### Active State

当前一级栏目使用 `--color-stamp` 强调，非社交高亮条。

未登录（如 Login / Register）可不显示 Primary Nav。

---

## 9.2 BackButton

### Purpose

返回上一级页面。

### Category

Navigation

### Variants

* Icon
* Text
* Icon + Text

### States

* Default
* Hover
* Pressed
* Focus
* Disabled

---

## 9.3 Tabs

### Purpose

在同一页面中切换内容区域。

### Category

Navigation

### Phase

P2 / Future

Phase 2 不自动要求使用 Tabs。

只有产品页面明确需要同页内容切换时才实现。

---

## 9.4 ViewSwitcher

### Purpose

在不同内容视图之间切换。

例如：

```text
Grid
List
```

### Category

Navigation

### Phase

P2 / Future

Phase 1 默认使用 Grid。

Phase 2 当前也不要求自动加入 List View。

---

# 10. Travel Components

## 10.1 TripCard

### Purpose

展示一次旅行的概要信息。

### Category

Travel

### Structure

```text
TripCard
├── Image
├── TravelStamp
├── TripName
├── TripDate
├── TripStatusBadge
└── TripStats
```

### Content / Data

* Trip Name
* Trip Start Date
* Trip End Date
* Travel Main Image
* Travel Status
* Visibility
* Basic Statistics

### Variants

* Default
* Compact
* Public

### States

* Default
* Hover
* Pressed
* Loading

### Rules

TripCard 是旅行档案卡，不是旅游产品卡。

Public Variant 只改变公开旅行场景下的信息展示方式，不创建新的旅行业务模型。

---

## 10.2 TripCover

### Purpose

作为 Trip Detail 的旅行扉页。

### Category

Travel

### Structure

```text
TripCover
├── TravelImage
├── TravelStamp
├── TripName
├── TripDate
├── TripStatusBadge
└── TripStats
```

### Content / Data

* Travel Main Image
* Trip Name
* Trip Date
* Travel Status
* Visibility
* Total Spend
* Item Count
* Category Count

### Variants

* Default
* Public

### States

* Default
* Loading

### Rules

TripCover 不应该直接堆叠大量商品信息。

---

## 10.3 TravelStamp

### Purpose

标记旅行、日期或地点。

### Category

Travel

### Structure

```text
TravelStamp
├── Destination
├── Date
└── Optional Label
```

### Variants

* Trip
* Day
* Location

### States

* Default
* Hover
* Active

### Rules

不是所有 Stamp 都必须可点击。

Stamp 是视觉识别元素，也可以只承担信息标记功能。

---

## 10.4 DayStamp

### Purpose

未来用于标记旅行中的时间段。

### Example

```text
DAY 03
BANGKOK
JUL 14
```

### Category

Travel

### Phase

P2 / Future

---

## 10.5 TripStats

### Purpose

展示旅行的基础统计。

### Category

Travel

### Structure

```text
TripStats
├── TotalSpend
├── ItemCount
└── CategoryCount
```

### Variants

* Default
* Compact

### States

* Default
* Loading

---

## 10.6 TripArchive

### Purpose

组织 My Trips 页面中的旅行卡片。

### Category

Travel / Page Module

### Structure

```text
TripArchive
├── SectionHeader
├── TripCard...
└── EmptyState
```

### Rules

TripArchive 负责组织，不负责重新定义 TripCard。

---

# 11. Item Components

## 11.1 ItemCard

### Purpose

展示一个商品记录。

### Category

Item

### Structure

```text
ItemCard
├── ItemImage
├── ItemMeta
│   ├── ItemName
│   ├── Price
│   ├── Location
│   └── Date
├── CategoryTag
└── Optional RecommendationFeedback
```

### Content / Data

* Item Name
* Price
* Currency
* Location
* Purchase Date
* Category
* Product Image
* Recommendation Counts

### Variants

* Default
* Public
* Compact

### States

* Default
* Hover
* Pressed
* Loading

### Rules

Phase 1 只实现：

> Default

Phase 2 Public Variant 用于公开商品信息。

每个 Card 代表一个商品记录。

不要使用：

* 购买按钮
* 折扣
* 销量
* 电商 CTA

Recommendation Feedback 是 Phase 2 的产品反馈，不应演变为电商评分。

---

## 11.2 ItemGrid

### Purpose

组织商品卡片。

### Category

Item / Page Module

### Structure

```text
ItemGrid
├── ItemCard...
└── EmptyState
```

### Variants

* Default
* Compact

### States

* Loading
* Empty
* Loaded

### Rules

Phase 1 默认使用 Grid。

Phase 2 继续优先使用 Grid。

---

## 11.3 ItemImage

### Purpose

展示商品图片或购买情境图片。

### Category

Item

### Variants

* Product
* Context

### States

* Loading
* Loaded
* Error
* Empty

### Rules

Phase 1 和 Phase 2 主要使用 Product。

Context 属于未来能力。

---

## 11.4 ItemMeta

### Purpose

展示商品的核心信息。

### Category

Item

### Structure

```text
ItemMeta
├── ItemName
├── Price
├── Location
└── Date
```

### Variants

* Default
* Compact

### States

* Default
* Loading

---

## 11.5 Price

### Purpose

统一展示价格。

### Category

Item / Data

### Variants

* Default
* Large
* Compact

### States

* Default
* Loading

### Rules

必须同时展示正确的 Currency 与 Amount。

---

## 11.6 Location

### Purpose

展示购买地点。

### Category

Item

### Variants

* Default
* Compact
* Stamp

### States

* Default

### Rules

Phase 1 / Phase 2：

* 用户输入文本
* 不使用地图
* 不使用 GPS
* 不使用 POI

---

## 11.7 CategoryTag

### Purpose

展示商品分类。

### Category

Item

### Values

数据库与组件 props 使用小写英文 slug；UI 显示中文标签。

```text
beauty      → 美妆
food        → 食品
fashion     → 服饰
jewelry     → 饰品
daily       → 日用品
electronics → 电子产品
other       → 其他
```

与 `product.md` §6.5 Category Storage Mapping 一致。

### States

* Default
* Hover
* Active

只有在 Tag 本身可交互时才使用 Hover / Active。

---

## 11.8 PurchaseContextImage

### Purpose

展示与购买行为直接相关的环境图片。

### Category

Item

### Phase

P2 / Future

---

# 12. Data Components

## 12.1 Stat

### Purpose

展示一个数据指标。

### Category

Data

### Variants

* Default
* Large
* Compact

### States

* Default
* Loading

---

## 12.2 StatGroup

### Purpose

组织多个统计指标。

### Category

Data

### Structure

```text
StatGroup
├── Stat...
```

### Variants

* Default
* Compact

### States

* Default
* Loading

---

## 12.3 TotalSpend

### Purpose

展示旅行总花费。

### Category

Data

### Variants

* Default
* Large

### States

* Default
* Loading

### Rules

多货币时分别展示。

不进行实时汇率转换。

---

## 12.4 ItemCount

### Purpose

展示商品数量。

### Category

Data

### Variants

* Default
* Compact

### States

* Default
* Loading

---

## 12.5 CategoryCount

### Purpose

展示商品分类数量。

### Category

Data

### Variants

* Default
* Compact

### States

* Default
* Loading

---

## 12.6 CategoryDonut

### Purpose

展示商品分类构成。

### Category

Data

### Phase

P2 / Future

---

## 12.7 CategoryBar

### Purpose

比较不同分类的商品数量。

### Category

Data

### Phase

P2 / Future

---

## 12.8 Receipt

### Purpose

未来以小票形式展示统计或旅行记录。

### Category

Data / Memory

### Phase

P2 / Future

---

# 13. Scrapbook Components

Scrapbook Components 属于未来的旅行回忆制作能力。

它们不是当前 Phase 必须实现的组件。

---

## 13.1 ScrapbookTemplate

### Purpose

提供旅行回忆制作模板。

### Variants

* TravelScrapbook
* TravelPostcard
* Collection
* TravelArchive

### Phase

Future

---

## 13.2 ScrapbookCard

### Purpose

在未来的 Scrapbook 模式中重新呈现商品记录。

### Variants

* Default
* Postcard
* Collection

### States

* Default
* Selected
* Editing

### Phase

Future

---

## 13.3 Postcard

### Purpose

未来用于制作旅行明信片视觉。

### Phase

Future

---

## 13.4 PhotoLayer

### Purpose

未来用于图片层叠。

### Variants

* Product
* Travel
* Context

### States

* Default
* Selected
* Dragging

### Phase

Future

---

## 13.5 StampLayer

### Purpose

未来用于在 Scrapbook 中放置 Stamp。

### Phase

Future

---

## 13.6 ReceiptPaper

### Purpose

未来用于以纸张 / 小票形式承载数据。

### Phase

Future

---

# 14. User Components

## 14.1 ProfileHeader

### Purpose

展示用户公开资料的主要信息。

### Category

User / Business Component

### Structure

```text
ProfileHeader
├── Avatar
├── UserName
├── UserMeta
├── FollowButton
└── Optional SocialAccount
```

### Content / Data

* Avatar
* User Name
* Bio
* Following Count
* Followers Count
* External Social Account

### Variants

* Default
* Public

### States

* Default
* Loading

### Rules

ProfileHeader 负责资料展示。

它不负责：

* 用户认证
* 用户数据获取
* Follow 业务逻辑

---

## 14.2 UserMeta

### Purpose

展示用户基础信息和统计。

### Category

User

### Content / Data

* User Name
* Bio
* Following Count
* Followers Count

### Variants

* Default
* Compact

### States

* Default
* Loading

---

## 14.3 FollowButton

### Purpose

建立或取消长期购物参考关系。

### Category

User / Business Component

### Variants

* Default
* Following

### States

* Default
* Hover
* Pressed
* Focus
* Loading
* Disabled

### Rules

Follow 表示：

> 长期购物参考关系。

它不是：

* 点赞
* 收藏
* 私信

不创建：

```text
FavoriteButton
LikeButton
```

---

## 14.4 SocialAccount

### Purpose

展示用户主动提供的外部社交账号。

### Category

User

### Variants

* Default
* Compact

### States

* Default

### Rules

只有用户主动提供的外部账号才展示。

不自动抓取或同步第三方社交平台内容。

---

# 15. Discovery Components

## 15.1 SearchResultCard

### Purpose

展示搜索结果中的一个对象。

### Category

Discovery / Business Component

### Variants

* Product
* Travel
* User

### States

* Default
* Hover
* Pressed
* Loading

### Product Content

```text
Product
├── Product Image
├── Product Name
├── Price
├── Location
├── Purchase Date
├── Recommendation Count
└── Not Recommendation Count
```

### Travel Content

```text
Travel
├── Trip Cover
├── Trip Name
├── Destination
├── Trip Date
└── Basic Information
```

### User Content

```text
User
├── Avatar
├── User Name
└── Basic Profile Information
```

### Rules

SearchResultCard 只负责展示。

搜索逻辑由页面和业务层处理。

不同搜索对象优先通过 Variant 表达，而不是创建多个重复 Card。

实现位置：`components/search/SearchResultCard.tsx`

---

## 15.2 SearchResultGroup

### Purpose

组织搜索结果。

### Category

Discovery / Page Module

### Structure

```text
SearchResultGroup
├── SectionHeader
├── SearchResultCard...
└── EmptyState
```

### Variants

* Product
* Travel
* User

### States

* Loading
* Empty
* Loaded

### Rules

SearchResultGroup 负责组织结果，不负责搜索业务逻辑。

---

## 15.3 RecommendationFeedback

### Purpose

对具体公开购物信息提供：

* 推荐
* 不推荐

以及对应数量反馈。

### Category

Discovery / Business Component

### Structure

```text
RecommendationFeedback
├── Recommend
│   └── Count
└── NotRecommend
    └── Count
```

### Variants

* Default
* Compact

### States

* Default
* Recommended
* NotRecommended
* Loading
* Disabled

### Rules

RecommendationFeedback 表示：

> 对具体购物信息的参考价值反馈。

它不是：

* Like
* Favorite
* Rating
* 综合评分

不创建：

```text
LikeButton
FavoriteButton
Rating
TrustScore
```

推荐数量与不推荐数量必须分别展示。

不得在 Component 中计算综合可信分。

商品价格、购买时间与推荐反馈保持独立。

---

# 16. Shopping Todo Components

## 16.1 ShoppingTodoCard

### Purpose

展示用户计划购买的商品。

### Category

Shopping Todo / Business Component

### Structure

```text
ShoppingTodoCard
├── ItemImage
├── ItemName
├── CategoryTag
├── ReferencePrice
├── ReferenceLocation
└── SourceInfo
```

### Content / Data

* Product Name
* Product Image
* Category
* Reference Price
* Reference Location
* Source
* Note

### Variants

* Default
* Compact

### States

* Default
* Hover
* Pressed
* Loading

### Rules

Shopping Todo 表示：

> 我计划购买这个商品。

它不同于 Purchase Record：

> 我已经购买这个商品。

---

## 16.2 ShoppingTodoList

### Purpose

组织购物代办。

### Category

Shopping Todo / Page Module

### Structure

```text
ShoppingTodoList
├── ShoppingTodoCard...
└── EmptyState
```

### States

* Loading
* Empty
* Loaded

### Rules

ShoppingTodoList 不负责 Todo 数据业务逻辑。

---

## 16.3 ShoppingTodoButton

### Purpose

将公开商品加入个人购物代办。

### Category

Shopping Todo / Business Component

### Variants

* Default
* Added
* Compact

### States

* Default
* Hover
* Pressed
* Loading
* Disabled

### Rules

点击后可以：

* 选择已有旅行
* 创建旅行
* 将商品加入对应旅行的购物代办

Button 不负责创建旅行或保存 Todo 数据。

---

## 16.4 PurchaseConversion

### Purpose

将购物代办转换为正式购买记录。

### Category

Shopping Todo / Business Component

### Structure

```text
PurchaseConversion
├── Existing Todo Information
├── CurrencyInput
├── DatePicker
├── Location Input
├── ImageUploader
├── Textarea
└── Confirm Action
```

### Content / Data

转换时优先保留：

* Product Name
* Product Image
* Category
* Reference Price
* Reference Location
* Source

用户主要补充：

* Actual Price
* Actual Location
* Purchase Date
* Actual Product Image
* Note

### Rules

核心关系：

```text
Shopping Todo
    ↓
Purchased
    ↓
Purchase Record
```

转换不是：

```text
Delete Todo
+
Create unrelated Item
```

而是：

> 完成同一个购物目标。

---

# 17. Visibility Components

## 17.1 VisibilityBadge

### Purpose

展示内容当前公开 / 私密状态。

### Category

Visibility / Business Component

### Variants

* Public
* Private

### States

* Default

### Rules

VisibilityBadge 只展示状态。

它不负责决定内容是否允许公开。

---

## 17.2 TripVisibilityControl

### Purpose

控制旅行的公开 / 私密状态。

### Category

Visibility / Business Component

### Variants

* Default
* Compact

### States

* Public
* Private
* Updating
* Disabled

### Rules

旅行公开状态遵循 Product Definition。

当旅行设置为私密时，如果其中存在公开商品，应通过确认流程处理公开商品。

组件本身不负责实现业务数据修改。

---

## 17.3 ItemVisibilityControl

### Purpose

控制商品的公开 / 私密状态。

### Category

Visibility / Business Component

### Variants

* Default
* Compact

### States

* Public
* Private
* Updating
* Disabled

### Rules

公开状态必须遵守：

```text
公开旅行
├── 公开商品
└── 私密商品

私密旅行
└── 私密商品
```

私密旅行中不能存在公开商品。

该约束属于 Product / Business Logic。

Component 只负责展示和触发操作。

---

# 18. Auth Components

## 18.1 AuthForm

### Purpose

提供登录 / 注册表单。

### Category

Auth / Business Component

### Structure

```text
AuthForm
├── FormField
├── FormField
└── Button
```

### Variants

* Login
* Register

### States

* Empty
* Focus
* Error
* Loading
* Success

### Rules

AuthForm 负责表单展示和用户输入。

认证逻辑由 Auth / Data Layer 负责。

成功登录或注册后进入：

> My Trips

---

# 19. Component Composition

组件应该通过组合形成更大的结构。

---

## 19.1 FormField

```text
FormField
├── Label
├── Input
├── HelperText
└── ErrorMessage
```

---

## 19.2 SearchInput

```text
SearchInput
├── Icon
├── Input
└── Clear Action
```

---

## 19.3 ItemMeta

```text
ItemMeta
├── ItemName
├── Price
├── Location
└── Date
```

---

## 19.4 StatGroup

```text
StatGroup
├── TotalSpend
├── ItemCount
└── CategoryCount
```

---

## 19.5 TripCard

```text
TripCard
├── Image
├── TravelStamp
├── TripName
├── TripDate
├── TripStatusBadge
└── TripStats
```

---

## 19.6 TripCover

```text
TripCover
├── TravelImage
├── TravelStamp
├── TripStatusBadge
└── TripStats
```

---

## 19.7 ItemCard

```text
ItemCard
├── ItemImage
├── ItemMeta
│   ├── ItemName
│   ├── Price
│   ├── Location
│   └── Date
├── CategoryTag
└── Optional RecommendationFeedback
```

---

## 19.8 TripArchive

```text
TripArchive
├── SectionHeader
├── TripCard...
└── EmptyState
```

---

## 19.9 ItemGrid

```text
ItemGrid
├── ItemCard...
└── EmptyState
```

---

## 19.10 ProfileHeader

```text
ProfileHeader
├── Avatar
├── UserName
├── UserMeta
├── FollowButton
└── Optional SocialAccount
```

---

## 19.11 SearchResultGroup

```text
SearchResultGroup
├── SectionHeader
├── SearchResultCard...
└── EmptyState
```

---

## 19.12 ShoppingTodoCard

```text
ShoppingTodoCard
├── ItemImage
├── ItemName
├── CategoryTag
├── ReferencePrice
├── ReferenceLocation
└── SourceInfo
```

---

## 19.13 RecommendationFeedback

```text
RecommendationFeedback
├── Recommend
│   └── Count
└── NotRecommend
    └── Count
```

---

# 20. Page Composition

## 20.1 My Trips

```text
Header
    ↓
PageHeading
    ↓
TripArchive
    ├── TripCard
    ├── TripCard
    └── EmptyState
```

---

## 20.2 Create Trip

```text
Header
    ↓
PageHeading
    ↓
FormField
    └── Input

FormField
    └── DatePicker

FormField
    └── ImageUploader

ButtonGroup
```

---

## 20.3 Trip Detail

```text
Header
    ↓
TripCover
    ├── TravelImage
    ├── TravelStamp
    ├── TripStatusBadge
    └── TripStats
    ↓
TripVisibilityControl
    ↓
ItemGrid
    ├── ItemCard
    │   ├── ItemImage
    │   ├── ItemMeta
    │   └── CategoryTag
    └── EmptyState
```

---

## 20.4 Item Detail

```text
Header
    ↓
ItemImage
    ↓
ItemMeta
    ├── ItemName
    ├── Price
    ├── Location
    └── Date
    ↓
CategoryTag
    ↓
RecommendationFeedback
    ↓
ItemVisibilityControl
    ↓
Note
    ↓
Edit / Delete Actions
```

---

## 20.5 Add / Edit Item

```text
Header
    ↓
FormField
    └── Input

FormField
    └── CurrencyInput

FormField
    └── Input

FormField
    └── DatePicker

FormField
    └── Select

FormField
    └── ImageUploader

FormField
    └── Textarea

Cancel / Save
```

---

## 20.6 Shopping Todo

```text
Header
    ↓
PageHeading
    ↓
ShoppingTodoList
    ├── ShoppingTodoCard
    ├── ShoppingTodoCard
    └── EmptyState
```

---

## 20.7 Search

```text
Header
    ↓
SearchInput
    ↓
Recommended Public Content
    ↓
SearchResultGroup
    ├── SearchResultCard
    ├── SearchResultCard
    └── EmptyState
```

---

## 20.8 Public Travel Detail

```text
Header
    ↓
TripCover
    ↓
ProfileHeader / Author Information
    ↓
ItemGrid
    ├── Public ItemCard
    └── Public ItemCard
```

---

## 20.9 Public User Profile

```text
Header
    ↓
ProfileHeader
    ├── Avatar
    ├── UserMeta
    └── FollowButton
    ↓
Public Travel / Shopping Content
```

---

## 20.10 Login / Register

```text
Landing
    ↓
Auth Modal
    ↓
AuthForm
    ├── FormField
    ├── FormField
    └── Button
```

---

# 21. Composition Rules

## Rule 1 — Small Components Do Not Know Pages

Foundation Components 不应该知道页面结构。

例如：

Button 不应该知道自己位于：

* Trip Detail
* Item Detail
* Search
* Public User Profile

---

## Rule 2 — Business Components Can Compose Foundation Components

例如：

```text
ItemCard
    ↓
ItemImage
ItemMeta
Price
Location
CategoryTag
RecommendationFeedback
```

---

## Rule 3 — Pages Compose Components

页面应该优先组合已有组件，而不是重复编写相同 UI。

---

## Rule 4 — Avoid Infinite Nesting

不要为了“组件化”而组件化。

如果一个元素：

* 只使用一次
* 没有独立状态
* 没有独立行为
* 不需要复用

不一定需要单独成为 Component。

---

## Rule 5 — Separate Logic and Presentation

数据计算、业务逻辑和视觉组件应该保持分离。

例如：

`TotalSpend`

负责展示统计结果。

它不应该负责：

* 获取数据库
* 处理整个旅行数据
* 进行页面级业务决策

---

## Rule 6 — Public Content Reuses Existing Components

公开旅行、公开商品和公开用户页面不应该创建完全独立的视觉组件体系。

应该优先：

```text
Public Travel
    ↓
Trip Components

Public Item
    ↓
Item Components

Public User
    ↓
User Components
```

公开状态通过：

* Variant
* VisibilityBadge
* Visibility Control

表达。

不要创建：

```text
PublicTripCard
PublicItemCard
PublicUserCard
```

除非未来出现明确且稳定的独立职责。

---

## Rule 7 — Business Rules Do Not Belong in Presentational Components

例如：

> 私密旅行中不能存在公开商品。

这是 Product / Business Logic。

不是：

```text
ItemVisibilityControl
```

自己决定的。

Component 负责：

> 展示状态 + 触发操作。

业务层负责：

> 判断操作是否合法。

---

# 22. Variant vs State

必须区分：

> Variant = 组件是什么类型。

> State = 组件当前处于什么状态。

---

## Variant Example

Button：

```text
Primary
Secondary
Danger
```

这些是 Variant。

---

## State Example

Button：

```text
Default
Hover
Pressed
Focus
Disabled
Loading
```

这些是 State。

---

## Rule

不要为：

> Variant × State

的每一种组合创建独立组件。

例如不要创建：

```text
PrimaryButtonHover
PrimaryButtonDisabled
DangerButtonHover
...
```

应该由同一个 Button Component 管理。

---

# 23. State Coverage

核心组件需要覆盖真实交互状态。

优先级：

```text
Default
Hover
Pressed
Focus
Disabled
Loading
Error
Empty
```

不是所有组件都需要所有状态。

只定义真实存在的状态。

Phase 2 新增业务组件需要重点考虑：

```text
Default
Hover
Pressed
Loading
Disabled
```

涉及选择状态的组件还需要：

```text
Active
Selected
```

---

# 24. Phase 2 Component Scope

当前：

> Phase 2 — Product Definition

必须优先保证以下 Phase 1 核心组件继续可用：

```text
Button
Input
Select
DatePicker
CurrencyInput
ImageUploader
FormField

TripCard
TripCover
TravelStamp

ItemCard
ItemGrid
ItemMeta
Price
Location
CategoryTag

ConfirmDialog
Toast
EmptyState

Header
BackButton
```

Phase 2 Core：

```text
Avatar
Badge
SearchInput
ShareButton

RecommendationFeedback

ProfileHeader
FollowButton

ShoppingTodoCard
ShoppingTodoButton
PurchaseConversion

VisibilityBadge
TripVisibilityControl
ItemVisibilityControl

SearchResultCard
```

Supporting Components：

```text
IconButton
Text
Heading
Icon
Image
Divider
Link

Textarea

Loading
ErrorState

TripStats

Stat
StatGroup
TotalSpend
ItemCount
CategoryCount

SearchResultGroup
UserMeta
SocialAccount
ShoppingTodoList
AuthForm
```

---

# 25. Phase 2 Components That Must Not Be Expanded Automatically

即使 Component Library 中已经存在以下组件：

```text
Tabs
ViewSwitcher
DayStamp
PurchaseContextImage
CategoryDonut
CategoryBar
Receipt
ScrapbookTemplate
ScrapbookCard
Postcard
PhotoLayer
StampLayer
ReceiptPaper
```

也不能因为它们存在于本文件中就自动实现。

它们属于：

> Future / Enhancement

只有产品进入对应 Phase 后，才进入实际开发。

---

# 26. Phase 2 Product Boundaries

Component Library 不因为 Phase 2 增加组件而改变产品边界。

当前仍然不自动引入：

```text
Generic Social Feed
Private Messaging
E-commerce Purchase Flow
Payment
Maps
GPS
POI
Live FX
Complex Recommendation Algorithm
AI Recommendation System
```

Component Library 不应该创建：

```text
SocialFeed
Chat
PaymentButton
MapPicker
POISelector
ExchangeRateConverter
AIRecommendationCard
```

除非未来 Product Definition 明确加入对应能力。

---

# 27. Component Naming Rules

组件名称使用：

> PascalCase

例如：

```text
TripCard
ItemCard
TravelStamp
CurrencyInput
ConfirmDialog
ShoppingTodoCard
RecommendationFeedback
ProfileHeader
```

---

## 27.1 Names Should Describe Purpose

推荐：

```text
ItemCard
TripCard
ItemMeta
ShoppingTodoCard
```

避免：

```text
Box
Thing
Block
Panel1
ComponentA
```

---

## 27.2 Avoid Over-Specific Names

组件名称应该表达稳定的职责。

不要因为某个页面的临时视觉设计而命名：

```text
ThailandTripCard
SummerTripCard
PinkProductCard
PublicThailandTripCard
```

应该使用：

```text
TripCard
ItemCard
```

然后通过数据和 Variant 表达差异。

---

## 27.3 Avoid Feature-Specific Duplicate Components

如果两个组件：

* 结构高度相似
* 行为高度相似
* 只有数据或 Variant 不同

优先合并。

例如：

不要创建：

```text
RecommendButton
NotRecommendButton
```

应该：

```text
RecommendationFeedback
```

不要创建：

```text
PublicTripCard
PrivateTripCard
```

优先：

```text
TripCard
```

---

# 28. Component Reusability Rules

组件应该满足：

1. 有明确职责
2. 可以被多个页面使用
3. 不依赖具体页面
4. 不绑定具体业务数据源
5. 有明确的 Props / Data Contract
6. 有明确 Variants
7. 有明确 States

Phase 2 Business Components 还应该：

8. 不重复定义 Product Logic
9. 不创建与现有组件重复的业务组件
10. 优先通过组合和 Variant 扩展

---

# 29. Component File Organization

正式 Coding 阶段建议：

```text
components/
├── ui/
│   ├── Button
│   ├── Input
│   ├── Modal
│   ├── Toast
│   ├── Avatar
│   ├── Badge
│   ├── SearchInput
│   └── ...
│
├── travel/
│   ├── TripCard
│   ├── TripCover
│   ├── TravelStamp
│   └── TripStats
│
├── item/
│   ├── ItemCard
│   ├── ItemGrid
│   ├── ItemMeta
│   ├── Price
│   └── CategoryTag
│
├── user/
│   ├── ProfileHeader
│   ├── UserMeta
│   ├── FollowButton
│   └── SocialAccount
│
├── discovery/
│   ├── SearchResultCard
│   ├── SearchResultGroup
│   └── RecommendationFeedback
│
├── shopping/
│   ├── ShoppingTodoCard
│   ├── ShoppingTodoList
│   ├── ShoppingTodoButton
│   └── PurchaseConversion
│
├── visibility/
│   ├── VisibilityBadge
│   ├── TripVisibilityControl
│   └── ItemVisibilityControl
│
├── auth/
│   └── AuthForm
│
├── data/
│   ├── TotalSpend
│   ├── ItemCount
│   └── CategoryCount
│
└── scrapbook/
    └── ...
```

这个目录结构是 Coding 阶段的组织建议。

当前 Product Definition 阶段不要求立即创建这些文件。

---

# 30. Component Index

## Foundation

* Button
* IconButton
* Text
* Heading
* Icon
* Image
* Divider
* Link
* Avatar
* Badge
* SearchInput
* ShareButton

## Form

* Input
* Textarea
* Select
* DatePicker
* CurrencyInput
* ImageUploader
* FormField

## Feedback

* Modal
* ConfirmDialog
* Toast
* Loading
* Skeleton
* EmptyState
* ErrorState

## Navigation

* Header
* Tabs
* BackButton
* ViewSwitcher

## Travel

* TripCard
* TripCover
* TravelStamp
* DayStamp
* TripStats
* TripArchive

## Item

* ItemCard
* ItemGrid
* ItemImage
* ItemMeta
* Price
* Location
* CategoryTag
* PurchaseContextImage

## Data

* Stat
* StatGroup
* TotalSpend
* ItemCount
* CategoryCount
* CategoryDonut
* CategoryBar
* Receipt

## Scrapbook

* ScrapbookTemplate
* ScrapbookCard
* Postcard
* PhotoLayer
* StampLayer
* ReceiptPaper

## User

* ProfileHeader
* UserMeta
* FollowButton
* SocialAccount

## Discovery

* SearchResultCard
* SearchResultGroup
* RecommendationFeedback

## Shopping Todo

* ShoppingTodoCard
* ShoppingTodoList
* ShoppingTodoButton
* PurchaseConversion

## Visibility

* VisibilityBadge
* TripVisibilityControl
* ItemVisibilityControl

## Auth

* AuthForm

---

# 31. Relationship Between Component Library and Design System

Design System 决定：

> Component 应该长什么样。

Component Library 决定：

> Component 是什么、由什么组成、有什么状态、如何复用。

例如：

Design System：

> Product Card 应该保持稳定、轻量、非电商化。

Component Library：

```text
ItemCard
├── ItemImage
├── ItemMeta
├── CategoryTag
└── RecommendationFeedback
```

Design System：

> User Profile 应保持档案式，而不是社交媒体创作者式。

Component Library：

```text
ProfileHeader
├── Avatar
├── UserMeta
└── FollowButton
```

---

# 32. Relationship Between Component Library and Product Definition

Product Definition 决定：

> 当前 Phase 是否需要这个 Component。

例如：

Product Definition：

> Phase 2 包含搜索。

因此：

```text
SearchInput = Active
SearchResultCard = Active
SearchResultGroup = Supporting
```

Product Definition：

> 用户可以关注其他用户。

因此：

```text
ProfileHeader = Active
FollowButton = Active
```

Product Definition：

> 用户可以将公开商品加入购物代办。

因此：

```text
ShoppingTodoCard = Active
ShoppingTodoButton = Active
```

Product Definition：

> 购物代办可以转换为购买记录。

因此：

```text
PurchaseConversion = Active
```

Product Definition：

> 旅行和商品存在公开 / 私密状态。

因此：

```text
VisibilityBadge = Active
TripVisibilityControl = Active
ItemVisibilityControl = Active
```

Product Definition：

> Scrapbook 属于未来能力。

因此：

```text
ScrapbookTemplate = Future
PhotoLayer = Future
StampLayer = Future
```

---

# 33. Source of Truth

组件体系的当前 Source of Truth：

`docs/component-library.md`

具体功能范围：

`docs/product.md`

具体视觉规则：

`docs/design-system.md`

三者关系：

```text
Product
  ↓
决定做什么
  ↓
Design System
  ↓
决定怎么呈现
  ↓
Component Library
  ↓
决定用什么可复用组件实现
```

---

# 34. Implementation Principle

Component Library 是：

> Architecture / Specification

而不是：

> 当前立即创建的所有代码文件。

Coding 阶段应该根据当前 Phase 的页面需求逐步实现组件。

不要因为 Component Library 中存在一个组件，就提前实现整个组件库。

---

# 35. Future Component Principle

未来组件可以提前记录。

这样做的目的：

* 保持架构方向
* 避免未来重复设计
* 方便扩展
* 保持 Design System 一致性

但：

> Future Component ≠ Current Requirement

Future Component 只有在产品进入对应 Phase 后才变成 Active Component。

---

# 36. Phase 2 Component Implementation Rules

Phase 2 Coding 时遵循：

```text
Product Requirement
        ↓
Page Requirement
        ↓
Check Existing Component
        ↓
Reuse
        ↓
Compose
        ↓
Add Variant
        ↓
Only when necessary
        ↓
Create New Component
```

禁止因为单个页面出现一次 UI，就立即创建新的 Business Component。

---

## 36.1 Reuse Before Create

优先：

```text
Button
+
Badge
+
ConfirmDialog
```

而不是：

```text
NewBusinessButton
NewBusinessBadge
NewBusinessDialog
```

---

## 36.2 Compose Before Duplicate

例如：

```text
ProfileHeader
├── Avatar
├── UserMeta
└── FollowButton
```

而不是把 Avatar、UserMeta、FollowButton 的逻辑全部重新写一遍。

---

## 36.3 Variant Before New Component

如果只是：

```text
Default
Public
Compact
```

这种差异，优先使用 Variant。

只有职责本身发生变化时才创建新 Component。

---

# 37. Phase 2 Business Component Boundaries

Business Component 可以知道：

> 自己是什么业务对象。

但不能知道：

> 整个页面应该怎么运行。

例如：

`ShoppingTodoCard`

可以知道：

> 这是购物代办商品。

但不能负责：

* 创建旅行
* 写入数据库
* 转换购买记录
* 修改页面路由

这些属于页面 / Business Logic / Data Layer。

---

# 38. Document Status

Version: 2.0

Current Product Phase: Phase 2 — Product Definition

Status: In Definition

Last Updated: 2026-09-25

This document defines the current reusable component architecture of Forget Me Not.

Phase 2 extends the completed Phase 1 component architecture with:

* Search
* Recommendation Feedback
* User Profile
* Follow
* Shopping Todo
* Purchase Conversion
* Public / Private Visibility
* Sharing
* Authentication

The component library may evolve as the product is validated.

Future components may be documented in advance, but they must not be implemented automatically unless they belong to the active product phase.

```
