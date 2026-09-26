# Forget Me Not — Design-System

> 记录时像档案，浏览时像旅行册，收藏时像邮票 → 归档时像邮票

---

# 1. Design System Overview

## 1.1 Purpose

本设计系统定义 Forget Me Not 的视觉语言、布局语言、图片语言、组件视觉原则、字体、颜色、数据可视化和交互动效。

Design System 回答：

> Forget Me Not 应该如何被设计和呈现。

它不定义具体产品功能。

产品功能与产品范围以：

`docs/product.md`

为准。

---

## 1.2 Design Philosophy

Forget Me Not 不是一个传统旅行日记，也不是旅行照片相册。

它是一种：

> 以购买行为为核心的数字旅行册。

用户记录的是：

- 买了什么
- 花了多少钱
- 在哪里买到
- 哪一天买的

视觉设计则通过：

- 商品照片
- 旅行主图
- 邮票
- 日期
- 标签
- 纸张
- 小票
- 明信片
- 档案结构

把结构化购买记录转化为具有旅行记忆感的数字体验。

Phase 2 在此基础上增加公开购物信息与旅行购物发现能力，但仍然必须保持：

> 以购物信息为核心，而不是以内容消费为核心。

---

# 2. Design Direction

## 2.1 Overall Direction

Forget Me Not 采用：

> Travel Archive × Travel Scrapbook

两种视觉世界。

### Travel Archive

用于记录、管理、浏览旅行购物数据。

关键词：

- 极简
- 秩序
- 清晰
- 数据
- 结构
- 留白
- 稳定
- 档案感

### Travel Scrapbook

用于未来的旅行回忆与收藏表达。

关键词：

- 旅行
- 照片
- 邮票
- 明信片
- 拼贴
- 手账
- 杂志
- 非对称
- 纪念品
- 年轻
- 松弛
- 文艺

Phase 2 的公开旅行、公开商品、搜索和用户页面默认继续使用：

> Travel Archive

作为主要视觉基础。

不要因为增加 UGC、搜索和关注功能而转向传统内容社区视觉。

---

## 2.2 Design Density

视觉密度根据用户当前任务变化。

### Recording

记录商品时：

- 低视觉密度
- 清晰表单
- 明确层级
- 减少装饰

目标：

> 让用户快速完成记录。

### Browsing

浏览旅行和商品时：

- 中等视觉密度
- 商品图片突出
- 日期、地点、价格清晰
- 适量使用旅行视觉元素

目标：

> 让用户像翻阅旅行册一样浏览自己的购买记录。

### Discovery

Phase 2 浏览公开旅行、公开商品和搜索结果时：

- 中等视觉密度
- 商品信息优先
- 价格、地点、日期明确
- 推荐 / 不推荐反馈清晰但低视觉权重
- 用户信息存在，但不能压过商品信息

目标：

> 帮助用户快速找到可以参考的旅行购物信息。

Discovery 页面不能成为：

> 无限内容浏览页面。

### Memory

未来回忆制作时：

- 高视觉密度
- 拼贴
- 层叠
- 图片倾斜
- 邮票
- 纸张
- 明信片

目标：

> 将已有数据重新组织成具有纪念意义的旅行回忆。

### Archive

数据归档时：

- 可以有较高的信息密度
- 但必须保持结构化
- 避免视觉噪音

---

# 3. Image Language

## 3.1 Core Principle

Forget Me Not 的图片不是为了记录整个旅行过程。

图片主要服务于：

> 商品记录。

Phase 2 的公开旅行和公开商品也必须延续这一原则。

公开内容中的图片应该优先表达：

> 买了什么。

而不是：

> 发布了一组旅行照片。

---

## 3.2 Image Hierarchy

图片分为三类。

### 1. Product Image

核心图片。

用于表达：

> 买了什么。

Phase 1：

- 每个商品最多 1 张商品主图
- 商品图片优先级最高
- 商品图片建议使用 1:1 比例

Phase 2：

- 公开商品继续使用 Product Image 作为核心视觉对象
- 公开商品不因为 UGC 而自动增加多图结构
- 商品图片不应被头像、装饰或社交元素压过

---

### 2. Purchase Context Image

辅助图片。

用于表达：

> 在哪里买到。

可能包括：

- 商场店铺
- 店铺门头
- 柜台
- 货架
- 收银台
- 与购买行为直接相关的环境

Purchase Context Image 不属于 Phase 1 核心功能。

未来加入后，每个商品最多 1 张。

Phase 2 暂不要求实现 Purchase Context Image。

---

### 3. Travel Main Image

旅行代表图片。

用于表达：

> 这是哪次旅行。

Phase 1：

- 每个旅行最多 1 张
- 可选
- 不用于记录旅行全过程
- 不作为照片墙使用

例如：

```text
THAILAND TRIP
JUL 2026
```

