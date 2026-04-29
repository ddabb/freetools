# CDN 数据管理规范

> 记录 FreeTools 项目中所有 CDN 数据的存放位置、更新流程和最佳实践。

## 一、CDN 架构概述

FreeTools 采用「jsDelivr CDN + GitHub」作为静态数据分发方案，实现免发布更新。

```
优势：
1. 数据更新无需重新提交审核
2. 全球 CDN 加速，访问速度快
3. 成本为零（jsDelivr 免费）
4. GitHub 作为版本控制，数据可追溯
```

### CDN 路径格式

```
https://cdn.jsdelivr.net/gh/ddabb/FreeToolsPuzzle@main/data/<功能名>/<文件>.json
```

**变量说明：**
- `ddabb/freetools`：GitHub 仓库
- `@main`：分支名（可用 @latest）
- `data/`：数据目录

---

## 二、数据源目录结构

```
freetools/data/
├── changelog.json              # 版本日志
├── daily-sudoku.json           # 每日数独
├── sudoku-presets.json         # 数独题目库
├── sudoku/                     # 数独详细数据（2191个文件）
│   ├── puzzle_0001.json        # 题目1
│   ├── puzzle_0002.json
│   └── ...
├── 24point-questions.json       # 24点题目库
├── daily-quote.json             # 每日语录
├── constellation-info.json      # 星座信息
├── calendar-events.json         # 日历事件（节假日等）
├── hot-tools.json               # 热门工具配置
├── relative-relation.json       # 亲戚关系数据
│
├── wordbank/                    # 文案数据（23个分类）
│   ├── index.json               # 文案分类索引
│   ├── birthday.json            # 生日文案
│   ├── children-day.json        # 儿童节
│   ├── family.json              # 家庭亲情
│   ├── food.json                # 美食餐饮
│   ├── friendship.json          # 友谊友情
│   ├── love.json                # 爱情恋爱
│   ├── mid-autumn.json          # 中秋节
│   ├── national-day.json        # 国庆节
│   ├── new-year.json            # 新年
│   ├── spring-festival.json     # 春节
│   ├── teacher-day.json         # 教师节
│   ├── travel.json              # 旅行出游
│   ├── work.json                # 工作职场
│   └── ...（其他节日/场景文案）
│
└── idiom-solitaire/             # 成语接龙数据
    ├── build.js                  # 构建脚本
    ├── idiom-first-index.json     # 首字索引
    ├── idiom-last-index.json      # 尾字索引
    └── letter/                   # 按拼音字母拆分
        ├── a.json ~ z.json
```

---

## 三、数据源详细说明

### 3.1 核心功能数据

| 数据文件 | CDN 路径 | 本地缓存 Key | 用途 | 大小 | 更新频率 |
|---------|---------|-------------|------|------|----------|
| 版本日志 | `data/changelog.json` | 无 | changelog 页面 | ~5KB | 有版本时 |
| 每日数独 | `data/daily-sudoku.json` | `cdn_daily_sudoku` | 数独求解器 | ~2KB | 每天 |
| 数独题库 | `data/sudoku-presets.json` | `cdn_sudoku_presets` | 数独求解器 | ~50KB | 低 |
| 24点题库 | `data/24point-questions.json` | `cdn_24point_questions` | 24点速算 | ~100KB | 低 |

### 3.2 工具类数据

| 数据文件 | CDN 路径 | 本地缓存 Key | 用途 | 大小 | 更新频率 |
|---------|---------|-------------|------|------|----------|
| 星座信息 | `data/constellation-info.json` | `cdn_constellation_info` | 星座查询 | ~10KB | 低 |
| 亲戚关系 | `data/relative-relation.json` | `cdn_relative_data` | 亲戚计算器 | ~50KB | 低 |
| 日历事件 | `data/calendar-events.json` | `cdn_calendar_events` | 万年历 | ~20KB | 低 |
| 每日语录 | `data/daily-quote.json` | `cdn_daily_quote` | 首页展示 | ~5KB | 每天 |
| 热门工具 | `data/hot-tools.json` | `cdn_hot_tools` | 首页推荐 | ~2KB | 低 |

### 3.3 文案类数据

