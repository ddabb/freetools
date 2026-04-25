# freetools 音效集成 PRD

> 创建时间：2026-04-24  
> 状态：✅ 全部完成！

## 一、背景与目标

**背景**：freetools 小程序包含多个益智游戏（扫雷、黑白棋、数独、数壹等），玩家交互反馈主要通过震动实现，但音效缺失导致沉浸感不足。

**目标**：为所有游戏类页面统一集成音效系统，提升用户体验。

**约束**：
- 音效文件托管于 jsdelivr CDN（同现有题库/图标方案）
- 使用 `wx.createInnerAudioContext()` 播放
- 音效文件体积控制在 50KB 以内/个

---

## 二、当前状态

| 游戏 | 状态 | 完成时间 |
|------|------|----------|
| 躲避牛蛙 (frog-escape) | ✅ 已完成 | 2026-04-23 |
| 黑白棋 (othello) | ✅ 已完成 | 2026-04-24 |
| 数织 (nonogram) | ✅ 已完成 | 2026-04-24 |
| 24点 (24point) | ✅ 已完成 | 2026-04-24 |
| 成语接龙 (idiom-query) | ✅ 已完成 | 2026-04-24 |
| 成语对决 (idiom-battle) | ✅ 已完成 | 2026-04-24 |
| 合并ABC (merge-abc) | ✅ 已完成 | 2026-04-24 |
| 真心话大冒险 (truth-or-dare) | ✅ 已完成 | 2026-04-24 |
| 数独求解器 (sudoku-solver) | ✅ 已完成+增强 | 2026-04-24 |
| 数壹 (number-one) | ✅ 已完成+增强 | 2026-04-24 |
| 电子木鱼 (electronic-woodfish) | ✅ 全新接入 | 2026-04-24 |
| 答案之书 (answer-book) | ✅ 全新接入 | 2026-04-24 |
| 一笔画求解器 (one-stroke-solver) | ✅ 全新接入 | 2026-04-24 |

---

## 三、待集成游戏清单

### 高优先级（游戏类）

| 游戏 | 页面路径 | 建议音效 | 优先级 |
|------|----------|----------|--------|
| 数壹 (number-one) | `packages/math/pages/number-one` | click, win | P0 ✅ (已下线) |
| 数织 (nonogram) | `packages/math/pages/nonogram` | click, win | P0 ✅ |
| 24点 (24point) | `packages/math/pages/24point` | click, correct, wrong | P1 |
| 成语接龙 (idiom-chain) | `packages/life/pages/idiom-chain` | click, correct, wrong | P1 |
| 成语对决 (idiom-battle) | `packages/life/pages/idiom-battle` | click, win, lose | P1 |
| 合并ABC (merge-abc) | `packages/life/pages/merge-abc` | click, merge, win, lose | P2 |
| 真心话大冒险 (truth-or-dare) | `packages/life/pages/truth-or-dare` | click, spin | P2 |
| 数独求解器 (sudoku-solver) | `packages/math/pages/sudoku-solver` | click, solve | P2 |

### 已有音效（非游戏）

| 页面 | 状态 | 备注 |
|------|------|------|
| 电子木鱼 (electronic-woodfish) | ✅ 已集成 | `bong` 敲击 + `glass` 成就解锁 |
| 答案之书 (answer-book) | ✅ 已集成 | `spin` 摇动 + `bong` 揭晓 |
| 一笔画求解器 (one-stroke-solver) | ✅ 已集成 | `win`/`wrong` 检查结果 |
| 其他工具类页面 | ⏸️ 不处理 | 非游戏，无音效需求 |

---

## 四、技术方案

### 4.1 CDN 路径约定

```
https://cdn.jsdelivr.net/gh/ddabb/freetools@main/data/sounds/
├── click.wav      # 通用点击音效 (~26KB)
├── flag.wav      # 标记/旗帜音效
├── win.wav       # 胜利音效
├── lose.wav      # 失败音效
├── click3.mp3    # 备用点击音效
└── [新增].wav    # 按需添加
```

### 4.2 playSound 函数标准实现

```javascript
const SOUNDS_BASE = 'https://cdn.jsdelivr.net/gh/ddabb/freetools@main/data/sounds';

function playSound(src) {
  const audio = wx.createInnerAudioContext();
  audio.src = src;
  audio.play();
  audio.onEnded(() => audio.destroy());
  audio.onError(() => audio.destroy());
}
```

### 4.3 集成点示例

```javascript
// 点击时
playSound(SOUNDS_BASE + '/click.wav');

// 胜利时
playSound(SOUNDS_BASE + '/win.wav');

// 失败时
playSound(SOUNDS_BASE + '/lose.wav');
```