对应一张代表这次旅行的图片。

Phase 2：

- 公开旅行继续使用 Travel Main Image
- 不增加多张旅行主图
- 公开旅行不能变成照片墙

---

## 3.3 Image Hard Rules

### Trip

每个旅行：

> Travel Main Image ≤ 1

### Item

每个商品：

> Product Image ≤ 1

Phase 1 不要求多图商品记录。

### Future Context

未来：

> Purchase Context Image ≤ 1

### Phase 2 Public Content

公开旅行与公开商品继续遵循 Phase 1 图片规则。

公开状态不会自动增加图片数量。

---

## 3.4 What Images Should Not Become

普通旅行记录中不应该出现：

- 大量景点照片
- 酒店照片合集
- 餐厅照片合集
- 无关街景照片
- 大量自拍
- 与购买行为无关的旅行照片
- 单纯为了“旅行氛围”而加入的照片

Phase 2 的公开内容中也不应该因为 UGC 而演变成：

- 大量生活照
- 大量个人照片
- 与商品无关的内容图
- 纯氛围内容流
- 以图片消费为主要目的的内容卡片

Forget Me Not 的图片组织方式应该围绕：

> Purchase Behavior

而不是：

> Travel Diary

---

# 4. Layout Language

## 4.1 Overall Layout Principle

布局应该在：

> 结构化档案

与

> 旅行册视觉感

之间保持平衡。

Archive 页面优先秩序。

Scrapbook 页面未来再允许更强的自由度。

Phase 2 的公开内容与搜索页面继续使用 Archive 优先原则。

---

## 4.2 My Trips

My Trips 是旅行档案入口。

旅行应该像收藏旅行邮票一样：

> 从左到右 / 从上到下逐步收藏自己的旅行。

Trip Card 可以使用：

- 旅行图片
- 旅行名称
- 日期
- Travel Stamp
- 基础统计
- 旅行状态

整体保持：

- 留白
- 稳定比例
- 轻量纸张感
- 非电商化

Phase 2 的旅行状态：

- 即将出行
- 进行中
- 已结束

状态应该以轻量方式表达。

---

## 4.3 Trip Detail

Trip Detail 的第一视觉应该是：

> 一次旅行的扉页。

推荐结构：

```text
┌──────────────────────────────┐
│                              │
│          旅行主图             │
│                              │
│       THAILAND TRIP          │
│       JUL 2026               │
│                              │
└──────────────────────────────┘

        ฿ 3,280
        TOTAL SPEND

        12 ITEMS · 5 CATEGORIES
```

Trip Cover 应包含：

- Travel Main Image
- Trip Name
- Trip Date
- Total Spend
- Item Count
- Category Count
- 必要的旅行状态信息

不要在 Trip Cover 中直接堆叠大量商品内容。

商品记录应该进入下方独立的 Item Grid。

Phase 2 的购物代办可以在旅行信息与商品记录区域之间形成清晰区分，但不能破坏 Trip Cover 的主要视觉结构。

---

## 4.4 Product Display

Phase 1 默认：

> Grid

商品以 Product Card 的形式展示。

List View 属于未来增强能力，不是 Phase 1 必须实现的视图。

Phase 2 搜索结果可以根据内容性质采用：

- Product Card
- Travel Card
- User Card
- 简洁结果列表

但所有结果布局都应优先展示：

> 商品 / 旅行购物信息

而不是优先展示社交互动数据。

---

## 4.5 Long Trips

对于长时间旅行：

不要通过增加大量旅行照片解决信息量问题。

应该优先：

- 时间结构
- 商品聚合
- 清晰的信息层级

未来可以考虑 DAY 时间分段。

DAY 结构不属于 Phase 1 核心视觉需求。

Phase 2 暂不提前实现 DAY 时间轴。

---

## 4.6 Search / Discovery

Phase 2 P6 Search 的整体布局：

> Search First + Public Shopping Discovery

推荐结构：

```text
Search

[ 搜索商品、目的地、用户 ]

公开旅行购物
├── 推荐公开旅行
├── 推荐公开商品

搜索结果
├── 商品
├── 目的地 / 旅行
└── 用户
```

搜索页下方的公开内容推荐：

- 应该存在
- 应该具有明确的信息价值
- 不应该设计成无限滚动内容流
- 不应该使用强烈社交媒体视觉

推荐内容的核心视觉仍然应是：

> 商品、价格、地点、日期、旅行购物信息。

---

## 4.7 Public Travel

公开旅行详情应该像：

> A Public Travel Archive

而不是：

> A Social Post

重点：

- Travel Main Image
- Travel Name
- Travel Date
- Author
- Shopping Records
- Product Information
- Travel Recommendation Feedback

页面应该让用户感觉：

> 正在查看一个真实旅行购物档案。

而不是正在浏览一个内容帖子。

---