| 数据文件 | CDN 路径 | 本地缓存 Key | 用途 | 条目数 | 更新频率 |
|---------|---------|-------------|------|--------|----------|
| 文案索引 | `data/wordbank/index.json` | `cdn_wordbank_index` | 文案工具 | 23类 | 低 |
| 生日文案 | `data/wordbank/birthday.json` | - | 生日祝福 | ~30条 | 低 |
| 爱情文案 | `data/wordbank/love.json` | - | 爱情语录 | ~50条 | 低 |
| 亲情文案 | `data/wordbank/family.json` | - | 亲情相关 | ~30条 | 低 |
| 友谊文案 | `data/wordbank/friendship.json` | - | 友情语录 | ~30条 | 低 |
| 美食文案 | `data/wordbank/food.json` | - | 餐饮美食 | ~30条 | 低 |
| 中秋文案 | `data/wordbank/mid-autumn.json` | - | 中秋节 | ~30条 | 节日前 |
| 国庆文案 | `data/wordbank/national-day.json` | - | 国庆节 | ~30条 | 节日前 |
| 春节文案 | `data/wordbank/spring-festival.json` | - | 春节 | ~40条 | 节日前 |
| 教师节文案 | `data/wordbank/teacher-day.json` | - | 教师节 | ~30条 | 节日前 |
| 儿童节文案 | `data/wordbank/children-day.json` | - | 儿童节 | ~20条 | 节日前 |
| 护士节文案 | `data/wordbank/nurses-day.json` | - | 护士节 | ~20条 | 节日前 |
| 劳动节文案 | `data/wordbank/labor-day.json` | - | 劳动节 | ~20条 | 节日前 |
| 程序员节 | `data/wordbank/programmer-day.json` | - | 程序员节 | ~20条 | 节日前 |
| 新年文案 | `data/wordbank/new-year.json` | - | 新年祝福 | ~30条 | 节日前 |
| 旅行文案 | `data/wordbank/travel.json` | - | 旅行相关 | ~30条 | 低 |
| 生活文案 | `data/wordbank/life.json` | - | 生活感悟 | ~30条 | 低 |
| 职场文案 | `data/wordbank/work.json` | - | 工作职场 | ~30条 | 低 |
| 激光文案 | `data/wordbank/laser.json` | - | 朋友圈装逼 | ~20条 | 低 |
| 人生感悟 | `data/wordbank/life-style.json` | - | 人生哲理 | ~30条 | 低 |

### 3.4 游戏类数据

| 数据文件 | CDN 路径 | 本地缓存 Key | 用途 | 大小 | 更新频率 |
|---------|---------|-------------|------|------|----------|
| 成语索引 | `data/idiom-solitaire/idiom-first-index.json` | `cdn_idiom_first_index` | 首字检索 | ~200KB | 低 |
| 成语索引 | `data/idiom-solitaire/idiom-last-index.json` | `cdn_idiom_last_index` | 尾字检索 | ~200KB | 低 |
| 成语详情 | `data/idiom-solitaire/letter/*.json` | `cdn_idiom_detail` | 按需加载 | ~50KB/个 | 低 |

---

## 四、数据加载规范

### 4.1 缓存策略

```javascript
// CDN 缓存 Key 必须以 cdn_ 开头，版本升级时 app.js 会自动清理
const CACHE_KEY = 'cdn_xxx_data';
const CACHE_EXPIRE = 30 * 24 * 60 * 60 * 1000; // 30 天

function loadFromCDN(url) {
  const cached = wx.getStorageSync(CACHE_KEY);
  const now = Date.now();

  // 缓存有效，直接使用
  if (cached && (now - cached.ts) < CACHE_EXPIRE) {
    return Promise.resolve(cached.data);
  }

  // 从 CDN 加载
  return wx.request({ url }).then(res => {
    if (res.data) {
      wx.setStorageSync(CACHE_KEY, { data: res.data, ts: now });
      return res.data;
    }
    throw new Error('加载失败');
  }).catch(() => {
    // 网络失败，尝试用缓存兜底
    if (cached) return cached.data;
    throw new Error('无可用缓存');
  });
}
```

### 4.2 缓存过期时间建议