---

## 五、音效资源清单

### 原有音效（自制）

| 文件名 | 用途 | 体积 | 状态 | 使用场景 |
|--------|------|------|------|----------|
| click.wav | 通用点击 | 26KB | ✅ 已有 | **躲避牛蛙**：翻开格子、开启音效时；**黑白棋**：落子、开启音效时；**数织**：点击格子（涂色/取消）、开启音效时；**24点**：点击运算符按钮、清空表达式、生成新游戏时；**成语查询**：点击"继续接龙"时；**成语对决**：玩家提交成语、AI出招时；**合并ABC**：合并成功时；**真心话大冒险**：难度切换、分类切换、跳过、标记完成时；**数独求解器**：填入数字、清空格子、候选数点击时；**数壹**：点击格子、长按清除时 |
| flag.wav | 标记/旗帜 | 26KB | ✅ 已有 | **躲避牛蛙**：在格子上插旗/取消旗帜时（旗帜模式下点击未翻开的格子） |
| win.wav | 胜利提示 | 26KB | ✅ 已有 | **躲避牛蛙**：成功翻开所有安全格子，游戏胜利时；**黑白棋**：玩家执黑棋获胜或平局时；**数织**：完成当前关卡拼图时；**24点**：计算结果等于24，答对时（建议用 `correct` 替代）；**成语查询**：查询到匹配成语结果时；**成语对决**：玩家在对决中获胜时；**数独求解器**：点击"求解"成功找到答案时；**合并ABC**：合成 Z 字母时；**数壹**：正确完成谜题时；**一笔画求解器**：检查结果为可一笔画成时 |
| lose.wav | 失败提示 | 26KB | ✅ 已有 | **躲避牛蛙**：踩到地雷，游戏失败时；**黑白棋**：玩家执黑棋败给AI时；**24点**：计算结果不等于24，答错时（建议用 `wrong` 替代）；**成语对决**：玩家在对决中输给AI时；**合并ABC**：棋盘无法继续操作，游戏结束时 |
| click3.mp3 | 备用点击 | 42KB | ✅ 已有 | 暂未接入游戏；可作为 click.wav 的备选方案（音色不同），按需替换 |

### 新增音效（Kenney CC0）