## 4.8 Public User

公开用户主页应该像：

> Shopper Profile / Travel Archive

而不是：

> Social Media Profile

重点：

- Avatar
- Username / Name
- Bio
- Following Count
- Follower Count
- Public Trips
- Public Shopping Information
- Follow

用户信息用于帮助判断：

> 是否想长期参考这个人的购物选择。

不能将用户主页设计成以内容互动为中心的社交主页。

---

## 4.9 Shopping Todo

购物代办页面应该明确表达：

> 准备购买什么。

视觉上应与 Product Card 同源，但与已购买商品形成轻量区分。

推荐使用：

- Pending State
- Todo Label
- Check Action
- 轻量状态信息

不应该像传统任务管理软件一样：

- 使用强烈任务列表视觉
- 大量勾选框
- 高密度项目管理样式

购物代办仍然属于：

> Travel Shopping

而不是：

> Task Management

---

# 5. Card / Stamp / Tag / Paper Language

Forget Me Not 使用四种核心视觉容器：

```text
Card
Stamp
Tag
Paper
```

---

## 5.1 Card

Card 回答：

> What is it?

用于承载商品或旅行信息。

### Product Card

Product Card 应包含：

- Product Image
- Item Name
- Price
- Location
- Date
- Category

Archive 模式：

- 规则
- 稳定
- 清晰
- 轻量阴影
- 不过度装饰

不使用：

- 购买按钮
- 折扣
- 电商 CTA
- 商品销量
- 电商式价格强调

### Phase 2 Public Product Card

可额外展示：

- 推荐数
- 不推荐数
- Public 状态
- Author

但信息优先级仍然是：

> 商品 → 价格 → 地点 → 日期 → 反馈

不能变成：

> 用户头像 → 社交数据 → 内容标题 → 商品

---

## 5.2 Stamp

Stamp 回答：

> Which trip / which time?

Travel Stamp 是 Forget Me Not 的重要视觉识别元素。

可用于：

- Trip
- Date
- DAY
- Location
- Memory
- Travel Status

视觉可以参考：

- 邮票
- 打孔边缘
- 虚线
- 印章
- 标签

但不要过度做成真实邮票。

---

## 5.3 Travel Stamp

Travel Stamp 用于标识一次旅行。

可以包含：

- Destination
- Date
- Optional Label
- Travel Status

例如：

```text
THAILAND
JUL 2026
```

可以使用轻微：

- 旋转
- 打孔
- 虚线
- 印章边缘

形成旅行收藏感。

Travel Status 不应改变 Stamp 的整体视觉语言。

---

## 5.4 DAY Stamp

未来可用于：

```text
DAY 03
BANGKOK
JUL 14
```

DAY Stamp 可以存在不同形状：

- 横向
- 纵向
- 印章
- 标签

但 DAY 时间结构不属于 Phase 1 核心功能。

Phase 2 暂不提前实现 DAY 时间结构。

---

## 5.5 Tag

Tag 回答：

> What does it belong to?

主要用于：

- 商品分类
- 属性
- 状态
- Public / Private
- Recommendation State
- Shopping Todo State

Tag 应：

- 小
- 轻
- 简洁
- 低视觉权重

不要大量堆叠 Tag。

通常只显示核心分类或最重要状态。

### Phase 2 Status Tag

可以用于：

- 即将出行
- 进行中
- 已结束
- 公开
- 私密
- 购物代办

状态 Tag 不应使用强烈警告式视觉。

---

## 5.6 Location

购买地点是核心商品数据。

Phase 1 使用：

> 用户输入的文本地点。

视觉上可以表现为：

- Location Tag
- Location Label
- Stamp
- Receipt-like Label

但不引入地图视觉。

Phase 2 继续使用文本地点表达。

搜索结果中，地点可以作为核心信息展示，但不需要地图卡片或地图 Marker。

---

## 5.7 Paper / Receipt

Paper / Receipt 用于表达：

> Saved Record / Memory

未来可用于：

- 总花费
- 日期统计
- 分类统计
- 旅行回忆
- 纪念页

它不是全站统一容器。

只在适合的场景使用。

---

# 6. Typography

## 6.1 Overall Typography Direction

字体需要同时满足：

- 年轻
- 文艺
- 清晰
- 杂志感
- 数据可读性

---

## 6.2 Chinese Font

优先：

> Noto Sans SC

或具有类似视觉特征的现代无衬线中文字体。

中文主要负责：

> 清晰的信息阅读。

---

## 6.3 English Font

优先：

> Inter

或类似 Helvetica Neue 的现代无衬线字体。

英文主要用于：

- THAILAND TRIP
- TOTAL SPEND
- DAY 03
- BANGKOK
- JUL 2026
- PUBLIC
- SHOPPING TODO
- RECOMMENDED

英文承担部分：

> Travel / Editorial Feeling