| 数据类型 | 推荐缓存时间 | 说明 |
|----------|-------------|------|
| 每日数据 | 24 小时 | 每日数独、每日语录 |
| 索引数据 | 30 天 | 文案索引、成语索引 |
| 详情数据 | 永久 | 题目、文案等几乎不变 |
| 节日数据 | 节日前更新 | 节假日专属文案 |
| 用户配置 | 不缓存 | 热词配置等可能频繁更新 |

---

## 五、更新流程

### 5.1 数据更新步骤

```
1. 修改本地 data/ 目录下的 JSON 文件
2. 本地验证 JSON 语法正确
3. 提交 git commit
4. 推送到 GitHub
5. jsDelivr CDN 自动刷新（通常 1-5 分钟）
6. 小程序端自动加载最新数据（缓存过期后）
```

### 5.2 强制刷新方法

用户清除小程序缓存后，下次打开会强制从 CDN 拉取最新数据。

### 5.3 大文件处理

> 单个 JSON 文件超过 500KB 时，建议拆分。

例如成语接龙数据：
- 主索引（~200KB）：首字/尾字到成语列表的映射
- 详情文件（~50KB/个）：按拼音字母拆分为 26 个 letter 文件，按需加载

---

## 六、新增数据源规范

### 6.1 命名规范

```
data/
├── 新功能名/                      # 小写+连字符
│   ├── index.json                 # 主索引（必须有）
│   ├── data.json                  # 主数据
│   └── build.js                   # 构建脚本（可选）
```

### 6.2 JSON 文件规范

```json
{
  "version": "1.0.0",           // 数据版本号
  "updated": "2026-04-07",     // 更新时间
  "count": 100,                 // 数据条数
  "data": [...]                // 实际数据
}
```

### 6.3 上线检查清单

- [ ] JSON 语法正确（用 `JSON.parse()` 验证）
- [ ] 文件大小符合预期
- [ ] CDN 链接可访问
- [ ] 小程序内加载正常
- [ ] 数据在页面中正确展示

---

## 七、安全注意事项

1. **不上传敏感信息**：用户数据、密钥等不上 CDN
2. **内容合规**：成语、百科等数据需符合微信内容规范
3. **定期检查**：定期检查 CDN 文件可用性
4. **版本控制**：重要数据更新前先备份

---

## 八、常见问题

| 错误 | 原因 | 解决 |
|------|------|------|
| 数据不更新 | CDN 缓存未刷新 | 等 5 分钟或清除缓存 |
| 加载失败 | 文件路径错误 | 检查 CDN 链接 |
| 数据为空 | JSON 格式错误 | 验证 JSON 语法 |
| 加载慢 | 文件太大 | 拆分为多个小文件 |
| 页面空白 | 数据结构变化 | 检查数据格式，更新读取代码 |

---

## 九、CDN 地址速查

| 数据 | jsDelivr CDN 地址 |
|------|------------------|
| 版本日志 | `https://cdn.jsdelivr.net/gh/ddabb/FreeToolsPuzzle@main/data/changelog.json` |
| 每日数独 | `https://cdn.jsdelivr.net/gh/ddabb/FreeToolsPuzzle@main/data/daily-sudoku.json` |
| 星座信息 | `https://cdn.jsdelivr.net/gh/ddabb/FreeToolsPuzzle@main/data/constellation-info.json` |
| 亲戚关系 | `https://cdn.jsdelivr.net/gh/ddabb/FreeToolsPuzzle@main/data/relative-relation.json` |
| 文案索引 | `https://cdn.jsdelivr.net/gh/ddabb/FreeToolsPuzzle@main/data/wordbank/index.json` |
| 生日文案 | `https://cdn.jsdelivr.net/gh/ddabb/FreeToolsPuzzle@main/data/wordbank/birthday.json` |
| 24点题库 | `https://cdn.jsdelivr.net/gh/ddabb/FreeToolsPuzzle@main/data/24point-questions.json` |
| **毒鸡汤** | `https://cdn.jsdelivr.net/gh/ddabb/FreeToolsPuzzle@main/data/wordbank/poison-soup.json` |
| **答案之书** | `https://cdn.jsdelivr.net/gh/ddabb/FreeToolsPuzzle@main/data/wordbank/answer-book.json` |
| 成语首字 | `https://cdn.jsdelivr.net/gh/ddabb/FreeToolsPuzzle@main/data/idiom-solitaire/idiom-first-index.json` |
