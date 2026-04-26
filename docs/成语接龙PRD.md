# 成语接龙小程序 PRD

> 状态：✅ 全部上线（查询/对战/接龙链三模式均已发布）
> 创建时间：2026-04-03
> 类型：功能增强

---

## 一、背景与目标

freetools 现有工具以**工具型**为主（计算器、转换器、查询器），成语接龙是平台首款**娱乐游戏型**工具，可补足小程序的趣味性，提升用户粘性和日活。

**目标：** 提供一款可在微信小程序内直接玩的成语接龙游戏，支持查询和双人游戏两种模式，无需后端数据库，成语数据通过 CDN 静态加载。

---

## 二、核心功能

### 2.1 模式一：成语查询（工具型）

用户输入任意成语，系统展示所有可接的成语列表。

**输入：**
- 单个成语（四字或多字）
- 声母过滤（可选，如"以 y 结尾"）

**输出：**
- 接龙成语列表（按常用程度排序）
- 每个结果显示：成语、拼音、解释（悬浮/点击展开）
- 结果数量统计
- 支持一键复制

**边界处理：**
- 生僻字无接龙 → 提示"暂无接龙数据，欢迎补充"
- 非成语 → 提示"这不是一个常用成语"

### 2.2 模式二：人机对战（游戏型）

用户 vs 系统，自动出题判负。

**流程：**
1. 用户选择先手（用户先出 / 系统先出）
2. 系统随机选一个龙头成语展示
3. 双方轮流接龙，每方限时 30 秒
4. 超时或无合法成语可接 → 判负
5. 手动认输按钮

**特殊规则：**
- 接龙方式：尾字 → 首字（同音也行）
- 禁止重复已出现过的成语
- 系统 AI 优先选常用成语，避免选生僻字为难自己

**记分系统：**
- 胜/负记录（本地存储）
- 连续胜场统计
- 历史最佳连胜

### 2.3 模式三：接龙链展示

用户输入一个起始成语，系统用 DFS 自动生成一条最长无重复成语链，展示结果并支持分享图片。

---

## 三、数据架构（CDN 静态方案）

> 核心原则：不用数据库，全部静态 JSON，走 freetools 现有 CDN 体系。

### 3.1 数据目录结构

```
data/idiom-solitaire/
  ├── build.js                      # 构建脚本（已有）
  ├── idiom.json                    # 完整成语数据（12,970 条，2.6MB）
  ├── idiom-first-index.json        # 按首字拼音分组索引（197KB）
  ├── idiom-last-index.json         # 按尾字拼音分组索引（200KB）
  ├── stats.json                    # 数据统计
  └── letter/                      # 按首字母分片（按需加载）
      ├── a.json ~ z.json           # 23 个文件，最大 147KB（y）
```

### 3.2 idiom.json 结构（已实现）

```json
[
  {
    "word": "一马当先",
    "pinyin": "yī mǎ dāng xiān",
    "firstChar": "y",
    "lastChar": "xian",
    "explanation": "原指作战时策马冲锋在前。形容领先、带头。",
    "derivation": "《隋书·史祥传》：\"公卿将士以为攘止，攘止之举，自当先之。\"",
    "example": "",
    "abbr": "ymdx"
  }
]
```

- `firstChar`：首字无声调拼音的第一个字母（a-z），用于按字母快速过滤
- `lastChar`：末字无声调拼音，用于接龙匹配
- `abbr`：首字母缩写，可作为常用度代理因子

### 3.3 索引文件结构

**idiom-first-index.json**（首字索引）：
```json
{
  "y": ["一马当先", "一脉相承", "一路平安", ...],
  "a": ["阿谀奉承", "阿其所好", ...],
  ...
}
```

**idiom-last-index.json**（尾字索引，用于接龙）：
```json
{
  "xian": ["一马当先", "大显身手", ...],
  "cheng": ["阿谀奉承", ...],
  ...
}
```

### 3.4 数据统计（已生成）

| 指标 | 数值 |
|------|------|
| 总成语数 | 12,970 |
| 四字成语 | 12,179（94%） |
| 五字成语 | 189 |
| 六字及以上 | 550 |
| 首字母分组 | 23 个 |
| 尾字母分组 | 380 个 |

### 3.5 CDN 地址

```
https://cdn.jsdelivr.net/gh/ddabb/freetools@main/data/idiom-solitaire/
```

### 3.6 加载策略

| 场景 | 加载文件 | 预估大小 |
|------|---------|---------|
| 启动/查询 | `idiom-first-index.json` | ~200KB |
| 接龙匹配 | `idiom-last-index.json` | ~200KB |
| 查看详情 | `letter/{char}.json`（按需） | 每文件 ~10-150KB |
| DFS 接龙链 | 仅需 `idiom-last-index.json` | ~200KB |

```json
[
  {
    "word": "一马当先",
    "pinyin": "yī mǎ dāng xiān",
    "firstChar": "y",
    "lastChar": "x",
    "frequency": 85
  }
]
```

- `frequency`：常用度 1-100，影响 AI 选词优先级
- 按首字拼音索引，减少运行时查询量

### 3.3 加载策略

- **首次加载**：启动时预加载 `first-char-index.json`（约 200KB）
- **按需加载**：`idioms-meta.json` 只在用户查看详情时按需拉取
- **本地缓存**：微信 `wx.setStorageSync` 缓存已加载数据
- **CDN 地址**：`https://cdn.jsdelivr.net/gh/ddabb/freetools@main/data/idiom-solitaire/`

### 3.4 数据来源

- 原始数据：开源成语库 `by-syk/chinese-idiom-db`（12,976 条，含拼音/释义/出处/例句）
- 处理工具：`pinyin-pro`（freetools 已有依赖）生成 `firstChar`/`lastChar` 索引
- 构建脚本：`build.js`（已实现，支持增量更新）
- 数据更新：修改 `idiom-source.txt` 后运行 `node build.js` 即可重新生成所有文件