---

## 6.4 Serif

Serif 字体只用于未来 Scrapbook / Editorial 风格中的装饰。

不作为主要 UI 字体。

---

## 6.5 Typography Hierarchy

建议至少包含：

### Display

用于：

- Trip Title
- Travel Cover
- 重要旅行视觉标题

### Heading

用于：

- 页面标题
- 模块标题
- Search Section Title
- Public Travel Title

### Body

用于：

- 普通信息
- 表单
- 描述
- 用户简介

### Data

用于：

- Price
- Total Spend
- Item Count
- Category Count
- Recommendation Count
- Recommendation / Not Recommendation

### Caption

用于：

- Date
- Location
- 辅助说明
- Source

---

## 6.6 Typography Principle

> 中文负责清晰，英文负责旅行感，数字负责数据感，Display 负责记忆感。

价格和统计数字需要有明确视觉层级，但不能做成传统金融 / 电商产品的强烈价格视觉。

Phase 2 的推荐数也必须服从这一原则：

> 推荐数属于辅助数据，不应压过真实价格与购买地点。

---

# 7. Color System

## 7.1 Overall Color Direction

整体采用：

> Low Saturation Natural Colors

基础：

- Warm White
- Paper
- Light Gray
- Charcoal

辅以少量：

- Terracotta
- Olive
- Sand
- Muted Blue

避免大面积高饱和颜色。

---

## 7.2 Base Colors

### Background

优先：

- Warm White
- Off White
- Paper

避免所有页面都使用纯白。

### Text

优先：

- Charcoal
- Dark Gray

避免大面积纯黑。

---

## 7.3 Brand Color Direction

Forget Me Not 不使用单一高饱和品牌色。

品牌视觉可以由：

- Terracotta
- Olive
- Sand
- Muted Blue

构成低饱和旅行色体系。

---

## 7.4 Trip Theme

不同旅行未来可以拥有不同视觉主题色。

例如：

### Thailand

方向：

- Warm Orange
- Sand
- Olive Green

### Japan

方向：

- Gray Blue
- Off White
- Muted Vermilion

### Korea

方向：

- Soft Blue
- Soft Pink
- Gray

这些只是视觉方向。

不能将国家与固定颜色进行强绑定。

---

## 7.5 Category Colors

建议分类拥有轻量的识别色：

| Category (slug) | UI Label | Visual Direction |
| --------------- | -------- | ---------------- |
| beauty          | 美妆     | Soft Pink        |
| food            | 食品     | Warm Orange      |
| fashion         | 服饰     | Blue Gray        |
| jewelry         | 饰品     | Purple Gray      |
| daily           | 日用品   | Soft Green       |
| electronics     | 电子产品 | Deep Blue Gray   |
| other           | 其他     | Neutral Gray     |

分类色只用于小范围识别。

说明：上表 Category 列为数据库 / 组件逻辑使用的小写英文 slug；UI Label 为界面中文显示。与 `product.md` §6.5 Category Storage Mapping 一致。

不应该占据页面主要视觉。

---

## 7.6 Semantic State Colors

Phase 2 新增的状态需要使用轻量语义色。

包括：

- 即将出行
- 进行中
- 已结束
- 公开
- 私密
- 购物代办
- 已购买
- 推荐
- 不推荐

原则：

- 低饱和
- 小范围使用
- 不依赖颜色单独表达状态
- 必须配合文字、图标或结构表达
- 不抢占商品主视觉

推荐 / 不推荐尤其不能使用强烈的社交媒体式红绿视觉。

---

## 7.7 Color Principle

> Warm White / Paper + Dark Gray 是基础。

> Low-saturation Travel Colors 负责情绪。

> Small Category Colors 负责识别。

> Semantic Colors 负责表达状态。

Archive：

> restrained

Scrapbook：

> freer

---

# 8. Data Visualization

## 8.1 Core Data

Phase 1 主要展示：

- Total Spend
- Item Count
- Category Count

Phase 2 可以继续展示这些基础数据。

---

## 8.2 Total Spend

示例：

```text
฿ 3,280
TOTAL SPEND
```

数字应该具有明显层级。

但整体仍然是旅行记录，而不是金融 Dashboard。

---

## 8.3 Multiple Currencies

如果一次旅行存在多个货币：

分别展示。

例如：

```text
THB
฿ 3,280

JPY
¥ 12,400
```

不使用实时汇率将不同货币强制转换为一个金额。

---

## 8.4 Category Visualization

未来可以加入：

- Category Donut
- Category Bar

用于表达：

- 分类数量
- 分类占比

但不属于 Phase 1 必须视觉模块。

---

## 8.5 Recommendation Data

Phase 2 增加：

- Recommendation Count
- Not Recommendation Count

例如：

```text
👍 24
👎 3
```

推荐数据应该：

