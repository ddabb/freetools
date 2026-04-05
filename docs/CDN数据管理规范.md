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

## 二、数据存放规范

### 2.1 目录结构

```
freetools/
├── data/                         # CDN 数据源（Git 仓库内）
│   ├── changelog.json            # 版本日志
│   ├── sudoku-presets.json       # 数独题目
│   ├── 24point-questions.json    # 24点题目
│   ├── wordbank/                  # 文案数据
│   └── idiom-solitaire/          # 成语接龙数据
│       ├── build.js               # 构建脚本
│       ├── idiom-first-full-index.json
│       ├── idiom-last-index.json
│       └── letter/               # 拼音字母分组
│
└── docs/
    └── data/                      # 同上，副本（方便管理）
```

### 2.2 CDN 路径格式

```
https://cdn.jsdelivr.net/gh/ddabb/freetools@main/data/<功能名>/<文件>.json
```

**变量说明：**
- `ddabb/freetools`：GitHub 仓库
- `@main`：分支名（可用 @latest）
- `data/`：数据目录

### 2.3 已上线 CDN 数据

| 数据 | CDN 路径 | 本地缓存 Key | 用途 | 更新频率 |
|------|----------|------------|------|----------|
| 版本日志 | `data/changelog.json` | 无本地缓存 | changelog 页面 | 有版本时 |
| 数独每日题 | `data/sudoku-presets.json` | `cdn_daily_sudoku` | 数独求解器 | 低 |
| 24点题库 | `data/24point-questions.json` | `cdn_24point_questions` | 24点速算 | 低 |
| 成语索引 | `data/idiom-solitaire/*.json` | `cdn_idiom_index_data` | 成语接龙 | 低 |
| 成语详情 | `data/idiom-solitaire/letter/*.json` | `cdn_idiom_data_logs` | 按需加载 | 低 |

## 三、数据加载规范

### 3.1 缓存策略

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

### 3.2 缓存过期时间建议

| 数据类型 | 推荐缓存时间 |
|----------|-------------|
| 版本日志 | 24 小时 |
| 索引数据 | 30 天 |
| 题目数据 | 永久（几乎不变） |
| 文案数据 | 7 天 |
| 用户生成内容 | 不缓存 |

## 四、更新流程

### 4.1 数据更新步骤

```
1. 修改本地 data/ 目录下的 JSON 文件
2. 提交 git commit
3. 推送到 GitHub
4. jsDelivr CDN 自动刷新（通常 1-5 分钟）
5. 小程序端自动加载最新数据（缓存过期后）
```

### 4.2 强制刷新方法

用户清除小程序缓存后，下次打开会强制从 CDN 拉取最新数据。

### 4.3 大文件处理

> 单个 JSON 文件超过 500KB 时，建议拆分。

例如成语接龙数据：
- 主索引（~200KB）：首字/尾字到成语列表的映射
- 详情文件（~50KB/个）：按拼音字母拆分为 26 个 letter 文件，按需加载

## 五、数据构建脚本

### 5.1 idiom-solitaire 构建脚本

```javascript
// data/idiom-solitaire/build.js
const fs = require('fs');
const path = require('path');

const idiomDB = require('./idiom-db.json'); // 原始数据
const pinyin = require('pinyin-pro');

// 构建首字索引
const firstIndex = {};
// 构建尾字索引
const lastIndex = {};

// 遍历所有成语，填充索引...

fs.writeFileSync('idiom-first-full-index.json', JSON.stringify(firstIndex));
fs.writeFileSync('idiom-last-index.json', JSON.stringify(lastIndex));
```

**使用**：
```bash
cd data/idiom-solitaire
node build.js
```

## 六、数据校验

### 6.1 上线前检查

- JSON 语法正确（可用 `JSON.parse()` 验证）
- 文件大小符合预期
- CDN 链接可访问
- 小程序内加载正常

### 6.2 常见错误

| 错误 | 原因 | 解决 |
|------|------|------|
| 数据不更新 | CDN 缓存未刷新 | 等 5 分钟或清除缓存 |
| 加载失败 | 文件路径错误 | 检查 CDN 链接 |
| 数据为空 | JSON 格式错误 | 验证 JSON 语法 |
| 加载慢 | 文件太大 | 拆分为多个小文件 |

## 七、安全注意事项

1. **不上传敏感信息**：用户数据、密钥等不上 CDN
2. **内容合规**：成语、百科等数据需符合微信内容规范
3. **定期检查**：定期检查 CDN 文件可用性
