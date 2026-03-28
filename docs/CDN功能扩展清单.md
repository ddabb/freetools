# CDN 动态数据源扩展功能清单

> 基于 jsDelivr CDN + GitHub，实现小程序动态数据更新，无需发布新版本。

---

## 一、已实现功能

### 1. 文案生图数据源
- **文件**：`docs/data/changelog.json`
- **CDN**：`https://cdn.jsdelivr.net/gh/ddabb/freetools@main/docs/data/changelog.json`
- **用途**：版本更新日志

### 2. 数独预设题目
- **文件**：`docs/data/sudoku-presets.json`
- **CDN**：`https://cdn.jsdelivr.net/gh/ddabb/freetools@main/docs/data/sudoku-presets.json`
- **用途**：数独求解器预设题目（5道不同难度）

### 3. 24点预设题目
- **文件**：`docs/data/24point-questions.json`
- **CDN**：`https://cdn.jsdelivr.net/gh/ddabb/freetools@main/docs/data/24point-questions.json`
- **用途**：24点速算预设题目（12道带解法）

### 4. 文章库
- **文件**：`docs/articles/index.json` + `docs/articles/published/*.md`
- **用途**：文章列表和内容管理

---

## 二、可扩展功能清单

### 🔴 高优先级

#### 1. 每日一言 / 每日鸡汤
```
文件：docs/data/daily-quote.json
CDN：https://cdn.jsdelivr.net/gh/ddabb/freetools@main/docs/data/daily-quote.json

数据结构：
{
  "quotes": [
    { "content": "句子内容", "author": "作者", "tag": "励志" }
  ]
}

小程序用途：
- 首页/关于页面展示每日句子
- 文案生图素材来源
- 可按标签分类（励志/毒汤/温暖/文案等）
```

#### 2. 热门工具榜单
```
文件：docs/data/hot-tools.json
CDN：https://cdn.jsdelivr.net/gh/ddabb/freetools@main/docs/data/hot-tools.json

数据结构：
{
  "updateDate": "2026-03-28",
  "rankings": [
    { "id": "sudoku-solver", "name": "数独求解器", "usage": 12580, "rank": 1 },
    { "id": "24point", "name": "24点速算", "usage": 9820, "rank": 2 }
  ]
}

小程序用途：
- 首页展示热门工具 TOP10
- 运营数据分析
```

#### 3. 工具使用统计
```
文件：docs/data/tool-stats.json
CDN：https://cdn.jsdelivr.net/gh/ddabb/freetools@main/docs/data/tool-stats.json

数据结构：
{
  "updateDate": "2026-03-28",
  "stats": {
    "totalUsers": 12580,
    "totalUsage": 98200,
    "dailyActive": 1250
  }
}
```

---

### 🟡 中优先级

#### 4. 节日/节气提醒数据
```
文件：docs/data/calendar-events.json
CDN：https://cdn.jsdelivr.net/gh/ddabb/freetools@main/docs/data/calendar-events.json

数据结构：
{
  "events": [
    { "date": "2026-04-04", "name": "清明节", "type": "festival", "tag": "传统节日" },
    { "date": "2026-04-03", "name": "寒食节", "type": "festival", "tag": "传统节日" }
  ]
}

小程序用途：
- 日历工具展示节日信息
- 首页/关于页节日提醒
```

#### 5. 生肖/星座运势（静态数据）
```
文件：docs/data/zodiac-fortune.json
CDN：https://cdn.jsdelivr.net/gh/ddabb/freetools@main/docs/data/zodiac-fortune.json

数据结构：
{
  "zodiac": [
    { "sign": "鼠", "fortune": "今日运势...", "lucky": ["红色", "数字3"] }
  ],
  "constellation": [
    { "sign": "白羊座", "fortune": "今日运势...", "lucky": ["红色", "数字3"] }
  ]
}
```

#### 6. 健康小贴士
```
文件：docs/data/health-tips.json
CDN：https://cdn.jsdelivr.net/gh/ddabb/freetools@main/docs/data/health-tips.json

数据结构：
{
  "tips": [
    { "content": "建议每天喝8杯水", "category": "饮水", "source": "健康指南" },
    { "content": "每工作1小时，休息5分钟", "category": "工作", "source": "健康管理" }
  ]
}

小程序用途：
- 健康计算器工具内展示
- 首页健康类工具推荐
```

#### 7. 数学益智题库
```
文件：docs/data/math-puzzles.json
CDN：https://cdn.jsdelivr.net/gh/ddabb/freetools@main/docs/data/math-puzzles.json

数据结构：
{
  "puzzles": [
    { 
      "type": "number-sequence", 
      "question": "1, 2, 4, 8, ?", 
      "answer": "16",
      "explanation": "等比数列，公比为2",
      "difficulty": "easy"
    }
  ]
}

小程序用途：
- 数学工具扩展题库
- 首页益智游戏推荐
```

---

### 🟢 低优先级（创意功能）

#### 8. 公众号文章列表
```
文件：docs/articles/index.json（已有基础）
扩展：docs/articles/featured.json

数据结构：
{
  "featured": [
    { "title": "文章标题", "summary": "文章摘要", "date": "2026-03-28", "tags": ["认知", "思维"] }
  ]
}

小程序用途：
- 小程序内展示公众号最新文章
- 跳转至公众号文章
```