- 使用简单数字
- 保持低视觉权重
- 不使用百分比
- 不计算成单一综合可信分
- 不替代价格、地点、日期

推荐数据的作用是：

> 表达其他用户对这条购物信息的反馈。

不是：

> 代表当前商品一定值得购买。

---

## 8.6 Data Visualization Principle

> Simple Numbers + Simple Charts + Clear Hierarchy

避免：

- 复杂金融分析
- 复杂 Dashboard
- 大量图表
- 无实际意义的数据指标
- 综合推荐评分
- 复杂社交数据指标

---

# 9. Interaction & Motion

## 9.1 Overall Motion Philosophy

动效应该像：

> 纸张、照片、邮票被轻轻放到桌面上。

而不是：

> 高科技 Dashboard。

整体：

- 轻
- 慢
- 自然
- 克制
- 有空间感

---

## 9.2 Archive Motion

Archive 模式：

- 快
- 稳
- 克制

目标：

> 不打断记录效率。

---

## 9.3 Discovery Motion

Phase 2 的搜索与公开内容页面：

- 轻量
- 快速
- 清晰
- 克制

目标：

> 帮助用户快速找到购物信息。

避免：

- 大型内容流动画
- 无限滚动视觉强化
- 强烈卡片弹跳
- 社交媒体式互动动画

---

## 9.4 Scrapbook Motion

未来 Scrapbook 模式：

- 更慢
- 更有空间感
- 更有层次
- 更有仪式感

但 Scrapbook 不属于 Phase 1。

---

## 9.5 Page Entry

推荐：

> Fade + Small Translate

例如：

```text
Opacity: 0 → 1
Y: 8px → 0
```

避免大型页面动画。

---

## 9.6 Card Interaction

Hover：

- 轻微上浮
- 轻微阴影变化

Click：

- 轻微 Press

可以：

```text
Scale: 1 → 0.98 → 1
```

避免夸张弹跳。

---

## 9.7 Add Item

添加商品成功后：

- 商品 Card 出现
- 轻微 Fade
- 轻微 Translate
- 进入 Grid

不使用：

- 烟花
- 大型庆祝动画
- 强烈粒子效果

---

## 9.8 Image Upload

状态：

```text
Upload
↓
Preview
↓
Normal
```

保持轻量。

---

## 9.9 Delete

流程：

```text
Delete
↓
Confirm
↓
Fade Out
↓
Layout Shift
```

删除属于破坏性操作，需要明确确认。

---

## 9.10 Stamp

Stamp 可以拥有：

> Slight Rotation → Drop Into Place

形成“盖章 / 收藏”的感觉。

---

## 9.11 Loading

使用：

> Skeleton

或轻量 Loading。

不使用大型 Loading 动画。

---

## 9.12 Empty State

空状态应该像：

> 一页还没有填写的旅行档案。

而不是普通后台：

> No Data.

例如可以使用：

- Empty Stamp
- 空白纸张
- 小型旅行标签

---

## 9.13 Feedback

成功：

```text
✓ 商品已记录
```

错误：

```text
价格不能为空
```

反馈应该：

- 明确
- 简短
- 及时

---

## 9.14 Recommendation Interaction

用户点击：

> 推荐

或：

> 不推荐

反馈动画应该：

- 轻微 Press
- 数量变化
- 状态切换

不使用：

- 爱心爆炸
- 点赞动画
- 彩色粒子
- 大型庆祝动画

推荐反馈应该像：

> 一次数据确认

而不是：

> 一次社交互动。

---

## 9.15 Shopping Todo Completion

购物代办完成购买时：

```text
Shopping Todo
↓
Mark as Purchased
↓
Purchase Record
```

动画应该表达：

> 同一个购物目标完成了。

可以使用：

- Check
- Fade
- 轻微位置变化
- 状态切换

不应产生：

> 删除任务 → 创建新商品

的割裂感。

---

# 10. Motion Timing

建议：

### Fast

120–160ms

适用于：

- Button
- Hover
- Press
- Small UI Feedback
- Recommendation Feedback

### Normal

200–300ms

适用于：

- Card
- Page transition
- Toast
- Search Result Transition

### Slow

400–600ms

适用于：

- Scrapbook
- Image
- Layered memory interactions

---

## 10.1 Easing

普通交互：

> ease-out

图片 / Scrapbook：

> ease-in-out

避免：

- Bounce
- Elastic
- Excessive Spring

---

# 11. Radius / Shadow / Depth

## 11.1 Archive

使用：

- Light Radius
- Medium Radius
- Subtle Shadow

强调：

> 清晰、稳定、轻量。

---

## 11.2 Scrapbook

未来可以：

- 减少圆角
- 使用纸张边缘
- 使用邮票打孔
- 使用轻微撕纸效果
- 增加层叠阴影

强调：

> 纸张、收藏、层叠。

---