> 来源：[Kenney Interface Sounds](https://opengameart.org/content/interface-sounds) — CC0 公共领域授权，无需署名

| 文件名 | 原文件 | 用途 | 体积 | 状态 | 使用场景 |
|--------|--------|------|------|------|----------|
| correct.wav | confirmation_001.wav | 答对/确认 | 25.5KB | ✅ 新增 | 答题类游戏答对时（比 win.wav 更轻量）；可替代 win.wav 用于"小成功"场景，如单步答对 |
| correct2.wav | confirmation_002.wav | 答对备选 | 48.5KB | ✅ 新增 | correct.wav 的音色变体，音调更高扬；可用于连续答对时升级反馈 |
| wrong.wav | error_001.wav | 答错/错误 | 29.8KB | ✅ 新增 | **24点**：计算结果不等于24时（替代 lose.wav）；**数独求解器**：无解时；**数壹**：答案错误时；**一笔画求解器**：无法一笔画成时；答题类游戏单次答错时 |
| select.wav | select_001.wav | 轻触选择 | 10.8KB | ✅ 新增 | 极短的选择音；适合频繁触发的选项点击，比 click.wav 更轻盈不烦人 |
| bong.wav | bong_001.wav | 提示音/通知 | 11.5KB | ✅ 新增 | **电子木鱼**：敲击音效；**答案之书**：揭晓答案音效；系统提示、弹窗出现 |
| drop.wav | drop_001.wav | 拖拽放下/落子 | 22.8KB | ✅ 新增 | **合并ABC**：字母合并时（替代 click）；**黑白棋**：可替代 click.wav 作为落子音（更有重量感） |
| spin.wav | maximize_001.wav | 旋转/展开 | 22.6KB | ✅ 新增 | **真心话大冒险**：模式切换时；**答案之书**：摇动开始时；页面展开/收起时 |
| pluck.wav | pluck_001.wav | 弹拨/轻触 | 19.3KB | ✅ 新增 | 独特的弹拨音色；可用于成语接龙找到字时的高亮反馈，或数独填入正确数字时 |
| tick.wav | tick_001.wav | 节拍/计时 | 4KB | ✅ 新增 | **成语对决**：倒计时≤30秒时每秒紧迫音；倒计时每秒 tick；进度条推进 |
| glass.wav | glass_001.wav | 清脆提示 | 25.2KB | ✅ 新增 | **电子木鱼**：成就解锁时；成就解锁、首次进入游戏、特殊奖励时；音色清脆区别于普通 win.wav |

> 所有音效文件位于 `F:\SelfJob\freetools\data\sounds\`

### 快速选音效指南

| 场景 | 推荐音效 | 备注 |
|------|----------|------|
| 普通点击/触摸 | `click.wav` | 最通用 |
| 高频点击（怕烦人） | `select.wav` | 4KB 极小，更轻盈 |
| 独特点击 | `pluck.wav` | 弹拨感，用于特殊操作 |
| 旗帜标记 | `flag.wav` | 仅扫雷类 |
| 游戏大胜利 | `win.wav` | 结局级别 |
| 单步答对/小成功 | `correct.wav` | 比 win.wav 短促 |
| 连续答对/升级 | `correct2.wav` | 音调更高扬 |
| 特殊成就/解锁 | `glass.wav` | 清脆独特（成就解锁） |
| 游戏大失败 | `lose.wav` | 结局级别 |
| 单步答错/小错误 | `wrong.wav` | 比 lose.wav 短促 |
| 倒计时/节拍 | `tick.wav` | 最小4KB，高频用 |
| 转盘旋转/展开 | `spin.wav` | 动画伴随音、模式切换 |
| 落子/放置/合并 | `drop.wav` | 有重量感的落地音 |
| 弹窗/通知/敲击 | `bong.wav` | 系统提示音、木鱼敲击 |
| 备用点击（不同音色） | `click3.mp3` | 42KB，按需替换 |

---

## 六、实现清单

### Phase 1：P0 游戏集成

- [x] 数壹 (number-one) 集成音效（P0）
- [x] 数织 (nonogram) 集成音效（P0）

### Phase 2：P1 游戏集成

- [x] 24点 (24point) 集成音效 ✅
- [x] 成语接龙/查询 (idiom-query) 集成音效 ✅
- [x] 成语对决 (idiom-battle) 集成音效 ✅

### Phase 3：P2 游戏集成

- [x] 合并ABC (merge-abc) 集成音效 ✅
- [x] 真心话大冒险 (truth-or-dare) 集成音效 ✅
- [x] 数独求解器 (sudoku-solver) 集成音效 ✅

### Phase 4：增强与新增接入（2026-04-24）

- [x] **24点增强**：运算符按钮点击、清空表达式、新游戏音效；答对→`correct` 替代 `win`，答错→`wrong` 替代 `lose`
- [x] **成语对决增强**：开始对战音效、AI出招音效、倒计时≤30秒时 `tick` 紧迫音
- [x] **合并ABC增强**：合并音效从 `click` 升级为 `drop`，达到 Z 时触发 `win`
- [x] **真心话大冒险增强**：模式切换→`spin`，难度/分类切换/跳过/标记完成→`click`
- [x] **数独求解器增强**：清空格子音效、候选数点击音效、无解时 `wrong`
- [x] **数壹增强**：长按清除音效、答错时 `wrong`
- [x] **电子木鱼全新接入**：`bong` 敲击音效、`glass` 成就解锁音效
- [x] **答案之书全新接入**：摇动→`spin`，揭晓→`bong`
- [x] **一笔画求解器全新接入**：可解→`win`，不可解→`wrong`

---

## 七、验收标准

1. **功能性**：所有点击/标记/胜利/失败事件正确触发音效
2. **稳定性**：音效播放不阻塞UI，播放后资源正确释放
3. **兼容性**：iOS/Android 双端正常播放，无兼容问题
4. **性能**：单次音效加载 < 500ms，不造成页面卡顿

---

## 八、附录

### 相关文档
- [格子游戏PRD.md](./格子游戏PRD.md)
- [CDN数据管理规范.md](./CDN数据管理规范.md)

### 提交记录
- `382447f9` feat(othello): add sound effects for moves and game over
- `7723c6bc` fix(frog-escape): sound CDN path and playSound duplicate

---

*最后更新：2026-04-24（增强版）*

### 备注
- 数壹 (number-one) 已设置 `publish: false`，从工具列表中移除（算法bug修复后再上线）
- 所有游戏音效集成已完成！统一使用 utils.playSound() 接口，pageId 参数支持页面级开关控制
- **增强规则**：答对/单步正确用 `correct` 而非 `win`；答错/单步错误用 `wrong` 而非 `lose`；落子/合并用 `drop` 而非 `click`；模式切换用 `spin`
- **Phase 4 新增接入**：电子木鱼（`bong`+`glass`）、答案之书（`spin`+`bong`）、一笔画求解器（`win`/`wrong`）