#### 9. 用户反馈/建议墙
```
文件：docs/data/user-feedback.json
CDN：https://cdn.jsdelivr.net/gh/ddabb/freetools@main/docs/data/user-feedback.json

数据结构：
{
  "approved": [
    { "content": "希望增加XX功能", "time": "2026-03-28", "votes": 12 },
    { "content": "建议优化XX界面", "time": "2026-03-27", "votes": 8 }
  ]
}

小程序用途：
- 展示已采纳的用户建议
- 激励用户参与反馈
```

#### 10. 小程序壁纸/配图素材
```
文件：docs/data/wallpaper-themes.json
CDN：https://cdn.jsdelivr.net/gh/ddabb/freetools@main/docs/data/wallpaper-themes.json

数据结构：
{
  "themes": [
    { "name": "简约白", "colors": ["#ffffff", "#f8f9fa"], "preview": "base64或CDN链接" },
    { "name": "暗夜黑", "colors": ["#18181b", "#27272a"], "preview": "base64或CDN链接" }
  ]
}

小程序用途：
- 公众号配图工具配色方案
- 文案生图背景主题
```

#### 11. 常用密码/序列号生成素材
```
文件：docs/data/password-phrases.json
CDN：https://cdn.jsdelivr.net/gh/ddabb/freetools@main/docs/data/password-phrases.json

数据结构：
{
  "words": ["strong", "brave", "wise", "creative"],
  "symbols": ["!", "@", "#", "$"],
  "patterns": ["首字母", "谐音", "混合"]
}
```

#### 12. 国际/地区数据
```
文件：docs/data/countries.json
CDN：https://cdn.jsdelivr.net/gh/ddabb/freetools@main/docs/data/countries.json

数据结构：
{
  "countries": [
    { "code": "CN", "name": "中国", "capital": "北京", "currency": "CNY", "timezone": "Asia/Shanghai" }
  ]
}

小程序用途：
- 进制转换工具扩展
- 单位换算工具扩展
```

---

## 三、技术实现方案

### 数据加载模式

```javascript
// 标准 CDN 加载函数
loadFromCDN(url, cacheKey, expireMs = 24*60*60*1000) {
  // 1. 检查缓存
  const cached = wx.getStorageSync(cacheKey);
  const timestamp = wx.getStorageSync(cacheKey + '_timestamp');
  if (cached && timestamp && (Date.now() - timestamp < expireMs)) {
    return Promise.resolve(cached);
  }
  
  // 2. 请求 CDN
  return new Promise((resolve, reject) => {
    wx.request({
      url,
      timeout: 10000,
      success: (res) => {
        if (res.statusCode === 200 && res.data) {
          wx.setStorageSync(cacheKey, res.data);
          wx.setStorageSync(cacheKey + '_timestamp', Date.now());
          resolve(res.data);
        } else {
          reject(new Error('数据格式错误'));
        }
      },
      fail: reject
    });
  });
}
```

### 缓存策略

| 数据类型 | 缓存时间 | 说明 |
|---------|---------|------|
| 版本日志 | 24小时 | 几乎不变 |
| 题库数据 | 24小时 | 更新频率低 |
| 每日一言 | 1小时 | 每日更新 |
| 统计数据 | 6小时 | 实时性要求不高 |
| 用户反馈 | 1小时 | 中等更新频率 |

### GitHub 文件更新流程

```
1. 编辑 docs/data/*.json 文件
2. git add . && git commit -m "update: xxx data"
3. git push
4. 等待 ~5 分钟 CDN 自动同步
5. 小程序用户自动获取最新数据
```

---

## 四、数据文件目录结构

```
docs/
├── data/
│   ├── changelog.json              ✅ 已实现
│   ├── sudoku-presets.json        ✅ 已实现
│   ├── 24point-questions.json     ✅ 已实现
│   ├── daily-quote.json           📋 待实现（每日一言）
│   ├── hot-tools.json             📋 待实现（热门榜单）
│   ├── tool-stats.json            📋 待实现（使用统计）
│   ├── calendar-events.json       📋 待实现（节日节气）
│   ├── zodiac-fortune.json        📋 待实现（运势数据）
│   ├── health-tips.json           📋 待实现（健康贴士）
│   ├── math-puzzles.json          📋 待实现（益智题库）
│   ├── wallpaper-themes.json      📋 待实现（壁纸主题）
│   ├── user-feedback.json         📋 待实现（用户反馈）
│   └── countries.json             📋 待实现（国家数据）
│
├── articles/
│   ├── index.json                 ✅ 已实现
│   ├── published/
│   └── drafts/
│
└── fonts/                         📋 字体文件（如需要）
```

---

## 五、运营建议

### 数据更新频率
- **题库类**：每月更新一次即可
- **每日一言**：每日更新
- **统计数据**：每周更新
- **用户反馈**：实时审核后更新

### 数据管理
- 使用 GitHub 管理所有 JSON 数据文件
- 建议添加数据版本号字段 `version`
- 建议添加更新时间字段 `updateDate`

### 小程序适配
- 所有 CDN 数据必须有本地备用数据
- 网络异常时自动回退到本地数据
- 首次加载显示 loading 状态
- 缓存过期后静默更新

---

*最后更新：2026-03-28*