# 12. Component Visual Principles

具体组件结构与状态定义见：

`docs/component-library.md`

Design System 只定义组件的视觉原则。

---

## 12.1 Button

Button：

- 不做成电商按钮
- 不使用过度圆润的药丸形
- Primary 用于主要操作
- Secondary 用于次要操作
- Danger 用于删除等破坏性操作

Phase 2 的：

- 登录
- 注册
- 加入购物代办
- 关注
- 推荐
- 不推荐

应继续遵循同一 Button 视觉体系。

---

## 12.2 Input

Input：

- 清晰
- 安静
- 有足够留白
- Label 优先于 Placeholder

Placeholder 不能替代 Label。

---

## 12.3 Product Card

Product Card：

- 商品图片优先
- 信息结构清晰
- 不使用电商购买 CTA
- 不显示折扣
- 不显示销量
- 不使用电商价格促销视觉

Phase 2 可以增加：

- Recommendation Count
- Not Recommendation Count
- Public Status
- Author

但推荐数据不能压过：

> Product / Price / Location / Date

---

## 12.4 Travel Card

Travel Card：

- 图片
- Travel Stamp
- Trip Name
- Trip Date
- Basic Stats
- Travel Status

整体像：

> Travel Archive Card

而不是旅游平台商品卡。

---

## 12.5 Travel Stamp

Travel Stamp 是品牌识别元素之一。

可以拥有轻微：

- 旋转
- 虚线
- 打孔
- 印章边缘

但整体仍应保持现代 UI 的可读性。

---

## 12.6 Shopping Todo

Shopping Todo：

- 与 Product Card 使用同源视觉
- 明确区分“准备购买”和“已经购买”
- 状态信息轻量
- 提供明确的完成操作
- 不做成传统任务管理软件视觉
- 不增加复杂优先级系统
- 不增加复杂任务标签体系

核心视觉关系：

> Todo → Purchased → Record

---

## 12.7 Recommendation Feedback

Recommendation Feedback：

- 推荐 / 不推荐都是反馈控件
- 不是社交点赞按钮
- 不使用大尺寸心形
- 不强调“获赞”
- 显示数量
- 不显示百分比
- 不计算为综合评分

视觉优先级：

> 商品信息 > 价格 / 地点 / 日期 > 推荐反馈

Recommendation Feedback 应该轻量、明确、可识别。

---

## 12.8 Public / Private State

Public / Private：

- 使用 Tag
- 使用 Label
- 使用轻量状态控件
- 不使用强烈警示样式

例如：

```text
PUBLIC
PRIVATE
```

或：

```text
公开
私密
```

公开 / 私密不能仅依赖颜色表达。

---

## 12.9 Profile Header

Profile Header：

- Avatar
- Username / Name
- Bio
- Following Count
- Follower Count
- Follow Action

整体应该像：

> Shopper Profile

而不是：

> Social Media Creator Profile

避免：

- 获赞数字
- 动态数量
- 点赞数量
- 粉丝热度排名
- 内容热榜

---

## 12.10 Search Result Card

Search Result Card 根据结果类型变化。

### Product Result

重点：

- Product Image
- Item Name
- Price
- Location
- Date
- Recommendation Count

### Travel Result

重点：

- Travel Main Image
- Trip Name
- Date
- Author
- Shopping Item Count
- Shopping Recommendation Information

### User Result

重点：

- Avatar
- Username
- Bio
- Public Travel Count
- Follow State

所有搜索结果都应该优先回答：

> 这是什么旅行购物信息？

而不是：

> 这个内容有多火。

---

## 12.11 Follow Control

Follow Control：

- 简洁
- 清晰
- 低社交媒体感
- 不使用大尺寸强 CTA

Follow 的含义是：

> 长期参考这个人的旅行购物选择。

不是：

> 内容互动。

---

# 13. Page-Level Visual Principles

## 13.1 My Trips

关键词：

> Archive / Collection / Stamps

重点：

- 旅行卡片
- 旅行主图
- 日期
- Travel Stamp
- Travel Status
- Personal Information

Phase 2 个人信息区域应该融入 My Trips，而不是把页面变成独立社交 Profile。

---

## 13.2 Create Trip

关键词：

> Clean / Calm / Focused

重点：

- 表单
- 图片上传
- 日期
- 保存操作
- Public / Private

减少装饰。

---

## 13.3 Trip Detail

关键词：

> Cover / Archive / Collection

结构：

```text
Trip Cover
    ↓
Trip Stats
    ↓
Shopping Todo / Product Grid
```

Phase 2 中可以同时呈现：

- Shopping Todo
- Purchased Items

但必须让用户清楚区分：

> 准备购买

与：

> 已经购买

---

## 13.4 Add / Edit Item

关键词：

> Recording / Efficient / Clear

重点：