---

## 四、页面结构

### 4.1 入口

- 分类：生活工具（与文案生图、生成二维码同区）
- 图标建议：🐉 或 📜
- ID：`idiom-solitaire`
- Keywords：`成语,接龙,文字游戏,猜成语`

### 4.2 页面布局（单页）

```
┌─────────────────────────┐
│  标题栏：成语接龙         │
├─────────────────────────┤
│  [查询] [对战] [接龙链]   │  ← Tab 切换
├─────────────────────────┤
│                         │
│  内容区（Tab 不同）      │
│                         │
├─────────────────────────┤
│  [保存/分享]（视 Tab 而定）│
└─────────────────────────┘
```

### 4.3 查询 Tab

```
┌─────────────────────────┐
│  [请输入成语...]          │  ← 输入框
├─────────────────────────┤
│  接"当"字（示例）：       │
│  ┌───────────────────┐  │
│  │ 当机立断     → 断   │  │
│  │ 当局者迷     → 迷   │  │
│  │ 当头一棒     → 棒   │  │
│  │ ...                │  │
│  └───────────────────┘  │
│  共 42 条，点击查看详情   │
└─────────────────────────┘
```

### 4.4 对战 Tab

```
┌─────────────────────────┐
│  回合：5    用时：01:23   │
├─────────────────────────┤
│  [系统] 心知肚明          │
│         ↓               │
│  [用户] 明目张胆          │  ← 用户输入
│         ↓               │
│  [系统] 单枪匹马          │  ← AI 回复（动画）
├─────────────────────────┤
│  [请输入成语...]    [发送]│
│  [认输]                  │
└─────────────────────────┘
```

### 4.5 接龙链 Tab

```
┌─────────────────────────┐
│  起始成语：[请输入]        │
│  最大长度：10  [生成]     │
├─────────────────────────┤
│  一马当先 → 先见之明       │
│  → 明哲保身 → 身经百战     │
│  → 战无不胜 → ...        │
├─────────────────────────┤
│  [保存图片] [重新生成]    │
└─────────────────────────┘
```

---

## 五、技术方案

### 5.1 页面文件

```
packages/life/pages/idiom-solitaire/
  ├── idiom-solitaire.js
  ├── idiom-solitaire.wxml
  ├── idiom-solitaire.wxss
  └── idiom-solitaire.json
```

### 5.2 核心算法

**查询接龙：**
```javascript
// 给定尾字 ch，找出所有首字为 ch 的成语
idioms.filter(i => i.firstChar === lastChar)
      .sort((a, b) => b.frequency - a.frequency)
```

**DFS 最长接龙链：**
```javascript
function dfs(current, visited, depth) {
  const candidates = getCandidates(current.lastChar, visited);
  for (const c of candidates) {
    visited.add(c);
    dfs(c, visited, depth + 1);
    visited.delete(c);
  }
  updateBest(depth);
}
```

### 5.3 CDN 数据加载

```javascript
const CDN = 'https://cdn.jsdelivr.net/gh/ddabb/freetools@main/data/idiom-solitaire/';

async function loadIdiomData() {
  const cache = wx.getStorageSync('idiom-index');
  if (cache) return cache;
  const res = await wx.request({ url: CDN + 'first-char-index.json' });
  wx.setStorageSync('idiom-index', res.data);
  return res.data;
}
```

### 5.4 依赖

- 无需额外 npm 包
- `lunar-javascript`（freetools 已有）不用于此功能
- 图片导出依赖 `wxml2canvas-2d`（freetools 已有）

---

## 六、非功能要求

| 维度 | 要求 |
|------|------|
| 首屏加载 | CDN 数据预加载 ≤ 2 秒（15MB 网络条件） |
| 查询响应 | ≤ 50ms（本地过滤，无网络） |
| 离线支持 | 首次加载后，本地缓存支持离线查询 |
| 包体积增量 | ≤ 5KB（JS + WXML + WXSS） |
| 数据文件 | CDN 总计 ≤ 2MB |
| 审核 | 避开"赌博""金钱"等敏感词，对战不计钱 |

---

## 七、竞品参考

| 产品 | 特色 |
|------|------|
| [成语接龙 · 千千秀字](https://www.qqxiuzi.cn/hanyu/chengyu/jielong.php) | 人机对战，支持认输/重来 |
| [成语接龙 · 汉语查](https://www.hgcha.com/chengyu/) | 查询模式，展示所有接龙结果 |
| [Idiom Solitaire · lawrenceshi](https://github.com/lawrenceshi/Idiom-solitaire) | 小程序，有"提示""查看拼音""生成证书"功能 |

---

## 八、里程碑

| 阶段 | 内容 | 状态 | 备注 |
|------|------|------|------|
| P0 | 数据包创建 + CDN 部署，查询 Tab 上线 | ✅ 已完成 | 2026-04-04 |
| P1 | 人机对战 Tab + 超时机制 | ✅ 已完成 | 2026-04-04 |
| P2 | 接龙链 Tab + 图片分享 | ✅ 已完成 | 2026-04-04 |
| P3 | 音效/动画/排行榜 | ✅ 音效已完成 | 2026-04-24 |

---

## 九、备注

- 数据包已生成（`data/idiom-solitaire/`），无需数据库，纯 CDN 静态分发
- `build.js` 是数据构建脚本，新增成语时修改 `idiom-source.txt` 后重新运行即可
- 对战/DFS 接龙链只依赖索引文件（各 ~200KB），无需加载完整数据
- 微信小程序 AI 人机对战不调用任何云 API，纯本地逻辑