- 商品名称
- 价格
- 货币
- 地点
- 日期
- 分类
- 商品图片
- 备注
- Public / Private

表单应该优先效率，而不是视觉展示。

---

## 13.5 Item Detail

关键词：

> Product Record / Archive

重点：

- Product Image
- Item Name
- Price
- Location
- Date
- Category
- Note
- Public / Private
- Recommendation Feedback
- Add to Shopping Todo

商品信息应该保持清晰主次。

---

## 13.6 Search

关键词：

> Search / Reference / Discovery

重点：

- Search Input
- Public Travel Recommendations
- Public Product Recommendations
- Search Result Type
- Product Information
- Price
- Location
- Date
- Recommendation Count

页面整体：

> Search-first

而不是：

> Feed-first

搜索下面的公开内容可以存在推荐区域，但不应该形成无限信息流。

---

## 13.7 Public Travel

关键词：

> Public Archive / Shopping Reference

重点：

- Travel Cover
- Travel Name
- Date
- Author
- Shopping Records
- Product Information
- Recommendation Information

页面应该像：

> 查看一份公开的旅行购物档案

而不是：

> 阅读一篇旅行帖子

---

## 13.8 Public User

关键词：

> Shopper Profile / Archive

重点：

- Avatar
- Username
- Bio
- Follow
- Public Trips
- Shopping History

用户主页应该帮助用户判断：

> 是否想长期参考这个人的购物选择。

---

## 13.9 Following

关键词：

> Reference / People / Archive

重点：

- 用户列表
- Avatar
- Username
- Bio
- Follow State
- Public Shopping Reference

不要增加：

- 动态
- 评论
- 点赞
- 社交内容墙

---

## 13.10 Followers

关键词：

> People / Relationship / Archive

重点：

- 用户列表
- Avatar
- Username
- Bio
- Follow State

视觉保持简单。

---

## 13.11 Landing Page

关键词：

> Introduction / Entry / Calm

重点：

- Forget Me Not
- Product Value
- 简短功能介绍
- 登录
- 注册

登录 / 注册使用窗口化体验。

Landing Page 不需要复杂营销页面。

也不需要提前展示完整的推荐信息流。

---

# 14. Responsive Design

Forget Me Not 是 Web App。

设计应适配：

- Desktop
- Tablet
- Mobile

---

## 14.1 Desktop

重点：

- 更宽的内容区域
- Grid 商品展示
- Travel Archive 横向浏览感
- Search Result 多列 / 结构化布局
- Profile 与旅行档案的合理组合

---

## 14.2 Mobile

重点：

- 单列或少列商品布局
- 更大的触控区域
- 表单适配移动端
- 保持信息层级
- 搜索框容易操作
- Recommendation Feedback 容易点击
- Shopping Todo 与 Purchased Items 容易区分

---

## 14.3 Responsive Principle

不要简单缩小 Desktop。

应该根据屏幕宽度重新组织：

- Grid
- 间距
- 图片比例
- 信息层级
- 操作区域
- Search Result Structure
- Profile Layout

---

# 15. Accessibility

视觉设计不能牺牲基本可用性。

需要保证：

- 足够的文字对比度
- 清晰的 Focus 状态
- 足够大的点击区域
- 不仅依赖颜色表达状态
- 表单错误信息明确
- 图片拥有合理的替代文本

Phase 2 额外注意：

- 推荐 / 不推荐不能仅通过颜色区分
- Public / Private 不能仅通过颜色区分
- Travel Status 不能仅通过颜色区分
- Follow State 不能仅通过颜色区分
- Shopping Todo / Purchased 不能仅通过颜色区分

---

# 16. Phase 1 Design Scope

当前 Phase 1 已完成。

Phase 1 核心视觉能力包括：

- Travel Archive
- Trip Card
- Trip Cover
- Travel Main Image
- Product Card
- Product Image
- Price
- Location
- Date
- Category Tag
- Basic Statistics
- Grid Product Display
- Clean Recording Form
- Basic Motion
- Responsive Layout

---

# 17. Phase 2 Design Scope

当前 Phase：

> Phase 2 — Product Definition

Phase 2 在保留 Phase 1 视觉语言的基础上，新增：

- User Profile
- Avatar
- Username / Name
- Bio
- Following Count
- Follower Count
- Login / Register Modal
- Travel Status
- Public / Private State
- Shopping Todo
- Purchased Completion State
- Recommendation / Not Recommend
- Recommendation Count
- Public Travel
- Public Product
- Search
- Public Travel Recommendation
- Public Product Recommendation
- Search Result
- Public User Profile
- Follow / Follower
- Sharing
- Landing Page

Phase 2 视觉重点：

> 商品信息仍然优先。

> 公开内容仍然采用 Travel Archive 作为主要视觉语言。

> 推荐、关注和用户关系属于辅助信息，不得压过真实购物信息。

> Search 是发现入口，但不是无限内容流。

> Shopping Todo 是购物计划工具，不是普通收藏夹或任务管理软件。

> Public User 是购物参考者档案，不是社交媒体主页。

---

# 18. Future Design Directions

以下视觉能力已经被设计系统识别，但不属于当前 Phase 2 实现范围。

## 18.1 Travel Scrapbook

未来可能包括：

- Travel Scrapbook
- Travel Postcard
- Collection
- Travel Archive Template

---

## 18.2 Layered Composition

未来可能包括：

- Product Photo Layer
- Travel Photo Layer
- Stamp Layer
- Receipt Paper
- Image Rotation
- Image Layering
- Collage

---

## 18.3 Advanced Image

未来可能包括：

- Purchase Context Image
- Multiple Product Images
- Additional Travel Photos

这些功能需要在进入对应 Phase 时重新确认。

---

## 18.4 Advanced Data Visualization

未来可能包括：

- Category Donut
- Category Bar
- More Travel Statistics

---

## 18.5 Advanced Browsing

未来可能包括：

- List View
- DAY Stamp
- Timeline
- Time Segmentation

---

# 19. Design System Rules

## Rule 1

Forget Me Not 必须保持：

> Travel Archive × Travel Scrapbook

的整体设计方向。

---

## Rule 2

商品是核心视觉对象。

不要把 Forget Me Not 设计成：

- 景点 App
- 旅行相册
- 酒店 App
- 电商平台

Phase 2 同样不能因为增加 UGC、关注、推荐而变成泛内容社区。

---

## Rule 3

Travel Archive 优先效率。

记录和管理场景不能被装饰干扰。

---

## Rule 4

Travel Scrapbook 用于未来的回忆制作。

不能把 Scrapbook 装饰强行应用到所有页面。

---

## Rule 5

图片优先表达：

> 买了什么。

而不是：

> 去哪里玩了什么。

---

## Rule 6

视觉元素必须有信息意义。

Card、Stamp、Tag、Paper 不应该为了装饰而存在。

---

## Rule 7

颜色保持低饱和。

避免高饱和、强烈、科技感的视觉风格。

---

## Rule 8

动效服务于：

-记录
-整理
-回忆
-发现
-购物计划转换

而不是炫技。

---

## Rule 9

不要自动实现 Future Design。

Design System 中存在的未来视觉概念：

- Scrapbook
- Postcard
- Photo Layer
- Stamp Layer
- Category Chart
- DAY

不代表当前 Phase 必须实现。

---

## Rule 10

当 Product Definition 与 Design System 发生冲突时：

> Product Definition 决定功能范围。

Design System 负责决定：

> 已确定功能应该如何呈现。

---

## Rule 11

Phase 2 的社交相关视觉必须服务于旅行购物。

推荐、关注、用户主页等视觉不应形成独立的社交媒体设计语言。

---

## Rule 12

Phase 2 的推荐信息必须服务于购物信息判断。

推荐 / 不推荐：

- 不等于点赞
- 不等于内容热度
- 不等于综合可信评分
- 不等于当前商品一定值得购买

视觉上应保持辅助信息地位。

---

## Rule 13

Shopping Todo 与 Purchased Record 必须保持视觉上的连续性。

用户应该感觉：

> 同一个购物目标完成了。

而不是：

> 一个任务消失了，另一个商品出现了。

---

## Rule 14

Search 页面必须保持：

> Search First + Shopping Reference

而不是：

> Feed First + Content Consumption

搜索下面可以有公开内容推荐，但不得自动发展为无限内容流。

---

## Rule 14b — Primary Navigation Active State

登录后 Global Navigation（我的旅行 / 搜索）的 Active State：

- 使用档案戳色：`--color-stamp`
- 字重略加强；可用细下划线或 stamp 色文字
- 不要使用社交媒体式粗底色条
- 不要使用高饱和红色或新的视觉体系

---

## Rule 15

不要自动实现尚未确认的 Product Rule。

如果 Product Definition 中存在待确认问题：

- 不自行决定
- 不自行扩展
- 不提前实现

应先确认产品规则。

---

# 20. Design Source of Truth

当前设计源文件：

`docs/design-system.md`

本文件是 Forget Me Not 的当前 Design Source of Truth。

设计可以随着产品验证持续更新。

不通过创建：

- design-v1.md
- design-v2.md
- design-final.md

来管理版本。

版本与变更记录应该保留在本文档内部。

---

# 21. Document Status

Version: 1.1

Current Product Phase: Phase 2 — Product Definition

Status: In Definition

Last Updated: 2026-09-25

Phase 1 Design: Completed

Phase 2 Design: In Definition

This document defines the current visual and interaction language of Forget Me Not.

Future design directions may be documented here for reference, but they must not be treated as current implementation requirements unless the active product phase explicitly includes them.